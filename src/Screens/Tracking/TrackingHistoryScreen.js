import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as TrackingService from '../../services/TrackingService';

const formatTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatKm = (meters) => {
  if (!meters) return '0 km';
  return `${(meters / 1000).toFixed(2)} km`;
};

const getSessionId = (session) =>
  session?.id ??
  session?.sessionId ??
  session?.trackingSessionId ??
  session?.SessionId ??
  session?.TrackingSessionId ??
  null;

const SessionItem = ({ item, onPress }) => {
  const start = formatTime(item.startTime);
  const end = formatTime(item.endTime);

  return (
    <View style={styles.card}>
      <View style={styles.timeRow}>
        <Icon name="clock-o" size={16} color="#2563eb" />
        <Text style={styles.timeText}>
          {start} - {end}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Icon name="motorcycle" size={18} color="#3b82f6" />
        <Text style={styles.infoText}>
          Delivery Stations: {item.deliveryStations || 0}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Icon name="random" size={18} color="#f59e0b" />
        <Text style={styles.infoText}>
          Travelled Distance: {formatKm(item.totalDistance)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() => onPress(item)}
      >
        <Icon name="eye" size={16} color="#2563eb" />
        <Text style={styles.detailsText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );
};

const TrackingHistoryScreen = ({ route }) => {
  const navigation = useNavigation();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const limit = 20;
  const hasLoadedRef = useRef(false);
  const loadRef = useRef(() => {});

  const load = useCallback(async (isRefresh = false) => {
    const p = isRefresh ? 1 : page;

    if (isRefresh) setRefreshing(true);
    else if (p === 1) setLoading(true);

    try {
      const res = await TrackingService.getSessions({
        page: p,
        limit,
        sort: 'createdAt_desc',
      });

      const list = res.sessions || [];
      const total = res.totalCount ?? 0;

      if (isRefresh || p === 1) {
        setSessions(list);
      } else {
        setSessions((prev) => [...prev, ...list]);
      }

      setHasMore(list.length === limit && p * limit < total);
      setPage(list.length === limit ? p + 1 : p);
    } catch (e) {
      console.log('Session error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  loadRef.current = load;

  useFocusEffect(
    useCallback(() => {
      const refresh = route?.params?.refresh;

      if (!hasLoadedRef.current || refresh) {
        hasLoadedRef.current = true;
        loadRef.current(true);
      }

      if (refresh) navigation.setParams({ refresh: false });
    }, [route?.params?.refresh])
  );

  const onRefresh = () => load(true);

  const onEndReached = () => {
    if (!loading && !refreshing && hasMore) {
      load(false);
    }
  };

  const onSessionPress = (item) => {
    const sessionId = getSessionId(item);

    if (!sessionId) return;

    navigation.navigate('TrackingSessionDetail', { sessionId });
  };

  if (loading && sessions.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10 }}>Loading sessions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item, index) => {
          const id = getSessionId(item);
          return id ? String(id) : `session-${index}`;
        }}
        renderItem={({ item }) => (
          <SessionItem item={item} onPress={onSessionPress} />
        )}
        contentContainerStyle={{ paddingBottom: hp(4) }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="history" size={50} color="#d1d5db" />
            <Text style={styles.emptyText}>No tracking sessions</Text>
          </View>
        }
      />
    </View>
  );
};

export default TrackingHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
    paddingHorizontal: wp(4),
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  timeText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },

  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 10,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6b7280',
  },

  detailsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
  },

  detailsText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },

  empty: {
    alignItems: 'center',
    marginTop: hp(20),
  },

  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
});