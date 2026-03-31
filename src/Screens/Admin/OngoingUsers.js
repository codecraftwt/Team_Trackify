// import React, { useEffect, useState, useRef, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ActivityIndicator,
//   SafeAreaView,
//   Alert,
//   TouchableOpacity,
//   Modal,
//   ScrollView,
//   Dimensions
// } from "react-native";
// import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import CustomHeader from "../../Component/CustomHeader";
// import { getActiveUsersCurrentLocations } from "../../config/AdminService";

// // Predefined colors for different user markers
// const MARKER_COLORS = [
//   "#FF5722", // Deep Orange
//   "#2196F3", // Blue
//   "#4CAF50", // Green
//   "#9C27B0", // Purple
//   "#FFC107", // Amber
//   "#E91E63", // Pink
//   "#00BCD4", // Cyan
//   "#FF9800", // Orange
//   "#795548", // Brown
//   "#607D8B", // Blue Grey
// ];

// // Function to check if coordinates are valid (not zero and within range)
// const isValidCoordinate = (latitude, longitude) => {
//   // Check if coordinates are numbers and not null/undefined
//   if (typeof latitude !== 'number' || typeof longitude !== 'number') {
//     return false;
//   }
//   // Check if coordinates are within valid ranges
//   if (isNaN(latitude) || isNaN(longitude)) {
//     return false;
//   }
//   // Check if coordinates are not (0,0) which is invalid for real locations
//   if (latitude === 0 && longitude === 0) {
//     return false;
//   }
//   // Check if coordinates are within valid ranges
//   if (latitude < -90 || latitude > 90) {
//     return false;
//   }
//   if (longitude < -180 || longitude > 180) {
//     return false;
//   }
//   return true;
// };

// const OngoingUsers = ({ navigation }) => {
//   const [loading, setLoading] = useState(true);
//   const [activeUserLocations, setActiveUserLocations] = useState([]);
//   const [usersWithInvalidLocation, setUsersWithInvalidLocation] = useState([]);
//   const [showInvalidUsersModal, setShowInvalidUsersModal] = useState(false);
//   const [mapReady, setMapReady] = useState(false);
//   const mapRef = useRef(null);

//   // Function to get marker color based on index
//   const getMarkerColor = (index) => {
//     return MARKER_COLORS[index % MARKER_COLORS.length];
//   };

//   // Function to fit all markers on the map - IMPROVED VERSION
//   const fitAllMarkers = useCallback(() => {
//     if (!mapRef.current || activeUserLocations.length === 0) {
//       console.log("Cannot fit markers: mapRef or locations missing");
//       return;
//     }

//     // Get all valid coordinates
//     const coordinates = activeUserLocations.map(location => ({
//       latitude: location.latitude,
//       longitude: location.longitude,
//     }));

//     console.log(`Fitting ${coordinates.length} markers on map:`, coordinates);

//     // Add a small delay to ensure map is ready
//     setTimeout(() => {
//       if (mapRef.current && coordinates.length > 0) {
//         mapRef.current.fitToCoordinates(coordinates, {
//           edgePadding: {
//             top: 50,
//             right: 50,
//             bottom: 50,
//             left: 50
//           },
//           animated: true,
//         });

//         // Log after fit attempt
//         console.log("Map fit triggered");
//       }
//     }, 200);
//   }, [activeUserLocations]);

//   // Function to get center point of all markers (fallback if fitToCoordinates fails)
//   const getCenterPoint = useCallback(() => {
//     if (activeUserLocations.length === 0) return null;

//     let totalLat = 0;
//     let totalLng = 0;

//     activeUserLocations.forEach(location => {
//       totalLat += location.latitude;
//       totalLng += location.longitude;
//     });

//     return {
//       latitude: totalLat / activeUserLocations.length,
//       longitude: totalLng / activeUserLocations.length,
//     };
//   }, [activeUserLocations]);

//   // Fit markers when map is ready and data is loaded
//   useEffect(() => {
//     if (mapReady && activeUserLocations.length > 0) {
//       console.log("Map ready, fitting markers...");
//       fitAllMarkers();
//     }
//   }, [mapReady, activeUserLocations, fitAllMarkers]);

//   // Fallback: If map doesn't fit automatically, try again after data updates
//   useEffect(() => {
//     if (activeUserLocations.length > 0 && mapRef.current) {
//       const timer = setTimeout(() => {
//         fitAllMarkers();
//       }, 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [activeUserLocations, fitAllMarkers]);

