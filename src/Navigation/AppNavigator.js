import { StyleSheet, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { useState, useEffect } from "react"
import { NavigationContainer} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import NetInfo from '@react-native-community/netinfo';
// Import all screens
import SplashScreen from '../Screens/SplashScreen';
import LoginScreen from '../Screens/LoginScreen';
import OTPScreen from '../Screens/OTPScreen';
import ProfileScreen from '../Screens/ProfileScreen';
import PersonalInfo from '../Screens/ProfileScreen/PersonalInfo';
import BankDetails from '../Screens/ProfileScreen/BankDetails';
import Logout from '../Screens/ProfileScreen/Logout';
import EditPersonalInfo from '../Screens/ProfileScreen/EditPersonalInfo';
import EditProfileScreen from '../Screens/ProfileScreen/EditProfileScreen';
import AddBankDetails from '../Screens/ProfileScreen/AddBankDetails';
import EditBankDetails from '../Screens/ProfileScreen/EditBankDetails';
import MyTickets from '../Screens/MyTickets';
import ShiftRequestScreen from '../Screens/ShiftRequestScreen';
import LoanRequestScreen from '../Screens/LoanRequestScreen';
import ExpenseClaim from '../Screens/ExpenseClaim';
import Attendance from '../Screens/Attendance';
import AttendanceDetails from '../Screens/AttendanceDetails';
import AttendanceSummary from '../Screens/AttendanceSummary';
import LeaveRequestScreen from '../Screens/LeaveRequestScreen';
import LeaveApproval from '../Screens/LeaveApproval';
import MarkAttendanceScreen from '../MarkAttendanceScreen';
import GeneralInfo from '../Screens/ProfileScreen/GeneralInfo';
import FixedHolidays from '../Screens/ProfileScreen/FixedHolidays';
import LeavePolicy from '../Screens/ProfileScreen/LeavePolicy';
import SalarySlipScreen from '../Screens/Salaryslip/SalarySlipScreen';

import SalarySlip from '../Screens/Salaryslip/SalarySlip'
import MyDocument from '../Screens/Document/MyDocument';
import AadharDetails from '../Screens/Document/AadharDetails';
import AadharDetailsEdit from '../Screens/Document/AadharDetailsEdit';
import PANDetails from '../Screens/Document/PANDetails';
import PANDetailsEdit from '../Screens/Document/PANDetailsEdit';
import QualificationDetails from '../Screens/Document/QualificationDetails';
import QualificationDetailsEdit from '../Screens/Document/QualificationDetailsEdit';
import ExperienceDetails from '../Screens/Document/ExperienceDetails';
import ExperienceDetailsEdit from '../Screens/Document/ExperienceDetailsEdit';
import DocumentScreen from '../Screens/ProfileScreen/DocumentScreen';
import Attendanceshow from '../Screens/Attendanceshow';
import AdminDashboard from '../Screens/Admin/AdminDashboard';
import AdminHistory from '../Screens/Admin/AdminHistory';
import AdminReport from '../Screens/Admin/AdminReport';
import UserTrackingHistory from '../Screens/Admin/UserTrackingHistory';
import SessionDetailMap from '../Screens/Admin/SessionDetailMap';
import FullImageScreen from '../FullImageScreen';

import { useAuth } from '../config/auth-context';
import AdminLeaveRequest from '../Screens/Admin/AdminLeaveRequest';
import AdminLeaveDetails from '../Screens/Admin/AdminLeaveDetails';
import AdminShiftRequest from '../Screens/Admin/AdminShiftRequest';
import AdminLoanRequest from '../Screens/Admin/AdminLoanRequest';
import AdminRequestDetails from '../Screens/Admin/AdminRequestDetails';
import AdminRequestPage from '../Screens/Admin/AdminRequestPage';
import Faceregister from './../Screens/Admin/Faceregister';
import EmployeeListScreen from './../Screens/Admin/EmployeeListScreen';
import AdminMarkAttendanceScreen from './../Screens/Admin/AdminMarkAttendanceScreen';
import NoInternetScreen from '../Screens/Nointernet/NoInternetScreen';
import AdminTotalEmployees from './../Screens/Admin/AdminTotalEmployees';
import LocationTrackingScreen from '../Screens/Tracking/LocationTrackingScreen';
import TrackingHistoryScreen from '../Screens/Tracking/TrackingHistoryScreen';
import TrackingSessionDetailScreen from '../Screens/Tracking/TrackingSessionDetailScreen';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Helper for common header options
const commonScreenOptions = ({ navigation, title, showEdit = false, editScreen = '' }) => ({
    title: title,
    headerShown: true,
    headerTitleAlign: 'center',
    headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
            <Icon name="chevron-back" size={24} color="#438AFF" />
        </TouchableOpacity>
    ),
    headerRight: showEdit ? () => (
        <TouchableOpacity onPress={() => navigation.navigate(editScreen)} style={{ marginRight: 15 }}>
            <Icon name="pencil" size={20} color="#438AFF" />
        </TouchableOpacity>
    ) : undefined,
    headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
        color: '#000',
    },
});

