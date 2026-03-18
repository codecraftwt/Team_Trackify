import RNFS from 'react-native-fs';
import NetInfo from '@react-native-community/netinfo';
import * as TrackingService from './TrackingService';
import {
  getAllSessionsWithUnsyncedLocations,
  getUnsyncedLocations,
  markLocationSynced,
  updateSessionServerId,
  endLocalSession,
} from './OfflineLocationStore';

let isSyncing = false;

export const isOnline = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected && state.isInternetReachable !== false;
};

export const syncPendingLocations = async () => {
  if (isSyncing) {
    console.log('SyncService: Sync already in progress, skipping');
    return { success: true, synced: 0 };
  }

  const online = await isOnline();
  if (!online) {
    console.log('SyncService: Offline, skipping sync');
    return { success: false, synced: 0, reason: 'offline' };
  }

  isSyncing = true;
  let totalSynced = 0;

  try {
    const sessionsWithUnsynced = await getAllSessionsWithUnsyncedLocations();

    for (const { session, unsyncedCount } of sessionsWithUnsynced) {
      if (unsyncedCount === 0 && session.synced) continue;

      let serverSessionId = session.serverSessionId;

      // If this session does not yet exist on the server (including
      // purely offline "local_*" sessions), create it now and link
      // it to the local session so all buffered points can be synced.
      if (!serverSessionId) {
        try {
          const res = await TrackingService.startSession();
          serverSessionId = res?.sessionId;
          if (serverSessionId) {
            await updateSessionServerId(session.localSessionId, serverSessionId);
          }
        } catch (err) {
          console.warn('SyncService: Failed to create session on server:', err?.message);
          continue;
        }
      }

      if (!serverSessionId) continue;

      const unsyncedPoints = await getUnsyncedLocations(session.localSessionId);

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
          }
        } catch (err) {
          console.warn('SyncService: Failed to upload location:', err?.message);
          break;
        }
      }

      if (session.status === 'ended') {
        try {
          await TrackingService.endSession(serverSessionId);
        } catch (err) {
          console.warn('SyncService: Failed to end session:', err?.message);
        }
      }
    }

    return { success: true, synced: totalSynced };
  } catch (error) {
    console.error('SyncService: Sync error:', error);
    return { success: false, synced: totalSynced, error };
  } finally {
    isSyncing = false;
  }
};

export const setupSyncOnReconnect = (onSyncComplete) => {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      console.log('SyncService: Network restored, triggering sync');
      syncPendingLocations().then((result) => {
        onSyncComplete?.(result);
      });
    }
  });
};

