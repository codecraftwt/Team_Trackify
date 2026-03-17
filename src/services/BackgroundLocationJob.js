import { Platform, PermissionsAndroid } from 'react-native';
import BackgroundService from 'react-native-background-actions';
import GetLocation from 'react-native-get-location';
import DeviceInfo from 'react-native-device-info';
import * as TrackingService from './TrackingService';
import { isOnline, syncPendingLocations } from './SyncService';
import { geocodeLatLng } from '../utils/geocoding';
import { syncNativeBufferedPointsForSession } from './BgLocationNative';

const LOCATION_POLL_INTERVAL_MS = 10000;
const BACKGROUND_TASK_NAME = 'BackgroundLocationTracking';
let isTaskRunning = false;
const FLUSH_EVERY_N_POINTS = 3;

const CONFIG = {
  MIN_DISTANCE_METERS: 15,
  // Be slightly more tolerant in background – GPS is naturally noisier
  LOCATION_ACCURACY_THRESHOLD: 100,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
};

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

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

const getCurrentLocationWithRetry = async (retryCount = 0) => {
  try {
    const location = await GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    });
    
    if (!location || 
        typeof location.latitude !== 'number' || 
        typeof location.longitude !== 'number' ||
        isNaN(location.latitude) || 
        isNaN(location.longitude)) {
      throw new Error('Invalid location data');
    }
    
    if (location.accuracy > CONFIG.LOCATION_ACCURACY_THRESHOLD) {
      console.warn(`Background: Location accuracy too low: ${location.accuracy}m`);
      if (retryCount < CONFIG.MAX_RETRIES) {
        await sleep(CONFIG.RETRY_DELAY);
        return getCurrentLocationWithRetry(retryCount + 1);
      }
    }
    
    return location;
  } catch (error) {
    console.warn(`Background: Failed to get location (attempt ${retryCount + 1}):`, error?.message);
    
    if (retryCount < CONFIG.MAX_RETRIES) {
      await sleep(CONFIG.RETRY_DELAY);
      return getCurrentLocationWithRetry(retryCount + 1);
    }
    
    throw error;
  }
};

