import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomHeader from "../../Component/CustomHeader";
import { getActiveUsersCurrentLocations } from "../../config/AdminService";

// Predefined colors for different user markers
const MARKER_COLORS = [
  "#FF5722", // Deep Orange
  "#2196F3", // Blue
  "#4CAF50", // Green
  "#9C27B0", // Purple
  "#FFC107", // Amber
  "#E91E63", // Pink
  "#00BCD4", // Cyan
  "#FF9800", // Orange
  "#795548", // Brown
  "#607D8B", // Blue Grey
  "#F44336", // Red
  "#3F51B5", // Indigo
  "#009688", // Teal
  "#CDDC39", // Lime
  "#FFEB3B", // Yellow
];

// Function to check if coordinates are valid
const isValidCoordinate = (latitude, longitude) => {
  // Check if coordinates are numbers and not null/undefined
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }
  // Check if coordinates are within valid ranges
  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }
  // Check if coordinates are not (0,0) which is invalid for real locations
  if (latitude === 0 && longitude === 0) {
    return false;
  }
  // Check if coordinates are within valid ranges
  if (latitude < -90 || latitude > 90) {
    return false;
  }
  if (longitude < -180 || longitude > 180) {
    return false;
  }
  return true;
};

// Function to get marker color based on user ID for consistency
const getMarkerColor = (userId, index) => {
  // Use userId hash for consistent color per user across refreshes
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return MARKER_COLORS[hash % MARKER_COLORS.length];
};

