import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as TrackingService from '../../services/TrackingService';
import { getAllLocationsForSession } from '../../services/OfflineLocationStore';
import FancyAlert from '../FancyAlert';
import Api from '../../config/Api';
import CustomHeader from '../../Component/CustomHeader';

const { width } = Dimensions.get('window');

// Simple haversine-distance helper (meters)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const normalizeTimestamp = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 0 && value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string') {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      return asNumber > 0 && asNumber < 1e12 ? asNumber * 1000 : asNumber;
    }
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return Date.now();
};

const MAX_TELEPORT_DISTANCE_METERS = 500;
const MAX_REALISTIC_SPEED_MPS = 70;

/**
 * Splits locations into contiguous segments by isOnline status and also
 * breaks segments when there is a large jump, so we don't draw a long
 * straight polyline between distant points (e.g. end point → last foreground point).
 */
const segmentLocationsByOnlineStatus = (locations) => {
  if (!locations || locations.length < 2) return [];

  const segments = [];
  let currentSegment = {
    coordinates: [
      { latitude: locations[0].latitude, longitude: locations[0].longitude },
    ],
    isOnline: locations[0]?.isOnline ?? true,
  };

  for (let i = 1; i < locations.length; i++) {
    const loc = locations[i];
    const locOnline = loc?.isOnline ?? true;
    const point = { latitude: loc.latitude, longitude: loc.longitude };

    const prevPoint =
      currentSegment.coordinates[currentSegment.coordinates.length - 1];
    const distance = calculateDistance(
      prevPoint.latitude,
      prevPoint.longitude,
      point.latitude,
      point.longitude
    );
    const prevLoc = locations[i - 1];
    const prevTimestamp = normalizeTimestamp(prevLoc?.timestamp);
    const currentTimestamp = normalizeTimestamp(loc?.timestamp);
    const elapsedMs = Math.max(1, currentTimestamp - prevTimestamp);
    const speedMps = distance / (elapsedMs / 1000);
    const looksLikeTeleport =
      distance > MAX_TELEPORT_DISTANCE_METERS && speedMps > MAX_REALISTIC_SPEED_MPS;

    // Keep long background gaps connected. Split only impossible jumps.
    if (looksLikeTeleport) {
      if (currentSegment.coordinates.length >= 2) {
        segments.push({
          ...currentSegment,
          coordinates: [...currentSegment.coordinates],
        });
      }
      currentSegment = {
        coordinates: [point],
        isOnline: locOnline,
      };
      continue;
    }

    if (locOnline === currentSegment.isOnline) {
      currentSegment.coordinates.push(point);
    } else {
      // Status changed (online/offline) but the jump is small enough –
      // finish current segment and start a new one that begins from the last point.
      if (currentSegment.coordinates.length >= 2) {
        segments.push({
          ...currentSegment,
          coordinates: [...currentSegment.coordinates],
        });
      }
      const lastCoord =
        currentSegment.coordinates[currentSegment.coordinates.length - 1];
      currentSegment = {
        coordinates: [lastCoord, point],
        isOnline: locOnline,
      };
    }
  }

  if (currentSegment.coordinates.length >= 2) {
    segments.push(currentSegment);
  }

  return segments;
};

const buildPhotoUrl = (rawUrl) => {
  if (!rawUrl) return null;
  if (typeof rawUrl !== 'string') rawUrl = String(rawUrl);
  // Local file path (offline-stored photo)
  if (rawUrl.startsWith('file://') || rawUrl.startsWith('/')) {
    return rawUrl.startsWith('file://') ? rawUrl : `file://${rawUrl}`;
  }
  // Remote URL
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }
  // Relative server path
  const base = (Api?.defaults?.baseURL || '').replace(/\/+$/, '');
  const path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
  return `${base}${path}`;
};

const TrackingSessionDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const sessionId = route?.params?.sessionId;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'error' });
  const mapRef = React.useRef(null);

  // Modal state for marker details
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);

  const load = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const data = await TrackingService.getSessionDetailsOfflineFirst(sessionId);

      // Enrich/override locations with offline store so that we always have
      // correct isOnline flags (blue for online, red for offline) and
      // consistent ordering, even for sessions that were started online.
      let enriched = data;
      try {
        const localLocations = await getAllLocationsForSession(sessionId);
        if (Array.isArray(localLocations) && localLocations.length > 0) {
          // IMPORTANT:
          // Keep server location fields (especially `photo` / `photoUrl`) so the
          // Start marker modal can display the correct image.
          // We only overlay coordinate/meta fields and isOnline from offline DB.
          const roundKey = (n, digits = 6) => {
            const x = Number(n);
            if (!Number.isFinite(x)) return null;
            return x.toFixed(digits);
          };

          const makeKey = (p) => {
            const latKey = roundKey(p?.latitude);
            const lngKey = roundKey(p?.longitude);
            if (!latKey || !lngKey) return null;
            const ts = normalizeTimestamp(p?.timestamp ?? p?.time ?? p?.createdAt);
            return `${latKey}|${lngKey}|${ts}`;
          };

          const localByKey = new Map(
            localLocations
              .map((p) => {
                const key = makeKey(p);
                return key ? [key, p] : null;
              })
              .filter(Boolean),
          );

          const usedLocalKeys = new Set();

          const serverLocations = Array.isArray(data?.locations) ? data.locations : [];
          const merged = serverLocations.map((serverLoc) => {
            const key = makeKey(serverLoc);
            const match = key ? localByKey.get(key) : null;
            if (!match) return serverLoc;

            if (key) usedLocalKeys.add(key);

            return {
              ...serverLoc, // preserve `photo`, `photoUrl`, etc.
              latitude: match.latitude,
              longitude: match.longitude,
              timestamp: match.timestamp,
              address: match.address ?? serverLoc.address,
              road: match.road ?? serverLoc.road,
              area: match.area ?? serverLoc.area,
              accuracy: match.accuracy ?? serverLoc.accuracy,
              heading: match.heading ?? serverLoc.heading,
              speed: match.speed ?? serverLoc.speed,
              batteryPercentage: match.batteryPercentage ?? serverLoc.batteryPercentage,
              source: match.source ?? serverLoc.source,
              remark: match.remark ?? serverLoc.remark,
              amount: match.amount ?? serverLoc.amount,
              photoUri: match.photoUri ?? serverLoc.photoUri,
              isOnline: match.isOnline ?? serverLoc.isOnline,
            };
          });

          // Add any local-only points (not present in server response),
          // so offline photos don't disappear.
          for (const p of localLocations) {
            const key = makeKey(p);
            if (!key || usedLocalKeys.has(key)) continue;
            merged.push({
              id: p.id,
              latitude: p.latitude,
              longitude: p.longitude,
              timestamp: p.timestamp,
              address: p.address,
              road: p.road,
              area: p.area,
              accuracy: p.accuracy,
              heading: p.heading,
              speed: p.speed,
              batteryPercentage: p.batteryPercentage,
              source: p.source,
              remark: p.remark,
              amount: p.amount,
              photoUri: p.photoUri,
              isOnline: p.isOnline ?? false,
            });
          }

          enriched = { ...data, locations: merged };
        }
      } catch (offlineError) {
        console.warn(
          'TrackingSessionDetail: failed to merge offline locations:',
          offlineError?.message || String(offlineError),
        );
      }

      setDetail(enriched);
    } catch (e) {
      console.error('getSessionDetails failed:', e);
      setAlertConfig({
        title: 'Error',
        message: e?.message || 'Failed to load session.',
        type: 'error',
      });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const locations = detail?.locations ?? [];

  // Normalise & sort locations so that first point is the true start
  // Find start location (source === 'start') or use earliest timestamp
  const startLocationFromSource = locations.find((l) => l?.source === 'start');
  const locationsWithCoords = locations.filter(
    (l) => l?.latitude != null && l?.longitude != null
  );
  const sortedLocationsWithCoords = [...locationsWithCoords].sort((a, b) => {
    const ta = normalizeTimestamp(a.timestamp ?? a.time ?? a.createdAt);
    const tb = normalizeTimestamp(b.timestamp ?? b.time ?? b.createdAt);
    return ta - tb;
  });

  // Use source='start' location if available, otherwise use the first sorted location
  // Also, if there's a location with photo, prefer that for the start marker
  const startLocationWithPhoto = locations.find(
    (l) => l?.photo || l?.photoUrl || l?.photoUri || l?.photoPath
  );
  
  // Determine the actual start location to display: prefer source='start', then any location with photo, then first by timestamp
  let startLocation = startLocationFromSource || startLocationWithPhoto || (sortedLocationsWithCoords.length > 0 ? sortedLocationsWithCoords[0] : null);

  // If startLocation has no photo but there's another location with photo that has similar timestamp,
  // use that photo location instead
  const hasPhotoInStart = startLocation?.photo || startLocation?.photoUrl || startLocation?.photoUri || startLocation?.photoPath;
  if (!hasPhotoInStart && startLocationWithPhoto && startLocationWithPhoto !== startLocation) {
    // Use the photo from the photo location but keep start location's coordinates/timestamp
    startLocation = {
      ...startLocation,
      photo: startLocationWithPhoto.photo,
      photoUrl: startLocationWithPhoto.photoUrl,
      photoUri: startLocationWithPhoto.photoUri,
      photoPath: startLocationWithPhoto.photoPath,
    };
  }

  const coordinates = sortedLocationsWithCoords.map((l) => ({
    latitude: Number(l.latitude),
    longitude: Number(l.longitude),
  }));

  const startCoordinate = startLocation
    ? { latitude: Number(startLocation.latitude), longitude: Number(startLocation.longitude) }
    : null;

  const endCoordinate =
    coordinates.length > 0 &&
      Number.isFinite(coordinates[coordinates.length - 1].latitude) &&
      Number.isFinite(coordinates[coordinates.length - 1].longitude)
      ? coordinates[coordinates.length - 1]
      : null;

  const polylineSegments = useMemo(
    () =>
      segmentLocationsByOnlineStatus(
        sortedLocationsWithCoords.map((l) => ({
          latitude: Number(l.latitude),
          longitude: Number(l.longitude),
          timestamp: normalizeTimestamp(l.timestamp ?? l.time ?? l.createdAt),
          isOnline: l?.isOnline ?? true,
        }))
      ),
    [sortedLocationsWithCoords]
  );

  // Find the end location (source === 'end')
  const endLocation = locations.find((l) => l?.source === 'end');

  // If no end location found by source, use the last location (sorted by timestamp)
  const endFromLastPoint = sortedLocationsWithCoords.length > 0
    ? sortedLocationsWithCoords[sortedLocationsWithCoords.length - 1]
    : null;

  // Find any location with a photo that could be the end location
  // Priority: source='end' > any location with photo > last point by timestamp
  const endLocationWithPhoto = locations.find(
    (l) => (l?.photo || l?.photoUrl || l?.photoUri || l?.photoPath) && l?.source !== 'start'
  );

  // Determine final end location - prefer source='end', then any photo location, then last point
  let finalEndLocation = endLocation || endFromLastPoint;

  // If final end location has no photo but there's a photo location that's not the start,
  // use that photo for the end marker
  const hasPhotoInEnd = finalEndLocation?.photo || finalEndLocation?.photoUrl || finalEndLocation?.photoUri || finalEndLocation?.photoPath;
  if (!hasPhotoInEnd && endLocationWithPhoto && endLocationWithPhoto !== startLocation) {
    finalEndLocation = {
      ...finalEndLocation,
      photo: endLocationWithPhoto.photo,
      photoUrl: endLocationWithPhoto.photoUrl,
      photoUri: endLocationWithPhoto.photoUri,
      photoPath: endLocationWithPhoto.photoPath,
    };
  }

  const photoLocations = locations.filter(
    (l) =>
      (l?.photoUrl || l?.photo || l?.photoPath || l?.photoUri) && // Check all possible photo fields
      l?.latitude != null &&
      l?.longitude != null
  );

  // Handle marker press to show modal
  // const handleMarkerPress = useCallback((markerType, location) => {
  //   if (!location) return;

  //   // Get photo URI from various possible fields
  //   const rawPhotoUri = location.photoUri || location.photoUrl || location.photo || location.photoPath || null;

  //   // Build the proper photo URL
  //   let photoUrl = null;
  //   if (rawPhotoUri) {
  //     if (rawPhotoUri.startsWith('file://') || rawPhotoUri.startsWith('/')) {
  //       photoUrl = rawPhotoUri.startsWith('file://') ? rawPhotoUri : `file://${rawPhotoUri}`;
  //     } else if (rawPhotoUri.startsWith('http://') || rawPhotoUri.startsWith('https://')) {
  //       photoUrl = rawPhotoUri;
  //     } else {
  //       // Relative path - prepend base URL
  //       const base = (Api?.defaults?.baseURL || '').replace(/\/+$/, '');
  //       photoUrl = `${base}/${rawPhotoUri}`;
  //     }
  //   }

  //   const markerData = {
  //     type: markerType,
  //     latitude: Number(location.latitude),
  //     longitude: Number(location.longitude),
  //     timestamp: location.timestamp,
  //     photoUri: rawPhotoUri,
  //     photoUrl: photoUrl,  // Pre-built URL for display
  //     remark: location.remark,
  //     source: location.source,
  //   };
  //   setSelectedMarker(markerData);
  //   setModalVisible(true);
  // }, [setSelectedMarker, setModalVisible]);
  const handleMarkerPress = useCallback((markerType, location) => {
    if (!location) return;

    // Debug log to see what we're receiving
    console.log('Marker pressed - location data:', {
      photo: location.photo,
      photoUri: location.photoUri,
      photoUrl: location.photoUrl,
      hasPhoto: !!(location.photo || location.photoUri || location.photoUrl),
      location
    });

    // Get photo URI from various possible fields (prioritize 'photo' as it's most common)
    let rawPhotoUri = null;
    if (location.photo) {
      rawPhotoUri = location.photo;
    } else if (location.photoUri) {
      rawPhotoUri = location.photoUri;
    } else if (location.photoUrl) {
      rawPhotoUri = location.photoUrl;
    } else if (location.photoPath) {
      rawPhotoUri = location.photoPath;
    }

    // Build the proper photo URL
    let photoUrl = null;
    if (rawPhotoUri) {
      // Make modal image loading resilient to string whitespace / unexpected types.
      rawPhotoUri =
        typeof rawPhotoUri === 'string' ? rawPhotoUri.trim() : String(rawPhotoUri).trim();
      if (!rawPhotoUri) rawPhotoUri = null;
    }
    if (rawPhotoUri) {
      // Check if it's already a full URL
      if (rawPhotoUri.startsWith('http://') || rawPhotoUri.startsWith('https://')) {
        photoUrl = rawPhotoUri;
      }
      // Check if it's a local file path
      else if (rawPhotoUri.startsWith('file://') || rawPhotoUri.startsWith('/')) {
        photoUrl = rawPhotoUri.startsWith('file://') ? rawPhotoUri : `file://${rawPhotoUri}`;
      }
      // Relative path - prepend base URL
      else {
        const base = (Api?.defaults?.baseURL || '').replace(/\/+$/, '');
        photoUrl = `${base}/${rawPhotoUri}`;
      }
    }

    console.log('Built photo URL:', photoUrl);

    const markerData = {
      type: markerType,
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      timestamp: location.timestamp,
      photoUri: rawPhotoUri,
      photoUrl: photoUrl,  // Pre-built URL for display
      remark: location.remark,
      source: location.source,
    };

    setSelectedMarker(markerData);
    setModalVisible(true);
  }, [setSelectedMarker, setModalVisible]);

const renderRouteMarkers = (keyPrefix) => (
  <>
    {startCoordinate && (
      <Marker
        key={`${keyPrefix}-start`}
        coordinate={startCoordinate}
        pinColor="green"
        title="Start"
        description={startLocation ? new Date(normalizeTimestamp(startLocation.timestamp)).toLocaleString() : 'Start point'}
        zIndex={1000}
        onPress={() => {
          console.log('Start marker pressed - location data:', startLocation);
          handleMarkerPress('start', startLocation);
        }}
      />
    )}
    {finalEndLocation && (
      <Marker
        key={`${keyPrefix}-end`}
        coordinate={{
          latitude: Number(finalEndLocation.latitude),
          longitude: Number(finalEndLocation.longitude),
        }}
        pinColor="red"
        title="End"
        description={new Date(normalizeTimestamp(finalEndLocation.timestamp)).toLocaleString()}
        zIndex={1001}
        onPress={() => {
          console.log('End marker pressed - location data:', finalEndLocation);
          handleMarkerPress('end', finalEndLocation);
        }}
      />
    )}
    {photoLocations.map((loc, idx) => (
      <Marker
        key={loc.id ?? `${keyPrefix}-photo-${idx}`}
        coordinate={{
          latitude: Number(loc.latitude),
          longitude: Number(loc.longitude),
        }}
        pinColor="#FF8C00"
        title="Photo Location"
        description={
          loc.remark != null && String(loc.remark).trim() !== '' 
            ? String(loc.remark).trim() 
            : 'Photo point'
        }
        onPress={() => {
          console.log('Photo marker pressed - location data:', loc);
          handleMarkerPress('photo', loc);
        }}
      />
    ))}
  </>
);

  const locationsWithPhotoOrRemark = locations.filter(
    (l) =>
      (l?.photoUrl ?? l?.photo ?? l?.photoPath ?? l?.photoUri) ||
      (l?.remark != null && String(l.remark).trim() !== '') ||
      (l?.amount != null && String(l.amount).trim() !== '')
  );

  const handlePhotoCardPress = useCallback(
    (loc) => {
      if (!loc || !mapRef.current) return;
      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      mapRef.current.animateCamera(
        {
          center: {
            latitude: lat,
            longitude: lng,
          },
          pitch: 0,
          heading: 0,
          zoom: 18,
        },
        { duration: 800 }
      );
    },
    [mapRef]
  );

  useEffect(() => {
    if (!detail || coordinates.length < 2 || !mapRef.current) return;
    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
      animated: true,
    });
  }, [detail?.id, coordinates.length]);

  if (!sessionId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Missing session</Text>
      </View>
    );
  }

  if (loading && !detail) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#438AFF" />
        <Text style={styles.loadingText}>Loading session…</Text>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Session not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const region = coordinates.length
    ? {
      latitude: coordinates[0].latitude,
      longitude: coordinates[0].longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }
    : null;

  const userName = detail?.userName || detail?.employeeName || '';

  return (
    <View style={styles.container}>
      <CustomHeader
        navigation={navigation}
        title={userName || 'Session Detail'}
        showBackButton={true}
        showCrossButton={true}
      />

      {region && coordinates.length > 0 ? (
        <View style={styles.content}>
          <View style={styles.mapTopContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={region}
              mapType="standard"
              showsUserLocation={false}
            >
              {polylineSegments.map((seg, idx) => (
                <Polyline
                  key={`polyline-${idx}`}
                  coordinates={seg.coordinates}
                  strokeColor={seg.isOnline ? '#438AFF' : '#DC2626'}
                  strokeWidth={4}
                />
              ))}
              {renderRouteMarkers('main')}
            </MapView>
          </View>

          {locationsWithPhotoOrRemark.length > 0 && (
            <View style={styles.photoCarouselSection}>
              <FlatList
                style={{ flex: 1 }}
                horizontal
                data={locationsWithPhotoOrRemark}
                keyExtractor={(loc, index) => String(loc.id ?? index)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoCarouselContent}
                renderItem={({ item: loc }) => {
                  const rawPhoto =
                    loc.photoUrl ?? loc.photo ?? loc.photoPath ?? loc.photoUri;
                  const photoUrl = buildPhotoUrl(rawPhoto);
                  const remark =
                    loc.remark != null ? String(loc.remark).trim() : '';
                  const label = remark || 'Location Name';

                  return (
                    <TouchableOpacity
                      style={styles.photoCard}
                      activeOpacity={0.9}
                      onPress={() => {
                        if (photoUrl) {
                          handlePhotoCardPress(loc);
                          navigation.navigate('FullImageScreen', {
                            imageUrl: photoUrl,
                          });
                        }
                      }}
                    >
                      {photoUrl ? (
                        <Image
                          source={{ uri: photoUrl }}
                          style={styles.photoCardImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.photoCardImage,
                            styles.photoAvatarPlaceholder,
                          ]}
                        >
                          <Icon name="image" size={24} color="#9ca3af" />
                        </View>
                      )}
                      <View style={styles.photoCardInfo}>
                        <Text style={styles.photoCardLabelTitle}>
                          Location Name:{' '}
                        </Text>
                        <Text
                          style={styles.photoCardLabelValue}
                          numberOfLines={1}
                        >
                          {label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}
        </View>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.errorText}>No route data</Text>
        </View>
      )}

      {/* Marker Detail Modal */}
      {modalVisible && selectedMarker && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedMarker.type === 'start' ? 'Start Location' :
                  selectedMarker.type === 'end' ? 'End Location' : 'Photo Location'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Icon name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedMarker.photoUrl ? (
              <Image
                source={{ uri: selectedMarker.photoUrl }}
                style={styles.modalImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.modalNoImage}>
                <Icon name="map-marker" size={48} color="#9ca3af" />
              </View>
            )}

            <View style={styles.modalInfo}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Time:</Text>
                <Text style={styles.modalValue}>
                  {selectedMarker.timestamp
                    ? new Date(normalizeTimestamp(selectedMarker.timestamp)).toLocaleString()
                    : 'N/A'}
                </Text>
              </View>

              {selectedMarker.remark && (
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Remark:</Text>
                  <Text style={styles.modalValue}>{selectedMarker.remark}</Text>
                </View>
              )}

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Coordinates:</Text>
                <Text style={styles.modalValue}>
                  {selectedMarker.latitude?.toFixed(6)}, {selectedMarker.longitude?.toFixed(6)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalDoneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FancyAlert
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: hp(1),
    fontSize: wp(4),
    color: '#6b7280',
  },
  errorText: {
    fontSize: wp(4),
    color: '#C6303E',
  },
  backBtn: {
    marginTop: hp(2),
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
  },
  backBtnText: {
    fontSize: wp(4),
    color: '#438AFF',
    fontWeight: '500',
  },
  mapTopContainer: {
    flex: 7,
    width: '100%',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(0.8),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  label: {
    fontSize: wp(3.8),
    color: '#6b7280',
  },
  value: {
    fontSize: wp(3.8),
    fontWeight: '500',
    color: '#111',
  },
  photoCarouselContent: {
    paddingHorizontal: wp(2),
  },
  photoCard: {
    width: wp(40),
    backgroundColor: '#ffffff',
    paddingVertical: hp(2),
    alignItems: 'center',
    marginHorizontal: wp(2),
    marginVertical: hp(3),
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoCardImage: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
    marginBottom: hp(1.5),
  },
  photoCardInfo: {
    alignItems: 'center',
  },
  photoCardLabelTitle: {
    fontSize: wp(3),
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  photoCardLabelValue: {
    fontSize: wp(3),
    color: '#4b5563',
    textAlign: 'center',
    marginTop: hp(0.5),          // small gap under title
  },
  photoAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCarouselSection: {
    flex: 3,
    paddingVertical: hp(0.5),
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: wp(85),
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: wp(4),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: wp(5),
    fontWeight: '600',
    color: '#111827',
  },
  modalCloseBtn: {
    padding: wp(2),
  },
  modalImage: {
    width: '100%',
    height: hp(25),
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginBottom: hp(2),
  },
  modalNoImage: {
    width: '100%',
    height: hp(20),
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  modalInfo: {
    marginBottom: hp(2),
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(1),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  modalLabel: {
    fontSize: wp(4),
    color: '#6b7280',
    fontWeight: '500',
  },
  modalValue: {
    fontSize: wp(4),
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  modalDoneBtn: {
    backgroundColor: '#438AFF',
    paddingVertical: hp(1.5),
    borderRadius: 8,
    alignItems: 'center',
    marginTop: hp(1),
  },
  modalDoneBtnText: {
    color: '#ffffff',
    fontSize: wp(4.5),
    fontWeight: '600',
  },
});

export default TrackingSessionDetailScreen;
