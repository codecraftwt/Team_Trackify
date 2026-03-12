import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const AttendanceDetails = () => {
  const route = useRoute();
  const { data = [], date } = route.params;

  const filteredList = data.filter(
    item =>
      item.date === date &&
      item.type !== 'Holiday' &&
      item.type !== 'Leave' &&
      item.punchIn !== 'Weekly off'
  );

  const earliestPunchIn = filteredList.reduce((earliest, current) => {
    if (!current.punchIn) return earliest;
    if (!earliest || compareTime(current.punchIn, earliest.punchIn) < 0) {
      return current;
    }
    return earliest;
  }, null);

  const latestPunchOut = filteredList.reduce((latest, current) => {
    if (!current.punchOut) return latest;
    if (!latest || compareTime(current.punchOut, latest.punchOut) > 0) {
      return current;
    }
    return latest;
  }, null);

  function compareTime(t1, t2) {
    const parse = t =>
      new Date(`1970-01-01T${t.replace(/(am|pm)/, match => (match === 'pm' ? ' PM' : ' AM'))}`);
    return parse(t1) - parse(t2);
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <Text style={styles.tabText}>Log</Text>
        <Text style={styles.pendingText}>Approval Pending</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!earliestPunchIn && !latestPunchOut ? (
          <Text style={{ textAlign: 'center', marginTop: hp('5%'), fontSize: wp('4%') }}>
            No punch records found for this date.
          </Text>
        ) : (
          <>
            {earliestPunchIn && (
              <View style={styles.card}>
                <Image
                  source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
                  style={styles.profile}
                />
                <View style={styles.infoContainer}>
                  <Text style={styles.date}>{earliestPunchIn.date}</Text>
                  <Text style={styles.day}>{earliestPunchIn.day || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.centerContainer}>
                    <Text style={styles.timeRow}>
                      <Text style={{ color: '#34C759', fontWeight: '400' }}>Punch IN </Text>
                      <Text style={{ color: '#000', fontWeight: '500' }}>{earliestPunchIn.punchIn}</Text>
                    </Text>
                    <View style={styles.locationRow}>
                      <Icon name="location-on" size={14} color="#666" style={{ marginRight: 4 }} />
                      <Text style={styles.location}>Shahupuri, 1 Lane...</Text>
                    </View>
                  </View>
                  <View style={styles.dottedLine} />
                  <View style={styles.rightContainer}>
                    <Text style={styles.shift}>{earliestPunchIn.shift || 'First Shift'}</Text>
                    <Text style={styles.name}>Omkar Adsaire</Text>
                  </View>
                </View>
              </View>
            )}

            {latestPunchOut && (
              <View style={styles.card}>
                <Image
                  source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
                  style={styles.profile}
                />
                <View style={styles.infoContainer}>
                  <Text style={styles.date}>{latestPunchOut.date}</Text>
                  <Text style={styles.day}>{latestPunchOut.day || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.centerContainer}>
                    <Text style={styles.timeRow}>
                      <Text style={{ color: '#d10000', fontWeight: '400' }}>Punch OUT </Text>
                      <Text style={{ color: '#000', fontWeight: '500' }}>{latestPunchOut.punchOut}</Text>
                    </Text>
                    <View style={styles.locationRow}>
                      <Icon name="location-on" size={14} color="#666" style={{ marginRight: 4 }} />
                      <Text style={styles.location}>Shahupuri, 1 Lane...</Text>
                    </View>
                  </View>
                  <View style={styles.dottedLine} />
                  <View style={styles.rightContainer}>
                    <Text style={styles.shift}>{latestPunchOut.shift || 'First Shift'}</Text>
                    <Text style={styles.name}>Omkar Adsaire</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default AttendanceDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: hp('2%'),
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingBottom: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: hp('1%'),
  },
  tabText: {
    fontWeight: '600',
    fontSize: wp('3.8%'),
    color: '#000',
  },
  pendingText: {
    fontWeight: '600',
    fontSize: wp('3.8%'),
    color: '#f5a623',
  },
  scrollContent: {
    paddingHorizontal: wp('3%'),
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('3%'),
    marginBottom: hp('1%'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    borderRadius: wp('2%'),
    alignItems: 'center',
  },
  detailRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dottedLine: {
    height: hp('5%'),
    width: wp('0.3%'),
    borderLeftWidth: wp('0.3%'),
    borderColor: '#939393',
    borderStyle: 'dashed',
    marginHorizontal: wp('4%'),
  },
  profile: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    marginRight: wp('2%'),
  },
  infoContainer: {
    width: wp('15%'),
    justifyContent: 'center',
    marginRight: wp('2%'),
  },
  date: {
    fontSize: wp('4%'),
    fontWeight: 'bold',
    color: '#000',
  },
  day: {
    fontSize: wp('4%'),
    color: '#888',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  timeRow: {
    fontSize: wp('3.5%'),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('0.5%'),
  },
  location: {
    fontSize: wp('2.8%'),
    color: '#666',
  },
  rightContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  shift: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#007aff',
  },
  name: {
    fontSize: wp('3%'),
    color: '#666',
    marginTop: hp('0.5%'),
  },
});
