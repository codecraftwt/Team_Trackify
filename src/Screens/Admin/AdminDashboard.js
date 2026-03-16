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
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import CustomHeader from '../../Component/CustomHeader';
// import { getUserStats } from '../../config/AdminService';

// // Static data for team tracking dashboard (keep for plan info)
// const STATIC_DATA = {
//   currentPlan: {
//     amount: '₹2000',
//     users: '2-14',
//     type: 'Standard Plan',
//     expires: '19 March 2026',
//     duration: 'monthly',
//     description: 'Standard Plan for 1 month create upto 10 users'
//   },
//   activePlans: 5,
//   liveTrackingUsers: 0,
//   recentActivities: []
// };

// const TeamTrackifyDashboard = ({ navigation }) => {
//   const [loading, setLoading] = useState(true);
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

//   useEffect(() => {
//     fetchUserStats();
//   }, []);

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
//       }
//     } catch (error) {
//       console.error('Error fetching user stats:', error);
//       Alert.alert('Error', 'Something went wrong while fetching data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRefresh = () => {
//     fetchUserStats();
//   };

//   const renderStatCard = (title, value, showDetails = true, onPress = null) => (
//     <View style={styles.statCard}>
//       <View style={styles.statHeader}>
//         <Text style={styles.statTitle}>{title}</Text>
//         {showDetails && (
//           <TouchableOpacity onPress={onPress}>
//             <Text style={styles.viewDetailsText}>View Details →</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//       <Text style={styles.statValue}>{value}</Text>
//     </View>
//   );

//   const renderMetricCard = (label, value, status, icon, subtitle = null) => (
//     <View style={styles.metricCard}>
//       <View style={styles.metricHeader}>
//         <Text style={styles.metricLabel}>{label}</Text>
//         <View style={styles.metricStatus}>
//           {icon === 'live' && <View style={styles.liveDot} />}
//           {icon === 'completed' && <Icon name="check-circle" size={16} color="#4CAF50" />}
//           <Text style={[
//             styles.metricStatusText,
//             icon === 'live' && styles.liveText,
//             icon === 'completed' && styles.completedText
//           ]}>
//             {status}
//           </Text>
//         </View>
//       </View>
//       <Text style={styles.metricValue}>{value}</Text>
//       {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
//     </View>
//   );

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <CustomHeader title="Team Trackify" />
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
    
//       <CustomHeader title="Team Trackify" />

//       <ScrollView 
//         style={styles.scrollView}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
//             <Icon name="refresh" size={24} color="#3088C7" />
//           </TouchableOpacity>
//         }
//       >
//         {/* Current Plan Section */}
//         <View style={styles.planSection}>
//           <View style={styles.planHeader}>
//             <Text style={styles.sectionTitle}>Current Plan</Text>
//             <TouchableOpacity>
//               <Text style={styles.changePlanText}>Change</Text>
//             </TouchableOpacity>
//           </View>
          
//           <View style={styles.planCard}>
//             <View style={styles.planRow}>
//               <Text style={styles.planLabel}>Amount:</Text>
//               <Text style={styles.planValue}>{STATIC_DATA.currentPlan.amount}</Text>
//             </View>
//             <View style={styles.planRow}>
//               <Text style={styles.planLabel}>Users:</Text>
//               <Text style={styles.planValue}>{STATIC_DATA.currentPlan.users} (Total: {userStats.totalUsers})</Text>
//             </View>
            
//             <View style={styles.planTypeContainer}>
//               <Text style={styles.planType}>{STATIC_DATA.currentPlan.type}</Text>
//             </View>
            
//             <View style={styles.planExpiryRow}>
//               <Icon name="access-time" size={16} color="#666" />
//               <Text style={styles.planExpiryText}>
//                 Expires: {STATIC_DATA.currentPlan.expires}
//               </Text>
//               <Text style={styles.planDuration}> • {STATIC_DATA.currentPlan.duration}</Text>
//             </View>
            
//             <Text style={styles.planDescription}>
//               {STATIC_DATA.currentPlan.description}
//             </Text>
//           </View>
//         </View>

