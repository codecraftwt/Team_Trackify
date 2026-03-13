import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
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

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const formatDuration = (seconds) => {
  if (seconds == null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const formatDistance = (meters) => {
  if (meters == null) return '—';
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
};

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
  const [deleting, setDeleting] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'error' });
  const [fullScreenMapVisible, setFullScreenMapVisible] = useState(false);
  const mapRef = React.useRef(null);
  const fullScreenMapRef = React.useRef(null);
  const mapRegionRef = React.useRef(null);

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
          enriched = {
            ...data,
            locations: localLocations.map((p) => ({
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
            })),
          };
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

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this tracking session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await TrackingService.deleteSession(sessionId);
              navigation.goBack();
            } catch (e) {
              console.error('deleteSession failed:', e);
              setAlertConfig({
                title: 'Error',
                message: e?.message || 'Failed to delete session.',
                type: 'error',
              });
              setAlertVisible(true);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [sessionId, navigation]);

  const locations = detail?.locations ?? [];

  // Normalise & sort locations so that index 0 is the true start
  // (earliest timestamp) and the last index is the true end.
  const locationsWithCoords = locations.filter(
    (l) => l?.latitude != null && l?.longitude != null
  );
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

  const photoLocations = locations.filter(
    (l) =>
      (l?.photoUrl ?? l?.photo ?? l?.photoPath ?? l?.photoUri) &&
      l?.latitude != null &&
      l?.longitude != null
  );

  const renderRouteMarkers = (keyPrefix) => (
    <>
      {startCoordinate && (
        <Marker
          key={`${keyPrefix}-start`}
          coordinate={startCoordinate}
          pinColor="green"
          title="Start"
          zIndex={1000}
        />
      )}
      {endCoordinate && (
        <Marker
          key={`${keyPrefix}-end`}
          coordinate={endCoordinate}
          pinColor="#FF8C00"
          title="End"
          zIndex={1001}
        />
      )}
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
            loc.remark != null ? String(loc.remark).trim() || undefined : undefined
          }
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
  mapWrap: {
    width: width,
    height: hp(40),
    borderRadius: 0,
    overflow: 'hidden',
    marginTop: 0,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapFullScreenBtn: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fullScreenMiniBtn: {
    position: 'absolute',
    right: 12,
    bottom: 24,
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 10,
  },
  fullScreenMapContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fullScreenCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: wp(4),
    marginTop: hp(2),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#111',
    marginBottom: hp(1.5),
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
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C6303E',
    paddingVertical: hp(1.5),
    borderRadius: 8,
    marginTop: hp(3),
  },
  deleteBtnDisabled: {
    opacity: 0.6,
  },
  deleteIcon: {
    marginRight: 8,
  },
  deleteBtnText: {
    fontSize: wp(4),
    fontWeight: '600',
    color: '#fff',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  photoThumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: wp(3),
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
  },
  photoPlaceholder: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoInfo: {
    flex: 1,
  },
  photoRemark: {
    fontSize: wp(3.6),
    color: '#374151',
    marginBottom: hp(0.3),
  },
  photoAmount: {
    fontSize: wp(3.2),
    color: '#6b7280',
  },
  photoCoords: {
    marginTop: hp(0.2),
    fontSize: wp(3.1),
    color: '#4b5563',
  },
  photoCarouselWrap: {
    marginTop: hp(2),
  },
  photoCarouselContent: {
    paddingHorizontal: wp(2),
  },
  photoCard: {
    width: wp(60),
    marginHorizontal: wp(1),
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  photoCardImage: {
    width: '100%',
    height: hp(18),
    backgroundColor: '#f3f4f6',
  },
  photoCardInfo: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  photoCardLabelTitle: {
    fontSize: wp(3.4),
    fontWeight: '600',
    color: '#111827',
  },
  photoCardLabelValue: {
    fontSize: wp(3.4),
    color: '#4b5563',
  },
  photoAvatarWrap: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoAvatar: {
    width: '100%',
    height: '100%',
  },
  photoAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCardLabel: {
    marginTop: hp(0.5),
    fontSize: wp(3.1),
    color: '#4b5563',
    textAlign: 'center',
  },
  mapFullScreen: {
    flex: 1,
    position: 'relative',
  },
  photoCarouselSection: {
    flex: 3,
    paddingVertical: hp(0.5),
  },
  photoOverlay: {
    position: 'absolute',
    bottom: hp(1.5),
    left: 0,
    right: 0,
    paddingHorizontal: wp(3),
  },
});

export default TrackingSessionDetailScreen;
