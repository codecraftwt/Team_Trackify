import RNFS from 'react-native-fs';
import NetInfo from '@react-native-community/netinfo';
import * as TrackingService from './TrackingService';
import {
  getAllSessionsWithUnsyncedLocations,
  getUnsyncedLocations,
  markLocationSynced,
  updateSessionServerId,
  updateSessionPunchInPhoto,
  updateSessionPunchOutPhoto,
  // endLocalSession,
  getSessionByLocalId,
  getAllLocationsForSession,
  relocatePointsToSession,
} from './OfflineLocationStore';

const SYNC_DEBOUNCE_MS = 3000; // Minimum 2 seconds between sync triggers (reduced from 5s for faster sync)
const LOCK_TIMEOUT_MS = 20000; // 15 seconds timeout for session creation locks (reduced from 30s for faster sync)
const MIN_DISTANCE_METERS = 10;
const MAX_ACCEPTABLE_ACCURACY_METERS = 60;
const MAX_TELEPORT_DISTANCE_METERS = 500;
const MAX_REALISTIC_SPEED_MPS = 70;

const normalizeTimestamp = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 0 && value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string') {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      return asNumber > 0 && asNumber < 1e12 ? asNumber * 1000 : asNumber;
    }
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return Date.now();
};

const distanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dPhi / 2) ** 2
    + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toFixedCoord = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(6) : 'NaN';
};

const hasBusinessPayload = (point) => {
  const source = (point?.source || '').toLowerCase();
  return Boolean(
    (typeof point?.photoUri === 'string' && point.photoUri.trim().length > 0)
    || (typeof point?.remark === 'string' && point.remark.trim().length > 0)
    || point?.amount != null
    || source === 'photo'
    || source === 'start'
    || source === 'end'
  );
};

const pointFingerprint = (point) => {
  return [
    normalizeTimestamp(point?.timestamp),
    toFixedCoord(point?.latitude),
    toFixedCoord(point?.longitude),
    (point?.source || 'foreground').toLowerCase(),
  ].join('|');
};

// Business/photo points (photos, start/end) are where duplicates are most visible.
// We dedupe using a stable fingerprint that doesn't depend on the local file path.
const businessPointFingerprint = (point) => {
  const remark = typeof point?.remark === 'string' ? point.remark.trim() : '';
  const amount = point?.amount != null ? String(point.amount) : '';
  const hasPhoto = point?.photoUri && typeof point.photoUri === 'string' && point.photoUri.trim().length > 0;

  return [
    normalizeTimestamp(point?.timestamp),
    toFixedCoord(point?.latitude),
    toFixedCoord(point?.longitude),
    (point?.source || 'business').toLowerCase(),
    hasPhoto ? 'photo:1' : 'photo:0',
    remark,
    amount,
  ].join('|');
};

const preparePointsForUpload = (points) => {
  if (!Array.isArray(points) || points.length === 0) {
    return { uploadPoints: [], skippedIds: [], stats: {} };
  }

  const sorted = [...points].sort((a, b) => {
    const ta = normalizeTimestamp(a?.timestamp);
    const tb = normalizeTimestamp(b?.timestamp);
    if (ta !== tb) return ta - tb;
    return String(a?.id || '').localeCompare(String(b?.id || ''));
  });

  const seen = new Set();
  const uploadPoints = [];
  const skippedIds = [];
  let lastKept = null;
  const stats = { duplicate: 0, inaccurate: 0, tooClose: 0, teleport: 0, outOfOrder: 0 };

  for (const point of sorted) {
    const businessPoint = hasBusinessPayload(point);
    const ts = normalizeTimestamp(point?.timestamp);
    const lat = Number(point?.latitude);
    const lng = Number(point?.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      skippedIds.push(point.id);
      continue;
    }

    // Filter out points with 0,0 coordinates (invalid location)
    if (lat === 0 && lng === 0) {
      console.warn('[SyncService] Skipping point with 0,0 coordinates (invalid):', {
        id: point.id,
        sessionLocalId: point.sessionLocalId,
        source: point.source,
        timestamp: point.timestamp,
      });
      skippedIds.push(point.id);
      continue;
    }

    // De-duplicate business/photo points too. Offline session dedup/relocation can otherwise
    // upload the same photo markers/events multiple times to the server.
    const fp = businessPoint ? businessPointFingerprint(point) : pointFingerprint(point);
    if (seen.has(fp)) {
      stats.duplicate += 1;
      skippedIds.push(point.id);
      continue;
    }
    seen.add(fp);

    const acc = point?.accuracy == null ? null : Number(point.accuracy);
    if (!businessPoint && Number.isFinite(acc) && acc > MAX_ACCEPTABLE_ACCURACY_METERS) {
      stats.inaccurate += 1;
      skippedIds.push(point.id);
      continue;
    }

    if (lastKept && !businessPoint) {
      const prevTs = normalizeTimestamp(lastKept.timestamp);
      if (ts < prevTs) {
        stats.outOfOrder += 1;
        skippedIds.push(point.id);
        continue;
      }

      const d = distanceMeters(
        Number(lastKept.latitude),
        Number(lastKept.longitude),
        lat,
        lng
      );
      const elapsedMs = Math.max(1, ts - prevTs);
      const speedMps = d / (elapsedMs / 1000);
      const looksLikeTeleport = d > MAX_TELEPORT_DISTANCE_METERS && speedMps > MAX_REALISTIC_SPEED_MPS;

      if (looksLikeTeleport) {
        stats.teleport += 1;
        skippedIds.push(point.id);
        continue;
      }

      if (d < MIN_DISTANCE_METERS) {
        stats.tooClose += 1;
        skippedIds.push(point.id);
        continue;
      }
    }

    uploadPoints.push(point);
    lastKept = { latitude: lat, longitude: lng, timestamp: ts };
  }

  return { uploadPoints, skippedIds, stats };
};

