// ============================================checkin photo upload code ============================================
// import Api, { getRequest, postRequest, putRequest, deleteRequest } from '../config/Api';
// import {
//   createLocalSession,
//   saveLocationPoint,
//   markLocationSynced,
//   endLocalSession,
//   generateLocalSessionId,
// } from './OfflineLocationStore';
// import { copyPhotoToOfflineStorage } from '../utils/photoStorage';

// const TRACKING_BASE = 'api/Tracking';

// const isLocalSessionId = (id) => id && String(id).startsWith('local_');

// const buildPhotoFormData = (photoFile) => {
//   const fd = new FormData();
//   if (!photoFile?.uri) return fd;
//   fd.append('photo', {
//     uri: photoFile.uri,
//     name: photoFile.fileName || photoFile.name || `photo_${Date.now()}.jpg`,
//     type: photoFile.type || 'image/jpeg',
//   });
//   return fd;
// };

// export const startSession = async (photoFile) => {
//   try {
//     if (!photoFile?.uri) {
//       throw new Error('Photo is required to start tracking');
//     }
//     const formData = buildPhotoFormData(photoFile);
//     const response = await Api.post(`${TRACKING_BASE}/AddTrackingSession`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//       timeout: 30000,
//       validateStatus: (status) => status >= 200 && status < 300,
//     });
//     const data = response?.data;
//     console.log("startSession ---------->", data);
//     return data;
//   } catch (error) {
//     console.error('Failed to start session:', error);
//     throw error;
//   }
// };

// export const startSessionOfflineFirst = async (photoFile) => {
//   try {
//     if (!photoFile?.uri) {
//       throw new Error('Photo is required to start tracking');
//     }
//     const formData = buildPhotoFormData(photoFile);
//     const response = await Api.post(`${TRACKING_BASE}/AddTrackingSession`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//       timeout: 30000,
//       validateStatus: (status) => status >= 200 && status < 300,
//     });
//     const data = response?.data;
//     const sessionId = data?.sessionId;
//     const startTime = data?.startTime ? new Date(data.startTime).getTime() : Date.now();
//     if (sessionId) {
//       await createLocalSession(sessionId, startTime, sessionId);
//     }
//     return data;
//   } catch (error) {
//     console.warn('Start session failed (offline?), creating local session:', error?.message);
//     const localId = generateLocalSessionId();
//     const startTime = Date.now();
//     await createLocalSession(localId, startTime, null);
//     return { sessionId: localId, startTime: new Date(startTime).toISOString(), isOffline: true };
//   }
// };

// export const addLocationOfflineFirst = async (sessionId, locationData, formData) => {
//   const isOnline = locationData.isOnline ?? false;
//   const locationPayload = {
//     sessionLocalId: sessionId,
//     latitude: locationData.latitude,
//     longitude: locationData.longitude,
//     timestamp: locationData.timestamp ?? Date.now(),
//     address: locationData.address ?? 'Unknown Address',
//     road: locationData.road ?? 'Unknown Road',
//     area: locationData.area ?? 'Unknown Area',
//     accuracy: locationData.accuracy ?? null,
//     heading: locationData.heading ?? locationData.bearing ?? null,
//     speed: locationData.speed ?? null,
//     batteryPercentage: locationData.batteryPercentage ?? null,
//     source: locationData.source ?? 'foreground',
//     remark: locationData.remark ?? null,
//     amount: locationData.amount ?? null,
//     photoUri: locationData.photoUri ?? null,
//     isOnline,
//   };
  
//   console.log('Saving location to offline store:', {
//     sessionId,
//     lat: locationData.latitude?.toFixed(6),
//     lng: locationData.longitude?.toFixed(6),
//     source: locationData.source,
//     timestamp: locationData.timestamp
//   });
  
//   const pointId = await saveLocationPoint(locationPayload);
  
//   if (isLocalSessionId(sessionId)) {
//     return { success: true, storedOffline: true, synced: false };
//   }
  
