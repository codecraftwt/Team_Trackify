import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { getSessionDetails } from '../../config/AdminService';

const { width, height } = Dimensions.get('window');

const SessionDetailMap = ({ navigation, route }) => {
  const { userId, sessionId, sessionDate } = route.params || {};
  const mapRef = useRef(null);
  
  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);

  // Fetch session details
  const fetchSessionDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!userId || !sessionId) {
        setError('User ID or Session ID not found.');
        setIsLoading(false);
        return;
      }

      const response = await getSessionDetails(userId, sessionId);

      if (response.success && response.data) {
        setSessionData(response.data);
        
        // Fit map to show all markers after data loads
        setTimeout(() => {
          if (mapRef.current && response.data.bounds) {
            const { bounds } = response.data;
            mapRef.current.fitToCoordinates(
              [
                { latitude: bounds.north, longitude: bounds.east },
                { latitude: bounds.south, longitude: bounds.west },
              ],
              {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              }
            );
          }
        }, 500);
      } else {
        setError(response.message || 'Failed to fetch session details');
      }
    } catch (err) {
      setError('Something went wrong while fetching session data');
      console.error('Error fetching session details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, sessionId]);

  // Initial fetch
  useEffect(() => {
    fetchSessionDetails();
    navigation.setOptions({ 
      title: sessionDate ? `Session: ${sessionDate}` : 'Session Details' 
    });
  }, [fetchSessionDetails, navigation, sessionDate]);

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Format distance
  const formatDistance = (distance) => {
    if (!distance) return '0 km';
    return `${distance.toFixed(2)} km`;
  };

  // Format speed
  const formatSpeed = (speed) => {
    if (!speed) return '0 km/h';
    return `${speed.toFixed(2)} km/h`;
  };

  // Check if location has a photo
  const hasPhoto = (location) => {
    return location.photo && location.photo !== null;
  };

  // Filter locations for markers (only start, end, and photo locations)
  const getMarkerLocations = () => {
    if (!sessionData?.locations) return [];
    
    return sessionData.locations.filter(location => {
      // Keep start marker
      if (location.markerType === 'start') return true;
      // Keep end marker
      if (location.markerType === 'end') return true;
      // Keep locations with photos
      if (hasPhoto(location)) return true;
      // Filter out all other waypoints
      return false;
    });
  };

  // Get marker color based on markerType or photo presence
  const getMarkerColor = (location) => {
    if (hasPhoto(location)) {
      return '#FF9800'; // Orange for photo markers
    }
    switch (location.markerType) {
      case 'start':
        return '#4CAF50'; // Green for start
      case 'end':
        return '#F44336'; // Red for end
      default:
        return '#3088C7'; // Default blue (shouldn't be used now)
    }
  };

  // Get marker icon based on markerType or photo presence
  const getMarkerIcon = (location) => {
    if (hasPhoto(location)) {
      return 'photo-camera'; // Camera icon for photo markers
    }
    switch (location.markerType) {
      case 'start':
        return 'play-arrow';
      case 'end':
        return 'stop';
      default:
        return 'place';
    }
  };

  // Get marker title
  const getMarkerTitle = (location) => {
    if (hasPhoto(location)) {
      return 'Photo Location';
    }
    switch (location.markerType) {
      case 'start':
        return 'Start Point';
      case 'end':
        return 'End Point';
      default:
        return 'Location';
    }
  };

  // Generate coordinates for polyline
  const getPolylineCoordinates = () => {
    if (!sessionData?.locations) return [];
    return sessionData.locations.map(loc => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
    }));
  };

  // Calculate initial region
  const getInitialRegion = () => {
    if (!sessionData?.locations || sessionData.locations.length === 0) {
      return {
        latitude: 16.7332,
        longitude: 74.1282,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    const firstLocation = sessionData.locations[0];
    return {
      latitude: firstLocation.latitude,
      longitude: firstLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  };

  // Render stats card
  const renderStatsCard = () => {
    if (!sessionData?.stats) return null;
    const { stats } = sessionData;

    return (
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="access-time" size={20} color="#3088C7" />
            <Text style={styles.statValue}>{formatDuration(stats.duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="straighten" size={20} color="#3088C7" />
            <Text style={styles.statValue}>{formatDistance(stats.totalDistance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="speed" size={20} color="#3088C7" />
            <Text style={styles.statValue}>{formatSpeed(stats.averageSpeed)}</Text>
            <Text style={styles.statLabel}>Avg Speed</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="location-on" size={20} color="#3088C7" />
            <Text style={styles.statValue}>{stats.totalLocations || 0}</Text>
            <Text style={styles.statLabel}>Locations</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="battery-std" size={20} color="#3088C7" />
            <Text style={styles.statValue}>{stats.batteryDrain || 0}%</Text>
            <Text style={styles.statLabel}>Battery Drain</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="photo-library" size={20} color="#3088C7" />
            <Text style={styles.statValue}>{stats.totalPhotos || 0}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render timeline
  const renderTimeline = () => {
    if (!sessionData?.timeline || sessionData.timeline.length === 0) return null;

    return (
      <View style={styles.timelineContainer}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        {sessionData.timeline.map((item, index) => (
          <View key={index} style={styles.timelineItem}>
            <View style={styles.timelineIcon}>
              <Icon name="circle" size={12} color="#3088C7" />
              {index < sessionData.timeline.length - 1 && (
                <View style={styles.timelineLine} />
              )}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTime}>{item.time}</Text>
              <Text style={styles.timelineAddress} numberOfLines={2}>
                {item.address || 'Unknown Address'}
              </Text>
              {item.speed !== undefined && (
                <Text style={styles.timelineSpeed}>
                  Speed: {formatSpeed(item.speed)}
                </Text>
              )}
              {item.battery !== undefined && (
                <Text style={styles.timelineBattery}>
                  Battery: {item.battery}%
                </Text>
              )}
            </View>
          </View>
        ))}
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
          <Text style={styles.loadingText}>Loading session details...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3088C7" />
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchSessionDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Get markers to display (only start, end, and photo locations)
  const markerLocations = getMarkerLocations();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3088C7" />
      
      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : null}
          initialRegion={getInitialRegion()}
          showsUserLocation={false}
          showsMyLocationButton={true}
          showsCompass={true}
          mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          {/* Polyline for route */}
          <Polyline
            coordinates={getPolylineCoordinates()}
            strokeColor="#3088C7"
            strokeWidth={4}
            lineDashPattern={null}
          />
          
          {/* Markers only for start, end, and photo locations */}
          {markerLocations.map((location, index) => (
            <Marker
              key={location.id || index}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={getMarkerTitle(location)}
              description={location.address || ''}
            >
              <View style={[
                styles.markerContainer,
                { backgroundColor: getMarkerColor(location) }
              ]}>
                <Icon 
                  name={getMarkerIcon(location)} 
                  size={16} 
                  color="#FFF" 
                />
              </View>
            </Marker>
          ))}

          {/* Optional: Show photo count if there are multiple photos at same location */}
          {markerLocations.filter(loc => hasPhoto(loc)).map((location, index) => {
            // This would require additional logic to count photos per location
            // For now, just showing the marker is sufficient
            return null;
          })}
        </MapView>

        {/* Marker Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Start</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
            <Text style={styles.legendText}>End</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>Photo</Text>
          </View>
        </View>

        {/* Toggle Timeline Button */}
        <TouchableOpacity 
          style={styles.timelineToggle}
          onPress={() => setShowTimeline(!showTimeline)}
        >
          <Icon 
            name={showTimeline ? 'map' : 'history'} 
            size={24} 
            color="#FFF" 
          />
          <Text style={styles.timelineToggleText}>
            {showTimeline ? 'Show Map' : 'Show Timeline'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet Content */}
      <ScrollView style={styles.bottomSheet} showsVerticalScrollIndicator={false}>
        {/* Stats Card */}
        {renderStatsCard()}

        {/* Timeline (collapsible) */}
        {showTimeline && renderTimeline()}
      </ScrollView>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#F44336',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
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
  mapContainer: {
    height: height * 0.45,
    width: '100%',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  legendContainer: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  timelineToggle: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3088C7',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  timelineToggleText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    marginLeft: 6,
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 20,
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  statsCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
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
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: 2,
  },
  timelineContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 15,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  timelineIcon: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#3088C7',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTime: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#3088C7',
    marginBottom: 4,
  },
  timelineAddress: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#333',
    marginBottom: 4,
  },
  timelineSpeed: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: 2,
  },
  timelineBattery: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
});

export default SessionDetailMap;