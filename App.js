import 'react-native-gesture-handler'; // 🔥 Must be first import
import './src/database'; // Initialize WatermelonDB for offline tracking
import React, { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/Navigation/AppNavigator';
import { AuthProvider } from './src/config/auth-context';
import { Buffer } from 'buffer';
import Toast from 'react-native-toast-message';
import { requestLocationPermission } from './src/Screens/CameraPermissionService';
import { registerTrackingForegroundService } from './src/services/BackgroundTrackingService';
import NotificationManager from './src/Notifications/NotificationManager';
import { setupSyncOnReconnect, syncPendingLocations } from './src/services/SyncService';


global.Buffer = Buffer;

const App = () => {
  const syncUnsubscribeRef = useRef(null);

  useEffect(() => {
    requestLocationPermission(); // 👈 Ask for location permission on app load
    registerTrackingForegroundService(); // 👈 Register foreground service for background tracking notifications
    NotificationManager.initialize(); // 👈 Initialize notification manager for proper notification handling

    // 👈 Global sync listener - persists even when tracking screen is unmounted
    // This ensures offline data syncs when network becomes available
    syncUnsubscribeRef.current = setupSyncOnReconnect((result) => {
      console.log('[App] Network restored, sync result:', result);
      if (result?.success && result?.synced > 0) {
        console.log('[App] Successfully synced', result.synced, 'location(s)');
      } else if (result?.reason === 'offline') {
        console.log('[App] Still offline, skipping sync');
      }
    });

    // 👈 Initial sync check on app start
    syncPendingLocations().then((result) => {
      console.log('[App] Initial sync check result:', result);
    }).catch((err) => {
      console.warn('[App] Initial sync failed:', err);
    });

    return () => {
      // Cleanup sync listener on app unmount
      if (syncUnsubscribeRef.current) {
        syncUnsubscribeRef.current();
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppNavigator />
        {/* <Toast /> */}
      </AuthProvider>
    </GestureHandlerRootView>
  );
};

export default App;
