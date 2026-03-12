import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const LeavePolicy = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Section 1: Leave Policy Summary */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Sandwich Leave Policy</Text>
          <Text style={styles.value}>Disabled</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Policy Period</Text>
          <Text style={styles.value}>Jan 2025 - Dec 2025</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Leaves</Text>
          <Text style={styles.value}>20 Days</Text>
        </View>
               <View style={[styles.row, { borderBottomWidth: 0 }]}>

          <Text style={styles.label}>Accrual Period</Text>
          <Text style={styles.value}>None</Text>
        </View>
      </View>

      {/* Section 2: Leave Categories */}
      <Text style={styles.subHeading}>Leave Categories</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.labelleave}>Casual Leave</Text>
          <Text style={styles.value}>6 Days</Text>
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={styles.labelSecondary}>Unused Leave Policy</Text>
          {/* <Text style={styles.valueSecondary}>Lapse</Text> */}
        </View>

        <View style={styles.row}>
          <Text style={styles.labelleave}>Sick Leave</Text>
          <Text style={styles.value}>4 Days</Text>
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={styles.labelSecondary}>Unused Leave Policy</Text>
          <Text style={styles.valueSecondary}>Lapse</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.labelleave}>Annual Leave</Text>
          <Text style={styles.value}>10 Days</Text>
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={styles.labelSecondary}>Unused Leave Policy</Text>
          <Text style={styles.valueSecondary}>Lapse</Text>
        </View>
      </View>

      {/* Section 3: Approval Order */}
      <Text style={styles.subHeading}>Approval Order</Text>
      <View style={styles.card}>
        <Text style={styles.approvalText}>
          Anyone ( Manager , Admin , Business Owner) can approve leave
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: wp('4%'),
  },

  subHeading: {
    fontSize: wp('4.2%'),
    fontWeight: '500',
    marginTop: hp('2.5%'),
    marginBottom: hp('1%'),
    marginLeft: wp('2.5%'),
    color: '#000000',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: "#E5E7EB",

  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp('1%'),
   borderBottomWidth: 0.5,
    borderColor: "#9ca3af",
  },
  label: {
    fontSize: wp('4%'),
    color: '#9CA3AF',
    fontWeight: '400',
  },
  labelleave: {
    fontSize: wp('4%'),
    color: '#374151',
    fontWeight: '500',
  },
  value: {
    fontSize: wp('4%'),
    color: '#374151',
    fontWeight: '500',
  },
  labelSecondary: {
    fontSize: wp('3.6%'),
    color: '#777',
  },
  valueSecondary: {
    fontSize: wp('4%'),
    color: '#374151',
    fontWeight: '500',
  },
  approvalText: {
    fontSize: wp('3.8%'),
    color: '#6E7079',
    lineHeight: hp('3%'),
  },
});

export default LeavePolicy;
