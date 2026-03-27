import { Q } from '@nozbe/watermelondb';
import { database } from '../database';

const sessionsCollection = () => database.collections.get('tracking_sessions');
const locationsCollection = () => database.collections.get('location_points');

export const generateLocalSessionId = () => {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

export const createLocalSession = async (localSessionId, startTime, serverSessionId = null, punchInPhotoUri = null) => {
  await database.write(async () => {
    await sessionsCollection().create((session) => {
      session.localSessionId = localSessionId;
      session.serverSessionId = serverSessionId;
      session.startTime = startTime;
      session.endTime = null;
      session.status = 'active';
      session.synced = !!serverSessionId;
      session.punchInPhotoUri = punchInPhotoUri;
      session.punchOutPhotoUri = null;
    });
  });
  return localSessionId;
};

export const saveLocationPoint = async ({
  sessionLocalId,
  latitude,
  longitude,
  timestamp,
  address = 'Unknown Address',
  road = 'Unknown Road',
  area = 'Unknown Area',
  accuracy = null,
  heading = null,
  speed = null,
  batteryPercentage = null,
  source = 'foreground',
  remark = null,
  amount = null,
  photoUri = null,
  isOnline = false,
}) => {
  let createdId = null;
  await database.write(async () => {
    const point = await locationsCollection().create((p) => {
      p.sessionLocalId = sessionLocalId;
      p.latitude = latitude;
      p.longitude = longitude;
      p.timestamp = timestamp;
      p.address = address;
      p.road = road;
      p.area = area;
      p.accuracy = accuracy;
      p.heading = heading;
      p.speed = speed;
      p.batteryPercentage = batteryPercentage;
      p.source = source;
      p.synced = false;
      p.remark = remark;
      p.amount = amount;
      p.photoUri = photoUri;
      p.isOnline = isOnline;
    });
    createdId = point.id;
  });
  return createdId;
};

export const getLocationsForSession = async (sessionLocalId) => {
  const points = await locationsCollection()
    .query(Q.where('session_local_id', sessionLocalId), Q.sortBy('timestamp', Q.asc))
    .fetch();
  return points.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
    timestamp: p.timestamp,
    synced: p.synced,
    isOnline: p.isOnline ?? false,
  }));
};

export const getUnsyncedLocations = async (sessionLocalId) => {
  const points = await locationsCollection()
    .query(
      Q.where('session_local_id', sessionLocalId),
      Q.where('synced', false),
      Q.sortBy('timestamp', Q.asc)
    )
    .fetch();
  return points;
};

export const getUnsyncedSessions = async () => {
  const sessions = await sessionsCollection()
    .query(Q.where('synced', false), Q.or(Q.where('status', 'active'), Q.where('status', 'ended')))
    .fetch();
  return sessions;
};

export const getAllSessionsWithUnsyncedLocations = async () => {
  // Only fetch sessions that need syncing - those with serverSessionId but unsynced points,
  // OR those without serverSessionId that need to be created on server
  const sessions = await sessionsCollection()
    .query(
      Q.or(
        Q.or(Q.where('server_session_id', null), Q.where('server_session_id', '')),
        Q.where('status', 'ended'),
      )
    )
    .fetch();
  
  const result = [];
  for (const session of sessions) {
    // Skip sessions that have been marked as duplicates (DUPLICATE_MERGED)
    if (session.serverSessionId === 'DUPLICATE_MERGED') {
      continue;
    }
    
    const unsyncedCount = await locationsCollection()
      .query(Q.where('session_local_id', session.localSessionId), Q.where('synced', false))
      .fetchCount();
    
    // Include:
    // - sessions with unsynced points (need upload + possible create session)
    // - sessions marked ended even if points are already synced (need server end call)
    if (unsyncedCount > 0 || session.status === 'ended') {
      result.push({ session, unsyncedCount });
    }
  }
  return result;
};

export const markLocationSynced = async (locationId) => {
  await database.write(async () => {
    const point = await locationsCollection().find(locationId);
    await point.update((p) => {
      p.synced = true;
    });
  });
};

// Move location points from one session to another (for deduplication)
export const relocatePointsToSession = async (fromSessionLocalId, toSessionLocalId) => {
  await database.write(async () => {
    const points = await locationsCollection()
      .query(Q.where('session_local_id', fromSessionLocalId))
      .fetch();
    
    for (const point of points) {
      await point.update((p) => {
        p.sessionLocalId = toSessionLocalId;
      });
    }
    
    console.log('[OfflineLocationStore] Relocated', points.length, 'points from', fromSessionLocalId, 'to', toSessionLocalId);
  });
};

