import { StyleSheet, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import NetInfo from '@react-native-community/netinfo';
import SplashScreen from '../Screens/SplashScreen';
import LoginScreen from '../Screens/LoginScreen';
import OTPScreen from '../Screens/OTPScreen';
import ProfileScreen from '../Screens/ProfileScreen';
import PersonalInfo from '../Screens/ProfileScreen/PersonalInfo';
import Logout from '../Screens/ProfileScreen/Logout';
import EditPersonalInfo from '../Screens/ProfileScreen/EditPersonalInfo';
import EditProfileScreen from '../Screens/ProfileScreen/EditProfileScreen';
import AdminDashboard from '../Screens/Admin/AdminDashboard';
import AdminHistory from '../Screens/Admin/AdminHistory';
import AdminReport from '../Screens/Admin/AdminReport';
import AdminDateUsers from '../Screens/Admin/AdminDateUsers';
import AdminUserSessions from '../Screens/Admin/AdminUserSessions';
import UserTrackingHistory from '../Screens/Admin/UserTrackingHistory';
import SessionDetailMap from '../Screens/Admin/SessionDetailMap';
import FullImageScreen from '../FullImageScreen';
import { useAuth } from '../config/auth-context';
import EmployeeListScreen from './../Screens/Admin/EmployeeListScreen';
import NoInternetScreen from '../Screens/Nointernet/NoInternetScreen';
import LocationTrackingScreen from '../Screens/Tracking/LocationTrackingScreen';
import TrackingHistoryScreen from '../Screens/Tracking/TrackingHistoryScreen';
import TrackingSessionDetailScreen from '../Screens/Tracking/TrackingSessionDetailScreen';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ForgotPassword from '../Screens/ForgotPassword';
import ManagePlans from '../Screens/Admin/ManagePlans';
import PlanDetails from '../Screens/Admin/PlanDetails';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Helper for common header options
const commonScreenOptions = ({
  navigation,
  title,
  showEdit = false,
  editScreen = '',
}) => ({
  title: title,
  headerShown: true,
  headerTitleAlign: 'center',
  headerLeft: () => (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={{ marginLeft: 15 }}
    >
      <Icon name="chevron-back" size={24} color="#438AFF" />
    </TouchableOpacity>
  ),
  headerRight: showEdit
    ? () => (
      <TouchableOpacity
        onPress={() => navigation.navigate(editScreen)}
        style={{ marginRight: 15 }}
      >
        <Icon name="pencil" size={20} color="#438AFF" />
      </TouchableOpacity>
    )
    : undefined,
  headerTitleStyle: {
    fontWeight: '600',
    fontSize: 18,
    color: '#000',
  },
});

// Bottom Tab Navigator for regular users
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#438AFF',
        tabBarInactiveTintColor: '#999999',
      }}
    >
      <Tab.Screen
        name="LocationTrackingTab"
        component={LocationTrackingScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="navigate" color={color} size={size} />
          ),
          title: 'Location',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="TrackingHistoryTab"
        component={TrackingHistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="time-outline" color={color} size={size} />
          ),
          headerShown: false,
          title: 'Tracking History',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
            color: '#000',
          },
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" color={color} size={size} />
          ),
          headerShown: false,
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Bottom Tab Navigator for Admin users
const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#438AFF',
        tabBarInactiveTintColor: '#999999',
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
          title: 'Dashboard',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="AdminHistory"
        component={AdminHistory}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="users" color={color} size={size} />
          ),
          title: 'Users',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="AdminReport"
        component={AdminReport}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="document" color={color} size={size} />
          ),
          title: 'Reports',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" color={color} size={size} />
          ),
          headerShown: false,
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Authentication Stack
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="LoginScreen" component={LoginScreen} />
    <Stack.Screen name="OTPScreen" component={OTPScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
  </Stack.Navigator>
);

