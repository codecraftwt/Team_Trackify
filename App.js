import 'react-native-gesture-handler'; // 🔥 Must be first import
import './src/database'; // Initialize WatermelonDB for offline tracking
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/Navigation/AppNavigator';
import { AuthProvider } from './src/config/auth-context';
import { Buffer } from 'buffer';
import Toast from 'react-native-toast-message';
import { requestLocationPermission } from './src/Screens/CameraPermissionService';
import { registerTrackingForegroundService } from './src/services/BackgroundTrackingService';
import NotificationManager from './src/Notifications/NotificationManager';


global.Buffer = Buffer;

const App = () => {
  useEffect(() => {
    requestLocationPermission(); // 👈 Ask for location permission on app load
    registerTrackingForegroundService(); // 👈 Register foreground service for background tracking notifications
    NotificationManager.initialize(); // 👈 Initialize notification manager for proper notification handling
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