//   const fetchLocations = useCallback(async () => {
//     try {
//       const adminId = await AsyncStorage.getItem("userId");

//       if (!adminId) {
//         Alert.alert("Error", "Admin ID not found");
//         setLoading(false);
//         return;
//       }

//       const result = await getActiveUsersCurrentLocations(adminId);
//       console.log("API Response:", result);

//       if (result.success && result.data) {
//         const activeUsers = result.data.activeUsers || [];

//         // Separate valid and invalid users
//         const validLocations = [];
//         const invalidUsers = [];

//         activeUsers.forEach((user, index) => {
//           // Check if user has location data
//           if (!user.currentLocation) {
//             invalidUsers.push({
//               userId: user.user.userId,
//               name: user.user.name,
//               email: user.user.email,
//               reason: "No location data"
//             });
//             return;
//           }

//           const { latitude, longitude } = user.currentLocation;
//           const isValid = isValidCoordinate(latitude, longitude);

//           if (isValid) {
//             // Add to valid locations for map display
//             validLocations.push({
//               userId: user.user.userId,
//               name: user.user.name,
//               email: user.user.email,
//               latitude: parseFloat(latitude),
//               longitude: parseFloat(longitude),
//               timestamp: user.currentLocation.timestamp,
//               lastUpdated: user.currentLocation.lastUpdated,
//               isOnline: user.currentLocation.isOnline
//             });
//           } else {
//             // Add to invalid users list for warning
//             invalidUsers.push({
//               userId: user.user.userId,
//               name: user.user.name,
//               email: user.user.email,
//               reason: latitude === 0 && longitude === 0 ? "Location (0,0) - User not sharing location" : "Invalid coordinates",
//               coordinates: { latitude, longitude }
//             });
//           }
//         });

//         console.log(`Found ${validLocations.length} users with valid locations`);
//         console.log(`Found ${invalidUsers.length} users with invalid locations`);

//         setActiveUserLocations(validLocations);
//         setUsersWithInvalidLocation(invalidUsers);

//         // If we have valid locations, trigger map fit after state update
//         if (validLocations.length > 0 && mapReady) {
//           setTimeout(() => fitAllMarkers(), 100);
//         }

//       } else {
//         console.log("Location API Error:", result.message);
//         setActiveUserLocations([]);
//       }
//     } catch (error) {
//       console.log("Location fetch error:", error);
//       setActiveUserLocations([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [mapReady, fitAllMarkers]);

//   // Poll for location updates every 10 seconds (reduced from 5 to save battery)
//   useEffect(() => {
//     let cancelled = false;
//     let intervalId;

//     const fetchData = async () => {
//       if (!cancelled) {
//         await fetchLocations();
//       }
//     };

//     // Initial fetch
//     fetchData();

//     // Set up polling
//     intervalId = setInterval(fetchData, 10000);

//     return () => {
//       cancelled = true;
//       if (intervalId) clearInterval(intervalId);
//     };
//   }, [fetchLocations]);

//   const handleMarkerPress = (user) => {
//     navigation.navigate("UserTrackingSummary", {
//       userId: user.userId,
//       userName: user.name
//     });
//   };

//   if (loading && activeUserLocations.length === 0) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <CustomHeader
//           title="Live Tracking Users"
//           onBackPress={() => navigation.goBack()}
//         />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#3088C7" />
//           <Text style={styles.loadingText}>Loading active users...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <CustomHeader
//         title="Live Tracking Users"
//         navigation={navigation}
//         showBackButton={true}
//         onBack={() => navigation.goBack()}
//       />