//         {/* Tracking Overview Section */}
//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Tracking Overview:</Text>
//             <TouchableOpacity onPress={handleRefresh}>
//               <Icon name="refresh" size={20} color="#3088C7" />
//             </TouchableOpacity>
//           </View>
          
//           <View style={styles.statsRow}>
//             <View style={styles.statsLeft}>
//               {renderStatCard('Active Users', userStats.activeUsers, true, () => navigation.navigate('ActiveUsers'))}
//               {renderStatCard('Inactive Users', userStats.inactiveUsers, true, () => navigation.navigate('InactiveUsers'))}
//             </View>
            
//             <View style={styles.statsRight}>
//               <View style={styles.checkedCard}>
//                 <Text style={styles.checkedTitle}>Today's Checked In</Text>
//                 <Text style={styles.checkedValue}>{userStats.todayCheckedIn}</Text>
//                 <Text style={styles.checkedSubtitle}>
//                   Unique: {userStats.uniqueCheckedInUsers} users
//                 </Text>
//               </View>
//               <View style={styles.checkedCard}>
//                 <Text style={styles.checkedTitle}>Today's Checked Out</Text>
//                 <Text style={styles.checkedValue}>{userStats.todayCheckedOut}</Text>
//                 <Text style={styles.checkedSubtitle}>
//                   Unique: {userStats.uniqueCheckedOutUsers} users
//                 </Text>
//               </View>
//             </View>
//           </View>

//           {/* Activity Summary */}
//           <View style={styles.activitySummary}>
//             <View style={styles.summaryItem}>
//               <Text style={styles.summaryLabel}>Active %</Text>
//               <Text style={styles.summaryValue}>{userStats.activePercentage}%</Text>
//             </View>
//             <View style={styles.summaryItem}>
//               <Text style={styles.summaryLabel}>Inactive %</Text>
//               <Text style={styles.summaryValue}>{userStats.inactivePercentage}%</Text>
//             </View>
//             <View style={styles.summaryItem}>
//               <Text style={styles.summaryLabel}>Activity Rate</Text>
//               <Text style={styles.summaryValue}>{userStats.todayActivityRate}%</Text>
//             </View>
//           </View>
//         </View>

//         {/* Additional Metrics Section */}
//         <View style={styles.metricsSection}>
//           <View style={styles.metricsRow}>
//             {renderMetricCard(
//               'Today\'s Checked In',
//               userStats.todayCheckedIn,
//               userStats.uniqueCheckedInUsers > 0 ? 'Live Status ●' : 'No Activity',
//               userStats.uniqueCheckedInUsers > 0 ? 'live' : 'completed',
//               `${userStats.uniqueCheckedInUsers} unique users`
//             )}
//             {renderMetricCard(
//               'Today\'s Checked Out',
//               userStats.todayCheckedOut,
//               userStats.uniqueCheckedOutUsers > 0 ? 'Completed ✔' : 'No Activity',
//               userStats.uniqueCheckedOutUsers > 0 ? 'completed' : 'completed',
//               `${userStats.uniqueCheckedOutUsers} unique users`
//             )}
//           </View>

//           <View style={styles.actionCardsRow}>
//             <TouchableOpacity 
//               style={styles.actionCard}
//               onPress={() => navigation.navigate('ActivePlans')}
//             >
//               <Text style={styles.actionCardTitle}>Active Plans</Text>
//               <Text style={styles.actionCardValue}>{STATIC_DATA.activePlans}</Text>
//               <Text style={styles.actionCardLink}>Manage Plans →</Text>
//             </TouchableOpacity>

//             <TouchableOpacity 
//               style={styles.actionCard}
//               onPress={() => navigation.navigate('LiveTracking')}
//             >
//               <Text style={styles.actionCardTitle}>Live Tracking Users</Text>
//               <Text style={styles.actionCardValue}>{userStats.currentlyTracking}</Text>
//               <Text style={styles.actionCardSubtext}>
//                 Unique: {userStats.uniqueCurrentlyTracking}
//               </Text>
//               <Text style={styles.actionCardLink}>View on Map ▷</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Recent Activities */}
//         <View style={styles.section}>
//           <View style={styles.recentHeader}>
//             <Text style={styles.sectionTitle}>Recent Activities</Text>
//           </View>
//           <View style={styles.recentEmptyState}>
//             <Icon name="info-outline" size={24} color="#999" />
//             <Text style={styles.recentEmptyText}>No recent activity</Text>
//           </View>
//         </View>

