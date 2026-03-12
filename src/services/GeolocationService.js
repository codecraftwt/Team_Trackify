/**
 * GeolocationService - Wrapper around react-native-geolocation-service
 * with fallback to react-native-get-location to avoid crashes.
 * Provides Promise-based API with normalized location format for consistent
 * use across foreground, background, online, and offline tracking.
 *
 * Uses lazy loading so the native geolocation module is not loaded until
 * first use (prevents app crash when opening Tracking screen).
 */

let GeolocationModule = null;

const getGeolocation = () => {
  if (GeolocationModule === null) {
    try {
      GeolocationModule = require('react-native-geolocation-service').default;
    } catch (e) {
      GeolocationModule = false; // mark as unavailable
    }
  }
  return GeolocationModule || null;
};

const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 5000,
  distanceFilter: 10,
  showLocationDialog: true,
  forceRequestLocation: true,
};

const normalizeFromGeolocation = (position) => {
  if (!position?.coords) return null;
  const { coords } = position;
  const ts = position.timestamp ?? Date.now();
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy ?? null,
    bearing: coords.heading ?? coords.bearing ?? null,
    speed: coords.speed ?? null,
    time: ts,
    timestamp: ts,
  };
};

const normalizeFromGetLocation = (location) => {
  if (location?.latitude == null || location?.longitude == null) return null;
  const ts = location.time ?? Date.now();
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy ?? null,
    bearing: location.bearing ?? null,
    speed: location.speed ?? null,
    time: ts,
    timestamp: ts,
  };
};

/**
 * Get current position. Uses react-native-get-location first (stable, no crash),
 * then tries react-native-geolocation-service when available for better accuracy.
 *
 * @param {Object} options - Geolocation options
 * @returns {Promise<Object>} Normalized location: { latitude, longitude, accuracy, bearing, speed, time, timestamp }
 */
export const getCurrentPosition = async (options = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Use get-location first so we never crash when opening Tracking screen or on first location request
  try {
    const GetLocation = require('react-native-get-location').default;
    const location = await GetLocation.getCurrentPosition({
      enableHighAccuracy: opts.enableHighAccuracy !== false,
      timeout: opts.timeout || 15000,
      maximumAge: opts.maximumAge ?? 5000,
    });
    const normalized = normalizeFromGetLocation(location);
    if (normalized) return normalized;
  } catch (getLocErr) {
    console.warn('GeolocationService: get-location failed:', getLocErr?.message);
  }

  // IMPORTANT:
  // Avoid geolocation-service fallback here because on some devices it can
  // trigger native crashes when location services are toggled ON/OFF at runtime.
  throw new Error('Unable to get location');
};

/**
 * Start watching position for continuous updates (foreground tracking).
 * Returns watchId to pass to clearWatch when done.
 *
 * @param {Function} callback - Called with normalized location on each update
 * @param {Function} errorCallback - Called on error
 * @param {Object} options - { enableHighAccuracy, distanceFilter, interval, fastestInterval }
 * @returns {number} watchId - Pass to clearWatch to stop
 */
export const watchPosition = (callback, errorCallback, options = {}) => {
  const Geolocation = getGeolocation();
  if (!Geolocation) return 0;
  const opts = {
    ...DEFAULT_OPTIONS,
    distanceFilter: options.distanceFilter ?? 10,
    interval: options.interval ?? 5000,
    fastestInterval: options.fastestInterval ?? 3000,
    ...options,
  };
  return Geolocation.watchPosition(
    (position) => {
      const normalized = normalizeFromGeolocation(position);
      if (normalized) callback(normalized);
    },
    errorCallback || (() => {}),
    opts
  );
};

/**
 * Stop watching position.
 * @param {number} watchId - From watchPosition
 */
export const clearWatch = (watchId) => {
  if (watchId != null) {
    const Geolocation = getGeolocation();
    if (Geolocation) Geolocation.clearWatch(watchId);
  }
};

/**
 * Stop all active watches.
 */
export const stopObserving = () => {
  const Geolocation = getGeolocation();
  if (Geolocation?.stopObserving) Geolocation.stopObserving();
};
