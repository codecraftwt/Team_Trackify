import { NativeModules, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import * as TrackingService from './TrackingService';
import { isOnline } from './SyncService';

const bgLocationModule = NativeModules.BgLocationModule;

const toNullableNumber = value =>
  typeof value === 'number' && !Number.isNaN(value) ? value : null;

const normalizeTimestamp = value => {
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

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

const coercePoint = point => {
  if (!point) {
    return null;
  }
  const latitude = Number(point.latitude);
  const longitude = Number(point.longitude);
  const timestamp = Number(point.timestamp);

  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude) ||
    Number.isNaN(timestamp)
  ) {
    return null;
  }

  const id =
    typeof point.id === 'string' && point.id.length > 0
      ? point.id
      : `${timestamp}-${latitude.toFixed(6)}-${longitude.toFixed(6)}`;

  return {
    id,
    latitude,
    longitude,
    accuracy: toNullableNumber(point.accuracy),
    timestamp,
    source: typeof point.source === 'string' && point.source.length > 0
      ? point.source
      : 'native',
  };
};

const hasNativeModule = () =>
  Platform.OS === 'android' && !!bgLocationModule;

export const startNativeForegroundService = async () => {
  if (!hasNativeModule()) {
    return;
  }
  try {
    console.log('[BGTRACK_NATIVE] NATIVE_SERVICE_START_REQUEST');
    await bgLocationModule.startService();
  } catch (error) {
    console.warn(
      '[BGTRACK_NATIVE] Failed to start native service:',
      error?.message || String(error),
    );
  }
};

export const stopNativeForegroundService = async () => {
  if (!hasNativeModule()) {
    return;
  }
  try {
    console.log('[BGTRACK_NATIVE] NATIVE_SERVICE_STOP_REQUEST');
    await bgLocationModule.stopService();
  } catch (error) {
    console.warn(
      '[BGTRACK_NATIVE] Failed to stop native service:',
      error?.message || String(error),
    );
  }
};

export const isNativeLocationEnabled = async () => {
  if (!hasNativeModule()) {
    return true;
  }

  try {
    if (typeof bgLocationModule.isLocationEnabled === 'function') {
      return await bgLocationModule.isLocationEnabled();
    }
    return true;
  } catch (error) {
    console.warn(
      '[BGTRACK_NATIVE] Failed to check location enabled state:',
      error?.message || String(error),
    );
    return true;
  }
};

export const setTrackingPipEnabled = async enabled => {
  if (!hasNativeModule() || Number(Platform.Version) < 26) {
    return false;
  }
  try {
    if (typeof bgLocationModule.setTrackingPipEnabled !== 'function') {
      return false;
    }
    return await bgLocationModule.setTrackingPipEnabled(!!enabled);
  } catch (error) {
    console.warn(
      '[BGTRACK_NATIVE] Failed to set PiP state:',
      error?.message || String(error),
    );
    return false;
  }
};

export const enterTrackingPip = async () => {
  if (!hasNativeModule() || Number(Platform.Version) < 26) {
    return false;
  }
  try {
    if (typeof bgLocationModule.enterTrackingPip !== 'function') {
      return false;
    }
    return await bgLocationModule.enterTrackingPip();
  } catch (error) {
    console.warn(
      '[BGTRACK_NATIVE] Failed to enter PiP:',
      error?.message || String(error),
    );
    return false;
  }
};

/**
 * Drain buffered native points into HRMS offline tracking for the given session.
 * This should be called when:
 * - restoring a tracking session
 * - app returns to foreground while tracking
 * - just before stopping tracking
 */