//         {/* Last Updated Info */}
//         {userStats.lastUpdated && (
//           <View style={styles.lastUpdated}>
//             <Icon name="access-time" size={14} color="#999" />
//             <Text style={styles.lastUpdatedText}>
//               Last updated: {new Date(userStats.lastUpdated).toLocaleString()}
//             </Text>
//           </View>
//         )}

//         {/* Bottom Navigation */}
//         <View style={styles.bottomNav}>
//           <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TeamTrackifyDashboard')}>
//             <Icon name="home" size={24} color="#3088C7" />
//             <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Users')}>
//             <Icon name="people" size={24} color="#999" />
//             <Text style={styles.navText}>Users</Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Reports')}>
//             <Icon name="assessment" size={24} color="#999" />
//             <Text style={styles.navText}>Reports</Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
//             <Icon name="person" size={24} color="#999" />
//             <Text style={styles.navText}>Profile</Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F5F5F5',
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
//   refreshButton: {
//     padding: 10,
//     alignItems: 'center',
//   },
//   section: {
//     padding: 20,
//     paddingBottom: 10,
//   },
//   planSection: {
//     padding: 20,
//     backgroundColor: '#FFFFFF',
//     marginBottom: 10,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontFamily: 'Poppins-Bold',
//     color: '#333',
//     marginBottom: 12,
//   },
//   planHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   changePlanText: {
//     color: '#3088C7',
//     fontSize: 14,
//     fontFamily: 'Poppins-Medium',
//   },
//   planCard: {
//     backgroundColor: '#F8F8F8',
//     borderRadius: 12,
//     padding: 16,
//   },
//   planRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   planLabel: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//   },
//   planValue: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Medium',
//     color: '#333',
//   },
//   planTypeContainer: {
//     backgroundColor: '#E8F0FE',
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 4,
//     alignSelf: 'flex-start',
//     marginVertical: 8,
//   },
//   planType: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Medium',
//     color: '#3088C7',
//   },
//   planExpiryRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   planExpiryText: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//     marginLeft: 4,
//   },
//   planDuration: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//   },
//   planDescription: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Regular',
//     color: '#888',
//     fontStyle: 'italic',
//     marginTop: 4,
//   },
//   statsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   statsLeft: {
//     flex: 1,
//     marginRight: 10,
//   },
//   statsRight: {
//     flex: 1,
//     marginLeft: 10,
//   },
//   statCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 10,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   statHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   statTitle: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//   },
//   viewDetailsText: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Medium',
//     color: '#3088C7',
//   },
//   statValue: {
//     fontSize: 32,
//     fontFamily: 'Poppins-Bold',
//     color: '#333',
//   },
//   checkedCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 10,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   checkedTitle: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//     marginBottom: 8,
//   },
//   checkedValue: {
//     fontSize: 32,
//     fontFamily: 'Poppins-Bold',
//     color: '#333',
//   },
//   checkedSubtitle: {
//     fontSize: 11,
//     fontFamily: 'Poppins-Regular',
//     color: '#999',
//     marginTop: 4,
//   },
//   activitySummary: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 15,
//     marginTop: 10,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   summaryItem: {
//     alignItems: 'center',
//   },
//   summaryLabel: {
//     fontSize: 11,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//     marginBottom: 4,
//   },
//   summaryValue: {
//     fontSize: 16,
//     fontFamily: 'Poppins-Bold',
//     color: '#3088C7',
//   },
//   metricsSection: {
//     padding: 20,
//     backgroundColor: '#FFFFFF',
//     marginVertical: 10,
//   },
//   metricsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 15,
//   },
//   metricCard: {
//     flex: 1,
//     backgroundColor: '#F8F8F8',
//     borderRadius: 12,
//     padding: 16,
//     marginHorizontal: 5,
//   },
//   metricHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   metricLabel: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//   },
//   metricStatus: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   liveDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#4CAF50',
//     marginRight: 4,
//   },
//   metricStatusText: {
//     fontSize: 10,
//     fontFamily: 'Poppins-Medium',
//   },
//   liveText: {
//     color: '#4CAF50',
//   },
//   completedText: {
//     color: '#4CAF50',
//   },
//   metricValue: {
//     fontSize: 28,
//     fontFamily: 'Poppins-Bold',
//     color: '#333',
//   },
//   metricSubtitle: {
//     fontSize: 10,
//     fontFamily: 'Poppins-Regular',
//     color: '#999',
//     marginTop: 2,
//   },
//   actionCardsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   actionCard: {
//     flex: 1,
//     backgroundColor: '#F8F8F8',
//     borderRadius: 12,
//     padding: 16,
//     marginHorizontal: 5,
//   },
//   actionCardTitle: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//     marginBottom: 8,
//   },
//   actionCardValue: {
//     fontSize: 28,
//     fontFamily: 'Poppins-Bold',
//     color: '#333',
//     marginBottom: 4,
//   },
//   actionCardSubtext: {
//     fontSize: 10,
//     fontFamily: 'Poppins-Regular',
//     color: '#999',
//     marginBottom: 8,
//   },
//   actionCardLink: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Medium',
//     color: '#3088C7',
//   },
//   recentHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   recentEmptyState: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   recentEmptyText: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: '#999',
//     marginTop: 8,
//   },
//   lastUpdated: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 10,
//     backgroundColor: '#FFFFFF',
//     marginHorizontal: 20,
//     marginBottom: 10,
//     borderRadius: 8,
//   },
//   lastUpdatedText: {
//     fontSize: 11,
//     fontFamily: 'Poppins-Regular',
//     color: '#999',
//     marginLeft: 4,
//   },
//   bottomNav: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderTopWidth: 1,
//     borderTopColor: '#E0E0E0',
//     marginTop: 10,
//   },
//   navItem: {
//     alignItems: 'center',
//   },
//   navText: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Regular',
//     color: '#999',
//     marginTop: 2,
//   },
//   navTextActive: {
//     color: '#3088C7',
//     fontFamily: 'Poppins-Medium',
//   },
// });