//   try {
//     formData.append('isOnline', isOnline ? 'true' : 'false');
//     const result = await addLocationWithFormData(sessionId, formData);
//     if (result.success) {
//       await markLocationSynced(pointId);
//       return { success: true, storedOffline: true, synced: true };
//     } else {
//       console.warn('Failed to sync location, keeping offline');
//       return { success: true, storedOffline: true, synced: false };
//     }
//   } catch (error) {
//     console.warn('Error syncing location:', error.message);
//     return { success: true, storedOffline: true, synced: false };
//   }
// };

// export const addLocationWithFormData = async (sessionId, formData) => {
//   try {
//     const response = await Api.post(
//       `${TRACKING_BASE}/${sessionId}/locations`,
//       formData,
//       {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//         timeout: 10000,
//         validateStatus: (status) => status === 204 || status === 200,
//       }
//     );
    
//     console.log(`Location sent successfully to session ${sessionId}, status: ${response.status}`);
//     return { success: true, status: response.status };
//   } catch (error) {
//     // console.error('Failed to send location:', error);
//     return { success: false, error };
//   }
// };

// export const addLocationWithPhoto = async (sessionId, formData) => {
//   try {
//     const response = await Api.post(
//       `${TRACKING_BASE}/${sessionId}/locations`,
//       formData,
//       {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//         timeout: 30000,
//         validateStatus: (status) => status === 204 || status === 200,
//       }
//     );
//     console.log('Photo with location sent successfully');
//     return { success: true, status: response.status };
//   } catch (error) {
//     console.error('Failed to send photo with location:', error);
//     return { success: false, error };
//   }
// };

// /**
//  * Offline-first: saves photo with location to local DB, then syncs when online.
//  * When offline or sync fails: copies photo to persistent storage and saves location with photoUri.
//  */
// export const addLocationWithPhotoOfflineFirst = async (sessionId, locationData, formData) => {
//   const {
//     latitude,
//     longitude,
//     timestamp = Date.now(),
//     address = 'Unknown Address',
//     road = 'Unknown Road',
//     area = 'Unknown Area',
//     accuracy = null,
//     heading = null,
//     speed = null,
//     batteryPercentage = null,
//     remark = null,
//     amount = null,
//   } = locationData;

//   let persistedPhotoPath = null;
//   const photoFile = locationData.photoFile; // { uri, fileName, type }

//   if (photoFile?.uri) {
//     try {
//       persistedPhotoPath = await copyPhotoToOfflineStorage(
//         photoFile.uri,
//         photoFile.fileName || `photo_${timestamp}.jpg`
//       );
//       console.log('Photo copied to offline storage:', persistedPhotoPath);
//     } catch (copyError) {
//       console.error('Failed to copy photo to offline storage:', copyError);
//       return { success: false, error: copyError };
//     }
//   }

//   const isOnline = locationData.isOnline ?? false;
//   const locationPayload = {
//     sessionLocalId: sessionId,
//     latitude,
//     longitude,
//     timestamp,
//     address,
//     road,
//     area,
//     accuracy,
//     heading,
//     speed,
//     batteryPercentage,
//     source: 'photo',
//     remark,
//     amount,
//     photoUri: persistedPhotoPath,
//     isOnline,
//   };

//   const pointId = await saveLocationPoint(locationPayload);

//   if (isLocalSessionId(sessionId)) {
//     return { success: true, storedOffline: true, synced: false };
//   }

//   try {
//     const result = await addLocationWithPhoto(sessionId, formData);
//     if (result.success) {
//       await markLocationSynced(pointId);
//       return { success: true, storedOffline: true, synced: true };
//     }
//   } catch (error) {
//     console.warn('Photo upload failed (offline?), saved locally:', error?.message);
//   }

//   return { success: true, storedOffline: true, synced: false };
// };