// IMPORTANT:
// This module can be loaded more than once in some bundling/dev scenarios.
// Store sync state on globalThis so locks are shared and we don't create duplicate server sessions.
const getSyncState = () => {
  const g = globalThis;
  if (!g.__trackifySyncState) {
    g.__trackifySyncState = {
      isSyncing: false,
      syncPromise: null,
      netInfoListener: null,
      lastSyncTime: 0,
      syncLock: false,
      // Map<localSessionId, { timestamp: number, promise: Promise<string|null> }>
      sessionCreationLocks: new Map(),
    };
  }
  return g.__trackifySyncState;
};

// Helper to clean up stale locks (older than LOCK_TIMEOUT_MS)
const cleanupStaleLocks = () => {
  const { sessionCreationLocks } = getSyncState();
  const now = Date.now();
  for (const [key, lockInfo] of sessionCreationLocks.entries()) {
    if (typeof lockInfo === 'object' && lockInfo.timestamp && now - lockInfo.timestamp > LOCK_TIMEOUT_MS) {
      console.warn('[SyncService] Cleaning up stale lock for:', key);
      sessionCreationLocks.delete(key);
    }
  }
};

// Helper function to end session on server with retry logic
const endSessionOnServerWithRetry = async (
  serverSessionId,
  punchOutPhoto,
  endLocationData,
  maxRetries = 2
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await TrackingService.endSession(serverSessionId, punchOutPhoto, endLocationData);
      console.log('[SyncService] Successfully ended session on server:', serverSessionId);
      return { success: true };
    } catch (err) {
      console.warn(`[SyncService] Failed to end session on server (attempt ${attempt}/${maxRetries}):`, err?.message);
      if (attempt === maxRetries) {
        return { success: false, error: err?.message };
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return { success: false, error: 'Max retries exceeded' };
};

export const isOnline = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected && state.isInternetReachable !== false;
};