// Bottom Tab Navigator for regular users
const TabNavigator = () => {
    return (
        <Tab.Navigator screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#438AFF',
            tabBarInactiveTintColor: '#999999',
        }}>
            <Tab.Screen
                name="LocationTrackingTab"
                component={LocationTrackingScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="navigate" color={color} size={size} />
                    ),
                    title: "Location",
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
                    title: "Tracking History",
                    headerTitleAlign: "center",
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
                    title: "Profile",
                }}
            />
        </Tab.Navigator>
    );
};

// Bottom Tab Navigator for Admin users
const AdminTabNavigator = () => {
    return (
        
        <Tab.Navigator screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#438AFF',
            tabBarInactiveTintColor: '#999999',
        }}>
            <Tab.Screen
                name="AdminDashboard"
                component={AdminDashboard}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="home" color={color} size={size} />
                    ),
                    title: "Dashboard",
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
                    title: "Users",
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
                    title: "Reports",
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
                    title: "Profile",
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
    </Stack.Navigator>
);

// Stack for all authenticated screens (both user and admin)
// This stack will have its initial route determined by the user's role
const AuthenticatedStack = ({ route }) => {
    const { userRole } = route.params; // Get userRole from route params
    console.log("userRole",userRole);
    
    const isAdminLike = userRole === 'Super Admin' || userRole === 'Manager' || userRole === 'Admin';
    const initialRoute = isAdminLike ? 'AdminTabs' : 'UserTabs';


    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
            {/* Tab navigators are nested here */}
            <Stack.Screen name="UserTabs" component={TabNavigator} />
            <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />

            {/* All other screens that are accessible from authenticated routes */}
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen
                name="PersonalInfo"
                component={PersonalInfo}
                options={(props) => ({
                    ...commonScreenOptions(props),
                    headerShown: false,
                    title: 'Personal Information', // optional, won't show since header is hidden
                })}
            />

            <Stack.Screen name="BankDetails" component={BankDetails} options={(props) => commonScreenOptions({ ...props, title: 'Bank Details' })} />
            <Stack.Screen name="MyDocument" component={MyDocument} options={(props) => commonScreenOptions({ ...props, title: 'My Document' })} />
            <Stack.Screen name="AadharDetails" component={AadharDetails} options={(props) => commonScreenOptions({ ...props, title: 'Aadhar Details' })} />
            <Stack.Screen name="AadharDetailsEdit" component={AadharDetailsEdit} options={(props) => commonScreenOptions({ ...props, title: 'Aadhar Details', showEdit: true, editScreen: 'AadharDetails' })} />
            <Stack.Screen name="PANDetails" component={PANDetails} options={(props) => commonScreenOptions({ ...props, title: 'PAN Details' })} />
            <Stack.Screen name="PANDetailsEdit" component={PANDetailsEdit} options={(props) => commonScreenOptions({ ...props, title: 'PAN Details', showEdit: true, editScreen: 'PANDetails' })} />
            <Stack.Screen name="EditPersonalInfo" component={EditPersonalInfo} options={(props) => commonScreenOptions({ ...props, title: 'Personal Information' })} />
            <Stack.Screen name="AddBankDetails" component={AddBankDetails} options={(props) => commonScreenOptions({ ...props, title: 'Bank Details' })} />
            <Stack.Screen name="EditBankDetails" component={EditBankDetails} options={(props) => commonScreenOptions({ ...props, title: 'Bank Details' })} />
            <Stack.Screen name="MyTickets" component={MyTickets} options={(props) => commonScreenOptions({ ...props, title: 'My Tickets' })} />
            <Stack.Screen name="ShiftRequestScreen" component={ShiftRequestScreen} options={(props) => commonScreenOptions({ ...props, title: 'Shift Request ' })} />
            <Stack.Screen name="LoanRequestScreen" component={LoanRequestScreen} options={(props) => commonScreenOptions({ ...props, title: 'Loan Request ' })} />
            <Stack.Screen name="ExpenseClaim" component={ExpenseClaim} options={(props) => commonScreenOptions({ ...props, title: 'Expense Claim' })} />
            <Stack.Screen name="FullImageScreen" component={FullImageScreen} options={{ headerShown: true, title: '', headerBackTitleVisible: false }} />
            <Stack.Screen name="AttendanceDetails" component={AttendanceDetails} options={(props) => commonScreenOptions({ ...props, title: 'Attendance Details' })} />
            <Stack.Screen name="Attendanceshow" component={Attendanceshow} options={(props) => commonScreenOptions({ ...props, title: 'Attendance' })} />
            <Stack.Screen name="Attendance" component={Attendance} options={(props) => commonScreenOptions({ ...props, title: 'Attendance' })} />
            <Stack.Screen name="AttendanceSummary" component={AttendanceSummary} options={(props) => commonScreenOptions({ ...props, title: 'Attendance Summary' })} />
            <Stack.Screen name="LeaveRequestScreen" component={LeaveRequestScreen} options={(props) => commonScreenOptions({ ...props, title: 'Leave Request ' })} />
            <Stack.Screen name="LeaveApproval" component={LeaveApproval} options={(props) => commonScreenOptions({ ...props, title: 'Leave Approval' })} />
            <Stack.Screen name="MarkAttendanceScreen" component={MarkAttendanceScreen} options={(props) => commonScreenOptions({ ...props, title: 'Mark Attendance' })} />
            <Stack.Screen name="GeneralInfo" component={GeneralInfo} options={(props) => commonScreenOptions({ ...props, title: 'General Information' })} />
            <Stack.Screen name="FixedHolidays" component={FixedHolidays} options={(props) => commonScreenOptions({ ...props, title: 'Fixed Holidays' })} />
            <Stack.Screen name="LeavePolicy" component={LeavePolicy} options={(props) => commonScreenOptions({ ...props, title: 'Leave Policy ( Yearly )' })} />
            <Stack.Screen name="SalarySlipScreen" component={SalarySlipScreen} options={(props) => commonScreenOptions({ ...props, title: 'Salary Slip' })} />
            <Stack.Screen name="SalarySlip" component={SalarySlip} options={(props) => commonScreenOptions({ ...props, title: 'Salary Slip' })} />
            <Stack.Screen name="QualificationDetails" component={QualificationDetails} options={(props) => commonScreenOptions({ ...props, title: 'Qualification Details' })} />
            <Stack.Screen name='QualificationDetailsEdit' component={QualificationDetailsEdit} options={(props) => commonScreenOptions({ ...props, title: 'Qualification Details', showEdit: true, editScreen: 'QualificationDetails' })} />
            <Stack.Screen name='ExperienceDetails' component={ExperienceDetails} options={(props) => commonScreenOptions({ ...props, title: 'Experience Details' })} />
            <Stack.Screen name='ExperienceDetailsEdit' component={ExperienceDetailsEdit} options={(props) => commonScreenOptions({ ...props, title: 'Experience Details', showEdit: true, editScreen: 'ExperienceDetails' })} />
            <Stack.Screen name="DocumentScreen" component={DocumentScreen} options={(props) => commonScreenOptions({ ...props, title: 'View Document' })} />
            <Stack.Screen name="Logout" component={Logout} />

            {/* Admin stack */}
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={(props) => commonScreenOptions({ ...props, title: 'Admin Dashboard' })} />
            <Stack.Screen name="AdminHistory" component={AdminHistory} options={(props) => commonScreenOptions({ ...props, title: 'History' })} />
            <Stack.Screen name="UserTrackingHistory" component={UserTrackingHistory} />
            <Stack.Screen name="SessionDetailMap" component={SessionDetailMap} options={(props) => commonScreenOptions({ ...props, title: 'Session Details' })} />
            <Stack.Screen name="AdminReport" component={AdminReport} options={(props) => commonScreenOptions({ ...props, title: 'Report' })} />
            <Stack.Screen name="AdminLeaveRequest" component={AdminLeaveRequest} options={(props) => commonScreenOptions({ ...props, title: 'Leave Request ' })} />
            <Stack.Screen name="AdminTotalEmployees" component={AdminTotalEmployees} options={(props) => commonScreenOptions({ ...props, title: 'Total Employees ' })} />
            <Stack.Screen name="AdminLeaveDetails" component={AdminLeaveDetails} options={(props) => commonScreenOptions({ ...props, title: 'Leave Details ' })} />
            <Stack.Screen name="AdminShiftRequest" component={AdminShiftRequest} options={(props) => commonScreenOptions({ ...props, title: 'Shift Request ' })} />
            <Stack.Screen name="AdminLoanRequest" component={AdminLoanRequest} options={(props) => commonScreenOptions({ ...props, title: 'Loan Request ' })} />
            <Stack.Screen name="AdminRequestPage" component={AdminRequestPage} options={(props) => commonScreenOptions({ ...props, title: ' Request ' })} />
            <Stack.Screen name="AdminRequestDetails" component={AdminRequestDetails} options={(props) => commonScreenOptions({ ...props, title: 'details ' })} />
            <Stack.Screen name="Faceregister" component={Faceregister} options={(props) => commonScreenOptions({ ...props, title: 'Faceregister ' })} />
            <Stack.Screen name="EmployeeListScreen" component={EmployeeListScreen} options={(props) => commonScreenOptions({ ...props, title: 'Faceregister ' })} />
            <Stack.Screen name="AdminMarkAttendanceScreen" component={AdminMarkAttendanceScreen} options={(props) => commonScreenOptions({ ...props, title: 'AdminMarkAttendanceScreen'})} />

            {/* Location Tracking */}
            <Stack.Screen name="LocationTracking" component={LocationTrackingScreen} options={(props) => commonScreenOptions({ ...props, title: 'Location Tracking' })} />
            <Stack.Screen name="TrackingHistory" component={TrackingHistoryScreen} options={(props) => commonScreenOptions({ ...props, title: 'Tracking History' })} />
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
  const unsubscribe = NetInfo.addEventListener(async (state) => {
    // Basic connection info
    const connected = state.isConnected && state.isInternetReachable !== false;

    if (connected) {
      // ⚡ Perform a "real" check — test a fast, lightweight endpoint
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000); // 3 sec timeout

        const response = await fetch("https://www.google.com/generate_204", {
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
    const response = await fetch("https://www.google.com/generate_204", { signal: controller.signal });
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
                    <Stack.Screen name="Authenticated" component={AuthenticatedStack} initialParams={{ userRole: userRole }} />
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