// export default TeamTrackifyDashboard;
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../../Component/CustomHeader';
import { getUserStats } from '../../config/AdminService';
import { LinearGradient } from 'react-native-linear-gradient';
import moment from 'moment';

// Static data for team tracking dashboard (keep for plan info)
const STATIC_DATA = {
  currentPlan: {
    amount: '₹2000',
    users: '2-14',
    type: 'Standard Plan',
    expires: '19 March 2026',
    duration: 'monthly',
    description: 'Standard Plan for 1 month create upto 10 users'
  },
  activePlans: 5,
  liveTrackingUsers: 0,
  recentActivities: []
};

const formatDate = date => moment(date).format('D MMMM YYYY');

// Add-On Card Component
const AddOnCard = ({ addOn, planName }) => (
  <View style={styles.addOnCard}>
    <View style={styles.addOnRow}>
      <Icon
        name="playlist-add"
        size={18}
        color="#4A90E2"
        style={styles.addOnIcon}
      />
      <Text style={styles.addOnPlanName}>{planName || addOn.addOnPlanId}</Text>
    </View>
    <View style={styles.addOnRow}>
      <Icon
        name="attach-money"
        size={16}
        color="#43A047"
        style={styles.addOnIcon}
      />
      <Text style={styles.addOnText}>₹{addOn.addOnAmount}</Text>
    </View>
    <View style={styles.addOnRow}>
      <Icon name="group" size={16} color="#1976D2" style={styles.addOnIcon} />
      <Text style={styles.addOnText}>+{addOn.addOnMaxUser} users</Text>
    </View>
    <View style={styles.addOnRow}>
      <Icon
        name="event-available"
        size={16}
        color="#D84315"
        style={styles.addOnIcon}
      />
      <Text style={styles.addOnText}>{formatDate(addOn.addOnExpiry)}</Text>
    </View>
    <View style={styles.addOnRow}>
      <Icon name="info" size={16} color="#F9A825" style={styles.addOnIcon} />
      <Text style={styles.addOnDesc}>{addOn.addOnDescription}</Text>
    </View>
  </View>
);

