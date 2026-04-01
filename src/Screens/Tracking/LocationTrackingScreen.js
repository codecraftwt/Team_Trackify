
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  BackHandler,
  useColorScheme,
  // NativeModules
} from 'react-native';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchCamera } from 'react-native-image-picker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { getCurrentPosition as getLocation } from '../../services/GeolocationService';
import * as TrackingService from '../../services/TrackingService';
import { getAllLocationsForSession, getSessionByLocalId } from '../../services/OfflineLocationStore';
import {
  enterTrackingPip,
  isNativeLocationEnabled,
  setTrackingPipEnabled,
  startNativeForegroundService,
  stopNativeForegroundService,
  syncNativeBufferedPointsForSession,
} from '../../services/BgLocationNative';
import { isOnline, setupSyncOnReconnect, syncPendingLocations } from '../../services/SyncService';
import { geocodeLatLng } from '../../utils/geocoding';
import { getPhotoUriForDisplay } from '../../utils/photoStorage';
import FancyAlert from '../FancyAlert';
import {
  startBackgroundLocationJob,
  stopBackgroundLocationJob,
  isBackgroundJobRunning,
} from '../../services/BackgroundLocationJob';
import { useAuth } from '../../config/auth-context';

// const { BatteryOptimization } = NativeModules;

// const checkBatteryOptimization = async () => {
//   if (Platform.OS !== 'android') return true;
  
//   try {
//     const enabled = await BatteryOptimization.isBatteryOptimizationEnabled();
    
//     if (enabled) {
//       return new Promise((resolve) => {
//         Alert.alert(
//           'Battery Optimization',
//           'Battery optimization is enabled for this app. This may prevent location tracking from working properly in the background. Would you like to disable it?',
//           [
//             {
//               text: 'Cancel',
//               style: 'cancel',
//               onPress: () => resolve(true), // User cancelled, allow to proceed
//             },
//             {
//               text: 'Disable',
//               onPress: () => {
//                 BatteryOptimization.requestDisableOptimization();
//                 // Wait for user to return from settings
//                 const subscription = AppState.addEventListener('change', (nextAppState) => {
//                   if (nextAppState === 'active') {
//                     subscription.remove();
//                     resolve(true); // User returned from settings, proceed
//                   }
//                 });
//               },
//             },
//           ],
//           { cancelable: true },
//         );
//       });
//     }
//     return true; // Battery optimization not enabled, proceed
//   } catch (error) {
//     console.warn('BatteryOptimization: check failed', error);
//     return true; // Allow to proceed on error
//   }
// };

const { width } = Dimensions.get('window');

const LAST_SESSION_KEY = '@last_tracking_session';
const LOCATION_INTERVAL_MS = 5000;
const LOCATION_LOAD_INTERVAL_MS = 15000;
const MIN_DISTANCE_METERS = 10;
const MAX_ACCEPTABLE_ACCURACY_METERS = 60;
const MAX_TELEPORT_DISTANCE_METERS = 500;
const MAX_REALISTIC_SPEED_MPS = 70;
const DEFAULT_REGION = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 15,
  longitudeDelta: 15,
};

const toNumberOrNull = value => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

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

const isValidLocation = (latitude, longitude) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  Math.abs(latitude) <= 90 &&
  Math.abs(longitude) <= 180 &&
  !(latitude === 0 && longitude === 0);

const distanceMeters = (aLat, aLng, bLat, bLng) => {
  const R = 6371e3;
  const p1 = (aLat * Math.PI) / 180;
  const p2 = (bLat * Math.PI) / 180;
  const dPhi = ((bLat - aLat) * Math.PI) / 180;
  const dLambda = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * y;
};

const segmentByOnlineStatus = points => {
  if (!Array.isArray(points) || points.length < 2) return [];

  const segments = [];
  let currentSegment = {
    isOnline: points[0]?.isOnline ?? true,
    coordinates: [{ latitude: points[0].latitude, longitude: points[0].longitude }],
  };

  for (let i = 1; i < points.length; i += 1) {
    const current = points[i];
    const prevCoord = currentSegment.coordinates[currentSegment.coordinates.length - 1];
    const gap = distanceMeters(
      prevCoord.latitude,
      prevCoord.longitude,
      current.latitude,
      current.longitude,
    );

    const prevPoint = points[i - 1];
    const prevTimestamp = normalizeTimestamp(prevPoint?.timestamp);
    const currentTimestamp = normalizeTimestamp(current?.timestamp);
    const elapsedMs = Math.max(1, currentTimestamp - prevTimestamp);
    const speedMps = gap / (elapsedMs / 1000);
    const looksLikeTeleport =
      gap > MAX_TELEPORT_DISTANCE_METERS && speedMps > MAX_REALISTIC_SPEED_MPS;

    // Keep route continuous across long background gaps, but split impossible jumps.
    if (looksLikeTeleport) {
      if (currentSegment.coordinates.length > 1) {
        segments.push(currentSegment);
      }
      currentSegment = {
        isOnline: current.isOnline ?? true,
        coordinates: [{ latitude: current.latitude, longitude: current.longitude }],
      };
      continue;
    }

    if ((current.isOnline ?? true) === currentSegment.isOnline) {
      currentSegment.coordinates.push({
        latitude: current.latitude,
        longitude: current.longitude,
      });
      continue;
    }

    if (currentSegment.coordinates.length > 1) {
      segments.push(currentSegment);
    }
    currentSegment = {
      isOnline: current.isOnline ?? true,
      coordinates: [
        prevCoord,
        { latitude: current.latitude, longitude: current.longitude },
      ],
    };
  }

  if (currentSegment.coordinates.length > 1) {
    segments.push(currentSegment);
  }

  return segments;
};

const LocationTrackingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isScreenFocused = useIsFocused();
  const { subscriptionStatus, userRole } = useAuth();

  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('idle');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [photoEntries, setPhotoEntries] = useState([]);
  const [lastAddress, setLastAddress] = useState(null);
  const [errorText, setErrorText] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'error' });
  const [bootComplete, setBootComplete] = useState(false);
  const [punchInPhotoUri, setPunchInPhotoUri] = useState(null);

  const [addPhotoModalVisible, setAddPhotoModalVisible] = useState(false);
  const [tempPhotoFile, setTempPhotoFile] = useState(null);
  const [tempRemark, setTempRemark] = useState('');
  const [tempAmount, setTempAmount] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const mapRef = useRef(null);
  const mapRegionRef = useRef(DEFAULT_REGION);
  const appStateRef = useRef(AppState.currentState);
  const trackingRef = useRef(false);
  const startTimeRef = useRef(null);
  const sessionIdRef = useRef(null);
  const locationTimerRef = useRef(null);
  const durationTimerRef = useRef(null);
  const loadTimerRef = useRef(null);
  const lastPointRef = useRef(null);
  const punchOutPausedServicesRef = useRef(false);

  const autoStartTracking = route?.params?.autoStartTracking === true;
  const autoStopTracking = route?.params?.autoStopTracking === true;

  // Check if subscription is expired for regular users
  const isSubscriptionExpired = userRole !== 'Admin' && subscriptionStatus?.isExpired === true;
  const subscriptionMessage = subscriptionStatus?.message || 'Your subscription has expired. Please contact admin.';

  // color scheme
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const showAlert = useCallback((title, message, type = 'error') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  }, []);

  // Add back handler for Android
  useEffect(() => {
    if (isScreenFocused) {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress
      );

      return () => backHandler.remove();
    }
  }, [isScreenFocused]);

  const handleBackPress = () => {
    Alert.alert(
      'Exit App',
      'Are you sure you want to exit?',
      [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        {
          text: 'Exit',
          onPress: () => BackHandler.exitApp(),
        },
      ],
      { cancelable: false }
    );
    return true; // Prevent default back button behavior
  };

  const showSystemLocationDisabledAlert = useCallback(() => {
    Alert.alert(
      'Location Services Disabled',
      'Please enable device location (GPS) to start tracking.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: async () => {
            try {
              if (Platform.OS === 'android' && typeof Linking.sendIntent === 'function') {
                await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
                return;
              }
            } catch {
              // Fallback to app settings if device location settings intent fails.
            }

            try {
              await Linking.openSettings();
            } catch {
              // no-op
            }
          },
        },
      ],
      { cancelable: true },
    );
  }, []);

  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    // 1) Foreground location: check first, request only if missing.
    let fineGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    let coarseGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    );

    if (!fineGranted && !coarseGranted) {
      const fgResults = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);
      fineGranted =
        fgResults[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;
      coarseGranted =
        fgResults[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;
    }

    const hasForeground = fineGranted || coarseGranted;
    if (!hasForeground) {
      return false;
    }

    // 2) Android 10+: request background permission separately.
    if (Number(Platform.Version) >= 29) {
      const hasBackground = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      );
      if (!hasBackground) {
        const bg = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        );
        if (bg !== PermissionsAndroid.RESULTS.GRANTED) {
          showAlert(
            'Background Permission',
            'Foreground location is allowed. For full background tracking, allow "Allow all the time" in app settings.',
            'warning',
          );
        }
      }
    }

    // 3) Android 13+: notification permission for foreground service notification.
    if (Number(Platform.Version) >= 33) {
      try {
        const hasNotifications = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (!hasNotifications) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
        }
      } catch {
        // Keep tracking flow resilient on vendor-specific ROM behavior.
      }
    }

    return true;
  }, [showAlert]);

  const requestCameraPermission = useCallback(async () => {
    if (Platform.OS !== 'android') return true;
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const captureCameraPhoto = useCallback(
    async (purposeLabel = 'photo') => {
      const hasCameraPermission = await requestCameraPermission();
      if (!hasCameraPermission) {
        showAlert('Camera Permission', 'Please allow camera permission.');
        return null;
      }

      return await new Promise(resolve => {
        launchCamera(
          {
            mediaType: 'photo',
            quality: 0.8,
            saveToPhotos: false,
            cameraType: 'back',
          },
          response => {
            if (response?.didCancel) {
              resolve(null);
              return;
            }
            if (response?.errorCode) {
              showAlert('Camera Error', response.errorMessage || 'Could not open camera.');
              resolve(null);
              return;
            }
            const asset = response.assets?.[0];
            if (!asset?.uri) {
              showAlert('Camera Error', `Could not capture ${purposeLabel}.`);
              resolve(null);
              return;
            }
            resolve({
              uri: asset.uri,
              fileName: asset.fileName || `${purposeLabel}_${Date.now()}.jpg`,
              type: asset.type || 'image/jpeg',
            });
          },
        );
      });
    },
    [requestCameraPermission, showAlert],
  );

  const ensureLocationEnabled = useCallback(async () => {
    const enabled = await isNativeLocationEnabled();
    if (!enabled) {
      setErrorText('Location services are disabled. Please enable GPS.');
      setGpsStatus('error');
      return false;
    }
    return true;
  }, []);

  const getCurrentLocation = useCallback(async () => {
    const enabled = await ensureLocationEnabled();
    if (!enabled) {
      throw new Error('Location disabled');
    }

    setGpsStatus('searching');
    const location = await getLocation({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    });

    const latitude = toNumberOrNull(location?.latitude);
    const longitude = toNumberOrNull(location?.longitude);
    const accuracy = toNumberOrNull(location?.accuracy);
    if (!isValidLocation(latitude, longitude)) {
      throw new Error('Invalid location');
    }

    const normalized = {
      latitude,
      longitude,
      accuracy,
      bearing: toNumberOrNull(location?.bearing),
      speed: toNumberOrNull(location?.speed),
      timestamp: normalizeTimestamp(location?.timestamp ?? location?.time),
    };

    setGpsStatus('active');
    setCurrentLocation(normalized);
    setErrorText(null);
    return normalized;
  }, [ensureLocationEnabled]);

  const loadSessionLocations = useCallback(async (sessionId, fitMap = false) => {
    if (!sessionId) return;

    try {
      const localPoints = await getAllLocationsForSession(sessionId);
      const points = (localPoints || [])
        .map(item => ({
          id: item.id,
          latitude: toNumberOrNull(item.latitude),
          longitude: toNumberOrNull(item.longitude),
          timestamp: normalizeTimestamp(item.timestamp ?? item.time ?? item.createdAt),
          isOnline: item.isOnline ?? false,
          source: item.source,
          remark: item.remark ?? null,
          amount: item.amount ?? null,
          photoUri: getPhotoUriForDisplay(item.photoUri ?? null),
          address: item.address ?? null,
        }))
        .filter(item => isValidLocation(item.latitude, item.longitude))
        .sort((a, b) => a.timestamp - b.timestamp);

      setLocations(points);
      // console.log('Loaded session locations:', {
      //   sessionId,
      //   count: points.length,
      //   first: points[0],
      //   last: points[points.length - 1],
      // });
      const photoPoints = points.filter(p => p.photoUri || p.remark || p.amount);
      setPhotoEntries(photoPoints);

      // For offline/local sessions, the punch-in photo is stored on the session record,
      // not on a location point. Use it for the Start marker image.
      if (String(sessionId).startsWith('local_')) {
        const sessionDetail = await getSessionByLocalId(sessionId);
        setPunchInPhotoUri(getPhotoUriForDisplay(sessionDetail?.punchInPhotoUri ?? null));
      } else {
        setPunchInPhotoUri(null);
      }

      if (points.length > 0) {
        const latest = points[points.length - 1];
        lastPointRef.current = { latitude: latest.latitude, longitude: latest.longitude };
      }

      if (fitMap && mapRef.current && points.length > 1) {
        mapRef.current.fitToCoordinates(
          points.map(p => ({ latitude: p.latitude, longitude: p.longitude })),
          { edgePadding: { top: 70, right: 70, bottom: 70, left: 70 }, animated: true },
        );
      }
    } catch (error) {
      console.warn('LocationTrackingScreen: loadSessionLocations failed', error?.message || String(error));
    }
  }, []);

  const stopForegroundTimers = useCallback(() => {
    if (locationTimerRef.current) {
      clearInterval(locationTimerRef.current);
      locationTimerRef.current = null;
    }
    if (loadTimerRef.current) {
      clearInterval(loadTimerRef.current);
      loadTimerRef.current = null;
    }
  }, []);

  const sendLocationPoint = useCallback(async (location, source = 'foreground') => {
    const sessionId = sessionIdRef.current;

    // CRITICAL: Check if tracking is still active before sending location
    // This prevents locations from being sent after punch out
    if (!sessionId || !location || !trackingRef.current) {
      // console.log('sendLocationPoint: Tracking not active or no session, skipping');
      return false;
    }

    // Also check if punch out is in progress (photo capture for end)
    if (punchOutPausedServicesRef.current) {
      // console.log('sendLocationPoint: Punch out in progress, skipping');
      return false;
    }

    if (
      lastPointRef.current &&
      source !== 'start' &&
      source !== 'resume' &&
      source !== 'background_entry'
    ) {
      const move = distanceMeters(
        lastPointRef.current.latitude,
        lastPointRef.current.longitude,
        location.latitude,
        location.longitude,
      );
      if (move < MIN_DISTANCE_METERS) {
        return false;
      }
    }

    if (
      Number.isFinite(location.accuracy) &&
      location.accuracy > MAX_ACCEPTABLE_ACCURACY_METERS &&
      source !== 'start'
    ) {
      return false;
    }

    // Filter out points with 0,0 coordinates (invalid location)
    if (location.latitude === 0 && location.longitude === 0) {
      console.warn('sendLocationPoint: Skipping point with 0,0 coordinates');
      return false;
    }

    let address = 'Unknown Address';
    let road = 'Unknown Road';
    let area = 'Unknown Area';
    try {
      const geo = await geocodeLatLng(location.latitude, location.longitude);
      address = geo?.address || address;
      road = geo?.road || road;
      area = geo?.area || area;
      setLastAddress(address);
    } catch {
      // no-op
    }

    let batteryPercentage = null;
    try {
      const level = await DeviceInfo.getBatteryLevel();
      batteryPercentage = Math.round((level || 0) * 100);
    } catch {
      batteryPercentage = null;
    }

    const online = await isOnline().catch(() => false);
    const timestamp = normalizeTimestamp(location.timestamp ?? location.time);
    const formData = new FormData();
    formData.append('latitude', String(location.latitude));
    formData.append('longitude', String(location.longitude));
    formData.append('timestamp', String(timestamp));
    formData.append('address', address);
    formData.append('road', road);
    formData.append('area', area);
    if (location.accuracy != null) formData.append('accuracy', String(location.accuracy));
    if (location.bearing != null) formData.append('heading', String(location.bearing));
    if (location.speed != null) formData.append('speed', String(location.speed));
    if (batteryPercentage != null) formData.append('batterypercentage', String(batteryPercentage));
    formData.append('source', source);
    formData.append('isOnline', online ? 'true' : 'false');

    const payload = {
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp,
      address,
      road,
      area,
      accuracy: location.accuracy ?? null,
      heading: location.bearing ?? null,
      speed: location.speed ?? null,
      batteryPercentage,
      source,
      isOnline: online,
    };

    // console.log('Sending location point:', payload);

    const result = await TrackingService.addLocationOfflineFirst(sessionId, payload, formData);
    if (result?.success) {
      lastPointRef.current = { latitude: location.latitude, longitude: location.longitude };
      return true;
    }
    return false;
  }, []);

  const startForegroundTimers = useCallback(() => {
    if (!trackingRef.current || appStateRef.current !== 'active' || locationTimerRef.current) {
      return;
    }

    locationTimerRef.current = setInterval(async () => {
      // Check if tracking is still active before getting location
      if (!trackingRef.current || appStateRef.current !== 'active') {
        stopForegroundTimers();
        return;
      }

      // Additional check: ensure session is still valid
      if (!sessionIdRef.current) {
        stopForegroundTimers();
        return;
      }
      try {
        const point = await getCurrentLocation();
        await sendLocationPoint(point, 'foreground');
      } catch (error) {
        setGpsStatus('error');
        setErrorText(error?.message || 'Unable to fetch location');
      }
    }, LOCATION_INTERVAL_MS);

    loadTimerRef.current = setInterval(async () => {
      if (trackingRef.current && sessionIdRef.current && appStateRef.current === 'active') {
        await loadSessionLocations(sessionIdRef.current, false);
      }
    }, LOCATION_LOAD_INTERVAL_MS);
  }, [
    getCurrentLocation,
    loadSessionLocations,
    sendLocationPoint,
    stopForegroundTimers,
  ]);

  const stopTracking = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) {
      setIsTracking(false);
      return;
    }

    // CRITICAL: Set tracking to false IMMEDIATELY to prevent any more locations from being sent
    // This must happen BEFORE stopping services and capturing photo
    trackingRef.current = false;
    setIsTracking(false);

    // CRITICAL: Clear session ID immediately to block ALL location sending
    // This ensures no location can be sent after punch out, even if other checks fail
    const sessionIdToEnd = sessionIdRef.current;
    sessionIdRef.current = null;

    // End tracking requires a photo (Punch Out).
    setLoading(true);
    
    // CRITICAL: Stop background services IMMEDIATELY before photo capture
    // This prevents any locations from being sent while user is taking punch-out photo
    punchOutPausedServicesRef.current = true;
    
    // Stop foreground timers FIRST to prevent any new location requests
    stopForegroundTimers();
    
    // Stop background job immediately - this signals the task to stop
    try {
      await stopBackgroundLocationJob();
    } catch {
      // no-op
    }
    try {
      await stopNativeForegroundService();
    } catch {
      // no-op
    }

    const endPhotoFile = await captureCameraPhoto('punch_out');
    if (!endPhotoFile?.uri) {
      // Photo is required; resume tracking state if possible
      if (sessionIdToEnd) {
        // Try to restore tracking - this is a recovery scenario
        punchOutPausedServicesRef.current = false;
        trackingRef.current = true;
        sessionIdRef.current = sessionIdToEnd;
        setIsTracking(true);
        
        try {
          await startNativeForegroundService();
        } catch {
          // no-op
        }
        if (appStateRef.current !== 'active' && sessionIdRef.current && !isBackgroundJobRunning()) {
          try {
            await startBackgroundLocationJob(sessionIdRef.current, 10000);
          } catch {
            // no-op
          }
        }
        startForegroundTimers();
      }
      setLoading(false);
      return;
    }

    await setTrackingPipEnabled(false);

    // NOTE: Do NOT sync buffered native points when ending session
    // These are old locations that would incorrectly add to the distance
    // The background services are already stopped, so no new points are coming
    // await syncNativeBufferedPointsForSession(sessionId);

    // Get current location and build location data for end session
    let endLocationData = null;
    try {
      const endLocation = await getCurrentLocation();
      const geoResult = await geocodeLatLng(endLocation.latitude, endLocation.longitude);
      const batteryLevel = await DeviceInfo.getBatteryLevel();
      endLocationData = {
        latitude: endLocation.latitude,
        longitude: endLocation.longitude,
        accuracy: endLocation.accuracy,
        heading: endLocation.bearing,
        speed: endLocation.speed,
        address: geoResult?.address || null,
        road: geoResult?.road || null,
        area: geoResult?.area || null,
        batteryPercentage: Math.round((batteryLevel || 0) * 100),
        isOnline: true,
        remark: 'Tracking ended',
      };
    } catch (locationError) {
      console.warn('Failed to get location for end session:', locationError?.message);
    }

    try {
      await TrackingService.endSessionOfflineFirst(sessionIdToEnd, endPhotoFile, endLocationData);
      await AsyncStorage.removeItem(LAST_SESSION_KEY);

      // Do NOT sync pending locations when ending - they would add more distance
      void syncPendingLocations().catch(() => undefined);

      await loadSessionLocations(sessionIdToEnd, true);

      // navigation.navigate('TrackingSessionDetail', { sessionId: sessionIdToEnd });
      // showAlert('Tracking Stopped', 'Session saved successfully.', 'success');
      Alert.alert(
        'Tracking Stopped',
        'Session saved successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('TrackingSessionDetail', { sessionId: sessionIdToEnd });
            },
          },
        ],
        { cancelable: false } // Prevent dismissing by tapping outside
      );
    } catch (error) {
      showAlert(
        'Warning',
        error?.message || 'Tracking stopped, but final sync failed. Data is still stored offline.',
        'warning',
      );
      navigation.navigate('TrackingSessionDetail', { sessionId: sessionIdToEnd });
    } finally {
      punchOutPausedServicesRef.current = false;
      sessionIdRef.current = null;
      startTimeRef.current = null;
      setLoading(false);
      setGpsStatus('idle');
    }
  }, [
    captureCameraPhoto,
    getCurrentLocation,
    loadSessionLocations,
    navigation,
    showAlert,
    startForegroundTimers,
    stopForegroundTimers,
  ]);
  const startTracking = useCallback(async () => {
    // Check if subscription is expired for regular users before allowing tracking
    if (isSubscriptionExpired) {
      setLoading(false);
      Alert.alert(
        'Subscription Expired',
        subscriptionMessage,
        [{ text: 'OK' }],
        { cancelable: false }
      );
      return;
    }

    setLoading(true);
    try {
      // STEP 1: Check if location services are enabled
      const isLocationEnabled = await isNativeLocationEnabled();
      if (!isLocationEnabled) {
        setLoading(false);
        Alert.alert(
          'Location Services Disabled',
          'Please enable device location (GPS) to start tracking.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: async () => {
                try {
                  if (Platform.OS === 'android' && typeof Linking.sendIntent === 'function') {
                    await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
                  } else {
                    await Linking.openSettings();
                  }
                  // Don't auto-retry - user will click Punch In again
                } catch {
                  await Linking.openSettings();
                }
              },
            },
          ],
          { cancelable: true }
        );
        return;
      }

      // STEP 2: Request location permissions if not already granted
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        showAlert('Permission Required', 'Location permission is required to start tracking.');
        setLoading(false);
        return;
      }

      // STEP 2.5: Check battery optimization before starting tracking
      // await checkBatteryOptimization();

      // STEP 3: Get initial location first (to ensure GPS is actually working)
      let initialLocation;
      try {
        initialLocation = await getCurrentLocation();
      } catch (locationError) {
        console.error('Failed to get initial location:', locationError);
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please make sure GPS is enabled and you have a clear view of the sky.',
          [{ text: 'OK', style: 'default' }]
        );
        setLoading(false);
        return;
      }

      // STEP 4: Now open camera for punch-in photo
      const startPhotoFile = await captureCameraPhoto('punch_in');
      if (!startPhotoFile?.uri) {
        setLoading(false);
        return;
      }

      // STEP 5: Build location data for the session
      let locationDataForSession = null;
      try {
        const geoResult = await geocodeLatLng(initialLocation.latitude, initialLocation.longitude);
        const batteryLevel = await DeviceInfo.getBatteryLevel();
        locationDataForSession = {
          latitude: Number(initialLocation.latitude),
          longitude: Number(initialLocation.longitude),
          accuracy: initialLocation.accuracy,
          heading: initialLocation.bearing,
          speed: initialLocation.speed,
          address: geoResult?.address || null,
          road: geoResult?.road || null,
          area: geoResult?.area || null,
          batteryPercentage: Math.round((batteryLevel || 0) * 100),
          isOnline: true,
        };
        
        console.log('[LocationTrackingScreen] Built location data for session START:', {
          lat: locationDataForSession.latitude,
          lng: locationDataForSession.longitude,
          isValid: !(locationDataForSession.latitude === 0 && locationDataForSession.longitude === 0),
        });
      } catch (geoError) {
        console.warn('Failed to get geocode or battery for session start:', geoError?.message);
        locationDataForSession = {
          latitude: Number(initialLocation.latitude),
          longitude: Number(initialLocation.longitude),
          accuracy: initialLocation.accuracy,
          heading: initialLocation.bearing,
          speed: initialLocation.speed,
          isOnline: true,
        };
        
        console.log('[LocationTrackingScreen] Built location data (fallback) for session START:', {
          lat: locationDataForSession.latitude,
          lng: locationDataForSession.longitude,
          isValid: !(locationDataForSession.latitude === 0 && locationDataForSession.longitude === 0),
        });
      }

      // STEP 6: Start the tracking session with location data
      console.log('[LocationTrackingScreen] Calling startSessionOfflineFirst with photo and location:', locationDataForSession);
      const started = await TrackingService.startSessionOfflineFirst(startPhotoFile, locationDataForSession);
      // console.log('Start tracking response:', started);
      const sessionId = started?.sessionId;
      // console.log("sessionId ----", sessionId);

      if (!sessionId) {
        throw new Error('Failed to start tracking session');
      }

      sessionIdRef.current = sessionId;
      startTimeRef.current = started?.startTime
        ? normalizeTimestamp(started.startTime)
        : Date.now();
      trackingRef.current = true;
      setIsTracking(true);
      setDurationSeconds(0);
      setLocations([]);
      setPhotoEntries([]);
      setPunchInPhotoUri(null);
      lastPointRef.current = null;

      await AsyncStorage.setItem(
        LAST_SESSION_KEY,
        JSON.stringify({
          sessionId,
          isTracking: true,
          startTime: startTimeRef.current,
        }),
      );

      // STEP 7: The initial location point with "start" source is already saved by TrackingService
      // when the session was created (both online and offline). No need to send it again.
      // console.log('[LocationTrackingScreen] Initial start location already saved by TrackingService');

      // STEP 8: Start foreground services and timers
      await startNativeForegroundService();
      await setTrackingPipEnabled(isScreenFocused);
      await loadSessionLocations(sessionId, true);

      durationTimerRef.current = setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);
      startForegroundTimers();

      showAlert('Tracking Started', 'Your location is now being tracked.', 'success');
    } catch (error) {
      console.error('Start tracking error:', error);
      setIsTracking(false);
      trackingRef.current = false;
      showAlert('Cannot Start Tracking', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [
    captureCameraPhoto,
    getCurrentLocation,
    isScreenFocused,
    loadSessionLocations,
    requestLocationPermission,
    sendLocationPoint,
    showAlert,
    startForegroundTimers,
  ]);

  const restorePreviousSession = useCallback(async () => {
    const raw = await AsyncStorage.getItem(LAST_SESSION_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.isTracking || !parsed?.sessionId) return;

      sessionIdRef.current = parsed.sessionId;
      startTimeRef.current = normalizeTimestamp(parsed.startTime);
      trackingRef.current = true;
      setIsTracking(true);
      setDurationSeconds(Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000)));

      await startNativeForegroundService();
      await setTrackingPipEnabled(isScreenFocused);
      await syncNativeBufferedPointsForSession(parsed.sessionId);
      await loadSessionLocations(parsed.sessionId, true);

      durationTimerRef.current = setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);
      startForegroundTimers();
    } catch (error) {
      console.warn('LocationTrackingScreen: failed to restore previous session', error?.message || String(error));
    }
  }, [isScreenFocused, loadSessionLocations, startForegroundTimers]);

  const openAddPhoto = useCallback(async () => {
    if (!isTracking || !sessionIdRef.current) {
      showAlert('Not Tracking', 'Please start tracking first.');
      return;
    }
    stopForegroundTimers();
    const hasCameraPermission = await requestCameraPermission();
    if (!hasCameraPermission) {
      showAlert('Camera Permission', 'Please allow camera permission.');
      startForegroundTimers();
      return;
    }

    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
        cameraType: 'back',
      },
      response => {
        if (response.didCancel) {
          startForegroundTimers();
          return;
        }
        if (response.errorCode) {
          showAlert('Camera Error', response.errorMessage || 'Could not open camera.');
          startForegroundTimers();
          return;
        }
        const asset = response.assets?.[0];
        if (!asset?.uri) {
          startForegroundTimers();
          return;
        }
        setTempPhotoFile({
          uri: asset.uri,
          fileName: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        });
        setTempRemark('');
        setTempAmount('');
        setAddPhotoModalVisible(true);
      },
    );
  }, [isTracking, requestCameraPermission, showAlert, startForegroundTimers, stopForegroundTimers]);

  const closePhotoModal = useCallback(() => {
    setAddPhotoModalVisible(false);
    setTempPhotoFile(null);
    setTempRemark('');
    setTempAmount('');
    setUploadingPhoto(false);
    if (trackingRef.current) {
      startForegroundTimers();
    }
  }, [startForegroundTimers]);

  const submitPhotoWithLocation = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    if (!sessionId || !tempPhotoFile?.uri) {
      showAlert('Error', 'Session or photo missing.');
      return;
    }

    setUploadingPhoto(true);
    try {
      let location = null;
      let usedFallbackLocation = false;
      try {
        location = await getCurrentLocation();
      } catch (liveLocationError) {
        const fallbackLat = toNumberOrNull(currentLocation?.latitude ?? lastPointRef.current?.latitude);
        const fallbackLng = toNumberOrNull(currentLocation?.longitude ?? lastPointRef.current?.longitude);
        if (!isValidLocation(fallbackLat, fallbackLng)) {
          throw liveLocationError;
        }

        location = {
          latitude: fallbackLat,
          longitude: fallbackLng,
          accuracy: toNumberOrNull(currentLocation?.accuracy),
          bearing: toNumberOrNull(currentLocation?.bearing),
          speed: toNumberOrNull(currentLocation?.speed),
          timestamp: normalizeTimestamp(currentLocation?.timestamp ?? currentLocation?.time ?? Date.now()),
        };
        usedFallbackLocation = true;
      }

      const timestamp = Date.now();
      let address = 'Unknown Address';
      let road = 'Unknown Road';
      let area = 'Unknown Area';
      try {
        const geo = await geocodeLatLng(location.latitude, location.longitude);
        address = geo?.address || address;
        road = geo?.road || road;
        area = geo?.area || area;
      } catch {
        // no-op
      }

      let batteryPercentage = null;
      try {
        const level = await DeviceInfo.getBatteryLevel();
        batteryPercentage = Math.round((level || 0) * 100);
      } catch {
        batteryPercentage = null;
      }

      const online = await isOnline().catch(() => false);
      const formData = new FormData();
      formData.append('latitude', String(location.latitude));
      formData.append('longitude', String(location.longitude));
      formData.append('timestamp', String(timestamp));
      formData.append('address', address);
      formData.append('road', road);
      formData.append('area', area);
      if (location.accuracy != null) formData.append('accuracy', String(location.accuracy));
      if (location.bearing != null) formData.append('heading', String(location.bearing));
      if (location.speed != null) formData.append('speed', String(location.speed));
      if (batteryPercentage != null) formData.append('batterypercentage', String(batteryPercentage));
      if (tempRemark.trim()) formData.append('remark', tempRemark.trim());
      if (tempAmount.trim()) formData.append('amount', tempAmount.trim());
      formData.append('isOnline', online ? 'true' : 'false');
      formData.append('photo', {
        uri: tempPhotoFile.uri,
        name: tempPhotoFile.fileName,
        type: tempPhotoFile.type,
      });

      const result = await TrackingService.addLocationWithPhotoOfflineFirst(
        sessionId,
        {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp,
          address,
          road,
          area,
          accuracy: location.accuracy ?? null,
          heading: location.bearing ?? null,
          speed: location.speed ?? null,
          batteryPercentage,
          remark: tempRemark.trim() || null,
          amount: tempAmount.trim() || null,
          photoFile: tempPhotoFile,
          isOnline: online,
        },
        formData,
      );

      if (!result?.success) {
        throw new Error('Could not save photo location');
      }
      await loadSessionLocations(sessionId, false);
      showAlert(
        'Saved',
        usedFallbackLocation
          ? result.synced
            ? 'Photo saved with last known location and synced.'
            : 'Photo saved offline with last known location.'
          : result.synced
            ? 'Photo and location saved and synced.'
            : 'Photo and location saved offline.',
        'success',
      );
      closePhotoModal();
    } catch (error) {
      showAlert('Upload Failed', error?.message || 'Could not save photo location.');
    } finally {
      setUploadingPhoto(false);
    }
  }, [
    closePhotoModal,
    currentLocation,
    getCurrentLocation,
    loadSessionLocations,
    showAlert,
    tempAmount,
    tempPhotoFile,
    tempRemark,
  ]);

  useEffect(() => {
    const boot = async () => {
      try {
        const hasPermission = await requestLocationPermission();
        if (hasPermission) {
          const loc = await getCurrentLocation();
          setCurrentLocation(loc);
          if (mapRef.current) {
            mapRef.current.animateToRegion(
              {
                latitude: loc.latitude,
                longitude: loc.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              700,
            );
          }
        }
        await restorePreviousSession();
      } catch {
        // no-op
      } finally {
        // Prevent auto start/stop race while restorePreviousSession is in-flight.
        setBootComplete(true);
      }
    };
    boot();

    const unsubscribeSync = setupSyncOnReconnect(result => {
      if (trackingRef.current && sessionIdRef.current && result?.synced > 0) {
        void loadSessionLocations(sessionIdRef.current, false);
      }
    });

    const appStateSub = AppState.addEventListener('change', async nextState => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (
        previousState === 'active' &&
        (nextState === 'background' || nextState === 'inactive') &&
        trackingRef.current
      ) {
        await enterTrackingPip();
        // When app goes to background, JS timers will pause; start a proper
        // background task so points keep saving/syncing to backend.
        const sid = sessionIdRef.current;
        if (sid && !punchOutPausedServicesRef.current && !isBackgroundJobRunning()) {
          try {
            const started = await startBackgroundLocationJob(sid, 10000);
            if (started) {
              // Kick a quick flush to minimize server lag right after backgrounding.
              void syncPendingLocations().catch(() => undefined);
            }
          } catch (e) {
            console.warn(
              'LocationTrackingScreen: failed to start background job',
              e?.message || String(e),
            );
          }
        }
        stopForegroundTimers();
        if (sid) {
          await AsyncStorage.setItem(
            LAST_SESSION_KEY,
            JSON.stringify({
              sessionId: sid,
              isTracking: true,
              startTime: startTimeRef.current || Date.now(),
            }),
          );
        }
      }

      if (previousState !== 'active' && nextState === 'active' && trackingRef.current) {
        // Stop background job and resume normal foreground polling/UI refresh.
        try {
          await stopBackgroundLocationJob();
        } catch {
          // no-op
        }
        const sid = sessionIdRef.current;
        if (sid && trackingRef.current) {
          // Only sync if tracking is still active (session not ended)
          // 1) Merge any buffered native points into local DB (fast)
          await syncNativeBufferedPointsForSession(sid);
          // 2) Render polyline immediately from local DB (no network wait)
          await loadSessionLocations(sid, true);
          // 3) Sync to server in background, then refresh UI once more
          void (async () => {
            try {
              await syncPendingLocations();
            } catch {
              // ignore
            }
            try {
              await syncNativeBufferedPointsForSession(sid);
              await loadSessionLocations(sid, false);
            } catch {
              // ignore
            }
          })();
        }
        startForegroundTimers();
      }
    });

    return () => {
      unsubscribeSync?.();
      appStateSub?.remove?.();
      stopForegroundTimers();
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      try {
        void stopBackgroundLocationJob();
      } catch {
        // no-op
      }
      if (trackingRef.current) {
        void setTrackingPipEnabled(false);
        void stopNativeForegroundService();
      }
    };
  }, [
    getCurrentLocation,
    loadSessionLocations,
    requestLocationPermission,
    restorePreviousSession,
    startForegroundTimers,
    stopForegroundTimers,
  ]);

  useEffect(() => {
    if (!route?.params) {
      return;
    }

    if (!bootComplete) {
      return;
    }

    if (autoStartTracking && !trackingRef.current && !isTracking && !loading) {
      startTracking();
      navigation.setParams({
        ...route.params,
        autoStartTracking: false,
      });
      return;
    }

    if (autoStopTracking && trackingRef.current && !loading) {
      stopTracking();
      navigation.setParams({
        ...route.params,
        autoStopTracking: false,
      });
    }
  }, [
    bootComplete,
    autoStartTracking,
    autoStopTracking,
    isTracking,
    loading,
    navigation,
    route,
    startTracking,
    stopTracking,
  ]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    void setTrackingPipEnabled(isTracking && isScreenFocused);
  }, [isScreenFocused, isTracking]);

  const sortedLocations = useMemo(
    () => [...locations].sort((a, b) => a.timestamp - b.timestamp),
    [locations],
  );

  // Prefer explicit start/end sources so duplicate/late points don't shift markers.
  const startMarker =
    sortedLocations.find(p => p?.source === 'start') || sortedLocations[0] || null;
  const endMarker =
    [...sortedLocations].reverse().find(p => p?.source === 'end') ||
    sortedLocations[sortedLocations.length - 1] ||
    null;
  const segments = useMemo(() => segmentByOnlineStatus(sortedLocations), [sortedLocations]);

  const startCoordinate = useMemo(() => {
    if (!startMarker) return null;
    const latitude = Number(startMarker.latitude);
    const longitude = Number(startMarker.longitude);
    return isValidLocation(latitude, longitude) ? { latitude, longitude } : null;
  }, [startMarker]);

  const endCoordinate = useMemo(() => {
    if (!endMarker) return null;
    const latitude = Number(endMarker.latitude);
    const longitude = Number(endMarker.longitude);
    return isValidLocation(latitude, longitude) ? { latitude, longitude } : null;
  }, [endMarker]);

  const renderMapMarkers = useCallback(
    mapKeyPrefix => {
      const markers = [];

      if (startCoordinate) {
        const startPhoto = startMarker?.photoUri ?? punchInPhotoUri;

        if (startPhoto) {
          markers.push(
            <Marker
              key={`${mapKeyPrefix}-start`}
              coordinate={startCoordinate}
              pinColor="green"
              title="Start"
              zIndex={1000}
            >
              {/* <View style={styles.startMarkerImageWrap}>
                <Image source={{ uri: startPhoto }} style={styles.startMarkerImage} />
              </View> */}
            </Marker>,
          );
        } else {
          markers.push(
            <Marker
              key={`${mapKeyPrefix}-start`}
              coordinate={startCoordinate}
              pinColor="green"
              title="Start"
              zIndex={1000}
            />,
          );
        }
      }

      if (endCoordinate) {
        markers.push(
          <Marker
            key={`${mapKeyPrefix}-end`}
            coordinate={endCoordinate}
            pinColor="red"
            title="End"
            zIndex={1001}
          />,
        );
      }

      if (currentLocation && isValidLocation(currentLocation.latitude, currentLocation.longitude)) {
        markers.push(
          <Marker
            key={`${mapKeyPrefix}-current`}
            coordinate={{
              latitude: Number(currentLocation.latitude),
              longitude: Number(currentLocation.longitude),
            }}
            pinColor="#1D4ED8"
            title="Current"
            zIndex={999}
          />,
        );
      }

      photoEntries.forEach(item => {
        if (item.photoUri && isValidLocation(item.latitude, item.longitude)) {
          markers.push(
            <Marker
              key={`${mapKeyPrefix}-photo-${item.id}`}
              coordinate={{ latitude: Number(item.latitude), longitude: Number(item.longitude) }}
              pinColor="#FF8C00"
              title="Photo"
              description={item.remark || 'Photo point'}
            />,
          );
        }
      });

      return markers;
    },
    [currentLocation, endCoordinate, photoEntries, startCoordinate, startMarker, punchInPhotoUri],
  );

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={DEFAULT_REGION}
          showsUserLocation
          showsMyLocationButton
          onRegionChangeComplete={region => {
            mapRegionRef.current = region;
          }}
        >
          {segments.map((segment, index) => (
            <Polyline
              key={`segment-${index}`}
              coordinates={segment.coordinates}
              strokeColor={segment.isOnline ? '#438AFF' : '#DC2626'}
              strokeWidth={4}
            />
          ))}
          {renderMapMarkers('main')}
        </MapView>
      </View>

      {/* Only map + Start/Stop + Add Photo (when tracking) */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[
            styles.mainBtn,
            styles.flexBtn,
            isTracking ? styles.stopBtn : styles.startBtn,
            (loading || uploadingPhoto) && styles.disabledBtn,
          ]}
          onPress={isTracking ? stopTracking : startTracking}
          disabled={loading || uploadingPhoto}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon
                name={isTracking ? 'stop' : 'play'}
                size={18}
                color="#fff"
                style={styles.btnIcon}
              />
              <Text style={styles.mainBtnText}>
                {isTracking ? 'Check Out' : 'Check In'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        {isTracking && (
          <TouchableOpacity
            style={[
              styles.photoBtn,
              styles.flexBtn,
              (loading || uploadingPhoto) && styles.disabledBtn,
            ]}
            onPress={openAddPhoto}
            disabled={loading || uploadingPhoto}
          >
            <Icon name="camera" size={18} color="#fff" style={styles.btnIcon} />
            <Text style={styles.photoBtnText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={addPhotoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closePhotoModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Location Details</Text>
            {tempPhotoFile?.uri ? (
              <Image source={{ uri: tempPhotoFile.uri }} style={styles.modalPreview} />
            ) : null}
            <TextInput
              style={styles.input}
              placeholder="Location Name"
              placeholderTextColor={isDarkMode ? '#A09E9E' : '#999'}
              value={tempRemark}
              onChangeText={setTempRemark}
            />
            {/* <TextInput
              style={styles.input}
              placeholder="Amount (optional)"
              value={tempAmount}
              onChangeText={setTempAmount}
              keyboardType="numeric"
            /> */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={closePhotoModal}
                disabled={uploadingPhoto}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, uploadingPhoto && styles.disabledBtn]}
                onPress={submitPhotoWithLocation}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Save Photo</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <FancyAlert
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  mapWrap: { flex: 1, width },
  map: { width: '100%', height: '100%' },
  controlsRow: {
    flexDirection: 'row',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    gap: wp(3),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  flexBtn: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: wp(4), paddingBottom: hp(3) },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: wp(5),
    alignItems: 'center',
  },
  title: {
    marginTop: 8,
    fontSize: wp(5.4),
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    fontSize: wp(3.8),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: hp(1.6),
  },
  statLabel: { color: '#6B7280', fontSize: wp(3.8) },
  statValue: { color: '#111827', fontWeight: '700', fontSize: wp(3.9) },

  errorText: { marginLeft: 8, flex: 1, color: '#B91C1C', fontSize: wp(3.5) },
  mainBtn: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: hp(1.9),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: hp(0.7),
  },
  startBtn: { backgroundColor: '#10B981' },
  stopBtn: { backgroundColor: '#EF4444' },
  secondaryBtn: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: hp(1.4),
    marginBottom: hp(1),
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: '#fff', fontWeight: '600', fontSize: wp(3.9) },
  photoBtn: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: hp(1.5),
    marginBottom: hp(0.4),
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtnText: { color: '#fff', fontWeight: '600', fontSize: wp(3.9) },
  mainBtnText: { color: '#fff', fontWeight: '700', fontSize: wp(4.3) },
  btnIcon: { marginRight: 8 },
  disabledBtn: { opacity: 0.7 },
  startMarkerImageWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startMarkerImage: { width: '100%', height: '100%' },
  photoSection: {
    marginTop: hp(2),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: wp(3.5),
  },
  photoCard: {
    width: wp(36),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: wp(3),
    backgroundColor: '#fff',
  },
  photoMeta: { padding: wp(2.5) },
  photoRemark: { color: '#111827', fontWeight: '600', fontSize: wp(3.3) },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: wp(4.5),
  },
  modalTitle: { fontSize: wp(5), fontWeight: '700', color: '#111827', marginBottom: 10 },
  modalPreview: { width: '100%', height: hp(24), borderRadius: 10, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 2 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelBtnText: { color: '#6B7280', fontWeight: '600' },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#003384',
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: '700' },
});

export default LocationTrackingScreen;