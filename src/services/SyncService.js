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
} from './OfflineLocationStore';

let isSyncing = false;
let syncPromise = null; // Store the sync promise to prevent concurrent syncs

export const isOnline = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected && state.isInternetReachable !== false;
};

export const syncPendingLocations = async () => {
  // If already syncing, return the existing promise to avoid duplicate syncs
  if (isSyncing && syncPromise) {
    console.log('[SyncService] Sync already in progress, waiting for it to complete...');
    return syncPromise;
  }

  const online = await isOnline();
  if (!online) {
    console.log('[SyncService] Offline, skipping sync');
    return { success: false, synced: 0, reason: 'offline' };
  }

  isSyncing = true;
  let totalSynced = 0;

  // Create the sync promise and store it to prevent concurrent syncs
  syncPromise = (async () => {
    try {
      console.log('[SyncService] Starting sync...');
      const sessionsWithUnsynced = await getAllSessionsWithUnsyncedLocations();
      console.log('[SyncService] Found sessions with unsynced locations:', sessionsWithUnsynced.length);

      for (const { session, unsyncedCount } of sessionsWithUnsynced) {
        console.log('[SyncService] ===========================================');
        console.log('[SyncService] Processing session:', session.localSessionId);
        console.log('[SyncService] - unsyncedCount:', unsyncedCount);
        console.log('[SyncService] - serverSessionId:', session.serverSessionId);
        console.log('[SyncService] - status:', session.status);
        console.log('[SyncService] - synced:', session.synced);
        console.log('[SyncService] ===========================================');
        
        if (unsyncedCount === 0 && session.synced) continue;

        let serverSessionId = session.serverSessionId;

        // If this session does not yet exist on the server (including
        // purely offline "local_*" sessions), create it now and link
        // it to the local session so all buffered points can be synced.
        if (!serverSessionId) {
          // For offline sessions, get the punch-in photo from session record
          try {
            let photoFile = null;
            
            // Get punch-in photo from session record
            const punchInPhotoUri = session.punchInPhotoUri;
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
              const allLocations = await getAllLocationsForSession(session.localSessionId);
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
        if (session.status === 'ended') {
          console.log('[SyncService] Session is ended locally, ending on server...');
          
          // Try to get punch-out photo from session
          let punchOutPhoto = null;
          if (session.punchOutPhotoUri) {
            const photoPath = session.punchOutPhotoUri.startsWith('file://') 
              ? session.punchOutPhotoUri.replace('file://', '') 
              : session.punchOutPhotoUri;
            try {
              const photoFileExists = await RNFS.exists(photoPath);
              if (photoFileExists) {
                punchOutPhoto = {
                  uri: session.punchOutPhotoUri.startsWith('file://') ? session.punchOutPhotoUri : `file://${photoPath}`,
                  fileName: session.punchOutPhotoUri.split('/').pop() || `punchout_${session.endTime}.jpg`,
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
      syncPromise = null; // Clear the sync promise when done
    }
  })();

  return syncPromise;
};

export const setupSyncOnReconnect = (onSyncComplete) => {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      console.log('[SyncService] Network restored, triggering sync...');
      syncPendingLocations().then((result) => {
        onSyncComplete?.(result);
      });
    }
  });
};
