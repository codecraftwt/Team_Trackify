import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const holidays = [
  { name: "New Year's Day", date: '1 Jan, 2025', day: 'Wed' },
  { name: 'Lohri/Makar Sankranti', date: '14 Jan, 2025', day: 'Tue' },
  { name: 'Republic Day', date: '26 Jan, 2025', day: 'Sun' },
  { name: 'Vasant Panchami', date: '2 Feb, 2025', day: 'Sun' },
  { name: 'Maha Shivaratri', date: '26 Feb, 2025', day: 'Wed' },
  { name: 'Holika Dahana', date: '13 Mar, 2025', day: 'Thu' },
  { name: 'Holi', date: '14 Mar, 2025', day: 'Fri' },
  { name: 'Ugadi/Gudi Padwa', date: '22 Mar, 2025', day: 'Sat' },
  { name: 'Eid-ul-Fitr', date: '23 Mar, 2025', day: 'Mon' },
  { name: 'Rama Navami', date: '6 Apr, 2025', day: 'Sun' },
  { name: 'Mahavir Jayanti', date: '10 Apr, 2025', day: 'Thu' },
  { name: 'Ambedkar Jayanti', date: '14 Apr, 2025', day: 'Mon' },
  { name: 'Labour Day', date: '1 May, 2025', day: 'Thu' },
  { name: 'Buddha Purnima', date: '12 May, 2025', day: 'Mon' },
  { name: 'Bakrid/Eid-ul-Adha', date: '7 Jun, 2025', day: 'Sat' },
  { name: 'Muharram/Ashura', date: '6 Jul, 2025', day: 'Sun' },
  { name: 'Guru Purnima', date: '10 Jul, 2025', day: 'Thu' },
  { name: 'Independence Day', date: '15 Aug, 2025', day: 'Fri' },
  { name: 'Janmashtami', date: '16 Aug, 2025', day: 'Sat' },
  { name: 'Ganesh Chaturthi', date: '27 Aug, 2025', day: 'Wed' },
  { name: 'Maha Navami', date: '1 Oct, 2025', day: 'Wed' },
  { name: 'Diwali', date: '20 Oct, 2025', day: 'Mon' },
  { name: 'Bhai Duj', date: '23 Oct, 2025', day: 'Thu' },
  { name: 'Chhath Puja', date: '28 Oct, 2025', day: 'Tue' },
  { name: 'Guru Nanak Jayanti', date: '5 Nov, 2025', day: 'Wed' },
  { name: 'Christmas', date: '25 Dec, 2025', day: 'Thu' },
];

const FixedHolidays = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Policy Period */}
      <View style={styles.card}>
        <View style={styles.row}>

          <Text style={styles.labelpolicy}>Policy Period</Text>
          <Text style={styles.value}>Jan 2025– Dec 2025</Text>
        </View>
      </View>

      {/* Holiday List */}
      <Text style={styles.label}>Holiday List</Text>

      <View style={styles.card}>
        {holidays.map((holiday, index) => (
          <View
            key={index}
            style={[
              styles.holidayItem,
              index === holidays.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.row}>
              <Text style={styles.holidayName}>{holiday.name}</Text>
              <Text style={styles.holidayDate}>
                {holiday.date} | {holiday.day}
              </Text>
            </View>
          </View>
        ))}
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: wp('4%'),
    paddingTop: hp('2%'),
  },
  title: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#000',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  labelpolicy: {
    fontSize: wp('3.8%'),
    color: '#9CA3AF',

    marginBottom: hp('1%'),
  },
  label: {
    fontSize: wp('3.8%'),
    color: '#374151',
    fontWeight: 500,
    marginBottom: hp('1%'),
    marginLeft: wp("1.5%"),

  },
  value: {
    fontSize: wp('4.2%'),
    fontWeight: 500,
    color: '#374151',
  },
  holidayItem: {
     borderBottomWidth: 0.5,
    borderColor: "#9ca3af",
    paddingVertical: hp('1.2%'),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',

  },

  holidayName: {
    fontSize: wp('4%'),
    color: '#9CA3AF',
  },
  holidayDate: {
    fontSize: wp('4%'),
    color: '#374151',
    fontWeight: 500,
  },
});

export default FixedHolidays;
