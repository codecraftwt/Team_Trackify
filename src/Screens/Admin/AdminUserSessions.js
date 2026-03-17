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

const formatDistance = (distance) => {
  if (!distance) return '0 km';
  return `${distance.toFixed(2)} km`;
};

const AdminUserSessions = ({ route, navigation }) => {
  const { userId, userName, date } = route.params || {};

  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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

  const getSessionStatus = (item) => {
    return item.startTime && item.endTime ? 'Completed' : 'Active';
  };

  const renderSessionItem = ({ item, index }) => {
    const status = getSessionStatus(item);
    
    return (
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
          <View style={styles.statusContainer}>
            {status === 'Completed' ? (
              <Icon name='check-circle' size={16} color='#4CAF50' />
            ) : (
              <Icon name='play-circle-filled' size={16} color='#FF9800' />
            )}
            <Text style={[
              styles.statusText,
              status === 'Completed' ? styles.completedText : styles.activeText
            ]}>
              {status}
            </Text>
          </View>
          <Text style={styles.routeLink}>Tap to view route on map</Text>
        </View>

        <View style={styles.dateTimeContainer}>
          <View style={styles.dateTimeItem}>
            <Text style={styles.dateTimeLabel}>Start:</Text>
            <Text style={styles.dateTimeValue}>
              {formatDate(item.startTime)} • {formatTime(item.startTime)}
            </Text>
          </View>
          
          <View style={styles.dateTimeItem}>
            <Text style={styles.dateTimeLabel}>End:</Text>
            {item.endTime ? (
              <Text style={styles.dateTimeValue}>
                {formatDate(item.endTime)} • {formatTime(item.endTime)}
              </Text>
            ) : (
              <Text style={styles.dateTimeValue}>--</Text>
            )}
          </View>
        </View>

        <View style={styles.distanceContainer}>
          <Icon name='straighten' size={16} color='#666' />
          <Text style={styles.distanceLabel}>Travelled Distance:</Text>
          <Text style={styles.distanceValue}>
            {formatDistance(item.totalDistance)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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
        title={`${userName || 'User Sessions'} - ${formatDate(date)}`}
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
  sessionItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginLeft: 6,
  },
  completedText: {
    color: '#4CAF50',
  },
  activeText: {
    color: '#FF9800',
  },
  routeLink: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#3088C7',
    // textDecorationLine: 'underline',
    backgroundColor:'#deeffb',
    padding: 6,
    borderRadius: 4,
  },
  dateTimeContainer: {
    marginBottom: 12,
  },
  dateTimeItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dateTimeLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#666',
    width: 45,
  },
  dateTimeValue: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#333',
    flex: 1,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  distanceLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginLeft: 6,
    marginRight: 4,
  },
  distanceValue: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    color: '#333',
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