import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Calendar } from 'react-native-calendars';
import * as TrackingService from '../../services/TrackingService';
import CustomHeader from '../../Component/CustomHeader';
import { useAuth } from '../../config/auth-context';

// const formatTime = (iso) => {
//   if (!iso) return '—';
//   const d = new Date(iso);
//   return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
// };
const formatTime = (iso) => {
  if (!iso) return '—';

  // If the string doesn't have 'Z' and no timezone offset, assume it's UTC
  let dateStr = iso;
  if (iso && !iso.endsWith('Z') && !iso.includes('+')) {
    dateStr = iso + 'Z'; // Append Z to treat as UTC
  }

  const d = new Date(dateStr);

  // Check if date is valid
  if (isNaN(d.getTime())) return '—';

  return d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/** Handles totalDistance in km (new API) or meters (legacy) */
const formatDistanceKm = (val) => {
  if (val == null || val === undefined) return '0.00 km';
  const n = Number(val);
  const km = n > 500 ? n / 1000 : n;
  return `${km.toFixed(2)} km`;
};

const formatDisplayDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const toISODate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getSessionId = (session) =>
  session?.id ??
  session?.sessionId ??
  session?.trackingSessionId ??
  session?.SessionId ??
  session?.TrackingSessionId ??
  null;

const SessionItem = ({ item, onPress }) => {
  const isActive = !item.endTime;
  const start = formatTime(item.startTime);
  const end = isActive ? 'Active' : formatTime(item.endTime);
  const distance = item.totalDistance ?? 0;

  return (
    <View
      style={[
        styles.card,
        isActive ? styles.cardActive : styles.cardInactive,
      ]}
    >
      {/* Top time strip */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderIconWrap}>
          <Icon name="clock-o" size={16} color="#2563eb" />
        </View>
        <Text style={styles.cardHeaderTime}>
          {start} - {end}
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Delivery stations */}
      <View style={styles.infoRow}>
        <View style={styles.roundIconBlue}>
          <Icon name="bicycle" size={16} color="#0f5fc5" />
        </View>
        <Text style={styles.infoText}>
          Delivery Stations: {item.deliveryStations ?? 0}
        </Text>
      </View>

      {/* Distance */}
      <View style={styles.infoRow}>
        <View style={styles.roundIconOrange}>
          <Icon name="road" size={16} color="#f97316" />
        </View>
        <Text style={styles.infoText}>
          Travelled Distance: {formatDistanceKm(distance)}
        </Text>
      </View>

      {/* View details button */}
      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
      >
        <Icon name="user" size={16} color="#2563eb" />
        <Text style={styles.detailsText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );
};

const TrackingHistoryScreen = ({ route }) => {
  const navigation = useNavigation();
  const { userProfile, userId: authUserId } = useAuth();
  const targetUserId = route?.params?.userId || userProfile?.id || authUserId;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const limit = 20;
  const hasLoadedRef = useRef(false);
  const loadRef = useRef(() => { });

  const [page, setPage] = useState(1);
  const [nextCursor, setNextCursor] = useState(null);

  // Fetch tracking dates for calendar using TrackingService
  const fetchTrackingDates = async () => {
    if (!targetUserId) {
      console.log('fetchTrackingDates: no targetUserId found', {
        routeUserId: route?.params?.userId,
        profileId: userProfile?.id,
        authUserId,
      });
      return;
    }

    setLoadingCalendar(true);
    try {
      // Using the TrackingService function
      console.log('Fetching tracking dates for userId:', targetUserId);
      const dates = await TrackingService.getUserTrackingDates(targetUserId);
      console.log('Dates from API:', dates); // Debug log

      const marked = {};

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // react-native-calendars: dots require markingType 'multi-dot' (or 'dot')
      dates.forEach((date) => {
        marked[date] = {
          dots: [{ key: 'tracking', color: '#2563eb' }],
        };
      });

      // Highlight today (with dot if it exists in API)
      marked[today] = {
        ...(marked[today] || {}),
        selected: true,
        selectedColor: '#ff9f1c',
        selectedTextColor: '#ffffff',
      };

      console.log('Marked dates:', marked); // Debug log
      setMarkedDates(marked);
    } catch (error) {
      console.error('Error fetching tracking dates:', error);
    } finally {
      setLoadingCalendar(false);
    }
  };

  // Load calendar data when it becomes visible
  useEffect(() => {
    if (calendarVisible) {
      fetchTrackingDates();
    }
  }, [calendarVisible, targetUserId]);

  const load = useCallback(
    async (isRefresh = false) => {
      const p = isRefresh ? 1 : page;
      const cursor = isRefresh ? null : nextCursor;
      if (isRefresh) setRefreshing(true);
      else if (p === 1) setLoading(true);

      const startDate = toISODate(selectedDate);
      const endDate = toISODate(selectedDate);

      try {
        const res = await TrackingService.getSessionHistory({
          limit,
          startDate,
          endDate,
          cursor: cursor || undefined,
        });

        const list = res.sessions || res.Sessions || res.data?.sessions || [];
        const hasMoreFromApi = Boolean(res.nextCursor) && list.length >= limit;

        if (list.length === 0 && (isRefresh || !cursor)) {
          const fallback = await TrackingService.getSessions({
            page: 1,
            limit: 50,
            sort: 'createdAt_desc',
          });
          const rawList = fallback.sessions || fallback.Sessions || fallback.data?.sessions || [];
          const targetDateStr = toISODate(selectedDate);
          const filtered = rawList.filter((s) => {
            const dt = s.startTime || s.createDate || s.endTime;
            if (!dt) return false;
            return toISODate(new Date(dt)) === targetDateStr;
          });
          const displayList = filtered;

          if (isRefresh || p === 1) {
            setSessions(displayList);
          } else {
            setSessions((prev) => [...prev, ...displayList]);
          }
          setNextCursor(null);
          setPage(1);
          setHasMore(false);
        } else {
          if (isRefresh || !cursor) {
            setSessions(list);
          } else {
            setSessions((prev) => [...prev, ...list]);
          }
          setNextCursor(res.nextCursor ?? null);
          setPage(p);
          setHasMore(hasMoreFromApi);
        }
      } catch (e) {
        console.log('Session history error', e);
        try {
          const fallback = await TrackingService.getSessions({
            page: 1,
            limit: 50,
            sort: 'createdAt_desc',
          });
          const rawList = fallback.sessions || fallback.Sessions || fallback.data?.sessions || [];
          const targetDateStr = toISODate(selectedDate);
          const filtered = rawList.filter((s) => {
            const dt = s.startTime || s.createDate || s.endTime;
            if (!dt) return false;
            return toISODate(new Date(dt)) === targetDateStr;
          });
          setSessions(filtered);
        } catch (e2) {
          if (isRefresh || p === 1) setSessions([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDate, page, nextCursor, limit]
  );

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

  const onDateChange = useCallback((date) => {
    setSelectedDate(date);
    setNextCursor(null);
    setCalendarVisible(false);
  }, []);

  const prevDateRef = useRef(null);
  useEffect(() => {
    if (prevDateRef.current !== null && prevDateRef.current.getTime() !== selectedDate.getTime()) {
      setNextCursor(null);
      loadRef.current(true);
    }
    prevDateRef.current = selectedDate;
  }, [selectedDate]);

  const onRefresh = () => {
    setNextCursor(null);
    load(true);
  };

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

  const totalDistance = sessions.reduce(
    (sum, s) => sum + (Number(s.totalDistance) || 0),
    0
  );

  const userName = userProfile?.name || 'History';

  const renderLegend = () => (
    <View style={styles.legendContainer}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
        <Text style={styles.legendText}>Has tracking data</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: '#ff9f1c' }]} />
        <Text style={styles.legendText}>Today</Text>
      </View>
    </View>
  );

  if (loading && sessions.length === 0) {
    return (
      <>
        <CustomHeader
          navigation={navigation}
          title={userName}
          showBackButton={true}
          showDatePicker={true}
          date={formatDisplayDate(selectedDate)}
          onDatePress={() => setCalendarVisible(true)}
          userData={userProfile}
        />
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <CustomHeader
        navigation={navigation}
        title={userName}
        showBackButton={true}
        showDatePicker={true}
        date={formatDisplayDate(selectedDate)}
        onDatePress={() => setCalendarVisible(true)}
        userData={userProfile}
      />

      <View style={styles.container}>
        <View style={styles.summaryCard}>
          <Icon name="bicycle" size={34} color="#fff" />
          <Text style={styles.summaryDistance}>
            {formatDistanceKm(totalDistance)}
          </Text>
          <Text style={styles.summaryLabel}>Total Traveled Distance</Text>
        </View>

        <FlatList
          data={sessions}
          keyExtractor={(item, index) => {
            const id = getSessionId(item);
            return id ? String(id) : `session-${index}`;
          }}
          renderItem={({ item }) => (
            <SessionItem item={item} onPress={onSessionPress} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="history" size={50} color="#d1d5db" />
              <Text style={styles.emptyText}>No tracking sessions</Text>
              <Text style={styles.emptySubtext}>
                for {formatDisplayDate(selectedDate)}
              </Text>
            </View>
          }
        />
      </View>

      {/* Calendar Modal */}
      <Modal
        visible={calendarVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.calendarContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setCalendarVisible(false)} style={styles.closeButton}>
                <Icon name="times" size={wp(5)} color="#666" />
              </TouchableOpacity>
            </View>

            {loadingCalendar ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading calendar...</Text>
              </View>
            ) : (
              <>
                <Calendar
                  current={selectedDate.toISOString().split('T')[0]}
                  onDayPress={(day) => {
                    onDateChange(new Date(day.dateString));
                  }}
                  markedDates={markedDates}
                  markingType={'multi-dot'}
                  theme={{
                    backgroundColor: '#ffffff',
                    calendarBackground: '#ffffff',
                    textSectionTitleColor: '#b6c1cd',
                    selectedDayBackgroundColor: '#ff9f1c',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#ff9f1c',
                    dayTextColor: '#2d4150',
                    textDisabledColor: '#d9e1e8',
                    dotColor: '#2563eb',
                    selectedDotColor: '#ffffff',
                    arrowColor: '#2563eb',
                    monthTextColor: '#2563eb',
                    indicatorColor: '#2563eb',
                    textDayFontWeight: '300',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '300',
                    textDayFontSize: wp(4),
                    textMonthFontSize: wp(5),
                    textDayHeaderFontSize: wp(3.5),
                  }}
                />
                {renderLegend()}
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
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

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },

  summaryCard: {
    borderRadius: 18,
    paddingVertical: hp(2.4),
    paddingHorizontal: wp(8),
    marginTop: hp(2.2),
    marginBottom: hp(1.5),
    alignItems: 'center',
    backgroundColor: '#ff9f1c',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },

  summaryDistance: {
    fontSize: wp(10),
    fontWeight: '700',
    color: '#fff',
    marginTop: hp(1),
  },

  summaryLabel: {
    fontSize: wp(3.5),
    color: 'rgba(255,255,255,0.9)',
    marginTop: hp(0.5),
  },

  listContent: {
    paddingTop: hp(0.5),
    paddingBottom: hp(4),
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginTop: 14,
    borderLeftWidth: 4,
    shadowColor: '#93c5fd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },

  cardInactive: {
    borderLeftColor: '#0f5fc5', // blue for completed sessions
  },

  cardActive: {
    borderLeftColor: '#22c55e', // green for active session
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
  },

  cardHeaderIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e5f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  cardHeaderTime: {
    fontSize: 15,
    fontWeight: '700',
    color: '#566000',
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  infoText: {
    marginLeft: 10,
    fontSize: 13,
    color: '#4b5563',
  },

  roundIconBlue: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e0ecff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  roundIconOrange: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff3e6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  detailsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fbff',
    borderRadius: 20,
    paddingVertical: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#d0e0ff',
  },

  detailsText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },

  empty: {
    alignItems: 'center',
    marginTop: hp(15),
  },

  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },

  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#9ca3af',
  },

  // Calendar Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarContainer: {
    width: wp(90),
    backgroundColor: '#ffffff',
    borderRadius: wp(5),
    padding: wp(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: wp(5),
    fontWeight: '600',
    color: '#2563eb',
  },
  closeButton: {
    padding: wp(2),
  },
  loadingContainer: {
    height: hp(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: hp(2),
    paddingTop: hp(2),
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(1.5),
    marginRight: wp(2),
  },
  legendText: {
    fontSize: wp(3.5),
    color: '#4b5563',
  },
});