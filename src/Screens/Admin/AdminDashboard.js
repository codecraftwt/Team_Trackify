// import React from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   StyleSheet,
//   StatusBar,
//   SafeAreaView,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import CustomHeader from '../../Component/CustomHeader';

// // Static data for team tracking dashboard
// const STATIC_DATA = {
//   currentPlan: {
//     amount: '₹2000',
//     users: '2-14',
//     type: 'Standard Plan',
//     expires: '19 March 2026',
//     duration: 'monthly',
//     description: 'Standard Plan for 1 month create upto 10 users'
//   },
//   trackingOverview: {
//     activeUsers: 9,
//     inactiveUsers: 1,
//     todayCheckedIn: 0,
//     todayCheckedOut: 0,
//     activePlans: 5,
//     liveTrackingUsers: 0
//   },
//   recentActivities: []
// };

// const TeamTrackifyDashboard = ({ navigation }) => {
//   const renderStatCard = (title, value, showDetails = true) => (
//     <View style={styles.statCard}>
//       <View style={styles.statHeader}>
//         <Text style={styles.statTitle}>{title}</Text>
//         {showDetails && (
//           <TouchableOpacity>
//             <Text style={styles.viewDetailsText}>View Details →</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//       <Text style={styles.statValue}>{value}</Text>
//     </View>
//   );

//   const renderMetricCard = (label, value, status, icon) => (
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
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
    
//        <CustomHeader
//           title="Team Trackify"
//         />

//       <ScrollView 
//         style={styles.scrollView}
//         showsVerticalScrollIndicator={false}
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
//               <Text style={styles.planValue}>{STATIC_DATA.currentPlan.users}</Text>
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
//           <Text style={styles.sectionTitle}>Tracking Overview:</Text>
          
//           <View style={styles.statsRow}>
//             <View style={styles.statsLeft}>
//               {renderStatCard('Active Users', STATIC_DATA.trackingOverview.activeUsers)}
//               {renderStatCard('Inactive Users', STATIC_DATA.trackingOverview.inactiveUsers)}
//             </View>
            
//             <View style={styles.statsRight}>
//               <View style={styles.checkedCard}>
//                 <Text style={styles.checkedTitle}>Today's Checked In</Text>
//                 <Text style={styles.checkedValue}>{STATIC_DATA.trackingOverview.todayCheckedIn}</Text>
//               </View>
//               <View style={styles.checkedCard}>
//                 <Text style={styles.checkedTitle}>Today's Checked Out</Text>
//                 <Text style={styles.checkedValue}>{STATIC_DATA.trackingOverview.todayCheckedOut}</Text>
//               </View>
//             </View>
//           </View>
//         </View>

//         {/* Additional Metrics Section (from second image) */}
//         <View style={styles.metricsSection}>
//           <View style={styles.metricsRow}>
//             {renderMetricCard('Today\'s Checked In', '0', 'Live Status ●', 'live')}
//             {renderMetricCard('Today\'s Checked Out', '0', 'Completed ✔', 'completed')}
//           </View>

//           <View style={styles.actionCardsRow}>
//             <TouchableOpacity style={styles.actionCard}>
//               <Text style={styles.actionCardTitle}>Active Plans</Text>
//               <Text style={styles.actionCardValue}>5</Text>
//               <Text style={styles.actionCardLink}>Manage Plans →</Text>
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.actionCard}>
//               <Text style={styles.actionCardTitle}>Live Tracking Users</Text>
//               <Text style={styles.actionCardValue}>0</Text>
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

//         {/* Bottom Navigation */}
//         <View style={styles.bottomNav}>
//           <TouchableOpacity style={styles.navItem}>
//             <Icon name="home" size={24} color="#3088C7" />
//             <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity style={styles.navItem}>
//             <Icon name="people" size={24} color="#999" />
//             <Text style={styles.navText}>Users</Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity style={styles.navItem}>
//             <Icon name="assessment" size={24} color="#999" />
//             <Text style={styles.navText}>Reports</Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity style={styles.navItem}>
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
//   section: {
//     padding: 20,
//     paddingBottom: 10,
//   },
//   planSection: {
//     padding: 20,
//     backgroundColor: '#FFFFFF',
//     marginBottom: 10,
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../../Component/CustomHeader';
import { getUserStats } from '../../config/AdminService';

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