// export const endSessionOfflineFirst = async (sessionId, photoFile) => {
//   const endTime = Date.now();
//   await endLocalSession(sessionId, endTime);
//   if (isLocalSessionId(sessionId)) {
//     return { success: true, storedOffline: true };
//   }
//   try {
//     const data = await endSession(sessionId, photoFile);
//     return data;
//   } catch (error) {
//     console.warn('End session API failed (offline?), session saved locally:', error?.message);
//     return { success: true, storedOffline: true };
//   }
// };

// export const endSession = async (sessionId, photoFile) => {
//   try {
//     if (!photoFile?.uri) {
//       throw new Error('Photo is required to end tracking');
//     }
//     const formData = buildPhotoFormData(photoFile);
//     const response = await Api.put(`${TRACKING_BASE}/${sessionId}/end`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//       timeout: 30000,
//       validateStatus: (status) => status >= 200 && status < 300,
//     });
//     const data = response?.data;
//     return data;
//   } catch (error) {
//     // console.error('Failed to end session:', error);
//     throw error;
//   }
// };

// export const getSessionDetailsOfflineFirst = async (sessionId) => {
//   if (isLocalSessionId(sessionId)) {
//     const { getLocalSessionDetail } = await import('./OfflineLocationStore');
//     return getLocalSessionDetail(sessionId);
//   }
//   return getSessionDetails(sessionId);
// };

// export const getSessionDetails = async (sessionId) => {
//   try {
//     const { data } = await getRequest(`${TRACKING_BASE}/sessions/${sessionId}`);
//     return data;
//   } catch (error) {
//     console.error('Failed to get session details:', error);
//     return null;
//   }
// };

// export const testSessionLocations = async (sessionId) => {
//   try {
//     const { data } = await getRequest(`${TRACKING_BASE}/sessions/${sessionId}`);
//     console.log("Session Locations Test:");
//     console.log("Total locations:", data?.locations?.length || 0);
//     console.log("Sample locations:", data?.locations?.slice(0, 5));
//     return data?.locations || [];
//   } catch (error) {
//     console.error('Failed to test session locations:', error);
//     return [];
//   }
// };

// export const getSessions = async (opts = {}) => {
//   const { page = 1, limit = 20, sort = 'createdAt_desc' } = opts;
//   const params = new URLSearchParams({ page, limit, sort });
//   try {
//     const { data } = await getRequest(`${TRACKING_BASE}/GetUserSesionHistory?${params.toString()}`);
//     return data;
//   } catch (error) {
//     console.error('Failed to get sessions:', error);
//     return { sessions: [], totalCount: 0 };
//   }
// };

// /**
//  * Fetches session history with date filtering (cursor-based pagination).
//  * API: GET /api/Tracking/GetUserSesionHistory
//  * @param {Object} opts - { limit?, cursor?, startDate?, endDate? }
//  * @returns {Promise<{sessions, nextCursor, limit, totalFetched}>}
//  */
// export const getSessionHistory = async (opts = {}) => {
//   const { limit = 20, cursor, startDate, endDate } = opts;
//   const params = new URLSearchParams();
//   if (limit) params.append('limit', Math.min(limit, 50));
//   if (cursor) params.append('cursor', cursor);
//   if (startDate) params.append('startDate', startDate);
//   if (endDate) params.append('endDate', endDate);
//   try {
//     const { data } = await getRequest(`${TRACKING_BASE}/GetUserSesionHistory?${params.toString()}`);
//     return data;
//   } catch (error) {
//     console.error('Failed to get session history:', error);
//     return { sessions: [], nextCursor: null, totalFetched: 0 };
//   }
// };

// export const deleteSession = async (sessionId) => {
//   try {
//     await deleteRequest(`${TRACKING_BASE}/${sessionId}`, {
//       validateStatus: (s) => s === 204 || s === 200,
//     });
//   } catch (error) {
//     console.error('Failed to delete session:', error);
//     throw error;
//   }
// };