const OngoingUsers = ({ navigation }) => {

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchLocations();

    const interval = setInterval(() => {
      fetchLocations();
    }, 5000); // auto refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Function to calculate bounds that fit all user markers
  const calculateMapBounds = (usersWithValidLocations) => {
    if (!usersWithValidLocations || usersWithValidLocations.length === 0) {
      return null;
    }

    if (usersWithValidLocations.length === 1) {
      return {
        latitude: usersWithValidLocations[0].currentLocation.latitude,
        longitude: usersWithValidLocations[0].currentLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    let minLat = usersWithValidLocations[0].currentLocation.latitude;
    let maxLat = usersWithValidLocations[0].currentLocation.latitude;
    let minLng = usersWithValidLocations[0].currentLocation.longitude;
    let maxLng = usersWithValidLocations[0].currentLocation.longitude;

    usersWithValidLocations.forEach((user) => {
      const { latitude, longitude } = user.currentLocation;
      if (latitude < minLat) minLat = latitude;
      if (latitude > maxLat) maxLat = latitude;
      if (longitude < minLng) minLng = longitude;
      if (longitude > maxLng) maxLng = longitude;
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Add padding to the bounds
    const latDelta = (maxLat - minLat) * 1.5 || 0.05;
    const lngDelta = (maxLng - minLng) * 1.5 || 0.05;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.02),
      longitudeDelta: Math.max(lngDelta, 0.02),
    };
  };

  // Default location for users without valid coordinates (India center)
  const DEFAULT_LAT = 20.5937;
  const DEFAULT_LNG = 78.9629;

  const fetchLocations = async () => {
    try {
      const adminId = await AsyncStorage.getItem("userId");

      if (!adminId) {
        Alert.alert("Error", "Admin ID not found");
        setLoading(false);
        return;
      }

      const result = await getActiveUsersCurrentLocations(adminId);
      // console.log("API Response:", result); // Debug log

      if (result.success && result.data) {
        const activeUsers = result.data.activeUsers || [];
        
        // Process ALL users - keep both valid and invalid location users
        const usersWithValidLocations = activeUsers.filter((user) => {
          if (!user.currentLocation) {
            // console.log(`User ${user.user?.name} has no location data`);
            return false;
          }
          
          const { latitude, longitude } = user.currentLocation;
          const isValid = isValidCoordinate(latitude, longitude);
          
          if (!isValid) {
            console.log(`User ${user.user?.name} has invalid coordinates: (${latitude}, ${longitude})`);
          }
          
          return isValid;
        });

        // console.log(`Total users: ${activeUsers.length}`);
        // console.log(`Users with valid locations: ${usersWithValidLocations.length}`);
        
        // if (usersWithValidLocations.length > 0) {
        //   console.log("Valid user locations:", usersWithValidLocations.map(u => ({
        //     name: u.user.name,
        //     lat: u.currentLocation.latitude,
        //     lng: u.currentLocation.longitude
        //   })));
        // }
        
        // Store all users - both valid and invalid
        setUsers(activeUsers);

        // Fit map to show all markers when map is ready and we have users
        // Use all users (with default coords for invalid ones) for bounds calculation
        const allUsersForBounds = activeUsers.map(user => {
          if (!user.currentLocation || !isValidCoordinate(user.currentLocation.latitude, user.currentLocation.longitude)) {
            return {
              ...user,
              currentLocation: { latitude: DEFAULT_LAT, longitude: DEFAULT_LNG }
            };
          }
          return user;
        });

        if (mapReady && allUsersForBounds.length > 0 && mapRef.current) {
          const bounds = calculateMapBounds(allUsersForBounds);
          if (bounds) {
            // console.log("Adjusting map to bounds:", bounds);
            mapRef.current.animateToRegion(bounds, 500);
          }
        } else if (mapReady) {
          // If no users at all, show default view
          const defaultRegion = {
            latitude: 20.5937,
            longitude: 78.9629,
            latitudeDelta: 8,
            longitudeDelta: 8
          };
          // console.log("No users, showing default view");
          mapRef.current.animateToRegion(defaultRegion, 500);
        }

      } else {
        console.log("Location API Error:", result.message);
      }

    } catch (error) {
      // console.log("Location fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (user) => {
    navigation.navigate("UserTrackingSummary", {
      userId: user.user.userId,
      userName: user.user.name
    });
  };

  const onMapReady = () => {
    setMapReady(true);
    // Initial map adjustment when map is ready
    if (users.length > 0 && mapRef.current) {
      const bounds = calculateMapBounds(users);
      if (bounds) {
        // console.log("Initial map adjustment to bounds:", bounds);
        mapRef.current.animateToRegion(bounds, 500);
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Live Tracking Users" />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3088C7" />
          <Text>Loading live users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get users with valid locations for map bounds calculation
  const usersWithValidLocations = users.filter((user) => {
    if (!user.currentLocation) return false;
    return isValidCoordinate(
      user.currentLocation.latitude,
      user.currentLocation.longitude
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        title="Live Tracking Users"
        onBackPress={() => navigation.goBack()}
      />

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        onMapReady={onMapReady}
        initialRegion={{
          latitude: 20.5937,
          longitude: 78.9629,
          latitudeDelta: 8,
          longitudeDelta: 8
        }}
        showsUserLocation={false}
        showsMyLocationButton={true}
      >
        {users.map((item, index) => {
          // Get coordinates - use default if invalid
          let latitude = item.currentLocation?.latitude || DEFAULT_LAT;
          let longitude = item.currentLocation?.longitude || DEFAULT_LNG;
          
          // Check if coordinates are valid
          const hasValidCoords = isValidCoordinate(latitude, longitude);
          
          // If invalid (0,0), use default location
          if (!hasValidCoords) {
            latitude = DEFAULT_LAT;
            longitude = DEFAULT_LNG;
          }
          
          const markerColor = getMarkerColor(item.user.userId, index);
          
          return (
            <Marker
              key={`marker-${item.user.userId}`}
              coordinate={{
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
              }}
              title={hasValidCoords ? item.user.name : `${item.user.name} (Location unavailable)`}
              description={hasValidCoords 
                ? `${item.user.email}${item.currentLocation?.address && item.currentLocation.address !== 'Unknown Address' ? '\n' + item.currentLocation.address : ''}`
                : `${item.user.email}\n⚠️ Location data not available`
              }
              pinColor={hasValidCoords ? markerColor : '#9E9E9E'} // Gray for invalid location
              onPress={() => handleMarkerPress(item)}
            />
          );
        })}
      </MapView>

      {/* Show count of active users */}
      {users.length > 0 && (
        <View style={styles.userCountBadge}>
          <Text style={styles.userCountText}>
            📍 {users.length} Active {users.length === 1 ? 'User' : 'Users'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default OngoingUsers;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  map: {
    flex: 1
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  userCountBadge: {
    position: 'absolute',
    top: 70,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 1
  },
  userCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  warningBadge: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 87, 34, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 1
  },
  warningText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center'
  }
});