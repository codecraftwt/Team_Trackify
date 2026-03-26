import RNFS from 'react-native-fs';
import NetInfo from '@react-native-community/netinfo';
import * as TrackingService from './TrackingService';
import {
  getAllSessionsWithUnsyncedLocations,
  getUnsyncedLocations,
  markLocationSynced,
  updateSessionServerId,
  endLocalSession,
  getSessionByLocalId,
  getAllLocationsForSession,
  relocatePointsToSession,
} from './OfflineLocationStore';

let isSyncing = false;
let syncPromise = null; // Store the sync promise to prevent concurrent syncs
let netInfoListener = null; // Store NetInfo listener to prevent duplicates
let lastSyncTime = 0; // Track last sync time for debouncing
const SYNC_DEBOUNCE_MS = 5000; // Minimum 5 seconds between sync triggers
let syncLock = false; // Additional lock to prevent any concurrent syncs

export const isOnline = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected && state.isInternetReachable !== false;
};

export const syncPendingLocations = async () => {
  // If already syncing or sync lock is active, return the existing promise to avoid duplicate syncs
  if ((isSyncing && syncPromise) || syncLock) {
    console.log('[SyncService] Sync already in progress or locked, waiting for it to complete...');
    if (syncPromise) {
      return syncPromise;
    }
    return { success: false, synced: 0, reason: 'locked' };
  }

  // Debounce: prevent sync from being triggered too frequently
  const now = Date.now();
  if (now - lastSyncTime < SYNC_DEBOUNCE_MS) {
    console.log('[SyncService] Sync debounced, last sync was', Math.round((now - lastSyncTime) / 1000), 'seconds ago');
    return { success: false, synced: 0, reason: 'debounced' };
  }

  const online = await isOnline();
  if (!online) {
    console.log('[SyncService] Offline, skipping sync');
    return { success: false, synced: 0, reason: 'offline' };
  }

  // Set isSyncing AND syncLock BEFORE anything else to prevent race conditions
  isSyncing = true;
  syncLock = true;
  lastSyncTime = now;
  let totalSynced = 0;

  // Create the sync promise and store it to prevent concurrent syncs
  syncPromise = (async () => {
    try {
      console.log('[SyncService] Starting sync...');
      const sessionsWithUnsynced = await getAllSessionsWithUnsyncedLocations();
      console.log('[SyncService] Found sessions with unsynced locations:', sessionsWithUnsynced.length);

      // Deduplicate sessions - if multiple sessions have similar start times (within 5 minutes),
      // treat them as the same session and only create one server session
      const deduplicatedSessions = [];
      const processedStarts = new Map(); // Track start times to session mapping
      const duplicateSessions = []; // Track duplicate sessions for point relocation
      
      for (const { session, unsyncedCount } of sessionsWithUnsynced) {
        const sessionStartTime = session.startTime;
        
        // Check if there's already a session being processed with a similar start time
        let existingSession = null;
        for (const [startTime, existing] of processedStarts) {
          const timeDiff = Math.abs(sessionStartTime - startTime);
          // If sessions are within 5 minutes of each other, consider them duplicates
          if (timeDiff < 5 * 60 * 1000) {
            existingSession = existing;
            break;
          }
        }
        
        if (existingSession) {
          console.log('[SyncService] Marking duplicate session:', session.localSessionId, 
            '(within 5 min of existing session)', existingSession.localSessionId);
          // Mark this session as a duplicate for point relocation
          duplicateSessions.push({ duplicate: session, main: existingSession });
        } else {
          processedStarts.set(sessionStartTime, session);
          deduplicatedSessions.push({ session, unsyncedCount });
        }
      }

      // Relocate points from duplicate sessions to their main sessions
      // This ensures all location data is synced to a single server session
      for (const { duplicate, main } of duplicateSessions) {
        console.log('[SyncService] Relocating points from duplicate session to main session');
        const mainSessionInfo = await getSessionByLocalId(main.localSessionId);
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

      console.log('[SyncService] After deduplication:', deduplicatedSessions.length, 'sessions to process');

      for (const { session, unsyncedCount } of deduplicatedSessions) {
        console.log('[SyncService] ===========================================');
        console.log('[SyncService] Processing session:', session.localSessionId);
        console.log('[SyncService] - unsyncedCount:', unsyncedCount);
        console.log('[SyncService] - serverSessionId:', session.serverSessionId);
        console.log('[SyncService] - status:', session.status);
        console.log('[SyncService] - synced:', session.synced);
        console.log('[SyncService] ===========================================');
        
        if (unsyncedCount === 0 && session.synced) continue;

        // Re-fetch session from database to get the latest state
        // This prevents creating duplicate server sessions if another sync process updated it
        const currentSession = await getSessionByLocalId(session.localSessionId);
        let serverSessionId = currentSession?.serverSessionId;
        
        console.log('[SyncService] Current serverSessionId after re-fetch:', serverSessionId);

        // Double-check if another concurrent process already created the session
        // by querying again just before creating (with a small delay if needed)
        if (!serverSessionId) {
          // Add a small delay to allow any concurrent operations to complete
          await new Promise(resolve => setTimeout(resolve, 100));
          const recheckSession = await getSessionByLocalId(session.localSessionId);
          serverSessionId = recheckSession?.serverSessionId;
          console.log('[SyncService] ServerSessionId after recheck:', serverSessionId);
        }

        // If this session does not yet exist on the server (including
        // purely offline "local_*" sessions), create it now and link
        // it to the local session so all buffered points can be synced.
        if (!serverSessionId) {
          // For offline sessions, get the punch-in photo from session record
          try {
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
              console.log('[SyncService] Linking local session to server session...');
              await updateSessionServerId(session.localSessionId, serverSessionId);
              console.log('[SyncService] Session linked successfully');
            } else {
              console.warn('[SyncService] No sessionId returned from server!');
            }
          } catch (err) {
            console.warn('SyncService: Failed to create session on server:', err?.message);
            continue;
          }
        }

        if (!serverSessionId) {
          console.warn('[SyncService] No serverSessionId, skipping session:', session.localSessionId);
          continue;
        }

        const unsyncedPoints = await getUnsyncedLocations(session.localSessionId);
        console.log('[SyncService] Found unsynced points:', unsyncedPoints.length);

        for (const point of unsyncedPoints) {
          try {
            const formData = new FormData();
            formData.append('latitude', String(point.latitude));
            formData.append('longitude', String(point.longitude));
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
            if (hasPhoto) {
              const photoPath = point.photoUri.startsWith('file://') ? point.photoUri.replace('file://', '') : point.photoUri;
              try {
                photoFileExists = await RNFS.exists(photoPath);
              } catch {
                photoFileExists = false;
              }
            }

            if (hasPhoto && photoFileExists) {
              const photoUri = point.photoUri.startsWith('file://') ? point.photoUri : `file://${point.photoUri}`;
              const fileName = point.photoUri.split('/').pop() || `photo_${point.timestamp}.jpg`;
              formData.append('photo', {
                uri: photoUri,
                name: fileName,
                type: 'image/jpeg',
              });
            }

            const result = hasPhoto && photoFileExists
              ? await TrackingService.addLocationWithPhoto(serverSessionId, formData)
              : await TrackingService.addLocationWithFormData(serverSessionId, formData);

            if (result.success) {
              await markLocationSynced(point.id);
              totalSynced++;
              console.log('[SyncService] Synced point:', point.id);
            }
          } catch (err) {
            console.warn('SyncService: Failed to upload location:', err?.message);
            break;
          }
        }

        // End the session on server if it was ended locally
        // Use currentSession to get the latest status
        const sessionToEnd = currentSession || session;
        if (sessionToEnd.status === 'ended') {
          console.log('[SyncService] Session is ended locally, ending on server...');
          
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
          
          try {
            await TrackingService.endSession(serverSessionId, punchOutPhoto);
            console.log('[SyncService] Ended session on server:', serverSessionId);
          } catch (err) {
            console.warn('SyncService: Failed to end session:', err?.message);
          }
        }
      }

      console.log('[SyncService] Total synced:', totalSynced);
      return { success: true, synced: totalSynced };
    } catch (error) {
      console.error('SyncService: Sync error:', error);
      return { success: false, synced: totalSynced, error };
    } finally {
      isSyncing = false;
      syncLock = false;
      syncPromise = null; // Clear the sync promise when done
    }
  })();

  return syncPromise;
};

export const setupSyncOnReconnect = (onSyncComplete) => {
  // Remove existing listener if present to prevent duplicate listeners
  if (netInfoListener) {
    netInfoListener();
  }
  
  netInfoListener = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      console.log('[SyncService] Network restored, triggering sync...');
      syncPendingLocations().then((result) => {
        onSyncComplete?.(result);
      });
    }
  });
};

// Cleanup function to remove NetInfo listener
export const cleanupSyncListeners = () => {
  if (netInfoListener) {
    netInfoListener();
    netInfoListener = null;
    console.log('[SyncService] NetInfo listener cleaned up');
  }
};

// Reset sync state - useful for recovering from stuck states
export const resetSyncState = () => {
  isSyncing = false;
  syncPromise = null;
  lastSyncTime = 0;
  console.log('[SyncService] Sync state reset');
};