// export const getUserTrackingDates = async (userId) => {
//   console.log('getUserTrackingDates called with userId:', userId);
//   try {
//     const response = await Api.get(
//       `${TRACKING_BASE}/admin/users/${userId}/sessions/dates`
//     );

//     console.log('getUserTrackingDates raw response status:', response.status);
//     console.log('getUserTrackingDates raw response data:', response.data);

//     const data = response.data;
//     if (data?.success && data?.data) {
//       return data.data.dates || [];
//     }
//     return [];
//   } catch (error) {
//     if (error.response) {
//       console.error(
//         'Failed to fetch user tracking dates (response error):',
//         error.response.status,
//         error.response.data
//       );
//     } else {
//       console.error('Failed to fetch user tracking dates:', error.message);
//     }
//     return [];
//   }
// };

// / ============================================== checkin photo upload ode end ========================================

import Api, { getRequest, postRequest, putRequest, deleteRequest } from '../config/Api';
import {
  createLocalSession,
  saveLocationPoint,
  markLocationSynced,
  endLocalSession,
  generateLocalSessionId,
  updateSessionPunchOutPhoto,
} from './OfflineLocationStore';
import { copyPhotoToOfflineStorage } from '../utils/photoStorage';

const TRACKING_BASE = 'api/Tracking';

const isLocalSessionId = (id) => id && String(id).startsWith('local_');

// Validate location coordinates to prevent invalid data
const isValidLocation = (latitude, longitude) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  Math.abs(latitude) <= 90 &&
  Math.abs(longitude) <= 180 &&
  !(latitude === 0 && longitude === 0);

const buildPhotoFormData = (photoFile, locationData = null) => {
  const fd = new FormData();
  if (!photoFile?.uri) return fd;
  fd.append('photo', {
    uri: photoFile.uri,
    name: photoFile.fileName || photoFile.name || `photo_${Date.now()}.jpg`,
    type: photoFile.type || 'image/jpeg',
  });

  // Add optional body parameters
  if (locationData) {
    if (locationData.latitude != null) {
      fd.append('latitude', String(locationData.latitude));
    }
    if (locationData.longitude != null) {
      fd.append('longitude', String(locationData.longitude));
    }
    if (locationData.accuracy != null) {
      fd.append('accuracy', String(locationData.accuracy));
    }
    if (locationData.heading != null) {
      fd.append('heading', String(locationData.heading));
    }
    if (locationData.speed != null) {
      fd.append('speed', String(locationData.speed));
    }
    if (locationData.address) {
      fd.append('address', locationData.address);
    }
    if (locationData.road) {
      fd.append('road', locationData.road);
    }
    if (locationData.area) {
      fd.append('area', locationData.area);
    }
    if (locationData.amount != null) {
      fd.append('amount', String(locationData.amount));
    }
    if (locationData.remark) {
      fd.append('remark', locationData.remark);
    }
    if (locationData.batteryPercentage != null) {
      fd.append('batteryPercentage', String(locationData.batteryPercentage));
    }
    if (locationData.isOnline != null) {
      fd.append('isOnline', locationData.isOnline ? 'true' : 'false');
    }
  }

  return fd;
};

export const startSession = async (photoFile, locationData = null) => {
  try {
    if (!photoFile?.uri) {
      throw new Error('Photo is required to start tracking');
    }
    const formData = buildPhotoFormData(photoFile, locationData);
    const response = await Api.post(`${TRACKING_BASE}/AddTrackingSession`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
      validateStatus: (status) => status >= 200 && status < 300,
    });
    const data = response?.data;
    // console.log("startSession --------->", data);
    return data;
  } catch (error) {
    console.error('Failed to start session:', error);
    throw error;
  }
};

