/**
 * Background location tracking: keeps tracking when app is minimized,
 * in background, or screen is locked (Android: foreground service; iOS: background mode).
 * Must call registerTrackingForegroundService() at app startup (e.g. index.js).
 */

import notifee, { AndroidImportance, AndroidColor } from '@notifee/react-native';
import { Platform } from 'react-native';

const TRACKING_CHANNEL_ID = 'hrms_location_tracking';
const TRACKING_NOTIFICATION_ID = 'hrms_tracking_session';

let trackingChannelCreated = false;

async function ensureTrackingChannel() {
  if (trackingChannelCreated) return TRACKING_CHANNEL_ID;
  await notifee.createChannel({
    id: TRACKING_CHANNEL_ID,
    name: 'Location Tracking',
    description: 'Shown while your route is being recorded in the background',
    importance: AndroidImportance.LOW,
    sound: null,
    vibration: false,
  });
  trackingChannelCreated = true;
  return TRACKING_CHANNEL_ID;
}

/**
 * Register the foreground service task. Call once at app startup (e.g. in index.js).
 * The service keeps running until stopTrackingForegroundService() is called.
 */
export function registerTrackingForegroundService() {
  if (Platform.OS !== 'android') return;

  notifee.registerForegroundService(() => {
    return new Promise(() => {
      // Long-lived task: promise never resolves so the service runs until
      // stopForegroundService() is called when user stops tracking.
    });
  });
}

/**
 * Start the tracking foreground service and show a persistent notification.
 * Call when user taps "Start Tracking". On Android this keeps the app process
 * eligible to run so location polling continues when app is minimized or screen locked.
 * @param {object} [opts] - Optional: { durationFormatted, pointsCount }
 */
export async function startTrackingForegroundService(opts = {}) {
  if (Platform.OS !== 'android') return;

  const channelId = await ensureTrackingChannel();
  const { durationFormatted = '00:00:00', pointsCount = 0 } = opts;

  await notifee.displayNotification({
    id: TRACKING_NOTIFICATION_ID,
    title: 'Location tracking active',
    body: `Duration: ${durationFormatted} • Points: ${pointsCount}`,
    android: {
      channelId,
      asForegroundService: true,
      color: AndroidColor.GREEN,
      colorized: true,
      ongoing: true,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
    },
  });
}

/**
 * Update the tracking notification (e.g. duration and points count).
 * Safe to call repeatedly while tracking.
 */
export async function updateTrackingNotification(opts = {}) {
  if (Platform.OS !== 'android') return;

  const { durationFormatted = '00:00:00', pointsCount = 0 } = opts;

  try {
    await notifee.displayNotification({
      id: TRACKING_NOTIFICATION_ID,
      title: 'Location tracking active',
      body: `Duration: ${durationFormatted} • Points: ${pointsCount}`,
      android: {
        channelId: TRACKING_CHANNEL_ID,
        asForegroundService: true,
        color: AndroidColor.GREEN,
        colorized: true,
        ongoing: true,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
      },
    });
  } catch (e) {
    // Notification may have been cancelled
  }
}

/**
 * Stop the tracking foreground service and remove the notification.
 * Call when user taps "Stop Tracking".
 */
export async function stopTrackingForegroundService() {
  if (Platform.OS !== 'android') return;

  try {
    await notifee.stopForegroundService();
  } catch (e) {
    console.warn('BackgroundTrackingService: stopForegroundService failed', e);
  }
}
