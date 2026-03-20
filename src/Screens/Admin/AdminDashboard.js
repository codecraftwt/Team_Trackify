// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   StyleSheet,
//   StatusBar,
//   SafeAreaView,
//   ActivityIndicator,
//   Alert,
//   RefreshControl,
//   BackHandler
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import CustomHeader from '../../Component/CustomHeader';
// import { getUserStats } from '../../config/AdminService';
// import { useIsFocused } from '@react-navigation/native';

// const TeamTrackifyDashboard = ({ navigation }) => {
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [userStats, setUserStats] = useState({
//     totalUsers: 0,
//     activeUsers: 0,
//     inactiveUsers: 0,
//     todayCheckedIn: 0,
//     todayCheckedOut: 0,
//     uniqueCheckedInUsers: 0,
//     uniqueCheckedOutUsers: 0,
//     currentlyTracking: 0,
//     uniqueCurrentlyTracking: 0,
//     activePercentage: '0',
//     inactivePercentage: '0',
//     todayActivityRate: '0',
//   });
//   const isScreenFocused = useIsFocused();

//   useEffect(() => {
//     fetchUserStats();
//   }, []);

//   // Add back handler for Android
//   useEffect(() => {
//     if (isScreenFocused) {
//       const backHandler = BackHandler.addEventListener(
//         'hardwareBackPress',
//         handleBackPress
//       );

//       return () => backHandler.remove();
//     }
//   }, [isScreenFocused]);

//   const handleBackPress = () => {
//     Alert.alert(
//       'Exit App',
//       'Are you sure you want to exit?',
//       [
//         {
//           text: 'Cancel',
//           onPress: () => null,
//           style: 'cancel',
//         },
//         {
//           text: 'Exit',
//           onPress: () => BackHandler.exitApp(),
//         },
//       ],
//       { cancelable: false }
//     );
//     return true; // Prevent default back button behavior
//   };


//   const fetchUserStats = async () => {
//     try {
//       setLoading(true);

//       // Get adminId from AsyncStorage
//       const adminId = await AsyncStorage.getItem('userId');
//       const userRole = await AsyncStorage.getItem('userRole');

//       if (!adminId) {
//         Alert.alert('Error', 'Admin ID not found');
//         setLoading(false);
//         return;
//       }

//       // Check if user is admin (case-insensitive comparison)
//       if (userRole && userRole.toLowerCase() !== 'admin') {
//         Alert.alert('Error', 'Unauthorized access');
//         setLoading(false);
//         return;
//       }

//       console.log('Fetching user stats for admin:', adminId);

//       const result = await getUserStats(adminId);

//       if (result.success && result.data) {
//         console.log('User Stats Data:', result.data);

//         // Update state with API data (new response format has data in 'count' object)
//         const countData = result.data.count || {};
//         setUserStats({
//           totalUsers: (countData.allActiveUsers || 0) + (countData.allInactiveUsers || 0),
//           activeUsers: countData.activeUsers || countData.allActiveUsers || 0,
//           inactiveUsers: countData.inactiveUsers || countData.allInactiveUsers || 0,
//           todayCheckedIn: countData.todayCheckedIn || 0,
//           todayCheckedOut: countData.todayCheckedOut || 0,
//           uniqueCheckedInUsers: countData.todayCheckedIn || 0,
//           uniqueCheckedOutUsers: countData.todayCheckedOut || 0,
//           currentlyTracking: countData.currentlyTracking || 0,
//           uniqueCurrentlyTracking: countData.currentlyTracking || 0,
//           activePercentage: countData.allActiveUsers && (countData.allActiveUsers + countData.allInactiveUsers) > 0
//             ? ((countData.allActiveUsers / (countData.allActiveUsers + countData.allInactiveUsers)) * 100).toFixed(1)
//             : '0',
//           inactivePercentage: countData.allInactiveUsers && (countData.allActiveUsers + countData.allInactiveUsers) > 0
//             ? ((countData.allInactiveUsers / (countData.allActiveUsers + countData.allInactiveUsers)) * 100).toFixed(1)
//             : '0',
//           todayActivityRate: countData.todayCheckedIn && (countData.allActiveUsers + countData.allInactiveUsers) > 0
//             ? ((countData.todayCheckedIn / (countData.allActiveUsers + countData.allInactiveUsers)) * 100).toFixed(1)
//             : '0',
//         });
//       } else {
//         Alert.alert('Error', result.message || 'Failed to fetch user stats');
//         console.log('Error fetching user stats admin dashboard:', result.message);
//       }
//     } catch (error) {
//       console.error('Error fetching user stats:', error);
//       Alert.alert('Error', 'Something went wrong while fetching data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Add back handler for Android
//   // useEffect(() => {
//   //   const backHandler = BackHandler.addEventListener(
//   //     'hardwareBackPress',
//   //     handleBackPress
//   //   );

//   //   return () => backHandler.remove();
//   // }, []);

//   // const handleBackPress = () => {
//   //   Alert.alert(
//   //     'Exit App',
//   //     'Are you sure you want to exit?',
//   //     [
//   //       {
//   //         text: 'Cancel',
//   //         onPress: () => null,
//   //         style: 'cancel',
//   //       },
//   //       {
//   //         text: 'Exit',
//   //         onPress: () => BackHandler.exitApp(),
//   //       },
//   //     ],
//   //     { cancelable: false }
//   //   );
//   //   return true; // Prevent default back button behavior
//   // };


//   const onRefresh = async () => {
//     setRefreshing(true);
//     await fetchUserStats();
//     setRefreshing(false);
//   };

//   // const handleCardPress = (cardType) => {
//   //   switch (cardType) {
//   //     case 'activeUsers':
//   //       navigation.navigate('ActiveUsers');
//   //       break;
//   //     case 'inactiveUsers':
//   //       navigation.navigate('InactiveUsers');
//   //       break;
//   //     case 'managePlans':
//   //       navigation.navigate('ActivePlans');
//   //       break;
//   //     case 'liveTracking':
//   //       navigation.navigate('LiveTracking');
//   //       break;
//   //     default:
//   //       break;
//   //   }
//   // };

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <CustomHeader title="Team Trackify" showLogo={true} textAlign="center" titleStyle={{ fontSize: 24 }} />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#3088C7" />
//           <Text style={styles.loadingText}>Loading dashboard...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }
//   const handleCardPress = () => {
//     navigation.navigate('ManagePlans');
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

//       <CustomHeader
//         title="Team Trackify"
//         showLogo={true}
//         textAlign="center"
//         titleStyle={{ fontSize: 24 }}
//       />

//       <ScrollView
//         style={styles.scrollView}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//       >
//         <View style={{ padding: 18 }}>
//           <Text style={styles.welcomeText}>Tracking Overview :</Text>

//           <View style={styles.statsContainer}>
//             <View style={styles.statCard}>
//               <View style={styles.cardHeader}>
//                 <View style={styles.iconWrapper}>
//                   <Icon name="people" size={24} color="#1976D2" />
//                 </View>
//                 <Text style={styles.cardTitle}>Active Users</Text>
//               </View>
//               <Text style={styles.statValue}>{userStats.activeUsers}</Text>
//               <View style={styles.cardAction}>
//                 <Text style={styles.actionText}>View Details</Text>
//                 <Icon name="arrow-forward" size={16} color="#1976D2" />
//               </View>
//             </View>

//             <View style={styles.statCard}>
//               <View style={styles.cardHeader}>
//                 <View style={styles.iconWrapper}>
//                   <Icon name="person-remove" size={24} color="#D32F2F" />
//                 </View>
//                 <Text style={styles.cardTitle}>Inactive Users</Text>
//               </View>
//               <Text style={styles.statValue}>{userStats.inactiveUsers}</Text>
//               <View style={styles.cardAction}>
//                 <Text style={styles.actionText}>View Details</Text>
//                 <Icon name="arrow-forward" size={16} color="#D32F2F" />
//               </View>
//             </View>

//             <View style={styles.statCard}>
//               <View style={styles.cardHeader}>
//                 <View style={styles.iconWrapper}>
//                   <Icon name="airplanemode-active" size={24} color="#388E3C" />
//                 </View>
//                 <Text style={styles.cardTitle}>Today's Checked In</Text>
//               </View>
//               <Text style={styles.statValue}>{userStats.todayCheckedIn}</Text>
//               <View style={styles.cardAction}>
//                 <Text style={styles.actionText}>Live Status</Text>
//                 <Icon name="fiber-manual-record" size={12} color="#388E3C" />
//               </View>
//             </View>

//             <View style={styles.statCard}>
//               <View style={styles.cardHeader}>
//                 <View style={styles.iconWrapper}>
//                   <Icon name="airplanemode-inactive" size={24} color="#F57C00" />
//                 </View>
//                 <Text style={styles.cardTitle}>Today's Checked Out</Text>
//               </View>
//               <Text style={styles.statValue}>{userStats.todayCheckedOut}</Text>
//               <View style={styles.cardAction}>
//                 <Text style={styles.actionText}>Completed</Text>
//                 <Icon name="check-circle" size={16} color="#F57C00" />
//               </View>
//             </View>
//             <TouchableOpacity
//               onPress={handleCardPress}
//               activeOpacity={0.7}
//               style={styles.statCard}
//             >
//               {/* <View style={styles.statCard}> */}
//                 <View style={styles.cardHeader}>
//                   <View style={styles.iconWrapper}>
//                     <Icon name="airplanemode-inactive" size={24} color="#F57C00" />
//                   </View>
//                   <Text style={styles.cardTitle}>Active Plans</Text>
//                 </View>
//                 <Text style={styles.statValue}>5</Text>
//                 <View style={styles.cardAction}>
//                   <Text style={styles.actionText}>View Plans</Text>
//                   <Icon name="arrow-forward" size={16} color="#F57C00" />
//                 </View>
//               {/* </View> */}
//             </TouchableOpacity>
//           </View>

//           {/* Recent Activities */}
//           <View style={styles.activitiesContainer}>
//             <View
//               style={{
//                 flexDirection: 'row',
//                 alignItems: 'center',
//                 marginBottom: 8,
//               }}>
//               <Icon
//                 name="notifications"
//                 size={25}
//                 color="#4A90E2"
//                 style={{ marginRight: 8, marginTop: 2 }}
//               />
//               <Text style={styles.sectionTitle}>Recent Activities</Text>
//             </View>
//             <View style={styles.recentEmptyState}>
//               <Icon name="info-outline" size={24} color="#999" />
//               <Text style={styles.recentEmptyText}>No recent activity</Text>
//             </View>
//           </View>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F0F4FA',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//   },
//   welcomeText: {
//     fontSize: 20,
//     fontFamily: 'Poppins-SemiBold',
//     color: '#333',
//     marginBottom: 18,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//     marginBottom: 18,
//   },
//   statCard: {
//     width: '48%',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#F0F0F0',
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   iconWrapper: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#F8F9FA',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//   },
//   cardTitle: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Medium',
//     color: '#2C3E50',
//     flex: 1,
//   },
//   statValue: {
//     fontSize: 28,
//     fontFamily: 'Poppins-Bold',
//     color: '#1A1A1A',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   cardAction: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingTop: 8,
//     borderTopWidth: 1,
//     borderTopColor: '#F0F0F0',
//     height: 30,
//     minHeight: 30
//   },
//   actionText: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Regular',
//     color: '#6C757D',
//     marginRight: 4,
//   },
//   activitiesContainer: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 10,
//     padding: 18,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 4,
//     elevation: 1,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontFamily: 'Poppins-Medium',
//     color: '#333',
//   },
//   recentEmptyState: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//   },
//   recentEmptyText: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: '#999',
//     marginTop: 8,
//   },
// });

// export default TeamTrackifyDashboard;
// =====================================================

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   StyleSheet,
//   StatusBar,
//   SafeAreaView,
//   ActivityIndicator,
//   Alert,
//   RefreshControl,
//   BackHandler
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import CustomHeader from '../../Component/CustomHeader';
// import { getUserStats, getUserById, getLastFiveTrackedUsers } from '../../config/AdminService';
// import { useIsFocused } from '@react-navigation/native';

// const TeamTrackifyDashboard = ({ navigation }) => {
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [showAddOns, setShowAddOns] = useState(false);
//   const [userStats, setUserStats] = useState({
//     totalUsers: 0,
//     activeUsers: 0,
//     inactiveUsers: 0,
//     todayCheckedIn: 0,
//     todayCheckedOut: 0,
//     uniqueCheckedInUsers: 0,
//     uniqueCheckedOutUsers: 0,
//     currentlyTracking: 0,
//     uniqueCurrentlyTracking: 0,
//     activePercentage: '0',
//     inactivePercentage: '0',
//     todayActivityRate: '0',
//   });
//   const [currentUser, setCurrentUser] = useState(null);
//   const [planExpired, setPlanExpired] = useState(false);
//   const [recentActivities, setRecentActivities] = useState([]);
//   const [loadingActivities, setLoadingActivities] = useState(false);
//   const isScreenFocused = useIsFocused();

//   useEffect(() => {
//     fetchDashboardData();
//   }, []);

//   // Add back handler for Android
//   useEffect(() => {
//     if (isScreenFocused) {
//       const backHandler = BackHandler.addEventListener(
//         'hardwareBackPress',
//         handleBackPress
//       );

//       return () => backHandler.remove();
//     }
//   }, [isScreenFocused]);

//   const handleBackPress = () => {
//     Alert.alert(
//       'Exit App',
//       'Are you sure you want to exit?',
//       [
//         {
//           text: 'Cancel',
//           onPress: () => null,
//           style: 'cancel',
//         },
//         {
//           text: 'Exit',
//           onPress: () => BackHandler.exitApp(),
//         },
//       ],
//       { cancelable: false }
//     );
//     return true;
//   };

//   const fetchRecentActivities = async (adminId) => {
//     try {
//       setLoadingActivities(true);
//       const result = await getLastFiveTrackedUsers(adminId);
      
//       if (result.success) {
//         console.log('Recent Activities Data:', result.data);
//         setRecentActivities(result.data || []);
//       } else {
//         console.log('Error fetching recent activities:', result.message);
//         if (result.unauthorized) {
//           // Handle unauthorized
//           Alert.alert('Session Expired', 'Please login again');
//           navigation.navigate('Login');
//         }
//       }
//     } catch (error) {
//       console.error('Error in fetchRecentActivities:', error);
//     } finally {
//       setLoadingActivities(false);
//     }
//   };

//   const fetchDashboardData = async () => {
//     try {
//       setLoading(true);

//       const userId = await AsyncStorage.getItem('userId');
//       const userRole = await AsyncStorage.getItem('userRole');

//       if (!userId) {
//         Alert.alert('Error', 'User ID not found');
//         setLoading(false);
//         return;
//       }

//       if (userRole && userRole.toLowerCase() !== 'admin') {
//         Alert.alert('Error', 'Unauthorized access');
//         setLoading(false);
//         return;
//       }

//       console.log('Fetching data for user:', userId);

//       // Fetch all data in parallel
//       const [userResult, statsResult] = await Promise.all([
//         getUserById(userId),
//         getUserStats(userId)
//       ]);

//       if (userResult.success) {
//         console.log('User Data:', userResult.data);
//         console.log('Plan Expired:', userResult.planExpired);
//         setCurrentUser(userResult.data);
//         setPlanExpired(userResult.planExpired);
//       } else {
//         console.log('Error fetching user details:', userResult.message);
//       }

//       if (statsResult.success && statsResult.data) {
//         console.log('User Stats Data:', statsResult.data);

//         const countData = statsResult.data.count || {};
//         setUserStats({
//           totalUsers: (countData.allActiveUsers || 0) + (countData.allInactiveUsers || 0),
//           activeUsers: countData.activeUsers || countData.allActiveUsers || 0,
//           inactiveUsers: countData.inactiveUsers || countData.allInactiveUsers || 0,
//           todayCheckedIn: countData.todayCheckedIn || 0,
//           todayCheckedOut: countData.todayCheckedOut || 0,
//           uniqueCheckedInUsers: countData.todayCheckedIn || 0,
//           uniqueCheckedOutUsers: countData.todayCheckedOut || 0,
//           currentlyTracking: countData.currentlyTracking || 0,
//           uniqueCurrentlyTracking: countData.currentlyTracking || 0,
//           activePercentage: countData.allActiveUsers && (countData.allActiveUsers + countData.allInactiveUsers) > 0
//             ? ((countData.allActiveUsers / (countData.allActiveUsers + countData.allInactiveUsers)) * 100).toFixed(1)
//             : '0',
//           inactivePercentage: countData.allInactiveUsers && (countData.allActiveUsers + countData.allInactiveUsers) > 0
//             ? ((countData.allInactiveUsers / (countData.allActiveUsers + countData.allInactiveUsers)) * 100).toFixed(1)
//             : '0',
//           todayActivityRate: countData.todayCheckedIn && (countData.allActiveUsers + countData.allInactiveUsers) > 0
//             ? ((countData.todayCheckedIn / (countData.allActiveUsers + countData.allInactiveUsers)) * 100).toFixed(1)
//             : '0',
//         });
//       } else {
//         Alert.alert('Error', statsResult.message || 'Failed to fetch user stats');
//         console.log('Error fetching user stats admin dashboard:', statsResult.message);
//       }

//       // Fetch recent activities
//       await fetchRecentActivities(userId);

//     } catch (error) {
//       console.error('Error fetching dashboard data:', error);
//       Alert.alert('Error', 'Something went wrong while fetching data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await fetchDashboardData();
//     setRefreshing(false);
//   };

//   const handleCardPress = () => {
//     navigation.navigate('ManagePlans');
//   };

//   const handleUserPress = (userId, userName) => {
//     // Navigate to user details or tracking summary
//     navigation.navigate('UserTrackingSummary', { userId, userName });
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   const getStatusColor = (status) => {
//     return status === 'completed' ? '#388E3C' : '#F57C00';
//   };

//   const getStatusText = (status) => {
//     return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
//   };

//   const getStatusIcon = (status) => {
//     return status === 'active' ? 'fiber-manual-record' : 'check-circle';
//   };

//   const formatTimeAgo = (date) => {
//     // This is a placeholder - you can implement actual time ago logic
//     return 'Just now';
//   };

//   // Calculate total add-on amount
//   const calculateTotalAddOnAmount = () => {
//     if (!currentUser?.currentPaymentId?.addOns) return 0;
//     return currentUser.currentPaymentId.addOns.reduce((total, addon) => {
//       return total + (addon.addOnAmount || 0);
//     }, 0);
//   };

//   // Calculate total users from add-ons
//   const calculateTotalUsers = () => {
//     if (!currentUser?.currentPaymentId?.addOns) return 0;
//     return currentUser.currentPaymentId.addOns.reduce((total, addon) => {
//       return total + (addon.addOnMaxUser || 0);
//     }, 0);
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <CustomHeader title="Team Trackify" showLogo={true} textAlign="center" titleStyle={{ fontSize: 24 }} />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#3088C7" />
//           <Text style={styles.loadingText}>Loading dashboard...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

//       <CustomHeader
//         title="Team Trackify"
//         showLogo={true}
//         textAlign="center"
//         titleStyle={{ fontSize: 24 }}
//       />

//       {/* Plan Details Section */}
//       {currentUser && (
//         <View style={styles.planContainer}>
//           <View style={styles.planHeader}>
//             <Icon name="card-membership" size={20} color="#3088C7" />
//             <Text style={styles.planTitle}>Current Plan Details</Text>
//           </View>
          
//           <View style={styles.planDetails}>
//             <View style={styles.planRow}>
//               <Text style={styles.planLabel}>Plan:</Text>
//               <Text style={styles.planValue}>
//                 {currentUser.currentPaymentId?.description || 'Basic Plan'}
//               </Text>
//             </View>
            
//             {/* <View style={styles.planRow}>
//               <Text style={styles.planLabel}>Status:</Text>
//               <View style={styles.statusBadge}>
//                 <Text style={[
//                   styles.statusText,
//                   { color: planExpired ? '#D32F2F' : '#388E3C' }
//                 ]}>
//                   {planExpired ? 'Expired' : 'Active'}
//                 </Text>
//               </View>
//             </View> */}
            
//             {/* <View style={styles.planRow}>
//               <Text style={styles.planLabel}>Start Date:</Text>
//               <Text style={styles.planValue}>
//                 {formatDate(currentUser.currentPaymentId?.createdAt) || 'N/A'}
//               </Text>
//             </View> */}
            
//             <View style={styles.planRow}>
//               <Text style={styles.planLabel}>Expiry Date:</Text>
//               <Text style={styles.planValue}>
//                 {formatDate(currentUser.currentPaymentId?.expiresAt) || 'N/A'}
//               </Text>
//             </View>

//             <View style={styles.planRow}>
//               <Text style={styles.planLabel}>Base Amount:</Text>
//               <Text style={styles.planValue}>
//                 ₹{currentUser.currentPaymentId?.amount || 0}
//               </Text>
//             </View>

//             {currentUser.currentPaymentId?.addOns && currentUser.currentPaymentId.addOns.length > 0 && (
//               <>
//                 <View style={styles.planRow}>
//                   <Text style={styles.planLabel}>Add-on Amount:</Text>
//                   <Text style={styles.planValue}>
//                     ₹{calculateTotalAddOnAmount()}
//                   </Text>
//                 </View>

//                 <View style={styles.planRow}>
//                   <Text style={styles.planLabel}>Total Amount:</Text>
//                   <Text style={[styles.planValue, styles.totalAmount]}>
//                     ₹{(currentUser.currentPaymentId?.amount || 0) + calculateTotalAddOnAmount()}
//                   </Text>
//                 </View>
//               </>
//             )}

//             <View style={styles.planRow}>
//               <Text style={styles.planLabel}>Base Users:</Text>
//               <Text style={styles.planValue}>
//                 {currentUser.currentPaymentId?.maxUser || 0}
//               </Text>
//             </View>

//             {currentUser.currentPaymentId?.addOns && currentUser.currentPaymentId.addOns.length > 0 && (
//               <>
//                 <View style={styles.planRow}>
//                   <Text style={styles.planLabel}>Add-on Users:</Text>
//                   <Text style={styles.planValue}>
//                     +{calculateTotalUsers()}
//                   </Text>
//                 </View>

//                 <View style={[styles.planRow, styles.totalRow]}>
//                   <Text style={styles.planLabel}>Total Users:</Text>
//                   <Text style={[styles.planValue, styles.totalAmount]}>
//                     {(currentUser.currentPaymentId?.maxUser || 0) + calculateTotalUsers()}
//                   </Text>
//                 </View>
//               </>
//             )}

//             {currentUser.currentPaymentId?.paymentMethod && (
//               <View style={styles.planRow}>
//                 <Text style={styles.planLabel}>Payment Method:</Text>
//                 <Text style={styles.planValue}>
//                   {currentUser.currentPaymentId.paymentMethod}
//                 </Text>
//               </View>
//             )}

//             {currentUser.currentPaymentId?.paymentStatus && (
//               <View style={styles.planRow}>
//                 <Text style={styles.planLabel}>Payment Status:</Text>
//                 <Text style={[
//                   styles.planValue,
//                   { color: getStatusColor(currentUser.currentPaymentId.paymentStatus) }
//                 ]}>
//                   {getStatusText(currentUser.currentPaymentId.paymentStatus)}
//                 </Text>
//               </View>
//             )}
//           </View>

//           {/* Add-ons Toggle Section */}
//           {currentUser.currentPaymentId?.addOns && currentUser.currentPaymentId.addOns.length > 0 && (
//             <View style={styles.addOnsSection}>
//               <TouchableOpacity
//                 style={styles.addOnsHeader}
//                 onPress={() => setShowAddOns(!showAddOns)}
//                 activeOpacity={0.7}
//               >
//                 <View style={styles.addOnsTitleContainer}>
//                   <Icon name="add-shopping-cart" size={18} color="#3088C7" />
//                   <Text style={styles.addOnsTitle}>
//                     Add-on Plans ({currentUser.currentPaymentId.addOns.length})
//                   </Text>
//                 </View>
//                 <Icon 
//                   name={showAddOns ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
//                   size={24} 
//                   color="#666" 
//                 />
//               </TouchableOpacity>

//               {showAddOns && (
//                 <View style={styles.addOnsList}>
//                   {currentUser.currentPaymentId.addOns.map((addon, index) => (
//                     <View key={addon._id || index} style={styles.addOnItem}>
//                       <View style={styles.addOnHeader}>
//                         <Text style={styles.addOnNumber}>Add-on #{index + 1}</Text>
//                         <View style={[
//                           styles.addOnStatusBadge,
//                           { backgroundColor: addon.status === 'completed' ? '#E8F5E9' : '#FFF3E0' }
//                         ]}>
//                           <Text style={[
//                             styles.addOnStatusText,
//                             { color: addon.status === 'completed' ? '#388E3C' : '#F57C00' }
//                           ]}>
//                             {getStatusText(addon.status)}
//                           </Text>
//                         </View>
//                       </View>

//                       <View style={styles.addOnDetails}>
//                         <View style={styles.addOnRow}>
//                           <Text style={styles.addOnLabel}>Description:</Text>
//                           <Text style={styles.addOnValue} numberOfLines={2}>
//                             {addon.addOnDescription || 'Add-on Plan'}
//                           </Text>
//                         </View>

//                         <View style={styles.addOnRow}>
//                           <Text style={styles.addOnLabel}>Amount:</Text>
//                           <Text style={styles.addOnValue}>₹{addon.addOnAmount || 0}</Text>
//                         </View>

//                         {addon.addOnOriginalAmount > addon.addOnAmount && (
//                           <View style={styles.addOnRow}>
//                             <Text style={styles.addOnLabel}>Original Amount:</Text>
//                             <Text style={[styles.addOnValue, styles.originalAmount]}>
//                               ₹{addon.addOnOriginalAmount}
//                             </Text>
//                           </View>
//                         )}

//                         {addon.addOnDiscountAmount > 0 && (
//                           <View style={styles.addOnRow}>
//                             <Text style={styles.addOnLabel}>Discount:</Text>
//                             <Text style={[styles.addOnValue, styles.discountAmount]}>
//                               -₹{addon.addOnDiscountAmount}
//                             </Text>
//                           </View>
//                         )}

//                         {addon.addOnCouponCode && (
//                           <View style={styles.addOnRow}>
//                             <Text style={styles.addOnLabel}>Coupon:</Text>
//                             <View style={styles.couponBadge}>
//                               <Text style={styles.couponText}>{addon.addOnCouponCode}</Text>
//                             </View>
//                           </View>
//                         )}

//                         <View style={styles.addOnRow}>
//                           <Text style={styles.addOnLabel}>Additional Users:</Text>
//                           <Text style={styles.addOnValue}>+{addon.addOnMaxUser || 0} users</Text>
//                         </View>

//                         <View style={styles.addOnRow}>
//                           <Text style={styles.addOnLabel}>Expiry Date:</Text>
//                           <Text style={[
//                             styles.addOnValue,
//                             new Date(addon.addOnExpiry) < new Date() ? styles.expiredText : styles.activeText
//                           ]}>
//                             {formatDate(addon.addOnExpiry)}
//                             {new Date(addon.addOnExpiry) < new Date() && ' (Expired)'}
//                           </Text>
//                         </View>

//                         {addon.addOnPaymentId && (
//                           <View style={styles.addOnRow}>
//                             <Text style={styles.addOnLabel}>Payment ID:</Text>
//                             <Text style={styles.addOnValue} numberOfLines={1}>
//                               {addon.addOnPaymentId}
//                             </Text>
//                           </View>
//                         )}
//                       </View>
//                     </View>
//                   ))}
//                 </View>
//               )}
//             </View>
//           )}

//           {planExpired && (
//             <TouchableOpacity 
//               style={styles.renewButton}
//               onPress={() => navigation.navigate('RenewPlan')}
//             >
//               <Text style={styles.renewButtonText}>Renew Plan</Text>
//               <Icon name="refresh" size={18} color="#FFFFFF" />
//             </TouchableOpacity>
//           )}
//         </View>
//       )}

//       <ScrollView
//         style={styles.scrollView}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//       >
//         <View style={{ padding: 18 }}>
//           <Text style={styles.welcomeText}>Tracking Overview :</Text>

//           <View style={styles.statsContainer}>
//             <View style={styles.statCard}>
//               <View style={styles.cardHeader}>
//                 <View style={styles.iconWrapper}>
//                   <Icon name="people" size={24} color="#1976D2" />
//                 </View>
//                 <Text style={styles.cardTitle}>Active Users</Text>
//               </View>
//               <Text style={styles.statValue}>{userStats.activeUsers}</Text>
//               <View style={styles.cardAction}>
//                 <Text style={styles.actionText}>View Details</Text>
//                 <Icon name="arrow-forward" size={16} color="#1976D2" />
//               </View>
//             </View>

//             <View style={styles.statCard}>
//               <View style={styles.cardHeader}>
//                 <View style={styles.iconWrapper}>
//                   <Icon name="person-remove" size={24} color="#D32F2F" />
//                 </View>
//                 <Text style={styles.cardTitle}>Inactive Users</Text>
//               </View>
//               <Text style={styles.statValue}>{userStats.inactiveUsers}</Text>
//               <View style={styles.cardAction}>
//                 <Text style={styles.actionText}>View Details</Text>
//                 <Icon name="arrow-forward" size={16} color="#D32F2F" />
//               </View>
//             </View>

//             <View style={styles.statCard}>
//               <View style={styles.cardHeader}>
//                 <View style={styles.iconWrapper}>
//                   <Icon name="airplanemode-active" size={24} color="#388E3C" />
//                 </View>
//                 <Text style={styles.cardTitle}>Today's Checked In</Text>
//               </View>
//               <Text style={styles.statValue}>{userStats.todayCheckedIn}</Text>
//               <View style={styles.cardAction}>
//                 <Text style={styles.actionText}>Live Status</Text>
//                 <Icon name="fiber-manual-record" size={12} color="#388E3C" />
//               </View>
//             </View>

//             <View style={styles.statCard}>
//               <View style={styles.cardHeader}>
//                 <View style={styles.iconWrapper}>
//                   <Icon name="airplanemode-inactive" size={24} color="#F57C00" />
//                 </View>
//                 <Text style={styles.cardTitle}>Today's Checked Out</Text>
//               </View>
//               <Text style={styles.statValue}>{userStats.todayCheckedOut}</Text>
//               <View style={styles.cardAction}>
//                 <Text style={styles.actionText}>Completed</Text>
//                 <Icon name="check-circle" size={16} color="#F57C00" />
//               </View>
//             </View>

//             <TouchableOpacity
//               onPress={handleCardPress}
//               activeOpacity={0.7}
//               style={styles.statCard}
//             >
//               <View style={styles.cardHeader}>
//                 <View style={styles.iconWrapper}>
//                   <Icon name="card-membership" size={24} color="#F57C00" />
//                 </View>
//                 <Text style={styles.cardTitle}>Active Plans</Text>
//               </View>
//               <Text style={styles.statValue}>5</Text>
//               <View style={styles.cardAction}>
//                 <Text style={styles.actionText}>View Plans</Text>
//                 <Icon name="arrow-forward" size={16} color="#F57C00" />
//               </View>
//             </TouchableOpacity>
//           </View>

//           {/* Recent Activities */}
//           <View style={styles.activitiesContainer}>
//             <View style={styles.activitiesHeader}>
//               <View style={styles.activitiesTitleContainer}>
//                 <Icon name="notifications" size={25} color="#4A90E2" />
//                 <Text style={styles.sectionTitle}>Recent Activities</Text>
//               </View>
//               {recentActivities.length > 0 && (
//                 <Text style={styles.activitiesCount}>{recentActivities.length} activities</Text>
//               )}
//             </View>

//             {loadingActivities ? (
//               <View style={styles.loadingActivitiesContainer}>
//                 <ActivityIndicator size="small" color="#3088C7" />
//                 <Text style={styles.loadingActivitiesText}>Loading activities...</Text>
//               </View>
//             ) : recentActivities.length > 0 ? (
//               <View style={styles.activitiesList}>
//                 {recentActivities.map((activity, index) => (
//                   <TouchableOpacity
//                     key={index}
//                     style={styles.activityItem}
//                     onPress={() => handleUserPress(activity.userId, activity.name)}
//                     activeOpacity={0.7}
//                   >
//                     <View style={styles.activityIconContainer}>
//                       <View style={[styles.activityIcon, { backgroundColor: activity.status === 'active' ? '#E8F5E9' : '#FFF3E0' }]}>
//                         <Icon 
//                           name="person" 
//                           size={20} 
//                           color={activity.status === 'active' ? '#388E3C' : '#F57C00'} 
//                         />
//                       </View>
//                     </View>
                    
//                     <View style={styles.activityContent}>
//                       <View style={styles.activityHeader}>
//                         <Text style={styles.activityUserName} numberOfLines={1}>
//                           {activity.name || 'Unknown User'}
//                         </Text>
//                         <View style={[
//                           styles.activityStatusBadge,
//                           { backgroundColor: activity.status === 'active' ? '#E8F5E9' : '#FFF3E0' }
//                         ]}>
//                           <Icon 
//                             name={getStatusIcon(activity.status)} 
//                             size={12} 
//                             color={activity.status === 'active' ? '#388E3C' : '#F57C00'} 
//                           />
//                           <Text style={[
//                             styles.activityStatusText,
//                             { color: activity.status === 'active' ? '#388E3C' : '#F57C00' }
//                           ]}>
//                             {activity.status === 'active' ? 'Tracking' : 'Completed'}
//                           </Text>
//                         </View>
//                       </View>
                      
//                       <View style={styles.activityFooter}>
//                         <View style={styles.activityTime}>
//                           <Icon name="access-time" size={14} color="#999" />
//                           <Text style={styles.activityTimeText}>{formatTimeAgo()}</Text>
//                         </View>
//                         <Icon name="chevron-right" size={20} color="#999" />
//                       </View>
//                     </View>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             ) : (
//               <View style={styles.recentEmptyState}>
//                 <Icon name="info-outline" size={24} color="#999" />
//                 <Text style={styles.recentEmptyText}>No recent activity</Text>
//               </View>
//             )}
//           </View>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F0F4FA',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//   },
//   welcomeText: {
//     fontSize: 20,
//     fontFamily: 'Poppins-SemiBold',
//     color: '#333',
//     marginBottom: 18,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//     marginBottom: 18,
//   },
//   statCard: {
//     width: '48%',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#F0F0F0',
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   iconWrapper: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#F8F9FA',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//   },
//   cardTitle: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Medium',
//     color: '#2C3E50',
//     flex: 1,
//   },
//   statValue: {
//     fontSize: 28,
//     fontFamily: 'Poppins-Bold',
//     color: '#1A1A1A',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   cardAction: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingTop: 8,
//     borderTopWidth: 1,
//     borderTopColor: '#F0F0F0',
//     height: 30,
//     minHeight: 30
//   },
//   actionText: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Regular',
//     color: '#6C757D',
//     marginRight: 4,
//   },
//   activitiesContainer: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 10,
//     padding: 18,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 4,
//     elevation: 1,
//   },
//   activitiesHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   activitiesTitleContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontFamily: 'Poppins-Medium',
//     color: '#333',
//     marginLeft: 4,
//   },
//   activitiesCount: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Regular',
//     color: '#3088C7',
//     backgroundColor: '#E8F0FE',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   loadingActivitiesContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//     gap: 8,
//   },
//   loadingActivitiesText: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//   },
//   activitiesList: {
//     gap: 12,
//   },
//   activityItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F8F9FA',
//     borderRadius: 8,
//     padding: 12,
//     borderWidth: 1,
//     borderColor: '#F0F0F0',
//   },
//   activityIconContainer: {
//     marginRight: 12,
//   },
//   activityIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   activityContent: {
//     flex: 1,
//   },
//   activityHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   activityUserName: {
//     fontSize: 14,
//     fontFamily: 'Poppins-SemiBold',
//     color: '#2C3E50',
//     flex: 1,
//   },
//   activityStatusBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     gap: 4,
//     marginLeft: 8,
//   },
//   activityStatusText: {
//     fontSize: 10,
//     fontFamily: 'Poppins-Medium',
//   },
//   activityFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   activityTime: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   activityTimeText: {
//     fontSize: 11,
//     fontFamily: 'Poppins-Regular',
//     color: '#999',
//   },
//   recentEmptyState: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//   },
//   recentEmptyText: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: '#999',
//     marginTop: 8,
//   },
//   // Plan section styles
//   planContainer: {
//     backgroundColor: '#FFFFFF',
//     marginHorizontal: 18,
//     marginVertical: 12,
//     borderRadius: 12,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#E8F0FE',
//   },
//   planHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//     paddingBottom: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E8F0FE',
//   },
//   planTitle: {
//     fontSize: 16,
//     fontFamily: 'Poppins-SemiBold',
//     color: '#2C3E50',
//     marginLeft: 8,
//   },
//   planDetails: {
//     marginBottom: 12,
//   },
//   planRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   totalRow: {
//     marginTop: 4,
//     paddingTop: 8,
//     borderTopWidth: 1,
//     borderTopColor: '#E8F0FE',
//   },
//   planLabel: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Medium',
//     color: '#6C757D',
//     flex: 0.4,
//   },
//   planValue: {
//     fontSize: 14,
//     fontFamily: 'Poppins-SemiBold',
//     color: '#2C3E50',
//     flex: 0.6,
//     textAlign: 'right',
//   },
//   totalAmount: {
//     color: '#3088C7',
//     fontSize: 16,
//   },
//   statusBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 4,
//   },
//   statusText: {
//     fontSize: 14,
//     fontFamily: 'Poppins-SemiBold',
//   },
//   renewButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#3088C7',
//     paddingVertical: 10,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     marginTop: 12,
//   },
//   renewButtonText: {
//     fontSize: 14,
//     fontFamily: 'Poppins-SemiBold',
//     color: '#FFFFFF',
//     marginRight: 8,
//   },
//   // Add-ons section styles
//   addOnsSection: {
//     marginTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: '#E8F0FE',
//     paddingTop: 12,
//   },
//   addOnsHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingVertical: 8,
//   },
//   addOnsTitleContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   addOnsTitle: {
//     fontSize: 15,
//     fontFamily: 'Poppins-SemiBold',
//     color: '#2C3E50',
//     marginLeft: 8,
//   },
//   addOnsList: {
//     marginTop: 12,
//   },
//   addOnItem: {
//     backgroundColor: '#F8F9FA',
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 10,
//     borderWidth: 1,
//     borderColor: '#E8F0FE',
//   },
//   addOnHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 10,
//     paddingBottom: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E8F0FE',
//   },
//   addOnNumber: {
//     fontSize: 14,
//     fontFamily: 'Poppins-SemiBold',
//     color: '#3088C7',
//   },
//   addOnStatusBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 4,
//   },
//   addOnStatusText: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Medium',
//   },
//   addOnDetails: {
//     gap: 6,
//   },
//   addOnRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//   },
//   addOnLabel: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Medium',
//     color: '#6C757D',
//     flex: 0.35,
//   },
//   addOnValue: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Regular',
//     color: '#2C3E50',
//     flex: 0.65,
//     textAlign: 'right',
//   },
//   originalAmount: {
//     textDecorationLine: 'line-through',
//     color: '#999',
//   },
//   discountAmount: {
//     color: '#388E3C',
//   },
//   couponBadge: {
//     backgroundColor: '#E3F2FD',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//   },
//   couponText: {
//     fontSize: 11,
//     fontFamily: 'Poppins-Medium',
//     color: '#1976D2',
//   },
//   expiredText: {
//     color: '#D32F2F',
//   },
//   activeText: {
//     color: '#388E3C',
//   },
// });

// export default TeamTrackifyDashboard;







import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  BackHandler
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../../Component/CustomHeader';
import { getUserStats, getUserById, getLastFiveTrackedUsers } from '../../config/AdminService';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../config/auth-context';
import { isSubscriptionExpired, getSubscriptionMessage } from '../../utils/subscriptionUtils';

const TeamTrackifyDashboard = ({ navigation, route }) => {
  const { subscriptionStatus: authSubscriptionStatus, userRole } = useAuth();
  // Get subscription status from route params (passed from login)
  const routeSubscriptionStatus = route?.params?.subscriptionStatus;
  // Use route params first, then fall back to auth context
  const subscriptionStatus = routeSubscriptionStatus || authSubscriptionStatus;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddOns, setShowAddOns] = useState(false);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    todayCheckedIn: 0,
    todayCheckedOut: 0,
    uniqueCheckedInUsers: 0,
    uniqueCheckedOutUsers: 0,
    currentlyTracking: 0,
    uniqueCurrentlyTracking: 0,
    activePercentage: '0',
    inactivePercentage: '0',
    todayActivityRate: '0',
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [planExpired, setPlanExpired] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const scrollViewRef = useRef(null);
  const isScreenFocused = useIsFocused();

  // Check if subscription is expired
  const isSubscriptionExpiredFlag = subscriptionStatus?.isExpired === true;
  
  // Get subscription warning message
  const subscriptionMessage = getSubscriptionMessage(subscriptionStatus);

  useEffect(() => {
    fetchDashboardData();
    loadSubscriptionStatus();
  }, []);

  // Load subscription status from AsyncStorage
  const loadSubscriptionStatus = async () => {
    try {
      // First check if we have it from route params or auth context
      if (subscriptionStatus) {
        setPlanExpired(subscriptionStatus.isExpired === true);
        return;
      }
      
      // If not, try to load from AsyncStorage
      const storedStatus = await AsyncStorage.getItem('subscriptionStatus');
      if (storedStatus) {
        const parsedStatus = JSON.parse(storedStatus);
        console.log('Loaded subscription status from storage:', parsedStatus);
        // Update planExpired state based on stored subscription status
        setPlanExpired(parsedStatus.isExpired === true);
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  };

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
    return true;
  };

  const fetchRecentActivities = async (adminId) => {
    try {
      setLoadingActivities(true);
      const result = await getLastFiveTrackedUsers(adminId);
      
      if (result.success) {
        console.log('Recent Activities Data:', result.data);
        setRecentActivities(result.data || []);
      } else {
        console.log('Error fetching recent activities:', result.message);
        if (result.unauthorized) {
          Alert.alert('Session Expired', 'Please login again');
          navigation.navigate('Login');
        }
      }
    } catch (error) {
      console.error('Error in fetchRecentActivities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const userId = await AsyncStorage.getItem('userId');
      const userRole = await AsyncStorage.getItem('userRole');

      if (!userId) {
        Alert.alert('Error', 'User ID not found');
        setLoading(false);
        return;
      }

      if (userRole && userRole.toLowerCase() !== 'admin') {
        Alert.alert('Error', 'Unauthorized access');
        setLoading(false);
        return;
      }

      console.log('Fetching data for user:', userId);

      const [userResult, statsResult] = await Promise.all([
        getUserById(userId),
        getUserStats(userId)
      ]);

      // LOG THE FULL USER RESPONSE TO SEE EXACT STRUCTURE
    // console.log('========== COMPLETE USER RESPONSE ==========');
    // console.log('User Result:', JSON.stringify(userResult, null, 2));

    
      if (userResult.success) {
        console.log('User Data:', userResult.data);
        console.log('Plan Expired:', userResult.planExpired);
        setCurrentUser(userResult.data);
        setPlanExpired(userResult.planExpired);
      } else {
        console.log('Error fetching user details:', userResult.message);
      }

      if (statsResult.success && statsResult.data) {
        console.log('User Stats Data:', statsResult.data);

        const countData = statsResult.data.count || {};
        setUserStats({
          totalUsers: (countData.allActiveUsers || 0) + (countData.allInactiveUsers || 0),
          activeUsers: countData.activeUsers || countData.allActiveUsers || 0,
          inactiveUsers: countData.inactiveUsers || countData.allInactiveUsers || 0,
          todayCheckedIn: countData.todayCheckedIn || 0,
          todayCheckedOut: countData.todayCheckedOut || 0,
          uniqueCheckedInUsers: countData.todayCheckedIn || 0,
          uniqueCheckedOutUsers: countData.todayCheckedOut || 0,
          currentlyTracking: countData.currentlyTracking || 0,
          uniqueCurrentlyTracking: countData.currentlyTracking || 0,
          activePercentage: countData.allActiveUsers && (countData.allActiveUsers + countData.allInactiveUsers) > 0
            ? ((countData.allActiveUsers / (countData.allActiveUsers + countData.allInactiveUsers)) * 100).toFixed(1)
            : '0',
          inactivePercentage: countData.allInactiveUsers && (countData.allActiveUsers + countData.allInactiveUsers) > 0
            ? ((countData.allInactiveUsers / (countData.allActiveUsers + countData.allInactiveUsers)) * 100).toFixed(1)
            : '0',
          todayActivityRate: countData.todayCheckedIn && (countData.allActiveUsers + countData.allInactiveUsers) > 0
            ? ((countData.todayCheckedIn / (countData.allActiveUsers + countData.allInactiveUsers)) * 100).toFixed(1)
            : '0',
        });
      } else {
        Alert.alert('Error', statsResult.message || 'Failed to fetch user stats');
        console.log('Error fetching user stats admin dashboard:', statsResult.message);
      }

      await fetchRecentActivities(userId);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Something went wrong while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleCardPress = () => {
    navigation.navigate('ManagePlans');
  };

  const handleUserPress = (userId, userName) => {
    navigation.navigate('UserTrackingSummary', { userId, userName });
  };

  const handlePlanToggle = () => {
    setShowPlanDetails(!showPlanDetails);
    // Small delay to ensure state is updated before scrolling
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    }, 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    return status === 'completed' ? '#388E3C' : '#F57C00';
  };

  const getStatusText = (status) => {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
  };

  const getStatusIcon = (status) => {
    return status === 'active' ? 'fiber-manual-record' : 'check-circle';
  };

  const formatTimeAgo = () => {
    return 'Just now';
  };

  // Calculate total add-on amount
  const calculateTotalAddOnAmount = () => {
    if (!currentUser?.currentPaymentId?.addOns) return 0;
    return currentUser.currentPaymentId.addOns.reduce((total, addon) => {
      return total + (addon.addOnAmount || 0);
    }, 0);
  };

  // Calculate total users from add-ons
  const calculateTotalUsers = () => {
    if (!currentUser?.currentPaymentId?.addOns) return 0;
    return currentUser.currentPaymentId.addOns.reduce((total, addon) => {
      return total + (addon.addOnMaxUser || 0);
    }, 0);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Team Trackify" showLogo={true} textAlign="center" titleStyle={{ fontSize: 24 }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3088C7" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <CustomHeader
        title="Team Trackify"
        showLogo={true}
        textAlign="center"
        titleStyle={{ fontSize: 24 }}
      />

      {/* Subscription Expired Warning Banner */}
      {isSubscriptionExpiredFlag && (
        <View style={styles.expiredBanner}>
          <Icon name="warning" size={24} color="#FFFFFF" />
          <View style={styles.expiredBannerTextContainer}>
            <Text style={styles.expiredBannerTitle}>Subscription Expired</Text>
            <Text style={styles.expiredBannerText}>
              {subscriptionMessage || 'Your plan has expired. Please renew to continue.'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.renewButton}
            onPress={() => navigation.navigate('ManagePlans')}
          >
            <Text style={styles.renewButtonText}>Renew Plan</Text>
            <Icon name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Plan Details Section */}
        {currentUser && (
          <View style={styles.planContainer}>
            <TouchableOpacity
              style={styles.planHeader}
              onPress={handlePlanToggle}
              activeOpacity={0.7}
            >
              <View style={styles.planTitleContainer}>
                <Icon name="card-membership" size={20} color="#3088C7" />
                <Text style={styles.planTitle}>Current Plan Details</Text>
              </View>
              <Icon 
                name={showPlanDetails ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
                size={24} 
                color="#666" 
              />
            </TouchableOpacity>
            
            {/* Always visible - Basic Plan Info */}
            <View style={styles.basicPlanInfo}>
              <View style={styles.planRow}>
                <Text style={styles.planLabel}>Plan:</Text>
                <Text style={styles.planValue} numberOfLines={1}>
                  {currentUser.currentPaymentId?.description || 'Basic Plan'}
                </Text>
              </View>
              
              <View style={styles.planRow}>
                <Text style={styles.planLabel}>Amount:</Text>
                <Text style={styles.planValue}>
                  ₹{currentUser.currentPaymentId?.amount || 0}
                </Text>
              </View>
              
              <View style={styles.planRow}>
                <Text style={styles.planLabel}>Expiry Date:</Text>
                <Text style={[
                  styles.planValue,
                  planExpired ? styles.expiredText : styles.activeText
                ]}>
                  {formatDate(currentUser.currentPaymentId?.expiresAt) || 'N/A'}
                  {planExpired && ' (Expired)'}
                </Text>
              </View>
            </View>

            {/* Hidden details - shown only when toggled */}
            {showPlanDetails && (
              <View style={styles.hiddenDetails}>
                <View style={styles.divider} />
                
                <View style={styles.planDetails}>
                  <View style={styles.planRow}>
                    <Text style={styles.planLabel}>Status:</Text>
                    <View style={styles.statusBadge}>
                      <Text style={[
                        styles.statusText,
                        { color: planExpired ? '#D32F2F' : '#388E3C' }
                      ]}>
                        {planExpired ? 'Expired' : 'Active'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.planRow}>
                    <Text style={styles.planLabel}>Start Date:</Text>
                    <Text style={styles.planValue}>
                      {formatDate(currentUser.currentPaymentId?.createdAt) || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.planRow}>
                    <Text style={styles.planLabel}>Base Users:</Text>
                    <Text style={styles.planValue}>
                      {currentUser.currentPaymentId?.maxUser || 0}
                    </Text>
                  </View>

                  {currentUser.currentPaymentId?.paymentMethod && (
                    <View style={styles.planRow}>
                      <Text style={styles.planLabel}>Payment Method:</Text>
                      <Text style={styles.planValue}>
                        {currentUser.currentPaymentId.paymentMethod}
                      </Text>
                    </View>
                  )}

                  {currentUser.currentPaymentId?.paymentStatus && (
                    <View style={styles.planRow}>
                      <Text style={styles.planLabel}>Payment Status:</Text>
                      <Text style={[
                        styles.planValue,
                        { color: getStatusColor(currentUser.currentPaymentId.paymentStatus) }
                      ]}>
                        {getStatusText(currentUser.currentPaymentId.paymentStatus)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Add-ons Toggle Section */}
                {currentUser.currentPaymentId?.addOns && currentUser.currentPaymentId.addOns.length > 0 && (
                  <View style={styles.addOnsSection}>
                    <TouchableOpacity
                      style={styles.addOnsHeader}
                      onPress={() => setShowAddOns(!showAddOns)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.addOnsTitleContainer}>
                        <Icon name="add-shopping-cart" size={18} color="#3088C7" />
                        <Text style={styles.addOnsTitle}>
                          Add-on Plans ({currentUser.currentPaymentId.addOns.length})
                        </Text>
                      </View>
                      <Icon 
                        name={showAddOns ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
                        size={20} 
                        color="#666" 
                      />
                    </TouchableOpacity>

                    {showAddOns && (
                      <View style={styles.addOnsList}>
                        {currentUser.currentPaymentId.addOns.map((addon, index) => (
                          <View key={addon._id || index} style={styles.addOnItem}>
                            <View style={styles.addOnHeader}>
                              <Text style={styles.addOnNumber}>Add-on #{index + 1}</Text>
                              <View style={[
                                styles.addOnStatusBadge,
                                { backgroundColor: addon.status === 'completed' ? '#E8F5E9' : '#FFF3E0' }
                              ]}>
                                <Text style={[
                                  styles.addOnStatusText,
                                  { color: addon.status === 'completed' ? '#388E3C' : '#F57C00' }
                                ]}>
                                  {getStatusText(addon.status)}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.addOnDetails}>
                              <View style={styles.addOnRow}>
                                <Text style={styles.addOnLabel}>Description:</Text>
                                <Text style={styles.addOnValue} numberOfLines={2}>
                                  {addon.addOnDescription || 'Add-on Plan'}
                                </Text>
                              </View>

                              <View style={styles.addOnRow}>
                                <Text style={styles.addOnLabel}>Amount:</Text>
                                <Text style={styles.addOnValue}>₹{addon.addOnAmount || 0}</Text>
                              </View>

                              {addon.addOnOriginalAmount > addon.addOnAmount && (
                                <View style={styles.addOnRow}>
                                  <Text style={styles.addOnLabel}>Original Amount:</Text>
                                  <Text style={[styles.addOnValue, styles.originalAmount]}>
                                    ₹{addon.addOnOriginalAmount}
                                  </Text>
                                </View>
                              )}

                              {addon.addOnDiscountAmount > 0 && (
                                <View style={styles.addOnRow}>
                                  <Text style={styles.addOnLabel}>Discount:</Text>
                                  <Text style={[styles.addOnValue, styles.discountAmount]}>
                                    -₹{addon.addOnDiscountAmount}
                                  </Text>
                                </View>
                              )}

                              {addon.addOnCouponCode && (
                                <View style={styles.addOnRow}>
                                  <Text style={styles.addOnLabel}>Coupon:</Text>
                                  <View style={styles.couponBadge}>
                                    <Text style={styles.couponText}>{addon.addOnCouponCode}</Text>
                                  </View>
                                </View>
                              )}

                              <View style={styles.addOnRow}>
                                <Text style={styles.addOnLabel}>Additional Users:</Text>
                                <Text style={styles.addOnValue}>+{addon.addOnMaxUser || 0} users</Text>
                              </View>

                              <View style={styles.addOnRow}>
                                <Text style={styles.addOnLabel}>Expiry Date:</Text>
                                <Text style={[
                                  styles.addOnValue,
                                  new Date(addon.addOnExpiry) < new Date() ? styles.expiredText : styles.activeText
                                ]}>
                                  {formatDate(addon.addOnExpiry)}
                                  {new Date(addon.addOnExpiry) < new Date() && ' (Expired)'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {planExpired && (
                  <TouchableOpacity 
                    style={styles.renewButton}
                    onPress={() => navigation.navigate('RenewPlan')}
                  >
                    <Text style={styles.renewButtonText}>Renew Plan</Text>
                    <Icon name="refresh" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        <View style={{ padding: 18 }}>
          <Text style={styles.welcomeText}>Tracking Overview :</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrapper}>
                  <Icon name="people" size={24} color="#1976D2" />
                </View>
                <Text style={styles.cardTitle}>Active Users</Text>
              </View>
              <Text style={styles.statValue}>{userStats.activeUsers}</Text>
              <View style={styles.cardAction}>
                <Text style={styles.actionText}>View Details</Text>
                <Icon name="arrow-forward" size={16} color="#1976D2" />
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrapper}>
                  <Icon name="person-remove" size={24} color="#D32F2F" />
                </View>
                <Text style={styles.cardTitle}>Inactive Users</Text>
              </View>
              <Text style={styles.statValue}>{userStats.inactiveUsers}</Text>
              <View style={styles.cardAction}>
                <Text style={styles.actionText}>View Details</Text>
                <Icon name="arrow-forward" size={16} color="#D32F2F" />
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrapper}>
                  <Icon name="airplanemode-active" size={24} color="#388E3C" />
                </View>
                <Text style={styles.cardTitle}>Today's Checked In</Text>
              </View>
              <Text style={styles.statValue}>{userStats.todayCheckedIn}</Text>
              <View style={styles.cardAction}>
                <Text style={styles.actionText}>Live Status</Text>
                <Icon name="fiber-manual-record" size={12} color="#388E3C" />
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrapper}>
                  <Icon name="airplanemode-inactive" size={24} color="#F57C00" />
                </View>
                <Text style={styles.cardTitle}>Today's Checked Out</Text>
              </View>
              <Text style={styles.statValue}>{userStats.todayCheckedOut}</Text>
              <View style={styles.cardAction}>
                <Text style={styles.actionText}>Completed</Text>
                <Icon name="check-circle" size={16} color="#F57C00" />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleCardPress}
              activeOpacity={0.7}
              style={styles.statCard}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconWrapper}>
                  <Icon name="card-membership" size={24} color="#F57C00" />
                </View>
                <Text style={styles.cardTitle}>Active Plans</Text>
              </View>
              <Text style={styles.statValue}>5</Text>
              <View style={styles.cardAction}>
                <Text style={styles.actionText}>View Plans</Text>
                <Icon name="arrow-forward" size={16} color="#F57C00" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Recent Activities */}
          <View style={styles.activitiesContainer}>
            <View style={styles.activitiesHeader}>
              <View style={styles.activitiesTitleContainer}>
                <Icon name="notifications" size={25} color="#4A90E2" />
                <Text style={styles.sectionTitle}>Recent Activities</Text>
              </View>
              {recentActivities.length > 0 && (
                <Text style={styles.activitiesCount}>{recentActivities.length} activities</Text>
              )}
            </View>

            {loadingActivities ? (
              <View style={styles.loadingActivitiesContainer}>
                <ActivityIndicator size="small" color="#3088C7" />
                <Text style={styles.loadingActivitiesText}>Loading activities...</Text>
              </View>
            ) : recentActivities.length > 0 ? (
              <View style={styles.activitiesList}>
                {recentActivities.map((activity, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.activityItem}
                    onPress={() => handleUserPress(activity.userId, activity.name)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.activityIconContainer}>
                      <View style={[styles.activityIcon, { backgroundColor: activity.status === 'active' ? '#E8F5E9' : '#FFF3E0' }]}>
                        <Icon 
                          name="person" 
                          size={20} 
                          color={activity.status === 'active' ? '#388E3C' : '#F57C00'} 
                        />
                      </View>
                    </View>
                    
                    <View style={styles.activityContent}>
                      <View style={styles.activityHeader}>
                        <Text style={styles.activityUserName} numberOfLines={1}>
                          {activity.name || 'Unknown User'}
                        </Text>
                        <View style={[
                          styles.activityStatusBadge,
                          { backgroundColor: activity.status === 'active' ? '#E8F5E9' : '#FFF3E0' }
                        ]}>
                          <Icon 
                            name={getStatusIcon(activity.status)} 
                            size={12} 
                            color={activity.status === 'active' ? '#388E3C' : '#F57C00'} 
                          />
                          <Text style={[
                            styles.activityStatusText,
                            { color: activity.status === 'active' ? '#388E3C' : '#F57C00' }
                          ]}>
                            {activity.status === 'active' ? 'Tracking' : 'Completed'}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.activityFooter}>
                        <View style={styles.activityTime}>
                          <Icon name="access-time" size={14} color="#999" />
                          <Text style={styles.activityTimeText}>{formatTimeAgo()}</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#999" />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.recentEmptyState}>
                <Icon name="info-outline" size={24} color="#999" />
                <Text style={styles.recentEmptyText}>No recent activity</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Subscription Expired Banner Styles
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC3545',
    padding: 15,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 10,
  },
  expiredBannerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  expiredBannerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expiredBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 2,
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  renewButtonText: {
    color: '#DC3545',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  welcomeText: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginBottom: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#2C3E50',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    height: 30,
    minHeight: 30
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6C757D',
    marginRight: 4,
  },
  activitiesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  activitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activitiesTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#333',
    marginLeft: 4,
  },
  activitiesCount: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#3088C7',
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadingActivitiesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  loadingActivitiesText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  activitiesList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  activityIconContainer: {
    marginRight: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityUserName: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#2C3E50',
    flex: 1,
  },
  activityStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginLeft: 8,
  },
  activityStatusText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityTimeText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#999',
  },
  recentEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  recentEmptyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    marginTop: 8,
  },
  // Plan section styles
  planContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 18,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8F0FE',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0FE',
  },
  planTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#2C3E50',
    marginLeft: 8,
  },
  basicPlanInfo: {
    marginBottom: 4,
  },
  hiddenDetails: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8F0FE',
    marginVertical: 12,
  },
  planDetails: {
    marginBottom: 12,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#6C757D',
    flex: 0.4,
  },
  planValue: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#2C3E50',
    flex: 0.6,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3088C7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  renewButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  // Add-ons section styles
  addOnsSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8F0FE',
    paddingTop: 12,
  },
  addOnsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  addOnsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addOnsTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#2C3E50',
    marginLeft: 8,
  },
  addOnsList: {
    marginTop: 12,
  },
  addOnItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8F0FE',
  },
  addOnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0FE',
  },
  addOnNumber: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#3088C7',
  },
  addOnStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addOnStatusText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  addOnDetails: {
    gap: 6,
  },
  addOnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addOnLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#6C757D',
    flex: 0.35,
  },
  addOnValue: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#2C3E50',
    flex: 0.65,
    textAlign: 'right',
  },
  originalAmount: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  discountAmount: {
    color: '#388E3C',
  },
  couponBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  couponText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: '#1976D2',
  },
  expiredText: {
    color: '#D32F2F',
  },
  activeText: {
    color: '#388E3C',
  },
});

export default TeamTrackifyDashboard;