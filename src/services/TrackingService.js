import Api, { getRequest, postRequest, putRequest, deleteRequest } from '../config/Api';
import {
  createLocalSession,
  saveLocationPoint,
  markLocationSynced,
  endLocalSession,
  generateLocalSessionId,
} from './OfflineLocationStore';
import { copyPhotoToOfflineStorage } from '../utils/photoStorage';

const TRACKING_BASE = 'api/Tracking';

const isLocalSessionId = (id) => id && String(id).startsWith('local_');

export const startSession = async () => {
  try {
    const { data } = await postRequest(`${TRACKING_BASE}/AddTrackingSession`, {});
    console.log("startSession ---------->", data);
    return data;
  } catch (error) {
    console.error('Failed to start session:', error);
    throw error;
  }
};

export const startSessionOfflineFirst = async () => {
  try {
    const { data } = await postRequest(`${TRACKING_BASE}/AddTrackingSession`, {});
    const sessionId = data?.sessionId;
    const startTime = data?.startTime ? new Date(data.startTime).getTime() : Date.now();
    if (sessionId) {
      await createLocalSession(sessionId, startTime, sessionId);
    }
    return data;
  } catch (error) {
    console.warn('Start session failed (offline?), creating local session:', error?.message);
    const localId = generateLocalSessionId();
    const startTime = Date.now();
    await createLocalSession(localId, startTime, null);
    return { sessionId: localId, startTime: new Date(startTime).toISOString(), isOffline: true };
  }
};

export const addLocationOfflineFirst = async (sessionId, locationData, formData) => {
  const isOnline = locationData.isOnline ?? false;
  const locationPayload = {
    sessionLocalId: sessionId,
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    timestamp: locationData.timestamp ?? Date.now(),
    address: locationData.address ?? 'Unknown Address',
    road: locationData.road ?? 'Unknown Road',
    area: locationData.area ?? 'Unknown Area',
    accuracy: locationData.accuracy ?? null,
    heading: locationData.heading ?? locationData.bearing ?? null,
    speed: locationData.speed ?? null,
    batteryPercentage: locationData.batteryPercentage ?? null,
    source: locationData.source ?? 'foreground',
    remark: locationData.remark ?? null,
    amount: locationData.amount ?? null,
    photoUri: locationData.photoUri ?? null,
    isOnline,
  };
  
  console.log('Saving location to offline store:', {
    sessionId,
    lat: locationData.latitude?.toFixed(6),
    lng: locationData.longitude?.toFixed(6),
    source: locationData.source,
    timestamp: locationData.timestamp
  });
  
  const pointId = await saveLocationPoint(locationPayload);
  
  if (isLocalSessionId(sessionId)) {
    return { success: true, storedOffline: true, synced: false };
  }
  
  try {
    formData.append('isOnline', isOnline ? 'true' : 'false');
    const result = await addLocationWithFormData(sessionId, formData);
    if (result.success) {
      await markLocationSynced(pointId);
      return { success: true, storedOffline: true, synced: true };
    } else {
      console.warn('Failed to sync location, keeping offline');
      return { success: true, storedOffline: true, synced: false };
    }
  } catch (error) {
    console.warn('Error syncing location:', error.message);
    return { success: true, storedOffline: true, synced: false };
  }
};

export const addLocationWithFormData = async (sessionId, formData) => {
  try {
    const response = await Api.post(
      `${TRACKING_BASE}/${sessionId}/locations`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000,
        validateStatus: (status) => status === 204 || status === 200,
      }
    );
    
    console.log(`Location sent successfully to session ${sessionId}, status: ${response.status}`);
    return { success: true, status: response.status };
  } catch (error) {
    // console.error('Failed to send location:', error);
    return { success: false, error };
  }
};

export const addLocationWithPhoto = async (sessionId, formData) => {
  try {
    const response = await Api.post(
      `${TRACKING_BASE}/${sessionId}/locations`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
        validateStatus: (status) => status === 204 || status === 200,
      }
    );
    console.log('Photo with location sent successfully');
    return { success: true, status: response.status };
  } catch (error) {
    console.error('Failed to send photo with location:', error);
    return { success: false, error };
  }
};

/**
 * Offline-first: saves photo with location to local DB, then syncs when online.
 * When offline or sync fails: copies photo to persistent storage and saves location with photoUri.
 */