//       <View style={styles.mapContainer}>
//         {activeUserLocations.length === 0 ? (
//           <View style={styles.emptyContainer}>
//             <Text style={styles.emptyText}>
//               {usersWithInvalidLocation.length > 0
//                 ? "No users with valid location found"
//                 : "No active users found"}
//             </Text>
//             {usersWithInvalidLocation.length > 0 && (
//               <TouchableOpacity
//                 style={styles.viewInvalidButton}
//                 onPress={() => setShowInvalidUsersModal(true)}
//               >
//                 <Text style={styles.viewInvalidButtonText}>
//                   View {usersWithInvalidLocation.length} user(s) with issues
//                 </Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         ) : (
//           <>
//             <MapView
//               ref={mapRef}
//               style={styles.map}
//               provider={PROVIDER_GOOGLE}
//               onMapReady={() => {
//                 console.log("Map is ready");
//                 setMapReady(true);
//               }}
//               showsUserLocation={false}
//               showsMyLocationButton={true}
//               showsCompass={true}
//               zoomEnabled={true}
//               zoomControlEnabled={true}
//             >
//               {activeUserLocations.map((location, index) => (
//                 <Marker
//                   key={`marker-${location.userId}-${index}`}
//                   coordinate={{
//                     latitude: location.latitude,
//                     longitude: location.longitude,
//                   }}
//                   title={location.name}
//                   description={`${location.email}${location.isOnline !== undefined ? ` • ${location.isOnline ? '🟢 Online' : '🔴 Offline'}` : ''}`}
//                   pinColor={getMarkerColor(index)}
//                 // onPress={() => handleMarkerPress(location)}
//                 >
//                   {/* Optional: Custom marker view with online/offline indicator */}
//                   <View style={styles.markerContainer}>
//                     <View style={[styles.markerPin, { backgroundColor: getMarkerColor(index) }]}>
//                       <Text style={styles.markerText}>
//                         {location.name.charAt(0).toUpperCase()}
//                       </Text>
//                     </View>
//                     {location.isOnline && <View style={styles.onlineIndicator} />}
//                   </View>
//                 </Marker>
//               ))}
//             </MapView>

//             {/* Control buttons */}
//             <View style={styles.controlsContainer}>
//               {/* User count badge */}
//               <View style={styles.userCountBadge}>
//                 <Text style={styles.userCountText}>
//                   📍 {activeUserLocations.length} Active {activeUserLocations.length === 1 ? 'User' : 'Users'}
//                 </Text>
//               </View>

//               {/* Fit all markers button */}
//               {activeUserLocations.length > 1 && (
//                 <TouchableOpacity
//                   style={styles.fitButton}
//                   onPress={fitAllMarkers}
//                   activeOpacity={0.8}
//                 >
//                   <Text style={styles.fitButtonText}>📍 Fit All</Text>
//                 </TouchableOpacity>
//               )}
//             </View>

//             {/* Warning badge for users with invalid locations */}
//             {usersWithInvalidLocation.length > 0 && (
//               <TouchableOpacity
//                 style={styles.warningBadge}
//                 onPress={() => setShowInvalidUsersModal(true)}
//                 activeOpacity={0.8}
//               >
//                 <Text style={styles.warningBadgeText}>
//                   ⚠️ {usersWithInvalidLocation.length} User{usersWithInvalidLocation.length > 1 ? 's' : ''} with Invalid Location
//                 </Text>
//               </TouchableOpacity>
//             )}
//           </>
//         )}
//       </View>

//       {/* Modal to show users with invalid locations */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={showInvalidUsersModal}
//         onRequestClose={() => setShowInvalidUsersModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>
//                 ⚠️ Users with Location Issues ({usersWithInvalidLocation.length})
//               </Text>
//               <TouchableOpacity
//                 onPress={() => setShowInvalidUsersModal(false)}
//                 style={styles.closeButton}
//               >
//                 <Text style={styles.closeButtonText}>✕</Text>
//               </TouchableOpacity>
//             </View>

//             <ScrollView style={styles.modalContent}>
//               {usersWithInvalidLocation.map((user, index) => (
//                 <View key={`invalid-user-${user.userId}-${index}`} style={styles.invalidUserItem}>
//                   <View style={styles.invalidUserInfo}>
//                     <Text style={styles.invalidUserName}>{user.name}</Text>
//                     <Text style={styles.invalidUserEmail}>{user.email}</Text>
//                     <Text style={styles.invalidUserReason}>
//                       Reason: {user.reason}
//                       {user.coordinates && (
//                         ` (${user.coordinates.latitude}, ${user.coordinates.longitude})`
//                       )}
//                     </Text>
//                   </View>
//                 </View>
//               ))}
//             </ScrollView>