export const syncNativeBufferedPointsForSession = async sessionId => {
  if (!hasNativeModule() || !sessionId) {
    return { inserted: 0 };
  }

  let buffered;
  try {
    buffered = await bgLocationModule.getBufferedPoints();
  } catch (error) {
    console.warn(
      '[BGTRACK_NATIVE] NATIVE_READ_ERROR',
      error?.message || String(error),
    );
    return { inserted: 0, error: error?.message || String(error) };
  }

  if (!Array.isArray(buffered) || buffered.length === 0) {
    return { inserted: 0 };
  }

  const normalized = buffered.map(coercePoint).filter(Boolean);
  if (normalized.length === 0) {
    try {
      await bgLocationModule.clearBufferedPoints();
    } catch {
      // ignore
    }
    return { inserted: 0 };
  }

  let online = false;
  try {
    online = await isOnline();
  } catch {
    online = false;
  }

  let batteryPercentage = null;
  try {
    const level = await DeviceInfo.getBatteryLevel();
    batteryPercentage = Math.round((level || 0) * 100);
  } catch {
    batteryPercentage = null;
  }

  let inserted = 0;
  let lastPoint = null;
  const MIN_ACCURACY_METERS = 60;
  const MAX_TELEPORT_DISTANCE_METERS = 500;
  const MAX_REALISTIC_SPEED_MPS = 70;

  for (const point of normalized) {
    const { latitude, longitude, timestamp, accuracy, source } = point;
    const ts = normalizeTimestamp(timestamp);

    // Filter out inaccurate locations
    if (accuracy != null && accuracy > MIN_ACCURACY_METERS) {
      console.warn(`[BGTRACK_NATIVE] Skipping inaccurate point: ${accuracy}m (threshold: ${MIN_ACCURACY_METERS}m)`);
      continue;
    }

    // Teleport detection
    if (lastPoint) {
      const distance = calculateDistance(
        lastPoint.latitude,
        lastPoint.longitude,
        latitude,
        longitude
      );
      const elapsedMs = Math.max(1, ts - lastPoint.timestamp);
      const speedMps = distance / (elapsedMs / 1000);
      const looksLikeTeleport =
        distance > MAX_TELEPORT_DISTANCE_METERS && speedMps > MAX_REALISTIC_SPEED_MPS;

      if (looksLikeTeleport) {
        console.warn(`[BGTRACK_NATIVE] Teleport detected (${distance.toFixed(0)}m in ${(elapsedMs/1000).toFixed(1)}s = ${speedMps.toFixed(1)} m/s), skipping`);
        continue;
      }
    }

    const locationData = {
      latitude,
      longitude,
      timestamp: ts,
      address: 'Unknown Address',
      road: 'Unknown Road',
      area: 'Unknown Area',
      accuracy: toNullableNumber(accuracy),
      bearing: null,
      speed: null,
      batteryPercentage,
      source,
      isOnline: online,
    };

    const formData = new FormData();
    formData.append('latitude', String(latitude));
    formData.append('longitude', String(longitude));
    formData.append('timestamp', String(normalizeTimestamp(ts)));
    formData.append('address', locationData.address);
    formData.append('road', locationData.road);
    formData.append('area', locationData.area);
    if (locationData.accuracy != null) {
      formData.append('accuracy', String(locationData.accuracy));
    }
    if (batteryPercentage != null) {
      formData.append('batterypercentage', String(batteryPercentage));
    }
    formData.append('source', source);

    try {
      const result = await TrackingService.addLocationOfflineFirst(
        sessionId,
        locationData,
        formData,
      );
      if (result?.success) {
        inserted += 1;
        lastPoint = { latitude, longitude, timestamp: ts };
      }
    } catch (error) {
      console.warn(
        '[BGTRACK_NATIVE] NATIVE_SYNC_ERROR',
        error?.message || String(error),
      );
    }
  }

  try {
    await bgLocationModule.clearBufferedPoints();
  } catch (error) {
    console.warn(
      '[BGTRACK_NATIVE] NATIVE_CLEAR_ERROR',
      error?.message || String(error),
    );
  }

  console.log(
    `[BGTRACK_NATIVE] NATIVE_SYNC_MERGED sessionId=${sessionId} count=${inserted}`,
  );

  return { inserted };
};