// Create a session on server without requiring a photo
// This is used when syncing offline sessions that already have photos stored locally
export const createSessionDirectly = async () => {
  try {
    // Create session with minimal data - the punch-in photo will be uploaded with location points
    const response = await Api.post(`${TRACKING_BASE}/AddTrackingSession`, {}, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
      validateStatus: (status) => status >= 200 && status < 300,
    });
    const data = response?.data;
    return data;
  } catch (error) {
    console.error('Failed to create session directly:', error);
    throw error;
  }
};

export const startSessionOfflineFirst = async (photoFile, locationData = null) => {
  console.log('[TrackingService] startSessionOfflineFirst called with:', {
    hasPhoto: !!photoFile?.uri,
    locationData: locationData ? {
      lat: locationData.latitude,
      lng: locationData.longitude,
      isOnline: locationData.isOnline,
    } : null,
  });
  
  // Prevent starting a session with invalid location data (0,0)
  if (!locationData || (locationData.latitude === 0 && locationData.longitude === 0)) {
    console.error('[TrackingService] BLOCKED: Invalid location data (0,0) or missing locationData');
    return { error: 'Invalid location data. Please wait for a valid GPS signal.' };
  }

  try {
    if (!photoFile?.uri) {
      throw new Error('Photo is required to start tracking');
    }
    const formData = buildPhotoFormData(photoFile, locationData);
    const response = await Api.post(`${TRACKING_BASE}/AddTrackingSession`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
      validateStatus: (status) => status >= 200 && status < 300,
    });
    const data = response?.data;
    const sessionId = data?.sessionId;
    const startTime = data?.startTime ? new Date(data.startTime).getTime() : Date.now();
    
    console.log('[TrackingService] API SUCCESS - Session created:', {
      sessionId,
      startTime,
      isOnlineSession: true,
    });
    
    if (sessionId) {
      await createLocalSession(sessionId, startTime, sessionId, photoFile.uri);
      
      // Save the initial location point with "start" source for online sessions
      const timestamp = locationData.timestamp ?? Date.now();
      const locationPayload = {
        sessionLocalId: sessionId,
        latitude: Number(locationData.latitude),  // Explicit conversion
        longitude: Number(locationData.longitude),
        timestamp,
        address: locationData.address ?? 'Unknown Address',
        road: locationData.road ?? 'Unknown Road',
        area: locationData.area ?? 'Unknown Area',
        accuracy: locationData.accuracy != null ? Number(locationData.accuracy) : null,
        heading: locationData.heading != null ? Number(locationData.heading) : null,
        speed: locationData.speed != null ? Number(locationData.speed) : null,
        batteryPercentage: locationData.batteryPercentage != null ? Number(locationData.batteryPercentage) : null,
        source: 'start',
        remark: null,
        amount: null,
        photoUri: photoFile.uri,
        isOnline: locationData.isOnline ?? true,
      };
      
      console.log('[TrackingService] SAVING location point to DB (online session):', {
        sessionLocalId: sessionId,
        lat: locationPayload.latitude,
        lng: locationPayload.longitude,
        source: locationPayload.source,
        isOnline: locationPayload.isOnline,
        hasPhoto: !!locationPayload.photoUri,
      });
      
      await saveLocationPoint(locationPayload);
      
      console.log('[TrackingService] ✅ Location saved successfully for online session:', {
        sessionId,
        lat: locationPayload.latitude,
        lng: locationPayload.longitude,
      });
    }
    return data;
  } catch (error) {
    console.warn('[TrackingService] API FAILED - Creating offline session:', error?.message);
    const localId = generateLocalSessionId();
    const startTime = Date.now();
    // Store the punch-in photo URI for later sync
    const punchInPhotoUri = photoFile?.uri || null;
    await createLocalSession(localId, startTime, null, punchInPhotoUri);
    
    console.log('[TrackingService] Offline session created:', {
      localId,
      hasLocationData: !!locationData,
      lat: locationData?.latitude,
      lng: locationData?.longitude,
    });
    
    // CRITICAL: Save the initial location point with "start" source even for offline sessions
    // This ensures the first valid location is captured with the photo
    if (locationData && isValidLocation(locationData.latitude, locationData.longitude)) {
      const timestamp = locationData.timestamp ?? Date.now();
      const locationPayload = {
        sessionLocalId: localId,
        latitude: Number(locationData.latitude),  // Explicit conversion to number
        longitude: Number(locationData.longitude),
        timestamp,
        address: locationData.address ?? 'Unknown Address',
        road: locationData.road ?? 'Unknown Road',
        area: locationData.area ?? 'Unknown Area',
        accuracy: locationData.accuracy != null ? Number(locationData.accuracy) : null,
        heading: locationData.heading != null ? Number(locationData.heading) : null,
        speed: locationData.speed != null ? Number(locationData.speed) : null,
        batteryPercentage: locationData.batteryPercentage != null ? Number(locationData.batteryPercentage) : null,
        source: 'start',
        remark: null,
        amount: null,
        photoUri: punchInPhotoUri,
        isOnline: false,
      };
      
      console.log('[TrackingService] SAVING location point to DB (offline session):', {
        sessionLocalId: localId,
        lat: locationPayload.latitude,
        lng: locationPayload.longitude,
        source: locationPayload.source,
        isOnline: locationPayload.isOnline,
        hasPhoto: !!locationPayload.photoUri,
      });
      
      await saveLocationPoint(locationPayload);
      
      console.log('[TrackingService] ✅ Location saved successfully for offline session:', {
        localId,
        lat: locationPayload.latitude,
        lng: locationPayload.longitude,
      });
    } else {
      console.error('[TrackingService] ❌ CRITICAL: Cannot save location - invalid coordinates!', {
        hasLocationData: !!locationData,
        latitude: locationData?.latitude,
        longitude: locationData?.longitude,
        isValid: locationData ? isValidLocation(locationData.latitude, locationData.longitude) : false,
      });
    }
    
    return { sessionId: localId, startTime: new Date(startTime).toISOString(), isOffline: true };
  }
};

