import { NativeModules, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import * as TrackingService from './TrackingService';
import { isOnline } from './SyncService';

const bgLocationModule = NativeModules.BgLocationModule;

const toNullableNumber = value =>
  typeof value === 'number' && !Number.isNaN(value) ? value : null;

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

  for (const point of normalized) {
    const { latitude, longitude, timestamp, accuracy, source } = point;
    const ts = Number(timestamp) || Date.now();

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
    formData.append('timestamp', String(ts));
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