export const updateSessionServerId = async (localSessionId, serverSessionId) => {
  await database.write(async () => {
    const sessions = await sessionsCollection()
      .query(Q.where('local_session_id', localSessionId))
      .fetch();
    if (sessions.length > 0) {
      await sessions[0].update((s) => {
        s.serverSessionId = serverSessionId;
        s.synced = true;
      });
    }
  });
};

export const updateSessionPunchInPhoto = async (localSessionId, punchInPhotoUri) => {
  await database.write(async () => {
    const sessions = await sessionsCollection()
      .query(Q.where('local_session_id', localSessionId))
      .fetch();
    if (sessions.length > 0) {
      await sessions[0].update((s) => {
        s.punchInPhotoUri = punchInPhotoUri;
      });
    }
  });
};

export const updateSessionPunchOutPhoto = async (localSessionId, punchOutPhotoUri) => {
  await database.write(async () => {
    const sessions = await sessionsCollection()
      .query(Q.where('local_session_id', localSessionId))
      .fetch();
    if (sessions.length > 0) {
      await sessions[0].update((s) => {
        s.punchOutPhotoUri = punchOutPhotoUri;
      });
    }
  });
};

export const endLocalSession = async (localSessionId, endTime) => {
  await database.write(async () => {
    const sessions = await sessionsCollection()
      .query(Q.where('local_session_id', localSessionId))
      .fetch();
    if (sessions.length > 0) {
      await sessions[0].update((s) => {
        s.endTime = endTime;
        s.status = 'ended';
      });
    }
  });
};

export const getSessionByLocalId = async (localSessionId) => {
  const sessions = await sessionsCollection()
    .query(Q.where('local_session_id', localSessionId))
    .fetch();
  if (sessions.length > 0) {
    const s = sessions[0];
    return {
      id: s.id,
      localSessionId: s.localSessionId,
      serverSessionId: s.serverSessionId,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
      synced: s.synced,
      punchInPhotoUri: s.punchInPhotoUri,
      punchOutPhotoUri: s.punchOutPhotoUri,
    };
  }
  return null;
};

export const getSessionByServerId = async (serverSessionId) => {
  const sessions = await sessionsCollection()
    .query(Q.where('server_session_id', serverSessionId))
    .fetch();
  return sessions[0] || null;
};

// Add this function to your existing OfflineLocationStore.js

export const getAllLocationsForSession = async (sessionLocalId) => {
  const points = await locationsCollection()
    .query(Q.where('session_local_id', sessionLocalId), Q.sortBy('timestamp', Q.asc))
    .fetch();
  return points.map((p) => ({
    id: p.id,
    latitude: p.latitude,
    longitude: p.longitude,
    timestamp: p.timestamp,
    address: p.address,
    road: p.road,
    area: p.area,
    accuracy: p.accuracy,
    heading: p.heading,
    speed: p.speed,
    batteryPercentage: p.batteryPercentage,
    source: p.source,
    synced: p.synced,
    remark: p.remark,
    amount: p.amount,
    photoUri: p.photoUri,
    isOnline: p.isOnline ?? false,
  }));
};

export const getLocalSessionDetail = async (localSessionId) => {
  const session = await getSessionByLocalId(localSessionId);
  if (!session) return null;
  const points = await locationsCollection()
    .query(Q.where('session_local_id', localSessionId), Q.sortBy('timestamp', Q.asc))
    .fetch();
  const locations = points.map((p) => ({
    id: p.id,
    latitude: p.latitude,
    longitude: p.longitude,
    timestamp: p.timestamp,
    address: p.address,
    remark: p.remark,
    amount: p.amount,
    photoUri: p.photoUri,
    isOnline: p.isOnline ?? false,
  }));
  const startTime = session.startTime;
  const endTime = session.endTime || Date.now();
  const durationSeconds = endTime ? Math.floor((endTime - startTime) / 1000) : 0;
  let totalDistance = 0;
  for (let i = 1; i < locations.length; i++) {
    const prev = locations[i - 1];
    const curr = locations[i];
    const R = 6371e3;
    const φ1 = prev.latitude * Math.PI / 180;
    const φ2 = curr.latitude * Math.PI / 180;
    const Δφ = (curr.latitude - prev.latitude) * Math.PI / 180;
    const Δλ = (curr.longitude - prev.longitude) * Math.PI / 180;
    const a = Math.sin(Δφ/2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    totalDistance += R * c;
  }
  return {
    id: localSessionId,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    duration: durationSeconds,
    totalDistance,
    locations,
  };
};