export const addLocationOfflineFirst = async (sessionId, locationData, formData) => {
  // Always check actual network status to ensure accurate isOnline field
  let actualIsOnline = false;
  try {
    const { isOnline: checkOnline } = await import('./SyncService');
    actualIsOnline = await checkOnline();
  } catch {
    // If network check fails, use the provided value as fallback
    actualIsOnline = locationData.isOnline ?? false;
  }
  
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
    isOnline: actualIsOnline,
  };
  
  // console.log('Saving location to offline store:', {
  //   sessionId,
  //   lat: locationData.latitude?.toFixed(6),
  //   lng: locationData.longitude?.toFixed(6),
  //   source: locationData.source,
  //   timestamp: locationData.timestamp
  // });
  
  const pointId = await saveLocationPoint(locationPayload);
  
  if (isLocalSessionId(sessionId)) {
    return { success: true, storedOffline: true, synced: false };
  }
  
  try {
    formData.append('isOnline', actualIsOnline ? 'true' : 'false');
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
    
    // console.log(`Location sent successfully to session ${sessionId}, status: ${response.status}`);
    // Return server response data if available (might contain photo URL)
    return { success: true, status: response.status, data: response?.data };
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
    // console.log('Photo with location sent successfully');
    // Return server response data if available (might contain photo URL)
    return { success: true, status: response.status, data: response?.data };
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
      // console.log('Photo copied to offline storage:', persistedPhotoPath);
    } catch (copyError) {
      console.error('Failed to copy photo to offline storage:', copyError);
      return { success: false, error: copyError };
    }
  }

  // Always check actual network status to ensure accurate isOnline field
  let actualIsOnline = false;
  try {
    const { isOnline: checkOnline } = await import('./SyncService');
    actualIsOnline = await checkOnline();
  } catch {
    // If network check fails, use the provided value as fallback
    actualIsOnline = locationData.isOnline ?? false;
  }
  
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
    isOnline: actualIsOnline,
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

