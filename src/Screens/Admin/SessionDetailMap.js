import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Image,
  // Platform,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { getSessionDetails } from '../../config/AdminService';
import FancyAlert from '../FancyAlert';
import Api from '../../config/Api';
import CustomHeader from '../../Component/CustomHeader';

// const { width } = Dimensions.get('window');

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

const parseFiniteNumber = (value) => {
  if (value == null) return null;
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
};

const isValidLatitude = (lat) => lat != null && lat >= -90 && lat <= 90;
const isValidLongitude = (lng) => lng != null && lng >= -180 && lng <= 180;

// Some APIs may return coordinates with different keys or occasionally swapped.
// This normalizes a location object into { latitude, longitude } or returns null.
const extractLatLngFromLocation = (loc) => {
  const latRaw = loc?.latitude ?? loc?.lat;
  const lngRaw = loc?.longitude ?? loc?.lng;

  let lat = parseFiniteNumber(latRaw);
  let lng = parseFiniteNumber(lngRaw);

  if (isValidLatitude(lat) && isValidLongitude(lng)) {
    return { latitude: lat, longitude: lng };
  }

  // Fallback: try swapped (lng -> latitude, lat -> longitude)
  const swappedLat = parseFiniteNumber(lngRaw);
  const swappedLng = parseFiniteNumber(latRaw);
  if (isValidLatitude(swappedLat) && isValidLongitude(swappedLng)) {
    return { latitude: swappedLat, longitude: swappedLng };
  }

  return null;
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
  if (rawUrl.startsWith('file://') || rawUrl.startsWith('/')) {
    return rawUrl.startsWith('file://') ? rawUrl : `file://${rawUrl}`;
  }
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }
  const base = (Api?.defaults?.baseURL || '').replace(/\/+$/, '');
  const path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
  return `${base}${path}`;
};

const SessionDetailsMap = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, sessionId, sessionDate } = route.params || {};
  
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'error' });
  const mapRef = useRef(null);

  const fetchSessionDetails = useCallback(async () => {
    if (!userId || !sessionId) return;
    
    setLoading(true);
    try {
      const response = await getSessionDetails(userId, sessionId);
      
      if (response.success && response.data) {
        setSessionData(response.data);
      } else {
        setAlertConfig({
          title: 'Error',
          message: response.message || 'Failed to fetch session details',
          type: 'error',
        });
        setAlertVisible(true);
      }
    } catch (err) {
      console.error('Error fetching session details:', err);
      setAlertConfig({
        title: 'Error',
        message: err?.message || 'Something went wrong while fetching session data',
        type: 'error',
      });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  }, [userId, sessionId]);

  useEffect(() => {
    fetchSessionDetails();
  }, [fetchSessionDetails]);

  const locations = sessionData?.locations ?? [];

  // Normalise & sort locations
  const locationsWithCoords = locations
    .map((l) => {
      const coords = extractLatLngFromLocation(l);
      if (!coords) return null;
      return { ...l, latitude: coords.latitude, longitude: coords.longitude };
    })
    .filter(Boolean);

  const sortedLocationsWithCoords = [...locationsWithCoords].sort((a, b) => {
    const ta = normalizeTimestamp(a.timestamp ?? a.time ?? a.createdAt);
    const tb = normalizeTimestamp(b.timestamp ?? b.time ?? b.createdAt);
    return ta - tb;
  });

  const coordinates = sortedLocationsWithCoords.map((l) => ({
    latitude: Number(l.latitude),
    longitude: Number(l.longitude),
  }));

  const startCoordinate =
    coordinates.length > 0 &&
    Number.isFinite(coordinates[0].latitude) &&
    Number.isFinite(coordinates[0].longitude)
      ? coordinates[0]
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

  // The segmentation logic may drop the final segment if it ends up with
  // only 1 point (React Native Maps Polyline needs >= 2 points).
  // To make the "End" marker match the visible end of the polyline,
  // compute the last coordinate that actually exists in rendered segments.
  const renderedEndCoordinate = useMemo(() => {
    if (!polylineSegments || polylineSegments.length === 0) return endCoordinate;

    for (let i = polylineSegments.length - 1; i >= 0; i--) {
      const coords = polylineSegments[i]?.coordinates;
      if (!coords || coords.length === 0) continue;
      const last = coords[coords.length - 1];
      if (
        last &&
        Number.isFinite(last.latitude) &&
        Number.isFinite(last.longitude)
      ) {
        return last;
      }
    }
    return endCoordinate;
  }, [polylineSegments, endCoordinate]);

  const photoLocations = sortedLocationsWithCoords.filter(
    (l) => (l?.photoUrl ?? l?.photo ?? l?.photoPath ?? l?.photoUri)
  );

  const renderRouteMarkers = (keyPrefix) => (
    <>
      {photoLocations.map((loc, idx) => (
        <Marker
          key={loc.id ?? `${keyPrefix}-photo-${idx}`}
          coordinate={{
            latitude: Number(loc.latitude),
            longitude: Number(loc.longitude),
          }}
          pinColor="#DC2626"
          title="Photo Location"
          description={
            loc.remark != null && String(loc.remark).trim() !== '' 
              ? String(loc.remark).trim() 
              : 'Photo point'
          }
          // Ensure photo markers don't cover start/end markers.
          zIndex={200}
        />
      ))}

      {startCoordinate && (
        <Marker
          key={`${keyPrefix}-start`}
          coordinate={startCoordinate}
          pinColor="green"
          title="Start"
          zIndex={1000}
        />
      )}
      {renderedEndCoordinate && (
        <Marker
          key={`${keyPrefix}-end`}
          coordinate={renderedEndCoordinate}
          pinColor="#FF8C00"
          title="End"
          zIndex={1001}
        />
      )}
    </>
  );

  const locationsWithPhotoOrRemark = sortedLocationsWithCoords.filter(
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
    if (!sessionData || coordinates.length < 2 || !mapRef.current) return;

    try {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
        animated: true,
      });
    } catch (e) {
      console.warn('Failed to fit map to coordinates:', e);
    }
  }, [sessionData?.id, coordinates.length]);

  if (!userId || !sessionId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Missing user or session ID</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && !sessionData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#438AFF" />
        <Text style={styles.loadingText}>Loading session details...</Text>
      </View>
    );
  }

  if (!sessionData) {
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

  const userName = sessionData?.userName || sessionData?.employeeName || '';

  return (
    <View style={styles.container}>
      <CustomHeader
        navigation={navigation}
        title={userName || 'Session Details'}
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
                  const label = remark || 'Location';

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
          <Text style={styles.errorText}>No route data available</Text>
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
  photoCarouselSection: {
    flex: 3,
    paddingVertical: hp(0.5),
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
    marginTop: hp(0.5),
  },
  photoAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SessionDetailsMap;