//             <TouchableOpacity
//               style={styles.modalCloseButton}
//               onPress={() => setShowInvalidUsersModal(false)}
//             >
//               <Text style={styles.modalCloseButtonText}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff"
//   },
//   mapContainer: {
//     flex: 1,
//     overflow: 'hidden',
//   },
//   map: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f5f5f5"
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f5f5f5",
//     padding: 20,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   viewInvalidButton: {
//     backgroundColor: '#FF5722',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 8,
//   },
//   viewInvalidButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: 'bold',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 14,
//     color: 'grey',
//   },
//   controlsContainer: {
//     position: 'absolute',
//     top: 70,
//     right: 10,
//     alignItems: 'flex-end',
//     zIndex: 1,
//   },
//   userCountBadge: {
//     backgroundColor: 'rgba(0,0,0,0.7)',
//     borderRadius: 20,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     marginBottom: 8,
//   },
//   userCountText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: 'bold'
//   },
//   fitButton: {
//     backgroundColor: 'rgba(48, 136, 199, 0.9)',
//     borderRadius: 20,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   fitButtonText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: 'bold'
//   },
//   warningBadge: {
//     position: 'absolute',
//     bottom: 20,
//     left: 10,
//     right: 10,
//     backgroundColor: 'rgba(255, 87, 34, 0.95)',
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     zIndex: 1,
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//   },
//   warningBadgeText: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: 'bold',
//     textAlign: 'center'
//   },
//   markerContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   markerPin: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#fff',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 2,
//     elevation: 3,
//   },
//   markerText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: -2,
//     right: -2,
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: '#4CAF50',
//     borderWidth: 2,
//     borderColor: '#fff',
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     width: '90%',
//     maxHeight: '80%',
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#FF5722',
//   },
//   closeButton: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: '#f0f0f0',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   closeButtonText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#666',
//   },
//   modalContent: {
//     padding: 20,
//     maxHeight: 400,
//   },
//   invalidUserItem: {
//     marginBottom: 15,
//     paddingBottom: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   invalidUserInfo: {
//     flex: 1,
//   },
//   invalidUserName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 4,
//   },
//   invalidUserEmail: {
//     fontSize: 13,
//     color: '#666',
//     marginBottom: 4,
//   },
//   invalidUserReason: {
//     fontSize: 12,
//     color: '#FF5722',
//     marginTop: 4,
//   },
//   modalCloseButton: {
//     backgroundColor: '#FF5722',
//     padding: 15,
//     borderRadius: 10,
//     margin: 20,
//     alignItems: 'center',
//   },
//   modalCloseButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });

// export default OngoingUsers;

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions
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
];

// Function to check if coordinates are valid (not zero and within range)
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