export const endSessionOfflineFirst = async (sessionId, photoFile, locationData = null) => {
  const endTime = Date.now();
  
  // Save punch-out photo if provided
  if (photoFile?.uri) {
    try {
      await updateSessionPunchOutPhoto(sessionId, photoFile.uri);
    } catch (err) {
      console.warn('Failed to save punch-out photo:', err?.message);
    }
  }
  
  // Save end location point if location data provided (for offline sessions)
  // if (locationData && isLocalSessionId(sessionId)) {
  //   try {
  //     const { saveLocationPoint } = await import('./OfflineLocationStore');
      
  //     // Try to geocode the end location
  //     let address = locationData.address || 'End Location';
  //     let road = locationData.road || '';
  //     let area = locationData.area || '';
      
  //     try {
  //       const { geocodeLatLng } = await import('../utils/geocoding');
  //       const geo = await geocodeLatLng(locationData.latitude, locationData.longitude);
  //       if (geo) {
  //         address = geo.address || address;
  //         road = geo.road || road;
  //         area = geo.area || area;
  //       }
  //     } catch (geoErr) {
  //       console.log('[TrackingService] Could not geocode end location:', geoErr?.message);
  //     }
      
  //     await saveLocationPoint({
  //       sessionLocalId: sessionId,
  //       latitude: locationData.latitude,
  //       longitude: locationData.longitude,
  //       timestamp: endTime,
  //       address: address,
  //       road: road,
  //       area: area,
  //       accuracy: locationData.accuracy || null,
  //       heading: locationData.heading || null,
  //       speed: locationData.speed || null,
  //       batteryPercentage: locationData.batteryPercentage || null,
  //       source: 'end',  // Mark as end location
  //       remark: locationData.remark || null,
  //       amount: locationData.amount || null,
  //       photoUri: photoFile?.uri || null,
  //       isOnline: false,
  //     });
  //     console.log('[TrackingService] Saved end location point with source=end');
  //   } catch (err) {
  //     console.warn('Failed to save end location point:', err?.message);
  //   }
  // }
  
  await endLocalSession(sessionId, endTime);
  if (isLocalSessionId(sessionId)) {
    return { success: true, storedOffline: true };
  }
  
  // For server sessions, try to end on server with retry logic
  let serverEndSuccess = false;
  let serverError = null;
  
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const data = await endSession(sessionId, photoFile, locationData);
      serverEndSuccess = true;
      console.log('[TrackingService] Successfully ended session on server:', sessionId);
      return data;
    } catch (error) {
      serverError = error;
      console.warn(`[TrackingService] End session API failed (attempt ${attempt}/2):`, error?.message);
      if (attempt < 2) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // If server end failed after retries, session is still ended locally
  // The sync process will retry ending on server later
  console.warn('[TrackingService] End session API failed after retries, session saved locally:', serverError?.message);
  return { success: true, storedOffline: true, serverEndFailed: true };
};

export const endSession = async (sessionId, photoFile, locationData = null) => {
  try {
    // Allow ending session without photo for offline sync scenarios
    // The server may accept this or reject - we'll handle the error
    const formData = buildPhotoFormData(photoFile, locationData);
    const response = await Api.put(`${TRACKING_BASE}/${sessionId}/end`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
      validateStatus: (status) => status >= 200 && status < 300,
    });
    const data = response?.data;
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
    // console.log("Session Locations Test:");
    // console.log("Total locations:", data?.locations?.length || 0);
    // console.log("Sample locations:", data?.locations?.slice(0, 5));
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
  // console.log('getUserTrackingDates called with userId:', userId);
  try {
    const response = await Api.get(
      `${TRACKING_BASE}/admin/users/${userId}/sessions/dates`
    );

    // console.log('getUserTrackingDates raw response status:', response.status);
    // console.log('getUserTrackingDates raw response data:', response.data);

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