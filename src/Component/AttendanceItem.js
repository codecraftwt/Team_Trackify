import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import BASE_URL from '../config/server';

const AttendanceItem = ({
  date,
  day,
  punchIn,
  punchOut,
  totalHours,
  shift,
  status,
  type,
  image,
}) => {
  const navigation = useNavigation();

  const isSpecial =
    type === 'Holiday' || type === 'Leave' || punchIn === 'Weekly off';

  const isWeeklyOff = punchIn === 'Weekly off';

  const renderPunchInOut = () => {
    if (isSpecial) {
      return (
        <>
          <View style={styles.middleCol}>
            <Text
              style={[
                styles.centerText,
                type === 'Holiday'
                  ? styles.holidayText
                  : type === 'Leave'
                  ? styles.leaveText
                  : isWeeklyOff
                  ? styles.weeklyOffText
                  : null,
              ]}
            >
              {type === 'Holiday'
                ? 'Holiday'
                : type === 'Leave'
                ? punchIn === 'Medical Leave'
                  ? 'Medical Leave'
                  : 'Leave'
                : isWeeklyOff
                ? 'Weekly Off'
                : ''}
            </Text>
          </View>

          <View style={styles.dottedLine} />

          <View style={styles.totalHoursCell}>
            {type === 'Holiday' && (
              <Text style={styles.holidaytotalText}>Holiday</Text>
            )}
            {type === 'Leave' && punchIn === 'Medical Leave' ? (
              <Text style={styles.medicalLeaveText}>Leave</Text>
            ) : type === 'Leave' ? (
              <Text style={styles.leaveText}>Leave</Text>
            ) : isWeeklyOff ? (
              <Text style={styles.weeklyOfftotalText}>Weekly Off</Text>
            ) : null}
          </View>
        </>
      );
    } else {
      return (
        <>
          <View style={styles.cellColumn}>
            <Text style={styles.punchText}>{punchIn}</Text>
            {status && (
              <Text
                style={[
                  styles.statusText,
                  status === 'Late' && styles.lateStatusText,
                ]}
              >
                {status !== 'Half day' ? status : 'On time'}
              </Text>
            )}
          </View>

          <View style={styles.cellColumn}>
            <Text style={styles.punchOutText}>{punchOut}</Text>
            <Text style={styles.statusText}>
              {status === 'Half day' ? 'Half day' : ''}
            </Text>
          </View>

          <View style={styles.dottedLine} />

          <View style={styles.cellColumn}>
            <Text style={styles.totalHourText}>{totalHours}</Text>
            <Text style={styles.shiftText}>{shift}</Text>
          </View>
        </>
      );
    }
  };

  return (
    <View style={styles.row}>
      <View style={styles.imageColumn}>
        {image && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('FullImageScreen', {
                  imageUrl: image, 
              })
            }
          >
            <Image   source={{ uri: image }} style={styles.image} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.dateColumn}>
        <Text style={[styles.dateText, isWeeklyOff && styles.weeklyOffText]}>
          {date}
        </Text>
        <Text style={[styles.dayText, isWeeklyOff && styles.weeklyOffText]}>
          {day}
        </Text>
      </View>

      {renderPunchInOut()}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp('2%'),
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  imageColumn: {
    width: wp('15%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('1%'),
  },
  image: {
    width: wp('10%'),
    height: wp('12%'),
    borderRadius: wp('2%'),
    resizeMode: 'cover',
  },
  dateColumn: {
    width: wp('20%'),
    alignItems: 'center',
  },
  dateText: {
    fontWeight: '700',
    fontSize: wp('3.3%'),
    color: '#000',
    textAlign: 'center',
    right: 5,
  },
  dayText: {
    fontWeight: '400',
    fontSize: wp('3.5%'),
    color: '#808080',
    textAlign: 'center',
    right: 5,
  },
  cellColumn: {
    width: wp('20%'),
    alignItems: 'center',
    justifyContent: 'center',
    right: 8,
  },
  punchText: {
    color: '#374151',
    fontWeight: 'bold',
    fontSize: wp('3.3%'),
    textAlign: 'center',
    marginBottom: 20,
    marginRight: wp('0.9%'),

  },
  punchOutText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: wp('3.3%'),
    textAlign: 'center',
    marginRight: wp('0.9%'),

  },
  statusText: {
    color: '#808080',
    fontSize: wp('3.5%'),
    marginTop: 2,
    textAlign: 'center',
    left: -2,
  },
  lateStatusText: {
    color: '#C6303E',
    fontSize: wp('3.5%'),
    marginTop: 2,
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginLeft: 15,
  },
  totalHourText: {
    color: '#000',
    fontWeight: '700',
    fontSize: wp('3.3%'),
    textAlign: 'center',
  },
  shiftText: {
    color: '#438aff',
    fontSize: wp('3.5%'),
    textAlign: 'center',
  },
  totalHoursCell: {
    width: wp('22%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleCol: {
    width: wp('45%'),
    alignItems: 'center',
    right: 25,
  },
  centerText: {
    fontSize: wp('3.5%'),
    textAlign: 'center',
    fontWeight: '700',
    top: 7,
  },
  holidayText: {
    color: '#C6303E',
    fontSize: wp('3.5%'),
    textAlign: 'center',
    fontWeight: '700',
    right: 20,
  },
  holidaytotalText: {
    color: '#C6303E',
    fontSize: wp('3.5%'),
    textAlign: 'center',
    fontWeight: '700',
  },
  leaveText: {
    color: '#C6303E',
    fontSize: wp('3.5%'),
    textAlign: 'center',
    fontWeight: '700',
  },
  medicalLeaveText: {
    color: '#C6303E',
    fontSize: wp('3.5%'),
    textAlign: 'center',
    fontWeight: '700',
  },
  weeklyOffText: {
    color: '#C6303E',
    fontSize: wp('3.5%'),
    textAlign: 'center',
    fontWeight: '700',
    right: 10,
  },
  weeklyOfftotalText: {
    color: '#C6303E',
    fontSize: wp('3.5%'),
    textAlign: 'center',
    fontWeight: '700',
  },
  dottedLine: {
    width: wp('0.2%'),
    height: hp('5%'),
    borderLeftWidth: wp('0.3%'),
    borderColor: '#939393',
    borderStyle: 'dashed',
    right: 8,
  },
});

export default AttendanceItem;