export const syncPendingLocations = async () => {
  const state = getSyncState();
  // If already syncing or sync lock is active, return the existing promise to avoid duplicate syncs
  if ((state.isSyncing && state.syncPromise) || state.syncLock) {
    console.log('[SyncService] Sync already in progress or locked, waiting for it to complete...');
    if (state.syncPromise) {
      return state.syncPromise;
    }
    return { success: false, synced: 0, reason: 'locked' };
  }

  // Debounce: prevent sync from being triggered too frequently
  const now = Date.now();
  if (now - state.lastSyncTime < SYNC_DEBOUNCE_MS) {
    console.log('[SyncService] Sync debounced, last sync was', Math.round((now - state.lastSyncTime) / 1000), 'seconds ago');
    return { success: false, synced: 0, reason: 'debounced' };
  }

  const online = await isOnline();
  if (!online) {
    console.log('[SyncService] Offline, skipping sync');
    return { success: false, synced: 0, reason: 'offline' };
  }

  // Set isSyncing AND syncLock BEFORE anything else to prevent race conditions
  state.isSyncing = true;
  state.syncLock = true;
  state.lastSyncTime = now;
  let totalSynced = 0;

  // Create the sync promise and store it to prevent concurrent syncs
  state.syncPromise = (async () => {
    try {
      console.log('[SyncService] Starting sync...');
      const sessionsWithUnsynced = await getAllSessionsWithUnsyncedLocations();
      console.log('[SyncService] Found sessions with unsynced locations:', sessionsWithUnsynced.length);

      // Split sessions:
      // - dedupCandidates: sessions that have unsynced points (relocation + server uploads)
      // - nonDedupSessions: sessions without unsynced points (may still need server "end" if status === 'ended')
      const dedupCandidates = sessionsWithUnsynced.filter(
        s => s.unsyncedCount > 0 || s.session.status === 'ended'
      );
      const nonDedupSessions = sessionsWithUnsynced.filter(
        s => !(s.unsyncedCount > 0 || s.session.status === 'ended')
      );

      // Deduplicate sessions - if multiple sessions have similar start times (within 1 minute),
      // treat them as the same session and only create one server session
      const deduplicatedSessions = [];
      const processedStarts = new Map(); // Track start times to session mapping
      const duplicateSessions = []; // Track duplicate sessions for point relocation
      
      for (const { session, unsyncedCount } of dedupCandidates) {
        const sessionStartTime = session.startTime;
        
        // Check if there's already a session being processed with a similar start time
        let existingSession = null;
        for (const [startTime, existing] of processedStarts) {
          const timeDiff = Math.abs(sessionStartTime - startTime);
          // If sessions are within 1 minute of each other, consider them duplicates
          // Reduced from 5 minutes to prevent false positives
          if (timeDiff < 60 * 1000) {
            existingSession = existing;
            break;
          }
        }
        
        if (existingSession) {
          console.log('[SyncService] Marking duplicate session:', session.localSessionId, 
            '(within 1 min of existing session)', existingSession.localSessionId);
          // Mark this session as a duplicate for point relocation
          duplicateSessions.push({ duplicate: session, main: existingSession });
        } else {
          processedStarts.set(sessionStartTime, session);
          // We already filtered to unsynced sessions, so unsyncedCount is > 0
          deduplicatedSessions.push({ session, unsyncedCount });
        }
      }

      // Relocate points from duplicate sessions to their main sessions
      // This ensures all location data is synced to a single server session
      for (const { duplicate, main } of duplicateSessions) {
        console.log('[SyncService] Relocating points from duplicate session to main session');
        const mainSessionInfo = await getSessionByLocalId(main.localSessionId);

        // Merge punch photos if the chosen "main" session doesn't have them yet.
        // This prevents missing markers after deduplication, especially for ended sessions.
        try {
          if (
            mainSessionInfo?.punchOutPhotoUri == null &&
            duplicate?.punchOutPhotoUri
          ) {
            await updateSessionPunchOutPhoto(main.localSessionId, duplicate.punchOutPhotoUri);
          }
          if (
            mainSessionInfo?.punchInPhotoUri == null &&
            duplicate?.punchInPhotoUri
          ) {
            await updateSessionPunchInPhoto(main.localSessionId, duplicate.punchInPhotoUri);
          }
        } catch (photoMergeErr) {
          console.warn('[SyncService] Failed to merge punch photos:', photoMergeErr?.message || String(photoMergeErr));
        }

        if (mainSessionInfo?.serverSessionId) {
          // If main session already has serverSessionId, relocate points to it
          await relocatePointsToSession(duplicate.localSessionId, main.localSessionId);
          console.log('[SyncService] Points relocated to session:', main.localSessionId);
        } else {
          // If main session doesn't have serverSessionId yet, relocate points anyway
          // (they will be synced when the main session is processed)
          await relocatePointsToSession(duplicate.localSessionId, main.localSessionId);
          console.log('[SyncService] Points relocated, will sync with main session');
        }
        // Mark the duplicate session as synced so it won't be processed again
        await updateSessionServerId(duplicate.localSessionId, 'DUPLICATE_MERGED');
        console.log('[SyncService] Marked duplicate session as synced:', duplicate.localSessionId);
      }

      const sessionsToProcess = [...deduplicatedSessions, ...nonDedupSessions];

      console.log('[SyncService] After deduplication:', sessionsToProcess.length, 'sessions to process');

      for (const { session, unsyncedCount } of sessionsToProcess) {
        console.log('[SyncService] ===========================================');
        console.log('[SyncService] Processing session:', session.localSessionId);
        console.log('[SyncService] - unsyncedCount:', unsyncedCount);
        console.log('[SyncService] - serverSessionId:', session.serverSessionId);
        console.log('[SyncService] - status:', session.status);
        console.log('[SyncService] - synced:', session.synced);
        console.log('[SyncService] ===========================================');
        
        // If there are no unsynced points, we normally skip.
        // But if the local session is ended, we still need to call the server "end" API.
        if (unsyncedCount === 0 && session.synced && session.status !== 'ended') continue;

        // Re-fetch session from database to get the latest state
        // This prevents creating duplicate server sessions if another sync process updated it
        const currentSession = await getSessionByLocalId(session.localSessionId);
        let serverSessionId = currentSession?.serverSessionId;
        
        console.log('[SyncService] Current serverSessionId after re-fetch:', serverSessionId);

        // Use per-session lock to prevent concurrent session creation for the same local session.
        // This must be global (shared across module instances) and promise-based (waiters await the same creation).
        if (!serverSessionId) {
          const lockKey = session.localSessionId;
          const lockMap = state.sessionCreationLocks;
          
          // Check if another process is already creating this session
          if (lockMap.has(lockKey)) {
            const lockInfo = lockMap.get(lockKey);
            const lockAge = typeof lockInfo === 'object' && lockInfo.timestamp ? Date.now() - lockInfo.timestamp : 0;
            
            // If lock is stale (older than timeout), remove it
            if (lockAge > LOCK_TIMEOUT_MS) {
              console.warn('[SyncService] Removing stale lock for:', lockKey, 'age:', lockAge, 'ms');
              lockMap.delete(lockKey);
            } else {
              console.log('[SyncService] Another process is already creating session for:', lockKey, 'awaiting...');
              try {
                // Await the creator promise, then re-check DB (WatermelonDB updates may not be immediate).
                await Promise.race([
                  lockInfo?.promise,
                  new Promise((_, reject) => setTimeout(() => reject(new Error('lock-timeout')), 12000)),
                ]);
              } catch {
                // ignore timeout, we'll re-check below
              }

              // Poll a bit for DB to reflect the updateSessionServerId write.
              const pollStart = Date.now();
              while (!serverSessionId && Date.now() - pollStart < 3000) {
                const recheckSession = await getSessionByLocalId(session.localSessionId);
                serverSessionId = recheckSession?.serverSessionId;
                if (serverSessionId) break;
                await new Promise(resolve => setTimeout(resolve, 100));
              }
              console.log('[SyncService] ServerSessionId after awaiting lock:', serverSessionId);
            }
          }
          
          // If still no server session ID, acquire lock and create it
          if (!serverSessionId) {
            // Clean up stale locks before acquiring new one
            cleanupStaleLocks();
            
            // Acquire lock with a promise so all waiters share one creation.
            let resolveLock = null;
            const creationPromise = new Promise(resolve => {
              resolveLock = resolve;
            });
            lockMap.set(lockKey, { timestamp: Date.now(), promise: creationPromise });
            console.log('[SyncService] Acquired session creation lock for:', lockKey);
            
            try {
              // Double-check one more time after acquiring lock
              const recheckAfterLock = await getSessionByLocalId(session.localSessionId);
              serverSessionId = recheckAfterLock?.serverSessionId;
              
              if (!serverSessionId) {
                // For offline sessions, get the punch-in photo from session record
                let photoFile = null;
                
                // Use currentSession for photo URI since it might have been updated
                const sessionForPhoto = currentSession || session;
                // Get punch-in photo from session record
                const punchInPhotoUri = sessionForPhoto.punchInPhotoUri;
                console.log('[SyncService] Punch-in photo URI from session:', punchInPhotoUri);
                
                if (punchInPhotoUri) {
                  const photoPath = punchInPhotoUri.startsWith('file://') 
                    ? punchInPhotoUri.replace('file://', '') 
                    : punchInPhotoUri;
                  try {
                    const photoFileExists = await RNFS.exists(photoPath);
                    if (photoFileExists) {
                      photoFile = {
                        uri: punchInPhotoUri.startsWith('file://') ? punchInPhotoUri : `file://${photoPath}`,
                        fileName: punchInPhotoUri.split('/').pop() || `photo_${session.startTime}.jpg`,
                        type: 'image/jpeg',
                      };
                      console.log('[SyncService] Found punch-in photo:', photoFile.fileName);
                    }
                  } catch {
                    console.log('[SyncService] Photo file does not exist:', photoPath);
                  }
                } else {
                  console.log('[SyncService] No punch-in photo in session, checking location points...');
                  // Fallback: check location points for photo
                  const sessionForLocations = currentSession || session;
                  const allLocations = await getAllLocationsForSession(sessionForLocations.localSessionId);
                  const startPoint = allLocations.find(p => p.source === 'start' && p.photoUri) 
                    || (allLocations.length > 0 ? allLocations[0] : null);
                  if (startPoint?.photoUri) {
                    const photoPath = startPoint.photoUri.startsWith('file://') 
                      ? startPoint.photoUri.replace('file://', '') 
                      : startPoint.photoUri;
                    try {
                      const photoFileExists = await RNFS.exists(photoPath);
                      if (photoFileExists) {
                        photoFile = {
                          uri: startPoint.photoUri.startsWith('file://') ? startPoint.photoUri : `file://${photoPath}`,
                          fileName: startPoint.photoUri.split('/').pop() || `photo_${startPoint.timestamp}.jpg`,
                          type: 'image/jpeg',
                        };
                        console.log('[SyncService] Found punch-in photo from location:', photoFile.fileName);
                      }
                    } catch {}
                  }
                }
                
                // Try to create session with the punch-in photo
                let res;
                if (photoFile) {
                  try {
                    console.log('[SyncService] Creating session with punch-in photo...');
                    res = await TrackingService.startSession(photoFile);
                    console.log('[SyncService] Session created with photo, result:', res);
                  } catch (photoErr) {
                    console.log('[SyncService] Could not create session with photo:', photoErr?.message);
                    // Try direct creation as fallback
                    try {
                      res = await TrackingService.createSessionDirectly();
                    } catch (directErr) {
                      console.log('[SyncService] Direct creation also failed:', directErr?.message);
                      throw directErr;
                    }
                  }
                } else {
                  // No photo available, try direct creation
                  console.log('[SyncService] No photo available, trying createSessionDirectly...');
                  try {
                    res = await TrackingService.createSessionDirectly();
                  } catch (directErr) {
                    console.log('[SyncService] Direct creation failed:', directErr?.message);
                    throw directErr;
                  }
                }
                
                serverSessionId = res?.sessionId;
                console.log('[SyncService] Created server session:', serverSessionId);
                
                if (serverSessionId) {
                  // Double-check that no other process already linked this session
                  const recheckAfterCreate = await getSessionByLocalId(session.localSessionId);
                  if (recheckAfterCreate?.serverSessionId && recheckAfterCreate.serverSessionId !== serverSessionId) {
                    console.warn('[SyncService] Session was already linked by another process to:', recheckAfterCreate.serverSessionId);
                    // Use the existing server session ID instead
                    serverSessionId = recheckAfterCreate.serverSessionId;
                  } else {
                    console.log('[SyncService] Linking local session to server session...');
                    await updateSessionServerId(session.localSessionId, serverSessionId);
                    console.log('[SyncService] Session linked successfully');
                  }
                } else {
                  console.warn('[SyncService] No sessionId returned from server!');
                }
              } else {
                console.log('[SyncService] Session was already created by another process:', serverSessionId);
              }
              resolveLock?.(serverSessionId || null);
            } catch (err) {
              console.warn('SyncService: Failed to create session on server:', err?.message);
              resolveLock?.(null);
              continue;
            } finally {
              // Always release the lock
              lockMap.delete(lockKey);
              console.log('[SyncService] Released session creation lock for:', lockKey);
            }
          }
        }

        if (!serverSessionId) {
          console.warn('[SyncService] No serverSessionId, skipping session:', session.localSessionId);
          continue;
        }

        const unsyncedPoints = await getUnsyncedLocations(session.localSessionId);
        console.log('[SyncService] Found unsynced points:', unsyncedPoints.length);

        // Normalize upload order and trim redundant/offending points before hitting network.
        const { uploadPoints, skippedIds, stats } = preparePointsForUpload(unsyncedPoints);
        if (skippedIds.length > 0) {
          console.log('[SyncService] Filtering redundant points before upload:', {
            skipped: skippedIds.length,
            ...stats,
          });
          for (const skippedId of skippedIds) {
            await markLocationSynced(skippedId);
          }
        }

        const photoExistenceCache = new Map();
        for (const point of uploadPoints) {
          try {
            // CRITICAL: Validate coordinates one more time before uploading
            const lat = Number(point.latitude);
            const lng = Number(point.longitude);
            
            console.log('[SyncService] Preparing to upload point:', {
              id: point.id,
              sessionLocalId: point.sessionLocalId,
              source: point.source,
              lat,
              lng,
              hasPhoto: !!point.photoUri,
              isOnline: point.isOnline,
            });
            
            if (lat === 0 && lng === 0) {
              console.error('[SyncService] ❌ BLOCKED upload of point with 0,0 coordinates:', {
                id: point.id,
                sessionLocalId: point.sessionLocalId,
                source: point.source,
                hasPhoto: !!point.photoUri,
                isOnline: point.isOnline,
              });
              await markLocationSynced(point.id); // Mark as synced to prevent retry
              continue;
            }
            
            const formData = new FormData();
            formData.append('latitude', String(lat));
            formData.append('longitude', String(lng));
            formData.append('timestamp', String(point.timestamp));
            formData.append('address', point.address || 'Unknown Address');
            formData.append('road', point.road || 'Unknown Road');
            formData.append('area', point.area || 'Unknown Area');
            if (point.accuracy != null) formData.append('accuracy', String(point.accuracy));
            if (point.heading != null) formData.append('heading', String(point.heading));
            if (point.speed != null) formData.append('speed', String(point.speed));
            if (point.batteryPercentage != null)
              formData.append('batterypercentage', String(point.batteryPercentage));
            formData.append('source', point.source || 'foreground');
            formData.append('isOnline', (point.isOnline === true) ? 'true' : 'false');
            if (point.remark != null) formData.append('remark', String(point.remark));
            if (point.amount != null) formData.append('amount', String(point.amount));

            const hasPhoto = point.photoUri && typeof point.photoUri === 'string' && point.photoUri.trim().length > 0;
            let photoFileExists = false;
            let photoUri = null;
            if (hasPhoto) {
              // Try multiple path formats to find the photo file
              const possiblePaths = [
                point.photoUri,
                point.photoUri.startsWith('file://') ? point.photoUri.replace('file://', '') : `file://${point.photoUri}`,
                point.photoUri.startsWith('/') ? point.photoUri : `/${point.photoUri}`,
              ];
              
              for (const testPath of possiblePaths) {
                const cleanPath = testPath.startsWith('file://') ? testPath.replace('file://', '') : testPath;
                if (photoExistenceCache.has(cleanPath)) {
                  photoFileExists = photoExistenceCache.get(cleanPath) === true;
                  if (photoFileExists) {
                    photoUri = testPath.startsWith('file://') ? testPath : `file://${cleanPath}`;
                    break;
                  }
                } else {
                  try {
                    photoFileExists = await RNFS.exists(cleanPath);
                    photoExistenceCache.set(cleanPath, photoFileExists);
                    if (photoFileExists) {
                      photoUri = testPath.startsWith('file://') ? testPath : `file://${cleanPath}`;
                      break;
                    }
                  } catch {
                    photoExistenceCache.set(cleanPath, false);
                  }
                }
              }
              
              // If still not found, try the original path as-is
              if (!photoFileExists) {
                try {
                  const cleanPath = point.photoUri.startsWith('file://') ? point.photoUri.replace('file://', '') : point.photoUri;
                  photoFileExists = await RNFS.exists(cleanPath);
                  if (photoFileExists) {
                    photoUri = point.photoUri.startsWith('file://') ? point.photoUri : `file://${cleanPath}`;
                  }
                } catch {}
              }
            }

            if (hasPhoto && photoFileExists && photoUri) {
              const fileName = point.photoUri.split('/').pop() || `photo_${point.timestamp}.jpg`;
              formData.append('photo', {
                uri: photoUri,
                name: fileName,
                type: 'image/jpeg',
              });
              console.log('[SyncService] Uploading photo for point:', point.id, 'fileName:', fileName);
            } else if (hasPhoto && !photoFileExists) {
              console.warn('[SyncService] Photo file not found for point:', point.id, 'photoUri:', point.photoUri);
            }

            const result = hasPhoto && photoFileExists && photoUri
              ? await TrackingService.addLocationWithPhoto(serverSessionId, formData)
              : await TrackingService.addLocationWithFormData(serverSessionId, formData);

            if (result.success) {
              await markLocationSynced(point.id);
              totalSynced++;
              console.log('[SyncService] ✅ Successfully synced point:', {
                id: point.id,
                sessionLocalId: point.sessionLocalId,
                source: point.source,
                lat: Number(point.latitude),
                lng: Number(point.longitude),
                hasPhoto: hasPhoto && photoFileExists,
                isOnline: point.isOnline,
                serverResponse: result.data ? 'present' : 'none',
              });
              
              // If server returned data with photo URL, log it for debugging
              if (result.data) {
                console.log('[SyncService] Server response data:', JSON.stringify(result.data));
              }
            } else {
              console.error('[SyncService] ❌ Upload failed - point NOT marked as synced:', {
                id: point.id,
                error: result.error?.message || 'unknown error',
              });
            }
          } catch (err) {
            console.warn('SyncService: Failed to upload location:', err?.message);
            break;
          }
        }

        // Calculate total distance for the session and send to server
        const sessionToEnd = currentSession || session;
        try {
          const allLocationsForDistance = await getAllLocationsForSession(sessionToEnd.localSessionId);
          if (allLocationsForDistance && allLocationsForDistance.length > 1) {
            let totalDistance = 0;
            for (let i = 1; i < allLocationsForDistance.length; i++) {
              const prev = allLocationsForDistance[i - 1];
              const curr = allLocationsForDistance[i];
              const prevLat = Number(prev.latitude);
              const prevLng = Number(prev.longitude);
              const currLat = Number(curr.latitude);
              const currLng = Number(curr.longitude);
              if (Number.isFinite(prevLat) && Number.isFinite(prevLng) && Number.isFinite(currLat) && Number.isFinite(currLng)) {
                totalDistance += distanceMeters(prevLat, prevLng, currLat, currLng);
              }
            }
            console.log('[SyncService] Calculated total distance:', totalDistance, 'meters');
            // Note: Distance is calculated locally but server API may not support updating it
            // The server should calculate distance from uploaded location points
          }
        } catch (distErr) {
          console.warn('[SyncService] Failed to calculate distance:', distErr?.message || String(distErr));
        }

        // End the session on server if it was ended locally
        // Use currentSession to get the latest status
        if (sessionToEnd.status === 'ended') {
          console.log('[SyncService] Session is ended locally, ending on server...');
          
          // First check if session is still active on server before trying to end it
          try {
            const serverSession = await TrackingService.getSessionDetails(serverSessionId);
            if (serverSession && serverSession.isActive === false) {
              console.log('[SyncService] Session is already ended on server, skipping end call');
            } else {
              // Use last known local coordinates for the "end" payload.
              // Without this, some backends default the end location to (0,0).
              let endLocationData = null;
              try {
                const allLocationsForEnd = await getAllLocationsForSession(sessionToEnd.localSessionId);
                // Pick the latest non-(0,0) location so the server "end" marker matches reality.
                let lastNonZero = null;
                for (let i = allLocationsForEnd.length - 1; i >= 0; i--) {
                  const p = allLocationsForEnd[i];
                  const lat = Number(p?.latitude);
                  const lng = Number(p?.longitude);
                  if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
                  if (lat === 0 && lng === 0) continue;
                  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
                  lastNonZero = p;
                  break;
                }

                if (lastNonZero) {
                  endLocationData = {
                    latitude: lastNonZero.latitude,
                    longitude: lastNonZero.longitude,
                    accuracy: lastNonZero.accuracy ?? null,
                    heading: lastNonZero.heading ?? null,
                    speed: lastNonZero.speed ?? null,
                    address: lastNonZero.address ?? null,
                    road: lastNonZero.road ?? null,
                    area: lastNonZero.area ?? null,
                    batteryPercentage: lastNonZero.batteryPercentage ?? null,
                    isOnline: true,
                    remark: 'Tracking ended',
                  };
                }
              } catch (locErr) {
                console.warn('[SyncService] Failed to compute end coordinates:', locErr?.message || String(locErr));
              }

              // Try to get punch-out photo from session
              let punchOutPhoto = null;
              if (sessionToEnd.punchOutPhotoUri) {
                const photoPath = sessionToEnd.punchOutPhotoUri.startsWith('file://') 
                  ? sessionToEnd.punchOutPhotoUri.replace('file://', '') 
                  : sessionToEnd.punchOutPhotoUri;
                try {
                  const photoFileExists = await RNFS.exists(photoPath);
                  if (photoFileExists) {
                    punchOutPhoto = {
                      uri: sessionToEnd.punchOutPhotoUri.startsWith('file://') ? sessionToEnd.punchOutPhotoUri : `file://${photoPath}`,
                      fileName: sessionToEnd.punchOutPhotoUri.split('/').pop() || `punchout_${sessionToEnd.endTime}.jpg`,
                      type: 'image/jpeg',
                    };
                    console.log('[SyncService] Found punch-out photo:', punchOutPhoto.fileName);
                  }
                } catch (err) {
                  console.log('[SyncService] Punch-out photo not found:', err?.message);
                }
              }
              
              // Use retry helper to end session
              const endResult = await endSessionOnServerWithRetry(
                serverSessionId,
                punchOutPhoto,
                endLocationData
              );
              if (!endResult.success) {
                console.warn('[SyncService] Failed to end session after retries:', endResult.error);
                // Don't throw - session is already ended locally, will retry on next sync
              }
            }
          } catch (checkErr) {
            console.warn('[SyncService] Failed to check session status on server:', checkErr?.message);
            // If we can't check status, try to end anyway with retry
            try {
              // Same end location computation for the "can't check server state" fallback.
              let endLocationData = null;
              try {
                const allLocationsForEnd = await getAllLocationsForSession(sessionToEnd.localSessionId);
                let lastNonZero = null;
                for (let i = allLocationsForEnd.length - 1; i >= 0; i--) {
                  const p = allLocationsForEnd[i];
                  const lat = Number(p?.latitude);
                  const lng = Number(p?.longitude);
                  if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
                  if (lat === 0 && lng === 0) continue;
                  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
                  lastNonZero = p;
                  break;
                }
                if (lastNonZero) {
                  endLocationData = {
                    latitude: lastNonZero.latitude,
                    longitude: lastNonZero.longitude,
                    accuracy: lastNonZero.accuracy ?? null,
                    heading: lastNonZero.heading ?? null,
                    speed: lastNonZero.speed ?? null,
                    address: lastNonZero.address ?? null,
                    road: lastNonZero.road ?? null,
                    area: lastNonZero.area ?? null,
                    batteryPercentage: lastNonZero.batteryPercentage ?? null,
                    isOnline: true,
                    remark: 'Tracking ended',
                  };
                }
              } catch (locErr) {
                console.warn('[SyncService] Failed to compute end coordinates (fallback):', locErr?.message || String(locErr));
              }

              // Try to get punch-out photo from session
              let punchOutPhoto = null;
              if (sessionToEnd.punchOutPhotoUri) {
                const photoPath = sessionToEnd.punchOutPhotoUri.startsWith('file://') 
                  ? sessionToEnd.punchOutPhotoUri.replace('file://', '') 
                  : sessionToEnd.punchOutPhotoUri;
                try {
                  const photoFileExists = await RNFS.exists(photoPath);
                  if (photoFileExists) {
                    punchOutPhoto = {
                      uri: sessionToEnd.punchOutPhotoUri.startsWith('file://') ? sessionToEnd.punchOutPhotoUri : `file://${photoPath}`,
                      fileName: sessionToEnd.punchOutPhotoUri.split('/').pop() || `punchout_${sessionToEnd.endTime}.jpg`,
                      type: 'image/jpeg',
                    };
                    console.log('[SyncService] Found punch-out photo:', punchOutPhoto.fileName);
                  }
                } catch (err) {
                  console.log('[SyncService] Punch-out photo not found:', err?.message);
                }
              }
              
              // Use retry helper to end session
              const endResult = await endSessionOnServerWithRetry(
                serverSessionId,
                punchOutPhoto,
                endLocationData
              );
              if (!endResult.success) {
                console.warn('[SyncService] Failed to end session after retries:', endResult.error);
              }
            } catch (err) {
              console.warn('SyncService: Failed to end session:', err?.message);
            }
          }
        }
      }

      console.log('[SyncService] Total synced:', totalSynced);
      return { success: true, synced: totalSynced };
    } catch (error) {
      console.error('SyncService: Sync error:', error);
      return { success: false, synced: totalSynced, error };
    } finally {
      state.isSyncing = false;
      state.syncLock = false;
      state.syncPromise = null; // Clear the sync promise when done
    }
  })();

  return state.syncPromise;
};

export const setupSyncOnReconnect = (onSyncComplete) => {
  const state = getSyncState();
  // Remove existing listener if present to prevent duplicate listeners
  if (state.netInfoListener) {
    state.netInfoListener();
  }
  
  state.netInfoListener = NetInfo.addEventListener((netState) => {
    if (netState.isConnected && netState.isInternetReachable !== false) {
      console.log('[SyncService] Network restored, triggering sync...');
      syncPendingLocations().then((result) => {
        onSyncComplete?.(result);
      });
    }
  });
};

// Cleanup function to remove NetInfo listener
export const cleanupSyncListeners = () => {
  const state = getSyncState();
  if (state.netInfoListener) {
    state.netInfoListener();
    state.netInfoListener = null;
    console.log('[SyncService] NetInfo listener cleaned up');
  }
};

// Reset sync state - useful for recovering from stuck states
export const resetSyncState = () => {
  const state = getSyncState();
  state.isSyncing = false;
  state.syncPromise = null;
  state.lastSyncTime = 0;
  state.syncLock = false;
  state.sessionCreationLocks?.clear?.();
  console.log('[SyncService] Sync state reset');
};