export const addLocationWithPhotoOfflineFirst = async (sessionId, locationData, formData) => {
  const {
    latitude,
    longitude,
    timestamp = Date.now(),
    address = 'Unknown Address',
    road = 'Unknown Road',
    area = 'Unknown Area',
    accuracy = null,
    heading = null,
    speed = null,
    batteryPercentage = null,
    remark = null,
    amount = null,
  } = locationData;

  let persistedPhotoPath = null;
  const photoFile = locationData.photoFile; // { uri, fileName, type }

  if (photoFile?.uri) {
    try {
      persistedPhotoPath = await copyPhotoToOfflineStorage(
        photoFile.uri,
        photoFile.fileName || `photo_${timestamp}.jpg`
      );
      console.log('Photo copied to offline storage:', persistedPhotoPath);
    } catch (copyError) {
      console.error('Failed to copy photo to offline storage:', copyError);
      return { success: false, error: copyError };
    }
  }

  const isOnline = locationData.isOnline ?? false;
  const locationPayload = {
    sessionLocalId: sessionId,
    latitude,
    longitude,
    timestamp,
    address,
    road,
    area,
    accuracy,
    heading,
    speed,
    batteryPercentage,
    source: 'photo',
    remark,
    amount,
    photoUri: persistedPhotoPath,
    isOnline,
  };

  const pointId = await saveLocationPoint(locationPayload);

  if (isLocalSessionId(sessionId)) {
    return { success: true, storedOffline: true, synced: false };
  }

  try {
    const result = await addLocationWithPhoto(sessionId, formData);
    if (result.success) {
      await markLocationSynced(pointId);
      return { success: true, storedOffline: true, synced: true };
    }
  } catch (error) {
    console.warn('Photo upload failed (offline?), saved locally:', error?.message);
  }

  return { success: true, storedOffline: true, synced: false };
};

export const endSessionOfflineFirst = async (sessionId) => {
  const endTime = Date.now();
  await endLocalSession(sessionId, endTime);
  if (isLocalSessionId(sessionId)) {
    return { success: true, storedOffline: true };
  }
  try {
    const data = await endSession(sessionId);
    return data;
  } catch (error) {
    console.warn('End session API failed (offline?), session saved locally:', error?.message);
    return { success: true, storedOffline: true };
  }
};

export const endSession = async (sessionId) => {
  try {
    const { data } = await putRequest(`${TRACKING_BASE}/${sessionId}/end`, {});
    return data;
  } catch (error) {
    // console.error('Failed to end session:', error);
    throw error;
  }
};

export const getSessionDetailsOfflineFirst = async (sessionId) => {
  if (isLocalSessionId(sessionId)) {
    const { getLocalSessionDetail } = await import('./OfflineLocationStore');
    return getLocalSessionDetail(sessionId);
  }
  return getSessionDetails(sessionId);
};

export const getSessionDetails = async (sessionId) => {
  try {
    const { data } = await getRequest(`${TRACKING_BASE}/sessions/${sessionId}`);
    return data;
  } catch (error) {
    console.error('Failed to get session details:', error);
    return null;
  }
};

export const testSessionLocations = async (sessionId) => {
  try {
    const { data } = await getRequest(`${TRACKING_BASE}/sessions/${sessionId}`);
    console.log("Session Locations Test:");
    console.log("Total locations:", data?.locations?.length || 0);
    console.log("Sample locations:", data?.locations?.slice(0, 5));
    return data?.locations || [];
  } catch (error) {
    console.error('Failed to test session locations:', error);
    return [];
  }
};

export const getSessions = async (opts = {}) => {
  const { page = 1, limit = 20, sort = 'createdAt_desc' } = opts;
  const params = new URLSearchParams({ page, limit, sort });
  try {
    const { data } = await getRequest(`${TRACKING_BASE}/GetUserSesionHistory?${params.toString()}`);
    return data;
  } catch (error) {
    console.error('Failed to get sessions:', error);
    return { sessions: [], totalCount: 0 };
  }
};

/**
 * Fetches session history with date filtering (cursor-based pagination).
 * API: GET /api/Tracking/GetUserSesionHistory
 * @param {Object} opts - { limit?, cursor?, startDate?, endDate? }
 * @returns {Promise<{sessions, nextCursor, limit, totalFetched}>}
 */
export const getSessionHistory = async (opts = {}) => {
  const { limit = 20, cursor, startDate, endDate } = opts;
  const params = new URLSearchParams();
  if (limit) params.append('limit', Math.min(limit, 50));
  if (cursor) params.append('cursor', cursor);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  try {
    const { data } = await getRequest(`${TRACKING_BASE}/GetUserSesionHistory?${params.toString()}`);
    return data;
  } catch (error) {
    console.error('Failed to get session history:', error);
    return { sessions: [], nextCursor: null, totalFetched: 0 };
  }
};

export const deleteSession = async (sessionId) => {
  try {
    await deleteRequest(`${TRACKING_BASE}/${sessionId}`, {
      validateStatus: (s) => s === 204 || s === 200,
    });
  } catch (error) {
    console.error('Failed to delete session:', error);
    throw error;
  }
};

export const getUserTrackingDates = async (userId) => {
  console.log('getUserTrackingDates called with userId:', userId);
  try {
    const response = await Api.get(
      `${TRACKING_BASE}/admin/users/${userId}/sessions/dates`
    );

    console.log('getUserTrackingDates raw response status:', response.status);
    console.log('getUserTrackingDates raw response data:', response.data);

    const data = response.data;
    if (data?.success && data?.data) {
      return data.data.dates || [];
    }
    return [];
  } catch (error) {
    if (error.response) {
      console.error(
        'Failed to fetch user tracking dates (response error):',
        error.response.status,
        error.response.data
      );
    } else {
      console.error('Failed to fetch user tracking dates:', error.message);
    }
    return [];
  }
};