const OngoingUsers = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [activeUserLocations, setActiveUserLocations] = useState([]);
  const [usersWithInvalidLocation, setUsersWithInvalidLocation] = useState([]);
  const [showInvalidUsersModal, setShowInvalidUsersModal] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false); // Track if user has manually zoomed
  const mapRef = useRef(null);
  const isFirstLoad = useRef(true); // Track if it's the first load

  // Function to get marker color based on index
  const getMarkerColor = (index) => {
    return MARKER_COLORS[index % MARKER_COLORS.length];
  };

  // Function to fit all markers on the map - IMPROVED VERSION
  const fitAllMarkers = useCallback((force = false) => {
    // Only auto-fit if user hasn't interacted OR force is true (manual button press)
    if (!force && hasUserInteracted) {
      console.log("Auto-zoom prevented: User has manually interacted with the map");
      return;
    }
    
    if (!mapRef.current || activeUserLocations.length === 0) {
      console.log("Cannot fit markers: mapRef or locations missing");
      return;
    }

    // Get all valid coordinates
    const coordinates = activeUserLocations.map(location => ({
      latitude: location.latitude,
      longitude: location.longitude,
    }));

    console.log(`Fitting ${coordinates.length} markers on map:`, coordinates);

    // Add a small delay to ensure map is ready
    setTimeout(() => {
      if (mapRef.current && coordinates.length > 0) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50
          },
          animated: true,
        });

        // Log after fit attempt
        console.log("Map fit triggered");
      }
    }, 200);
  }, [activeUserLocations, hasUserInteracted]);

  // Function to get center point of all markers (fallback if fitToCoordinates fails)
  const getCenterPoint = useCallback(() => {
    if (activeUserLocations.length === 0) return null;

    let totalLat = 0;
    let totalLng = 0;

    activeUserLocations.forEach(location => {
      totalLat += location.latitude;
      totalLng += location.longitude;
    });

    return {
      latitude: totalLat / activeUserLocations.length,
      longitude: totalLng / activeUserLocations.length,
    };
  }, [activeUserLocations]);

  // Fit markers when map is ready and data is loaded (only on first load or when returning to screen)
  useEffect(() => {
    if (mapReady && activeUserLocations.length > 0 && !hasUserInteracted) {
      console.log("Map ready, fitting markers on initial load...");
      fitAllMarkers();
    }
  }, [mapReady, activeUserLocations, fitAllMarkers, hasUserInteracted]);

  // Fallback: If map doesn't fit automatically, try again after data updates (only if no user interaction)
  useEffect(() => {
    if (activeUserLocations.length > 0 && mapRef.current && !hasUserInteracted) {
      const timer = setTimeout(() => {
        fitAllMarkers();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeUserLocations, fitAllMarkers, hasUserInteracted]);

  const fetchLocations = useCallback(async () => {
    try {
      const adminId = await AsyncStorage.getItem("userId");

      if (!adminId) {
        Alert.alert("Error", "Admin ID not found");
        setLoading(false);
        return;
      }

      const result = await getActiveUsersCurrentLocations(adminId);
      console.log("API Response:", result);

      if (result.success && result.data) {
        const activeUsers = result.data.activeUsers || [];

        // Separate valid and invalid users
        const validLocations = [];
        const invalidUsers = [];

        activeUsers.forEach((user, index) => {
          // Check if user has location data
          if (!user.currentLocation) {
            invalidUsers.push({
              userId: user.user.userId,
              name: user.user.name,
              email: user.user.email,
              reason: "No location data"
            });
            return;
          }

          const { latitude, longitude } = user.currentLocation;
          const isValid = isValidCoordinate(latitude, longitude);

          if (isValid) {
            // Add to valid locations for map display
            validLocations.push({
              userId: user.user.userId,
              name: user.user.name,
              email: user.user.email,
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              timestamp: user.currentLocation.timestamp,
              lastUpdated: user.currentLocation.lastUpdated,
              isOnline: user.currentLocation.isOnline
            });
          } else {
            // Add to invalid users list for warning
            invalidUsers.push({
              userId: user.user.userId,
              name: user.user.name,
              email: user.user.email,
              reason: latitude === 0 && longitude === 0 ? "Location (0,0) - User not sharing location" : "Invalid coordinates",
              coordinates: { latitude, longitude }
            });
          }
        });

        console.log(`Found ${validLocations.length} users with valid locations`);
        console.log(`Found ${invalidUsers.length} users with invalid locations`);

        setActiveUserLocations(validLocations);
        setUsersWithInvalidLocation(invalidUsers);

        // If we have valid locations, trigger map fit after state update (only if no user interaction)
        if (validLocations.length > 0 && mapReady && !hasUserInteracted) {
          setTimeout(() => fitAllMarkers(), 100);
        }

      } else {
        console.log("Location API Error:", result.message);
        setActiveUserLocations([]);
      }
    } catch (error) {
      console.log("Location fetch error:", error);
      setActiveUserLocations([]);
    } finally {
      setLoading(false);
    }
  }, [mapReady, fitAllMarkers, hasUserInteracted]);

  // Poll for location updates every 10 seconds (reduced from 5 to save battery)
  useEffect(() => {
    let cancelled = false;
    let intervalId;

    const fetchData = async () => {
      if (!cancelled) {
        await fetchLocations();
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling
    intervalId = setInterval(fetchData, 10000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchLocations]);

  // Reset user interaction flag when navigating back to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log("Screen focused - resetting user interaction flag");
      setHasUserInteracted(false);
    });

    return unsubscribe;
  }, [navigation]);

  const handleMarkerPress = (user) => {
    navigation.navigate("UserTrackingSummary", {
      userId: user.userId,
      userName: user.name
    });
  };

  // Handle manual zoom by user - detect when user interacts with map
  const handleMapInteraction = () => {
    if (!hasUserInteracted) {
      console.log("User manually interacted with the map - disabling auto-zoom");
      setHasUserInteracted(true);
    }
  };

  // Manual fit button handler that always works regardless of user interaction
  const handleManualFit = () => {
    console.log("Manual fit button pressed - forcing map to fit all markers");
    fitAllMarkers(true);
  };

  if (loading && activeUserLocations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader
          title="Live Tracking Users"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3088C7" />
          <Text style={styles.loadingText}>Loading active users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        title="Live Tracking Users"
        navigation={navigation}
        showBackButton={true}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.mapContainer}>
        {activeUserLocations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {usersWithInvalidLocation.length > 0
                ? "No users with valid location found"
                : "No active users found"}
            </Text>
            {usersWithInvalidLocation.length > 0 && (
              <TouchableOpacity
                style={styles.viewInvalidButton}
                onPress={() => setShowInvalidUsersModal(true)}
              >
                <Text style={styles.viewInvalidButtonText}>
                  View {usersWithInvalidLocation.length} user(s) with issues
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              onMapReady={() => {
                console.log("Map is ready");
                setMapReady(true);
              }}
              showsUserLocation={false}
              showsMyLocationButton={true}
              showsCompass={true}
              zoomEnabled={true}
              zoomControlEnabled={true}
              onTouchStart={handleMapInteraction} // Detect when user touches the map
              onRegionChangeComplete={handleMapInteraction} // Detect when user finishes zooming/panning
            >
              {activeUserLocations.map((location, index) => (
                <Marker
                  key={`marker-${location.userId}-${index}`}
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title={location.name}
                  description={`${location.email}${location.isOnline !== undefined ? ` • ${location.isOnline ? '🟢 Online' : '🔴 Offline'}` : ''}`}
                  pinColor={getMarkerColor(index)}
                  onPress={() => {
                    handleMapInteraction(); // Marker press also counts as user interaction
                    handleMarkerPress(location);
                  }}
                >
                  {/* Optional: Custom marker view with online/offline indicator */}
                  <View style={styles.markerContainer}>
                    <View style={[styles.markerPin, { backgroundColor: getMarkerColor(index) }]}>
                      <Text style={styles.markerText}>
                        {location.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    {location.isOnline && <View style={styles.onlineIndicator} />}
                  </View>
                </Marker>
              ))}
            </MapView>

            {/* Control buttons */}
            <View style={styles.controlsContainer}>
              {/* User count badge */}
              <View style={styles.userCountBadge}>
                <Text style={styles.userCountText}>
                  📍 {activeUserLocations.length} Active {activeUserLocations.length === 1 ? 'User' : 'Users'}
                </Text>
              </View>

              {/* Fit all markers button - always works */}
              {activeUserLocations.length > 1 && (
                <TouchableOpacity
                  style={styles.fitButton}
                  onPress={handleManualFit}
                  activeOpacity={0.8}
                >
                  <Text style={styles.fitButtonText}>📍 Fit All</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Warning badge for users with invalid locations */}
            {usersWithInvalidLocation.length > 0 && (
              <TouchableOpacity
                style={styles.warningBadge}
                onPress={() => setShowInvalidUsersModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.warningBadgeText}>
                  ⚠️ {usersWithInvalidLocation.length} User{usersWithInvalidLocation.length > 1 ? 's' : ''} with Invalid Location
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Modal to show users with invalid locations */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showInvalidUsersModal}
        onRequestClose={() => setShowInvalidUsersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                ⚠️ Users with Location Issues ({usersWithInvalidLocation.length})
              </Text>
              <TouchableOpacity
                onPress={() => setShowInvalidUsersModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {usersWithInvalidLocation.map((user, index) => (
                <View key={`invalid-user-${user.userId}-${index}`} style={styles.invalidUserItem}>
                  <View style={styles.invalidUserInfo}>
                    <Text style={styles.invalidUserName}>{user.name}</Text>
                    <Text style={styles.invalidUserEmail}>{user.email}</Text>
                    <Text style={styles.invalidUserReason}>
                      Reason: {user.reason}
                      {user.coordinates && (
                        ` (${user.coordinates.latitude}, ${user.coordinates.longitude})`
                      )}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowInvalidUsersModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5"
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  viewInvalidButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewInvalidButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: 'grey',
  },
  controlsContainer: {
    position: 'absolute',
    top: 70,
    right: 10,
    alignItems: 'flex-end',
    zIndex: 1,
  },
  userCountBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  userCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  fitButton: {
    backgroundColor: 'rgba(48, 136, 199, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fitButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  warningBadge: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 87, 34, 0.95)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  warningBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  markerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  modalContent: {
    padding: 20,
    maxHeight: 400,
  },
  invalidUserItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  invalidUserInfo: {
    flex: 1,
  },
  invalidUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  invalidUserEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  invalidUserReason: {
    fontSize: 12,
    color: '#FF5722',
    marginTop: 4,
  },
  modalCloseButton: {
    backgroundColor: '#FF5722',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OngoingUsers;