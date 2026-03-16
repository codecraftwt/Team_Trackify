import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomHeader from '../../Component/CustomHeader';
import { getUserSessions } from '../../config/AdminService';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const formatDuration = (seconds) => {
  if (!seconds) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

const formatDistance = (distance) => {
  if (!distance) return '0 km';
  return `${distance.toFixed(2)} km`;
};

const AdminUserSessions = ({ route, navigation }) => {
  const { userId, userName, date } = route.params || {};

  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!userId) {
        setError('User ID not found.');
        setIsLoading(false);
        return;
      }

      const response = await getUserSessions(userId, date);

      if (response.success && response.data) {
        // API shape from existing admin history: response.data.sessions
        setSessions(response.data.sessions || []);
      } else {
        setError(response.message || 'Failed to fetch user sessions');
      }
    } catch (err) {
      setError('Something went wrong while fetching user sessions');
      console.error('Error fetching user sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, date]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const renderSessionItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.sessionItem}
      onPress={() => {
        navigation.navigate('SessionDetailMap', {
          userId,
          sessionId: item.sessionId,
          sessionDate: item.startTime,
        });
      }}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionDateContainer}>
          <Icon name='event' size={16} color='#3088C7' />
          <Text style={styles.sessionDate}>{formatDate(item.startTime)}</Text>
        </View>
        <View style={styles.sessionIdContainer}>
          <Text style={styles.sessionId}>#{index + 1}</Text>
        </View>
      </View>
      <View style={styles.sessionDetails}>
        <View style={styles.sessionTimeRow}>
          <View style={styles.sessionTimeItem}>
            <Icon name='play-arrow' size={16} color='#4CAF50' />
            <Text style={styles.sessionTimeLabel}>Start:</Text>
            <Text style={styles.sessionTime}>{formatTime(item.startTime)}</Text>
          </View>
          <View style={styles.sessionTimeItem}>
            <Icon name='stop' size={16} color='#F44336' />
            <Text style={styles.sessionTimeLabel}>End:</Text>
            <Text style={styles.sessionTime}>{formatTime(item.endTime)}</Text>
          </View>
        </View>
        <View style={styles.sessionStatsRow}>
          <View style={styles.sessionStatItem}>
            <Icon name='timer' size={14} color='#666' />
            <Text style={styles.sessionStatLabel}>Duration:</Text>
            <Text style={styles.sessionStatValue}>
              {formatDuration(item.duration)}
            </Text>
          </View>
          <View style={styles.sessionStatItem}>
            <Icon name='straighten' size={14} color='#666' />
            <Text style={styles.sessionStatLabel}>Distance:</Text>
            <Text style={styles.sessionStatValue}>
              {formatDistance(item.totalDistance)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptySessions = () => (
    <View style={styles.emptySessions}>
      <Icon name='location-off' size={48} color='#ccc' />
      <Text style={styles.emptySessionsText}>
        No tracking sessions found for this date
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle='light-content' backgroundColor='#3088C7' />
        <CustomHeader
          navigation={navigation}
          showBackButton={true}
          title={userName || 'User Sessions'}
          titleColor='#ffffff'
          iconColor='#ffffff'
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#3088C7' />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor='#3088C7' />
      <CustomHeader
        navigation={navigation}
        showBackButton={true}
        title={userName || 'User Sessions'}
        titleColor='#ffffff'
        iconColor='#ffffff'
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSessions}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!error && (
        <FlatList
          data={sessions}
          renderItem={renderSessionItem}
          keyExtractor={(item, index) => item.sessionId || index.toString()}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <View style={styles.selectedDateInfo}>
              <View style={styles.selectedDateHeader}>
                <Icon name='event' size={18} color='#3088C7' />
                <Text style={styles.selectedDateText}>
                  {date ? formatDate(date) : 'Selected Date'}
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={renderEmptySessions}
          showsVerticalScrollIndicator={false}
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
    fontSize: 14,
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
    padding: 16,
    flexGrow: 1,
  },
  selectedDateInfo: {
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
  selectedDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginLeft: 8,
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
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  emptySessionsText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    marginTop: 10,
  },
});

export default AdminUserSessions;

