import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const wp = (percentage) => (width * percentage) / 100;
const hp = (percentage) => (height * percentage) / 100;

const AdminLeaveDetails = ({ route, navigation }) => {
  const { leaveData } = route.params;

  const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date)) return 'N/A';

  const day = date.getDate().toString().padStart(2, '0');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

  // Map the leaveData object to the format your UI expects
  const data = [
    { label: 'Leave Type', value: leaveData.leaveType || 'N/A' },
    { label: 'Date', value: `${formatDate(leaveData.fromDate)} - ${formatDate(leaveData.toDate)}` },
    { label: 'Remark', value: leaveData.remark || 'N/A' },
    { label: 'Applied On',value: formatDate(leaveData.applicationDate) },
    { label: 'Contact Number', value: leaveData.contactNumber || 'N/A' },
    { label: 'Reason', value: leaveData.reason || 'N/A' },
    { label: 'Status', value: leaveData.status || 'N/A' },
    { label: 'Approved By', value: leaveData.approvedBy || 'N/A' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {data.map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
            {index !== data.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.accept]}>
          <Text style={styles.acceptText}>✔ Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.reject]}>
          <Text style={styles.rejectText}>✖ Reject</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: wp(4),
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#d6cacaff',
  },
  row: {
    marginBottom: hp(1.5),
  },
  label: {
    fontSize: wp(3.5),
    color: '#8a8a8a',
    marginBottom: hp(0.5),
  },
  value: {
    fontSize: wp(3.8),
    fontWeight: '500',
    color: '#000',
    marginBottom: hp(0.8),
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(2),
  },
  button: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: wp(2),
    alignItems: 'center',
    marginHorizontal: wp(1.5),
  },
  accept: {
    borderWidth: 1,
    borderColor: '#44c144',
  },
  reject: {
    borderWidth: 1,
    borderColor: '#F44336',
  },
  acceptText: {
    fontSize: wp(3.8),
    color: '#44c144',
    fontWeight: 'bold',
  },
  rejectText: {
    fontSize: wp(3.8),
    color: '#c64343',
    fontWeight: 'bold',
  },
});

export default AdminLeaveDetails;
