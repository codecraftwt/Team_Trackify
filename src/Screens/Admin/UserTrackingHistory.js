import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../config/auth-context';
import { getUserTrackingSummary, getSessionDetails } from '../../config/AdminService';

const UserTrackingHistory = ({ navigation, route }) => {
  // Extract params: userId is the selected user's ID, adminId is the admin's ID
  const { userId, adminId, userName } = route.params || {};
  
  console.log('UserTrackingHistory - Route params:', route.params);
  console.log('UserTrackingHistory - Selected User ID:', userId);
  console.log('UserTrackingHistory - Admin ID:', adminId);
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user tracking summary
  const fetchUserTrackingSummary = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      if (!adminId || !userId) {
        setError('Admin ID or User ID not found.');
        setIsLoading(false);
        return;
      }

      const response = await getUserTrackingSummary(adminId, userId);

      if (response.success && response.data) {
        setTrackingData(response.data);
      } else {
        setError(response.message || 'Failed to fetch user tracking summary');
      }
    } catch (err) {
      setError('Something went wrong while fetching user tracking data');
      console.error('Error fetching user tracking summary:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [adminId, userId]);

  // Initial fetch
  useEffect(() => {
    fetchUserTrackingSummary();
    // Set header title
    if (userName) {
      navigation.setOptions({ title: `${userName}'s Tracking` });
    }
  }, [fetchUserTrackingSummary, navigation, userName]);

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUserTrackingSummary(true);
  };

  // Format duration from seconds to HH:MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  // Format distance
  const formatDistance = (distance) => {
    if (!distance) return '0 km';
    return `${distance.toFixed(2)} km`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate session duration
  const getSessionDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '0m';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationInSeconds = Math.floor((end - start) / 1000);
    return formatDuration(durationInSeconds);
  };

  // Render stats card
  const renderStatsCard = () => {
    if (!trackingData?.stats) return null;
    const { stats } = trackingData;

    return (
      <View style={styles.statsCardContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="access-time" size={24} color="#3088C7" />
            <Text style={styles.statValue}>{stats.totalSessions || 0}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="straighten" size={24} color="#3088C7" />
            <Text style={styles.statValue}>{formatDistance(stats.totalDistance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="timer" size={24} color="#3088C7" />
            <Text style={styles.statValue}>{formatDuration(stats.totalDuration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="speed" size={24} color="#3088C7" />
            <Text style={styles.statValue}>{formatDistance(stats.averageDistance)}</Text>
            <Text style={styles.statLabel}>Avg Distance</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[
              styles.activeIndicator,
              { backgroundColor: stats.isActiveToday ? '#4CAF50' : '#FF9800' }
            ]} />
            <Text style={[
              styles.statValue,
              { color: stats.isActiveToday ? '#4CAF50' : '#FF9800' }
            ]}>
              {stats.isActiveToday ? 'Active' : 'Inactive'}
            </Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render user info card
  const renderUserInfoCard = () => {
    if (!trackingData?.user) return null;
    const { user } = trackingData;

    return (
      <View style={styles.userInfoCard}>
        <View style={styles.userInfoHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) : '?'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.name || 'N/A'}</Text>
            <Text style={styles.userEmail}>{user.email || 'N/A'}</Text>
            <View style={styles.userContact}>
              <Icon name="phone" size={14} color="#666" />
              <Text style={styles.userContactText}>{user.mobile_no || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Render session item
  const renderSessionItem = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.sessionItem}
      onPress={() => {
        // Navigate to session detail screen
        navigation.navigate('SessionDetailMap', { 
          userId: userId,
          sessionId: item.sessionId,
          sessionDate: item.date,
        });
      }}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionDateContainer}>
          <Icon name="event" size={16} color="#3088C7" />
          <Text style={styles.sessionDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.sessionIdContainer}>
          <Text style={styles.sessionId}>#{index + 1}</Text>
        </View>
      </View>
      <View style={styles.sessionDetails}>
        <View style={styles.sessionTimeRow}>
          <View style={styles.sessionTimeItem}>
            <Icon name="play-arrow" size={16} color="#4CAF50" />
            <Text style={styles.sessionTimeLabel}>Start:</Text>
            <Text style={styles.sessionTime}>{formatTime(item.startTime)}</Text>
          </View>
          <View style={styles.sessionTimeItem}>
            <Icon name="stop" size={16} color="#F44336" />
            <Text style={styles.sessionTimeLabel}>End:</Text>
            <Text style={styles.sessionTime}>{formatTime(item.endTime)}</Text>
          </View>
        </View>
        <View style={styles.sessionStatsRow}>
          <View style={styles.sessionStatItem}>
            <Icon name="timer" size={14} color="#666" />
            <Text style={styles.sessionStatLabel}>Duration:</Text>
            <Text style={styles.sessionStatValue}>
              {getSessionDuration(item.startTime, item.endTime)}
            </Text>
          </View>
          <View style={styles.sessionStatItem}>
            <Icon name="straighten" size={14} color="#666" />
            <Text style={styles.sessionStatLabel}>Distance:</Text>
            <Text style={styles.sessionStatValue}>
              {formatDistance(item.totalDistance)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render empty sessions
  const renderEmptySessions = () => (
    <View style={styles.emptySessions}>
      <Icon name="location-off" size={48} color="#ccc" />
      <Text style={styles.emptySessionsText}>No tracking sessions found</Text>
    </View>
  );

  // Render available dates
  const renderAvailableDates = () => {
    if (!trackingData?.availableDates || trackingData.availableDates.length === 0) {
      return null;
    }

    return (
      <View style={styles.datesSection}>
        <Text style={styles.sectionTitle}>Available Tracking Dates</Text>
        <View style={styles.datesContainer}>
          {trackingData.availableDates.map((date, index) => (
            <View key={index} style={styles.dateBadge}>
              <Icon name="event" size={12} color="#3088C7" />
              <Text style={styles.dateText}>{formatDate(date)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3088C7" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3088C7" />
          <Text style={styles.loadingText}>Loading tracking data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3088C7" />
      
      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchUserTrackingSummary(true)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {!error && trackingData && (
        <FlatList
          data={trackingData.recentSessions || []}
          renderItem={renderSessionItem}
          keyExtractor={(item, index) => item.sessionId || index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* User Info Card */}
              {renderUserInfoCard()}
              
              {/* Stats Card */}
              {renderStatsCard()}
              
              {/* Available Dates */}
              {renderAvailableDates()}
              
              {/* Sessions Header */}
              <Text style={styles.sectionTitle}>Recent Sessions</Text>
            </>
          }
          ListEmptyComponent={renderEmptySessions}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#3088C7']}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    margin: 20,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3088C7',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  userInfoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3088C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userAvatarText: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: 4,
  },
  userContact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userContactText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginLeft: 4,
  },
  statsCardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: 2,
  },
  activeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 5,
  },
  datesSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 10,
  },
  datesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#3088C7',
    marginLeft: 4,
  },
  sessionItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  sessionDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionDate: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginLeft: 6,
  },
  sessionIdContainer: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sessionId: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  sessionDetails: {},
  sessionTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionTimeLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginLeft: 4,
  },
  sessionTime: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#333',
    marginLeft: 4,
  },
  sessionStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionStatLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginLeft: 4,
  },
  sessionStatValue: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginLeft: 4,
  },
  emptySessions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySessionsText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    marginTop: 10,
  },
});

export default UserTrackingHistory;