// Plan Card Component
const PlanCard = ({
  planDetails,
  paymentDetails,
  isExpanded,
  onToggleExpand,
  addOnPlanNames,
}) => (
  <LinearGradient
    colors={['#e0eafc', '#cfdef3']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.planCardGradient}>
    <View style={styles.planCardRow}>
      <View style={styles.planAccentBar} />
      <View style={styles.planCardContent}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onToggleExpand}
          style={styles.expandIconContainer}>
          <Icon
            name={isExpanded ? 'expand-less' : 'expand-more'}
            size={32}
            color="#2A73FF"
          />
        </TouchableOpacity>

        <View style={styles.planCardHeaderRow}>
          <Icon
            name="verified-user"
            size={28}
            color="#2A73FF"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.planCardTitle}>Current Plan</Text>
          {planDetails && planDetails.name && (
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{planDetails.name}</Text>
            </View>
          )}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: '#43A047',
                marginLeft: 8,
              },
            ]}>
            <Text style={styles.statusBadgeText}>Active</Text>
          </View>
        </View>
        <View>
          <View style={styles.planDetailsRow}>
            <View style={{ width: '48%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon
                  name="attach-money"
                  size={20}
                  color="#43A047"
                  style={styles.planDetailIcon}
                />
                <Text style={styles.planDetailText}>
                  Amount:{' '}
                  <Text style={styles.planDetailHighlight}>
                    {STATIC_DATA.currentPlan.amount}
                  </Text>
                </Text>
              </View>
            </View>
            <View style={{ width: '48%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon
                  name="event-available"
                  size={20}
                  color="#D84315"
                  style={styles.planDetailIcon}
                />
                <Text style={styles.planDetailText}>
                  Expires:{' '}
                  <Text
                    style={[styles.planDetailHighlight, { color: '#D84315' }]}>
                    {STATIC_DATA.currentPlan.expires}
                  </Text>
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.planDetailsRow}>
            <View style={{ width: '48%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon
                  name="group"
                  size={20}
                  color="#00B8D4"
                  style={styles.planDetailIcon}
                />
                <Text style={styles.planDetailText}>
                  Users:{' '}
                  <Text
                    style={[styles.planDetailHighlight, { color: '#00B8D4' }]}>
                    {STATIC_DATA.currentPlan.users}
                  </Text>
                </Text>
              </View>
            </View>
            <View style={{ width: '48%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon
                  name="schedule"
                  size={20}
                  color="#1976D2"
                  style={styles.planDetailIcon}
                />
                <Text style={styles.planDetailText}>
                  Duration:{' '}
                  <Text
                    style={[styles.planDetailHighlight, { color: '#1976D2' }]}>
                    {STATIC_DATA.currentPlan.duration}
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.planDescRow}>
          <Icon
            name="info"
            size={18}
            color="#F9A825"
            style={styles.planDetailIcon}
          />
          <Text style={styles.planDescText}>{STATIC_DATA.currentPlan.description}</Text>
        </View>
      </View>
    </View>
  </LinearGradient>
);

const TeamTrackifyDashboard = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [addOnPlanNames, setAddOnPlanNames] = useState({});
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

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      
      // Get adminId from AsyncStorage
      const adminId = await AsyncStorage.getItem('userId');
      const userRole = await AsyncStorage.getItem('userRole');
      
      if (!adminId) {
        Alert.alert('Error', 'Admin ID not found');
        setLoading(false);
        return;
      }

      // Check if user is admin (case-insensitive comparison)
      if (userRole && userRole.toLowerCase() !== 'admin') {
        Alert.alert('Error', 'Unauthorized access');
        setLoading(false);
        return;
      }

      console.log('Fetching user stats for admin:', adminId);
      
      const result = await getUserStats(adminId);
      
      if (result.success && result.data) {
        console.log('User Stats Data:', result.data);
        
        // Update state with API data (new response format has data in 'count' object)
        const countData = result.data.count || {};
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
        Alert.alert('Error', result.message || 'Failed to fetch user stats');
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      Alert.alert('Error', 'Something went wrong while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserStats();
    setRefreshing(false);
  };

  const handleCardPress = (cardType) => {
    switch (cardType) {
      case 'activeUsers':
        navigation.navigate('ActiveUsers');
        break;
      case 'inactiveUsers':
        navigation.navigate('InactiveUsers');
        break;
      case 'managePlans':
        navigation.navigate('ActivePlans');
        break;
      case 'liveTracking':
        navigation.navigate('LiveTracking');
        break;
      default:
        break;
    }
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

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Current Plan Section */}
        <View style={{ marginVertical: 18, marginHorizontal: 4 }}>
          <PlanCard
            planDetails={STATIC_DATA.currentPlan}
            paymentDetails={STATIC_DATA.currentPlan}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
            addOnPlanNames={addOnPlanNames}
          />
        </View>

        <View style={{ padding: 18 }}>
          <Text style={styles.welcomeText}>Tracking Overview :</Text>

          <View style={styles.statsContainer}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => handleCardPress('activeUsers')}>
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
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => handleCardPress('inactiveUsers')}>
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
            </TouchableOpacity>

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
              onPress={() => handleCardPress('managePlans')}
              style={styles.statCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrapper}>
                  <Icon name="subscriptions" size={24} color="#7B1FA2" />
                </View>
                <Text style={styles.cardTitle}>Active Plans</Text>
              </View>
              <Text style={styles.statValue}>{STATIC_DATA.activePlans}</Text>
              <View style={styles.cardAction}>
                <Text style={styles.actionText}>Manage Plans</Text>
                <Icon name="arrow-forward" size={16} color="#7B1FA2" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => handleCardPress('liveTracking')}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrapper}>
                  <Icon name="my-location" size={24} color="#689F38" />
                </View>
                <Text style={styles.cardTitle}>Live Tracking Users</Text>
              </View>
              <Text style={styles.statValue}>{userStats.currentlyTracking}</Text>
              <View style={styles.cardAction}>
                <Text style={styles.actionText}>View on Map</Text>
                <Icon name="map" size={16} color="#689F38" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Recent Activities */}
          <View style={styles.activitiesContainer}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8,
              }}>
              <Icon
                name="notifications"
                size={25}
                color="#4A90E2"
                style={{ marginRight: 8, marginTop: 2 }}
              />
              <Text style={styles.sectionTitle}>Recent Activities</Text>
            </View>
            <View style={styles.recentEmptyState}>
              <Icon name="info-outline" size={24} color="#999" />
              <Text style={styles.recentEmptyText}>No recent activity</Text>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#333',
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
  // Plan Card Styles
  planCardGradient: {
    borderRadius: 20,
    padding: 4,
    shadowColor: '#2A73FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  planCardRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  planAccentBar: {
    width: 6,
    height: '100%',
    backgroundColor: '#2A73FF',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  planCardContent: {
    flex: 1,
    padding: 18,
  },
  expandIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  planCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  planCardTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
    marginRight: 8,
  },
  planBadge: {
    backgroundColor: '#2A73FF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginRight: 6,
  },
  planBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2.1,
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  planDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planDetailIcon: {
    marginRight: 7,
  },
  planDetailText: {
    fontSize: 14,
    color: '#333',
    flexShrink: 1,
  },
  planDetailHighlight: {
    fontSize: 13.4,
    fontWeight: 'bold',
    color: '#43A047',
    flexShrink: 1,
  },
  planDescRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginTop: 8,
  },
  planDescText: {
    fontSize: 13.2,
    color: '#333',
    fontStyle: 'italic',
  },
  addOnCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    margin: 2,
    minWidth: 174,
    flex: 1,
    shadowColor: '#2A73FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e3e3e3',
  },
  addOnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginTop: 6,
  },
  addOnIcon: {
    marginRight: 5,
  },
  addOnPlanName: {
    fontWeight: 'bold',
    color: '#4A90E2',
    fontSize: 14,
  },
  addOnText: {
    fontSize: 14,
    color: '#333',
  },
  addOnDesc: {
    fontSize: 13,
    color: '#333',
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 18,
    overflow: 'hidden',
  },
});

export default TeamTrackifyDashboard;