const TeamTrackifyDashboard = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
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

  const handleRefresh = () => {
    fetchUserStats();
  };

  const renderStatCard = (title, value, showDetails = true, onPress = null) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        {showDetails && (
          <TouchableOpacity onPress={onPress}>
            <Text style={styles.viewDetailsText}>View Details →</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const renderMetricCard = (label, value, status, icon, subtitle = null) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        <View style={styles.metricStatus}>
          {icon === 'live' && <View style={styles.liveDot} />}
          {icon === 'completed' && <Icon name="check-circle" size={16} color="#4CAF50" />}
          <Text style={[
            styles.metricStatusText,
            icon === 'live' && styles.liveText,
            icon === 'completed' && styles.completedText
          ]}>
            {status}
          </Text>
        </View>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Team Trackify" />
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
    
      <CustomHeader title="Team Trackify" />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Icon name="refresh" size={24} color="#3088C7" />
          </TouchableOpacity>
        }
      >
        {/* Current Plan Section */}
        <View style={styles.planSection}>
          <View style={styles.planHeader}>
            <Text style={styles.sectionTitle}>Current Plan</Text>
            <TouchableOpacity>
              <Text style={styles.changePlanText}>Change</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.planCard}>
            <View style={styles.planRow}>
              <Text style={styles.planLabel}>Amount:</Text>
              <Text style={styles.planValue}>{STATIC_DATA.currentPlan.amount}</Text>
            </View>
            <View style={styles.planRow}>
              <Text style={styles.planLabel}>Users:</Text>
              <Text style={styles.planValue}>{STATIC_DATA.currentPlan.users} (Total: {userStats.totalUsers})</Text>
            </View>
            
            <View style={styles.planTypeContainer}>
              <Text style={styles.planType}>{STATIC_DATA.currentPlan.type}</Text>
            </View>
            
            <View style={styles.planExpiryRow}>
              <Icon name="access-time" size={16} color="#666" />
              <Text style={styles.planExpiryText}>
                Expires: {STATIC_DATA.currentPlan.expires}
              </Text>
              <Text style={styles.planDuration}> • {STATIC_DATA.currentPlan.duration}</Text>
            </View>
            
            <Text style={styles.planDescription}>
              {STATIC_DATA.currentPlan.description}
            </Text>
          </View>
        </View>

        {/* Tracking Overview Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tracking Overview:</Text>
            <TouchableOpacity onPress={handleRefresh}>
              <Icon name="refresh" size={20} color="#3088C7" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statsLeft}>
              {renderStatCard('Active Users', userStats.activeUsers, true, () => navigation.navigate('ActiveUsers'))}
              {renderStatCard('Inactive Users', userStats.inactiveUsers, true, () => navigation.navigate('InactiveUsers'))}
            </View>
            
            <View style={styles.statsRight}>
              <View style={styles.checkedCard}>
                <Text style={styles.checkedTitle}>Today's Checked In</Text>
                <Text style={styles.checkedValue}>{userStats.todayCheckedIn}</Text>
                <Text style={styles.checkedSubtitle}>
                  Unique: {userStats.uniqueCheckedInUsers} users
                </Text>
              </View>
              <View style={styles.checkedCard}>
                <Text style={styles.checkedTitle}>Today's Checked Out</Text>
                <Text style={styles.checkedValue}>{userStats.todayCheckedOut}</Text>
                <Text style={styles.checkedSubtitle}>
                  Unique: {userStats.uniqueCheckedOutUsers} users
                </Text>
              </View>
            </View>
          </View>

          {/* Activity Summary */}
          <View style={styles.activitySummary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Active %</Text>
              <Text style={styles.summaryValue}>{userStats.activePercentage}%</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Inactive %</Text>
              <Text style={styles.summaryValue}>{userStats.inactivePercentage}%</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Activity Rate</Text>
              <Text style={styles.summaryValue}>{userStats.todayActivityRate}%</Text>
            </View>
          </View>
        </View>

        {/* Additional Metrics Section */}
        <View style={styles.metricsSection}>
          <View style={styles.metricsRow}>
            {renderMetricCard(
              'Today\'s Checked In',
              userStats.todayCheckedIn,
              userStats.uniqueCheckedInUsers > 0 ? 'Live Status ●' : 'No Activity',
              userStats.uniqueCheckedInUsers > 0 ? 'live' : 'completed',
              `${userStats.uniqueCheckedInUsers} unique users`
            )}
            {renderMetricCard(
              'Today\'s Checked Out',
              userStats.todayCheckedOut,
              userStats.uniqueCheckedOutUsers > 0 ? 'Completed ✔' : 'No Activity',
              userStats.uniqueCheckedOutUsers > 0 ? 'completed' : 'completed',
              `${userStats.uniqueCheckedOutUsers} unique users`
            )}
          </View>

          <View style={styles.actionCardsRow}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('ActivePlans')}
            >
              <Text style={styles.actionCardTitle}>Active Plans</Text>
              <Text style={styles.actionCardValue}>{STATIC_DATA.activePlans}</Text>
              <Text style={styles.actionCardLink}>Manage Plans →</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('LiveTracking')}
            >
              <Text style={styles.actionCardTitle}>Live Tracking Users</Text>
              <Text style={styles.actionCardValue}>{userStats.currentlyTracking}</Text>
              <Text style={styles.actionCardSubtext}>
                Unique: {userStats.uniqueCurrentlyTracking}
              </Text>
              <Text style={styles.actionCardLink}>View on Map ▷</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
          </View>
          <View style={styles.recentEmptyState}>
            <Icon name="info-outline" size={24} color="#999" />
            <Text style={styles.recentEmptyText}>No recent activity</Text>
          </View>
        </View>

        {/* Last Updated Info */}
        {userStats.lastUpdated && (
          <View style={styles.lastUpdated}>
            <Icon name="access-time" size={14} color="#999" />
            <Text style={styles.lastUpdatedText}>
              Last updated: {new Date(userStats.lastUpdated).toLocaleString()}
            </Text>
          </View>
        )}

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TeamTrackifyDashboard')}>
            <Icon name="home" size={24} color="#3088C7" />
            <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Users')}>
            <Icon name="people" size={24} color="#999" />
            <Text style={styles.navText}>Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Reports')}>
            <Icon name="assessment" size={24} color="#999" />
            <Text style={styles.navText}>Reports</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
            <Icon name="person" size={24} color="#999" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  refreshButton: {
    padding: 10,
    alignItems: 'center',
  },
  section: {
    padding: 20,
    paddingBottom: 10,
  },
  planSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  changePlanText: {
    color: '#3088C7',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  planCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  planValue: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#333',
  },
  planTypeContainer: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  planType: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#3088C7',
  },
  planExpiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planExpiryText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginLeft: 4,
  },
  planDuration: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  planDescription: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsLeft: {
    flex: 1,
    marginRight: 10,
  },
  statsRight: {
    flex: 1,
    marginLeft: 10,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  viewDetailsText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#3088C7',
  },
  statValue: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  checkedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  checkedTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: 8,
  },
  checkedValue: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  checkedSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    marginTop: 4,
  },
  activitySummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#3088C7',
  },
  metricsSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginVertical: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 5,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  metricStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  metricStatusText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
  },
  liveText: {
    color: '#4CAF50',
  },
  completedText: {
    color: '#4CAF50',
  },
  metricValue: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  metricSubtitle: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    marginTop: 2,
  },
  actionCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 5,
  },
  actionCardTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: 8,
  },
  actionCardValue: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 4,
  },
  actionCardSubtext: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    marginBottom: 8,
  },
  actionCardLink: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#3088C7',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentEmptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recentEmptyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    marginTop: 8,
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  lastUpdatedText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    marginLeft: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 10,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    marginTop: 2,
  },
  navTextActive: {
    color: '#3088C7',
    fontFamily: 'Poppins-Medium',
  },
});

export default TeamTrackifyDashboard;