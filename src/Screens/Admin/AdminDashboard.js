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
  BackHandler
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../../Component/CustomHeader';
import { getUserStats } from '../../config/AdminService';
import { useIsFocused } from '@react-navigation/native';

const TeamTrackifyDashboard = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const isScreenFocused = useIsFocused();

  useEffect(() => {
    fetchUserStats();
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
        console.log('Error fetching user stats admin dashboard:', result.message);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      Alert.alert('Error', 'Something went wrong while fetching data');
    } finally {
      setLoading(false);
    }
  };

  // Add back handler for Android
  // useEffect(() => {
  //   const backHandler = BackHandler.addEventListener(
  //     'hardwareBackPress',
  //     handleBackPress
  //   );

  //   return () => backHandler.remove();
  // }, []);

  // const handleBackPress = () => {
  //   Alert.alert(
  //     'Exit App',
  //     'Are you sure you want to exit?',
  //     [
  //       {
  //         text: 'Cancel',
  //         onPress: () => null,
  //         style: 'cancel',
  //       },
  //       {
  //         text: 'Exit',
  //         onPress: () => BackHandler.exitApp(),
  //       },
  //     ],
  //     { cancelable: false }
  //   );
  //   return true; // Prevent default back button behavior
  // };


  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserStats();
    setRefreshing(false);
  };

  // const handleCardPress = (cardType) => {
  //   switch (cardType) {
  //     case 'activeUsers':
  //       navigation.navigate('ActiveUsers');
  //       break;
  //     case 'inactiveUsers':
  //       navigation.navigate('InactiveUsers');
  //       break;
  //     case 'managePlans':
  //       navigation.navigate('ActivePlans');
  //       break;
  //     case 'liveTracking':
  //       navigation.navigate('LiveTracking');
  //       break;
  //     default:
  //       break;
  //   }
  // };

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
});

export default TeamTrackifyDashboard;