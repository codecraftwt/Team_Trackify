import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const LeaveRequestScreen = () => {

  
  const navigation = useNavigation();

  const leaveBalance = 8;
  const totalLeave = 16;
  const usedLeave = 8;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const leaveTypes = [
    { type: 'Casual Leaves', count: 2, total: 5 },
    { type: 'Medical Leaves', count: 3, total: 5 },
    { type: 'Annual Leaves', count: 5, total: 5 },
    { type: 'Maternity Leaves', count: 15, total: 20 },
  ];

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isStartPickerVisible, setStartPickerVisible] = useState(false);
  const [isEndPickerVisible, setEndPickerVisible] = useState(false);




  const handleWeeklyCalendarPress = () => {
    setStartPickerVisible(true);
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {/* {/ Header /} */}
          <View style={styles.cardHeaderWrapper}>
            <View style={styles.cardHeader}>
              <Text style={styles.myLeavesText}>My Leaves</Text>
              {/* <View style={styles.iconRow}>
                <Text style={styles.monthText}>
                  {startDate && endDate
                    ? `${new Date(startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })} - ${new Date(endDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}`
                    : 'Select Date'}
                </Text>


                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#438AFF"
                  style={styles.icon}
                  onPress={handleWeeklyCalendarPress}
                />
              </View> */}
            </View>
          </View>



          {/* {/ Circular Progress /} */}
          <View style={styles.circularContainer}>
            <AnimatedCircularProgress
              size={wp(40)}
              width={wp(1.5)}
              fill={(leaveBalance / totalLeave) * 100}
              tintColor="#438aff"
              backgroundColor="#d1d5db"
              rotation={0}
              lineCap="round"
            >
              {() => (
                <View style={styles.circularInner}>
                  <Text style={styles.leaveBalance}>
                    {String(leaveBalance).padStart(2, '0')}
                  </Text>
                  <Text style={styles.leaveBalanceLabel}>Leave Balance</Text>
                </View>
              )}
            </AnimatedCircularProgress>
          </View>


          {/* {/ Leave Count /} */}
          <View style={styles.leaveCountRow}>
            <View style={styles.leaveBox}>
              <Text style={styles.leaveCountText}>{totalLeave}</Text>
              <Text style={styles.leaveCountLabel}>Total Leave</Text>
            </View>
            <View style={styles.leaveBox}>
              <Text style={styles.leaveCountText}>{usedLeave}</Text>
              <Text style={styles.leaveCountLabel}>Used Leave</Text>
            </View>
          </View>

          {/* {/ Leave Types /} */}
          <View style={styles.leaveTypeRow}>
            {leaveTypes.map((leave, index) => {
              const fill = (leave.count / leave.total) * 100;
              return (
                <View key={index} style={styles.leaveTypeBox}>
                  <AnimatedCircularProgress
                    size={70}
                    width={2}
                    fill={fill}
                    tintColor="#438aff"
                    backgroundColor="#d1d5db"
                    rotation={0}
                    lineCap="round"
                  >
                    {() => (
                      <Text style={styles.leaveTypeCount}>
                        {String(leave.count).padStart(2, '0')}
                      </Text>
                    )}
                  </AnimatedCircularProgress>
                  <Text style={styles.leaveTypeLabel}>{leave.type}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Start Date Picker Modal */}
        {isStartPickerVisible && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="calendar"
            onChange={(event, date) => {
              if (event.type === 'set' && date) {
                setStartDate(date);
                setStartPickerVisible(false);
                setTimeout(() => setEndPickerVisible(true), 300);
              } else {
                setStartPickerVisible(false);
              }
            }}
          />
        )}

        {/* End Date Picker Modal */}
        {isEndPickerVisible && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="calendar"
            onChange={(event, date) => {
              if (event.type === 'set' && date) {
                setEndDate(date);
              }
              setEndPickerVisible(false);
            }}
          />
        )}

        {/* {/ Apply Button /} */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('LeaveApproval')}
        >
          <Text style={styles.buttonText}>Apply For Leave</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

export default LeaveRequestScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: wp(4),
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: wp(3),
    padding: wp(4),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: wp(1),
  },
  cardHeaderWrapper: {
    backgroundColor: '#F2F2F4',
    paddingVertical: hp(2),
    paddingHorizontal: wp(3),
    marginHorizontal: -wp(4),
    marginTop: -wp(4),
    borderTopLeftRadius: wp(3),
    borderTopRightRadius: wp(3),
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

  },
  myLeavesText: {
    fontSize: wp(3.5),
    fontWeight: '600',
    color: '#374151',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    fontSize: wp('3.5%'),
    color: '#666',
    marginRight: wp('2%'),
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: wp(3.3),
    color: '#333',
  },
  circularContainer: {
    alignItems: 'center',
    marginVertical: hp(2.5),
  },
  circularInner: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },

  leaveBalance: {
    fontSize: wp(10),
    fontWeight: '600',
    color: '#212529',
    marginLeft: wp('2.5%'),
    alignItems: 'center',
  },
  leaveBalanceLabel: {
    fontSize: wp(3.3),
    color: '#9ca3af',

    marginTop: hp(0.5),
  },
  leaveCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp(1.2),
  },
  leaveBox: {
    alignItems: 'center',
  },
  leaveCountText: {
    fontSize: wp(5),
    fontWeight: '700',
    color: '#212529',
  },
  leaveCountLabel: {
    fontSize: Math.max(wp("3.8%"), 14),
    color: '#666',
    marginTop: hp(0.5),
  },
  leaveTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(2),
  },
  leaveTypeBox: {
    alignItems: 'center',
    flex: 1,
  },
  leaveTypeCount: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#3b82f6',
    textAlign: 'center',
  },
  leaveTypeLabel: {
    fontSize: wp(2.8),
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: hp(1),
    paddingHorizontal: wp(1),
  },
  button: {
    backgroundColor: '#438AFF',
    borderRadius: wp(2),
    paddingVertical: hp(1.5),
    marginTop: hp("15%"),
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: wp(4),
    fontWeight: '600',
  },
});