// Stack for all authenticated screens (both user and admin)
// This stack will have its initial route determined by the user's role
const AuthenticatedStack = ({ route }) => {
  const { userRole, subscriptionStatus } = route.params; // Get userRole and subscriptionStatus from route params
  // console.log('userRole', userRole);
  // console.log('subscriptionStatus', subscriptionStatus);

  const isAdminLike =
    userRole === 'Super Admin' ||
    userRole === 'Manager' ||
    userRole === 'Admin';
  const initialRoute = isAdminLike ? 'AdminTabs' : 'UserTabs';

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRoute}
    >
      {/* Tab navigators are nested here */}
      <Stack.Screen name="UserTabs" component={TabNavigator} />
      <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />

      {/* All other screens that are accessible from authenticated routes */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PersonalInfo"
        component={PersonalInfo}
        options={props => ({
          ...commonScreenOptions(props),
          headerShown: false,
          title: 'Personal Information', // optional, won't show since header is hidden
        })}
      />
      <Stack.Screen
        name="EditPersonalInfo"
        component={EditPersonalInfo}
        options={props =>
          commonScreenOptions({ ...props, title: 'Personal Information' })
        }
      />
      <Stack.Screen name="Logout" component={Logout} />
      <Stack.Screen
        name="FullImageScreen"
        component={FullImageScreen}
        options={{
          headerShown: true,
          title: '',
          headerBackTitleVisible: false,
        }}
      />

      {/* Admin stack */}
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboard}
        options={props =>
          commonScreenOptions({ ...props, title: 'Admin Dashboard' })
        }
      />
      <Stack.Screen
        name="AdminHistory"
        component={AdminHistory}
        options={props => commonScreenOptions({ ...props, title: 'History' })}
      />
      <Stack.Screen
        name="UserTrackingHistory"
        component={UserTrackingHistory}
      />
      <Stack.Screen
        name="SessionDetailMap"
        component={SessionDetailMap}
        // options={props =>
        //   commonScreenOptions({ ...props, title: 'Session Details' })
        // }
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminReport"
        component={AdminReport}
        options={props => commonScreenOptions({ ...props, title: 'Report' })}
      />
      <Stack.Screen
        name="AdminDateUsers"
        component={AdminDateUsers}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminUserSessions"
        component={AdminUserSessions}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="EmployeeListScreen"
        component={EmployeeListScreen}
        options={props =>
          commonScreenOptions({ ...props, title: 'Faceregister ' })
        }
      />

      {/* Add ManagePlans screen here */}
      <Stack.Screen
        name="ManagePlans"
        component={ManagePlans}
        options={props => ({
          ...commonScreenOptions(props),
          headerShown: false,
        })}
      />

      <Stack.Screen
        name="PlanDetails"
        component={PlanDetails}
        options={props => ({
          ...commonScreenOptions(props),
          headerShown: false,
        })}
      />

      {/* Location Tracking */}
      <Stack.Screen
        name="LocationTracking"
        component={LocationTrackingScreen}
        options={props =>
          commonScreenOptions({ ...props, title: 'Location Tracking' })
        }
      />
      <Stack.Screen
        name="TrackingHistory"
        component={TrackingHistoryScreen}
        options={props =>
          commonScreenOptions({ ...props, title: 'Tracking History' })
        }
      />
      <Stack.Screen
        name="TrackingSessionDetail"
        component={TrackingSessionDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  const [isConnected, setIsConnected] = useState(true);
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async state => {
      // Basic connection info
      const connected =
        state.isConnected && state.isInternetReachable !== false;

      if (connected) {
        // ⚡ Perform a "real" check — test a fast, lightweight endpoint
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3000); // 3 sec timeout

          const response = await fetch('https://www.google.com/generate_204', {
            signal: controller.signal,
          });
          clearTimeout(timeout);

          // HTTP 204 is success from Google’s lightweight endpoint
          if (response.status === 204) {
            setIsConnected(true);
          } else {
            setIsConnected(false);
          }
        } catch (error) {
          setIsConnected(false);
        }
      } else {
        setIsConnected(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Function to re-check the network status
  const handleTryAgain = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const response = await fetch('https://www.google.com/generate_204', {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      setIsConnected(response.status === 204);
    } catch (error) {
      setIsConnected(false);
    }
  };
  // Only block with NoInternetScreen when NOT authenticated (login requires network).
  // When authenticated, allow full app access so user can use Location Tracking offline.
  if (!isAuthenticated && !isConnected) {
    return <NoInternetScreen onTryAgain={handleTryAgain} />;
  }
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoading ? (
          // Show splash screen while loading authentication state
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : isAuthenticated ? (
          // User is authenticated, render the authenticated stack
          <Stack.Screen
            name="Authenticated"
            component={AuthenticatedStack}
            initialParams={{ userRole: userRole }}
          />
        ) : (
          // User is not authenticated, render the authentication stack
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({});
