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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as TrackingService from '../../services/TrackingService';
import { getAllLocationsForSession } from '../../services/OfflineLocationStore';
import FancyAlert from '../FancyAlert';
import Api from '../../config/Api';

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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {region && coordinates.length > 0 && (
          <View style={styles.mapWrap}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={region}
              mapType="standard"
              showsUserLocation={false}
              onRegionChangeComplete={(r) => {
                mapRegionRef.current = r;
              }}
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
            <TouchableOpacity
              style={styles.mapFullScreenBtn}
              onPress={() => {
                mapRegionRef.current = region;
                setFullScreenMapVisible(true);
              }}
            >
              <Icon name="expand" size={18} color="#374151" />
            </TouchableOpacity>
          </View>
        )}
        {region && coordinates.length > 0 && (
          <Modal
            visible={fullScreenMapVisible}
            animationType="slide"
            onRequestClose={() => setFullScreenMapVisible(false)}
          >
            <View style={styles.fullScreenMapContainer}>
              <TouchableOpacity
                style={styles.fullScreenCloseBtn}
                onPress={() => setFullScreenMapVisible(false)}
              >
                <Icon name="times" size={24} color="#111" />
              </TouchableOpacity>
              <MapView
                ref={fullScreenMapRef}
                style={StyleSheet.absoluteFill}
                provider={PROVIDER_GOOGLE}
                initialRegion={mapRegionRef.current || region}
                mapType="standard"
                showsUserLocation={false}
                onRegionChangeComplete={(r) => {
                  mapRegionRef.current = r;
                }}
              >
                {polylineSegments.map((seg, idx) => (
                  <Polyline
                    key={`polyline-full-${idx}`}
                    coordinates={seg.coordinates}
                    strokeColor={seg.isOnline ? '#438AFF' : '#DC2626'}
                    strokeWidth={4}
                  />
                ))}
                {renderRouteMarkers('full')}
              </MapView>
              <TouchableOpacity
                style={styles.fullScreenMiniBtn}
                onPress={() => setFullScreenMapVisible(false)}
              >
                <Icon name="compress" size={20} color="#374151" />
              </TouchableOpacity>
            </View>
          </Modal>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Start</Text>
            <Text style={styles.value}>{formatDate(detail.startTime)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>End</Text>
            <Text style={styles.value}>{formatDate(detail.endTime)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>{formatDuration(detail.duration)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Distance</Text>
            <Text style={styles.value}>{formatDistance(detail.totalDistance)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Points</Text>
            <Text style={styles.value}>{locations.length}</Text>
          </View>
        </View>

        {locationsWithPhotoOrRemark.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Photos & remarks</Text>
            {locationsWithPhotoOrRemark.map((loc, index) => {
              const rawPhoto = loc.photoUrl ?? loc.photo ?? loc.photoPath ?? loc.photoUri;
              const photoUrl = buildPhotoUrl(rawPhoto);
              const remark = loc.remark != null ? String(loc.remark).trim() : '';
              const amount = loc.amount != null ? String(loc.amount).trim() : '';
              const lat = loc.latitude != null ? Number(loc.latitude) : null;
              const lng = loc.longitude != null ? Number(loc.longitude) : null;
              return (
                <View key={loc.id ?? index} style={styles.photoRow}>
                  {photoUrl ? (
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('FullImageScreen', {
                          imageUrl: photoUrl,
                        })
                      }
                      style={styles.photoThumbWrap}
                    >
                      <Image
                        source={{ uri: photoUrl }}
                        style={styles.photoThumb}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.photoThumbWrap, styles.photoPlaceholder]}>
                      <Icon name="image" size={24} color="#9ca3af" />
                    </View>
                  )}
                  <View style={styles.photoInfo}>
                    {remark ? (
                      <Text style={styles.photoRemark} numberOfLines={2}>
                        {remark}
                      </Text>
                    ) : null}
                    {amount ? (
                      <Text style={styles.photoAmount}>Amount: {amount}</Text>
                    ) : null}
                    {lat != null && lng != null && (
                      <Text style={styles.photoCoords}>
                        {`Lat: ${lat.toFixed(6)}  Lng: ${lng.toFixed(6)}`}
                      </Text>
                    )}
                    {!remark && !amount && lat == null && lng == null && (
                      <Text style={styles.photoRemark}>—</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="trash-o" size={18} color="#fff" style={styles.deleteIcon} />
              <Text style={styles.deleteBtnText}>Delete session</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(4),
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
  mapWrap: {
    width: width - wp(8),
    height: hp(28),
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: hp(2),
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
});

export default TrackingSessionDetailScreen;
