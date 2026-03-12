import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import SettingItem from '../Component/SettingItem';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width } = Dimensions.get("window");

const Settings = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ✅ Top Menu Section */}
        <View style={styles.menuRow}>
          <SettingItem icon="file-alt" title="Salary Slips" onPress={() => navigation.navigate('SalarySlip')} />
          <SettingItem icon="calendar-day" title="Attendance" onPress={() => navigation.navigate('Attendance')} />
          {/* <SettingItem icon="calendar-check" title="Attendance Summary" onPress={() => navigation.navigate('AttendanceSummary')} /> */}
          <SettingItem icon="ticket-alt" title="My Tickets" onPress={() => navigation.navigate('MyTickets')} />
        </View>

        {/* ✅ Request Section */}
        <Text style={styles.sectionTitle}>Request</Text>
        <View style={styles.menuRow}>
          <SettingItem icon="briefcase" title="Shift Request" onPress={() => navigation.navigate('ShiftRequestScreen')} />
          <SettingItem icon="calendar-plus" title="Leave Request" onPress={() => navigation.navigate('LeaveApproval')} />
          <SettingItem icon="money-bill" title="Loan Request" onPress={() => navigation.navigate('LoanRequestScreen')} />
        </View>

        {/* ✅ Claim Section */}
        <Text style={styles.sectionTitle}>Claim</Text>
        <View style={styles.menuRow}>
          <SettingItem icon="receipt" title="Expense Request" onPress={() => navigation.navigate('ExpenseClaim')} />
        </View>

        {/* ✅ Tracking Section */}
        <Text style={styles.sectionTitle}>Tracking</Text>
        <View style={styles.menuRow}>
          <SettingItem icon="map-marker-alt" title="Location Tracking" onPress={() => navigation.navigate('LocationTracking')} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    alignItems: 'center',
  },

  menuRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: hp(1.5),
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: "#f8f9fa",
  },

  sectionTitle: {
     fontSize: Math.max(wp("4.3%"), 14),
    fontWeight: '600',
    color: "#000000",
    marginTop: hp(1),
    marginBottom: hp(1),
    width: '100%',
    textAlign: 'left',
    maxWidth: 600,
    alignSelf: 'center',
     marginLeft: wp('3%'),
  },
});

export default Settings;