const sendLocationPointToServer = async (sessionId, location) => {
  if (!sessionId || !location) {
    console.warn('Background: Missing sessionId or location');
    return { success: false };
  }

  const { latitude, longitude } = location;
  
  if (latitude == null || longitude == null || isNaN(latitude) || isNaN(longitude)) {
    console.warn('Background: Invalid coordinates:', latitude, longitude);
    return { success: false };
  }

  try {
    const now = Date.now();
    let address = 'Unknown Address';
    let road = 'Unknown Road';
    let area = 'Unknown Area';
    
    try {
      const geoPromise = geocodeLatLng(latitude, longitude);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Geocoding timeout')), 5000)
      );
      
      const geo = await Promise.race([geoPromise, timeoutPromise]);
      address = geo.address || address;
      road = geo.road || road;
      area = geo.area || area;
    } catch (geoError) {
      console.warn('Background: Geocoding failed:', geoError.message);
    }

    let batteryPercentage = null;
    try {
      const batteryLevel = await DeviceInfo.getBatteryLevel();
      batteryPercentage = Math.round((batteryLevel || 0) * 100);
    } catch (batteryError) {
      console.warn('Background: Failed to get battery level:', batteryError.message);
    }

    const online = await isOnline();
    const formData = new FormData();
    formData.append('latitude', String(latitude));
    formData.append('longitude', String(longitude));
    formData.append('timestamp', String(location.time || now));
    formData.append('address', address);
    formData.append('road', road);
    formData.append('area', area);
    
    if (location.accuracy != null) {
      formData.append('accuracy', String(location.accuracy));
    }
    if (location.bearing != null) {
      formData.append('heading', String(location.bearing));
    }
    if (location.speed != null) {
      formData.append('speed', String(location.speed));
    }
    if (batteryPercentage != null) {
      formData.append('batterypercentage', String(batteryPercentage));
    }

    formData.append('source', 'background');

    const locationData = {
      latitude,
      longitude,
      timestamp: location.time || now,
      address,
      road,
      area,
      accuracy: location.accuracy ?? null,
      bearing: location.bearing ?? null,
      speed: location.speed ?? null,
      batteryPercentage: batteryPercentage,
      source: 'background',
      isOnline: online,
    };
    
    console.log(`Background: Sending location to session ${sessionId}:`, {
      lat: latitude.toFixed(6),
      lng: longitude.toFixed(6),
      accuracy: location.accuracy,
      time: new Date().toLocaleTimeString()
    });
    
    const result = await TrackingService.addLocationOfflineFirst(sessionId, locationData, formData);

    if (result.success) {
      console.log(`Background: Location ${result.synced ? 'synced' : 'saved offline'} (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
      return { success: true, location: { latitude, longitude } };
    } else {
      console.warn('Background: Failed to save location');
      return { success: false };
    }
  } catch (error) {
    console.error('Background: Error in sendLocationPointToServer:', error);
    return { success: false, error: error.message };
  }
};

const backgroundLocationTask = async (taskData) => {
  const { sessionId, intervalMs = LOCATION_POLL_INTERVAL_MS } = taskData || {};
  
  if (!sessionId) {
    console.error('Background task: No sessionId provided');
    await BackgroundService.stop();
    return;
  }

  console.log(`Background task started for session: ${sessionId}`);
  isTaskRunning = true;

  let locationCount = 0;
  let lastSuccessfulLocation = null;
  let consecutiveFailures = 0;
  let lastFlushAtCount = 0;
  // Allow more failures before triggering a recovery backoff
  const MAX_CONSECUTIVE_FAILURES = 10;
  
  try {
    await BackgroundService.updateNotification({
      taskDesc: `Tracking active • Starting...`,
    });

    while (BackgroundService.isRunning() && isTaskRunning) {
      try {
        console.log(`Background: Getting location (attempt ${locationCount + 1})...`);
        
        const location = await getCurrentLocationWithRetry();
        
        if (location) {
          let shouldSend = true;
          
          if (lastSuccessfulLocation) {
            const distance = calculateDistance(
              lastSuccessfulLocation.latitude,
              lastSuccessfulLocation.longitude,
              location.latitude,
              location.longitude
            );
            
            if (distance < CONFIG.MIN_DISTANCE_METERS) {
              console.log(`Background: Location skipped (moved only ${distance.toFixed(1)}m)`);
              shouldSend = false;
            }
          }
          
          if (shouldSend) {
            const result = await sendLocationPointToServer(sessionId, location);
            
            if (result.success) {
              lastSuccessfulLocation = {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                time: location.time || Date.now(),
              };
              locationCount++;
              consecutiveFailures = 0;
              
              const timeStr = new Date().toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
              
              await BackgroundService.updateNotification({
                taskDesc: `Tracking active • ${locationCount} points • Last: ${timeStr}`,
              });
              
              console.log(`Background: Location sent successfully. Total: ${locationCount}`);

              // Periodically flush any offline/native-buffered points to server while background.
              if (locationCount - lastFlushAtCount >= FLUSH_EVERY_N_POINTS) {
                lastFlushAtCount = locationCount;
                try {
                  const merged = await syncNativeBufferedPointsForSession(sessionId);
                  if (merged?.inserted > 0) {
                    console.log(`Background: merged native buffered points: ${merged.inserted}`);
                  }
                } catch (e) {
                  console.warn('Background: native buffer sync failed:', e?.message || String(e));
                }
                try {
                  const syncRes = await syncPendingLocations();
                  console.log(`Background: pending sync result: ${syncRes?.synced ?? 0}`);
                } catch (e) {
                  console.warn('Background: pending sync failed:', e?.message || String(e));
                }
              }
            } else {
              consecutiveFailures++;
              console.warn(`Background: Failed to send location. Consecutive failures: ${consecutiveFailures}`);
              
              if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                console.error('Background: Too many consecutive failures, applying backoff before retrying');
                const backoffMs = Math.min(intervalMs * 6, 10 * 60 * 1000); // up to 10 minutes
                try {
                  await BackgroundService.updateNotification({
                    taskDesc: 'Tracking unstable • backing off and retrying...',
                  });
                } catch (notifError) {
                  console.warn('Background: Failed to update notification during backoff:', notifError?.message);
                }
                await sleep(backoffMs);
                consecutiveFailures = 0;
              }
            }
          }
        }
      } catch (locationError) {
        consecutiveFailures++;
        console.warn(`Background: Location error (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}):`, locationError.message);
        
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          console.error('Background: Too many consecutive errors, applying backoff before retrying');
          
          try {
            await BackgroundService.updateNotification({
              taskDesc: 'Tracking unstable • backing off and retrying...',
            });
          } catch (notifError) {
            console.warn('Background: Failed to update notification during error backoff:', notifError?.message);
          }
          
          const backoffMs = Math.min(intervalMs * 6, 10 * 60 * 1000); // up to 10 minutes
          await sleep(backoffMs);
          consecutiveFailures = 0;
        }
      }
      
      let adjustedInterval = intervalMs;
      if (lastSuccessfulLocation) {
        // If user is stationary, increase interval to save battery
        adjustedInterval = Math.min(intervalMs * 2, 30000);
      }
      
      await sleep(adjustedInterval);
    }
  } catch (taskError) {
    console.error('Background task error:', taskError);
    
    await BackgroundService.updateNotification({
      taskDesc: 'Tracking error - restart app',
    });
  } finally {
    console.log(`Background task ended. Sent ${locationCount} locations.`);
    isTaskRunning = false;
    
    try {
      if (BackgroundService.isRunning()) {
        await BackgroundService.stop();
      }
    } catch (stopError) {
      console.error('Error stopping background service:', stopError);
    }
  }
};

const optionsBase = {
  taskName: BACKGROUND_TASK_NAME,
  taskTitle: 'Location Tracking Active',
  taskDesc: 'Your route is being recorded in the background',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#34a853',
  linkingURI: 'myapp://tracking',
  parameters: {
    delay: 1000,
  },
  ...(Platform.OS === 'android' && {
    notificationChannelId: 'location_tracking',
    notificationChannelName: 'Location Tracking',
    notificationChannelDescription: 'Tracks your location in the background',
    notificationColor: '#34a853',
    notificationIcon: 'ic_launcher',
  }),
};

export const startBackgroundLocationJob = async (sessionId, intervalMs = LOCATION_POLL_INTERVAL_MS) => {
  try {
    if (!sessionId) {
      console.error('Cannot start background job: No sessionId');
      return false;
    }
    
    if (BackgroundService.isRunning()) {
      console.log('Background service already running, stopping first...');
      await stopBackgroundLocationJob();
      await sleep(1000);
    }

    console.log(`Starting background service for session: ${sessionId}`);
    
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 29) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            {
              title: 'Background Location Permission',
              message: 'This app needs access to your location even when the app is closed to track your route.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn('Background location permission not granted');
          }
        }
      } catch (err) {
        console.warn('Error requesting background location permission:', err);
      }
    }
    
    await BackgroundService.start(backgroundLocationTask, {
      ...optionsBase,
      parameters: {
        sessionId,
        intervalMs,
      },
    });
    
    console.log('Background service started successfully');
    return true;
  } catch (error) {
    console.error('Failed to start background service:', error);
    
    if (Platform.OS === 'android' && error.message.includes('not allowed')) {
      console.log('Trying alternative background service start...');
      try {
        await BackgroundService.start(backgroundLocationTask, {
          ...optionsBase,
          parameters: {
            sessionId,
            intervalMs,
          },
          notificationChannelId: 'tracking_channel',
          notificationChannelName: 'Tracking Notifications',
        });
        return true;
      } catch (retryError) {
        console.error('Alternative start also failed:', retryError);
      }
    }
    
    return false;
  }
};

export const stopBackgroundLocationJob = async () => {
  try {
    console.log('Stopping background service...');
    isTaskRunning = false;
    
    if (BackgroundService.isRunning()) {
      try {
        await BackgroundService.updateNotification({
          taskDesc: 'Stopping tracking...',
        });
        await sleep(500);
      } catch (notifError) {
        console.warn('Error updating notification:', notifError);
      }
      
      await BackgroundService.stop();
      console.log('Background service stopped');
    } else {
      console.log('Background service was not running');
    }
    return true;
  } catch (error) {
    console.error('Failed to stop background service:', error);
    return false;
  }
};

export const isBackgroundJobRunning = () => {
  return BackgroundService.isRunning() && isTaskRunning;
};

export const checkBatteryOptimization = async () => {
  if (Platform.OS === 'android') {
    try {
      const batteryOptimizationStatus = await BackgroundService.checkBatteryOptimization();
      if (batteryOptimizationStatus === 'true') {
        console.warn('Battery optimization is enabled. This may affect background tracking.');
        return false;
      }
      return true;
    } catch (error) {
      console.warn('Could not check battery optimization:', error);
      return true;
    }
  }
  return true;
};

export const getBackgroundServiceStatus = () => {
  return {
    isRunning: BackgroundService.isRunning(),
    isTaskRunning,
    taskName: BACKGROUND_TASK_NAME,
  };
};

export const restartBackgroundLocationJob = async (sessionId, intervalMs = LOCATION_POLL_INTERVAL_MS) => {
  try {
    console.log('Restarting background service...');
    await stopBackgroundLocationJob();
    await sleep(2000);
    return await startBackgroundLocationJob(sessionId, intervalMs);
  } catch (error) {
    console.error('Failed to restart background service:', error);
    return false;
  }
};