// screens/AdminRequestDetails.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const wp = (p) => (width * p) / 100;
const hp = (p) => (height * p) / 100;

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date)) return 'N/A';
  const day = date.getDate().toString().padStart(2, '0');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

export default function AdminRequestDetails({ route }) {
  const { title, fields, onAccept, onReject } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* <Text style={styles.header}>{title} Details</Text> */}
      <View style={styles.card}>
        {fields.map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>
              {item.isDate ? formatDate(item.value) : (item.value || 'N/A')}
            </Text>
            {index !== fields.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.accept]} onPress={onAccept}>
          <Text style={styles.acceptText}>✔ Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.reject]} onPress={onReject}>
          <Text style={styles.rejectText}>✖ Reject</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    backgroundColor: '#f8f9fa',
    flexGrow: 1,
  },
  header: {
    fontSize: wp(5.5),
    fontWeight: 'bold',
    marginBottom: hp(1),
    color: '#212529',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: wp(3),
    padding: wp(3),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    marginBottom: hp(0.5),
  },
  label: {
    fontSize: Math.max(wp(3.8), 14),
    color: '#374151',
    marginBottom: hp(0.5),
  },
  value: {
    fontSize: Math.max(wp(3.8), 14),
    fontWeight: '500',
    color: '#212529',
    marginBottom: hp(0.5),
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: hp(0.5),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap', // allows wrapping on small screens
    // marginTop: hp(2),
  },
  button: {
    flex: 1,
    paddingVertical: hp(1.8),
    borderRadius: wp(2),
    alignItems: 'center',
    marginHorizontal: wp(1),
    marginVertical: hp(0.5),
    minWidth: wp(40), // ensures buttons don’t get too small on tiny screens
  },
  accept: {
    borderWidth: 1,
    borderColor: '#44c144',
  },
  reject: {
    borderWidth: 1,
    borderColor: '#c6303e',
  },
  acceptText: {
    fontSize: Math.max(wp(4), 14),
    color: '#44c144',
    fontWeight: 'bold',
  },
  rejectText: {
    fontSize: Math.max(wp(4), 14),
    color: '#c6303e',
    fontWeight: 'bold',
  },
});

