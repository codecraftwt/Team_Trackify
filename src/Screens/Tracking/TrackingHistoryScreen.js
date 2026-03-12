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

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
};

const formatDuration = (seconds) => {
  if (seconds == null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}`;
};

const formatDistance = (meters) => {
  if (meters == null) return '—';
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
};

const SessionItem = ({ item, onPress }) => {
  const isActive = item.endTime == null;
  return (
    <TouchableOpacity style={styles.item} onPress={() => onPress(item)} activeOpacity={0.7}>
      <View style={[styles.itemIndicator, isActive && styles.itemIndicatorActive]} />
      <View style={styles.itemBody}>
        <Text style={styles.itemDate}>{formatDate(item.startTime)}</Text>
        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Duration</Text>
          <Text style={styles.itemValue}>{formatDuration(item.duration)}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Distance</Text>
          <Text style={styles.itemValue}>{formatDistance(item.totalDistance)}</Text>
        </View>
        {isActive && <Text style={styles.activeBadge}>Active</Text>}
      </View>
      <Icon name="chevron-right" size={18} color="#9ca3af" />
    </TouchableOpacity>
  );
};

// Helper to get a stable session id from API response objects.
// Backend might use different property names (id, sessionId, trackingSessionId, etc.).
const getSessionId = (session) =>
  session?.id ??
  session?.sessionId ??
  session?.trackingSessionId ??
  session?.SessionId ??
  session?.TrackingSessionId ??
  null;

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
      const nextPage = list.length === limit ? p + 1 : p;
      setPage(nextPage);
    } catch (e) {
      console.error('getSessions failed:', e);
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
    }, [route?.params?.refresh, navigation])
  );

  const onRefresh = useCallback(() => load(true), [load]);

  const onEndReached = useCallback(() => {
    if (!loading && !refreshing && hasMore) load(false);
  }, [loading, refreshing, hasMore, load]);

  const onSessionPress = useCallback(
    (item) => {
      const sessionId = getSessionId(item);
      if (!sessionId) {
        console.warn('TrackingHistoryScreen: missing session id in item', item);
        return;
      }
      navigation.navigate('TrackingSessionDetail', { sessionId });
    },
    [navigation]
  );

  if (loading && sessions.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#438AFF" />
        <Text style={styles.loadingText}>Loading sessions…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(s, index) => {
          const id = getSessionId(s);
          return id ? String(id) : `session-${index}`;
        }}
        renderItem={({ item }) => <SessionItem item={item} onPress={onSessionPress} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#438AFF']} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="history" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No tracking sessions yet</Text>
            <Text style={styles.emptySub}>Start tracking from the main screen</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  listContent: { paddingHorizontal: wp(4), paddingBottom: hp(4) },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: { marginTop: hp(1), fontSize: wp(4), color: '#6b7280' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: wp(4),
    marginTop: hp(1.5),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#438AFF',
    marginRight: wp(3),
    minHeight: 40,
  },
  itemIndicatorActive: { backgroundColor: '#34a853' },
  itemBody: { flex: 1 },
  itemDate: { fontSize: wp(4), fontWeight: '600', color: '#111', marginBottom: hp(0.5) },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: hp(0.3) },
  itemLabel: { fontSize: wp(3.2), color: '#6b7280' },
  itemValue: { fontSize: wp(3.5), fontWeight: '500', color: '#374151' },
  activeBadge: { marginTop: hp(0.5), fontSize: wp(3), color: '#34a853', fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: hp(15) },
  emptyText: { fontSize: wp(4.5), fontWeight: '600', color: '#374151', marginTop: hp(2) },
  emptySub: { fontSize: wp(3.8), color: '#6b7280', marginTop: hp(0.5) },
});

export default TrackingHistoryScreen;
