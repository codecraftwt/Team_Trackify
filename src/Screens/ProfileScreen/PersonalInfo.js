import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import BASE_URL from '../../config/server';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const decodeJWT = (token) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
  } catch (e) {
    console.error("JWT decode error:", e);
    return null;
  }
};

const PersonalInfo = () => {
  const navigation = useNavigation();
  const [employeeData, setEmployeeData] = useState(null);

  const employee = employeeData?.employee;
  const bloodGroup = employeeData?.bloodGroup;

  useFocusEffect(
    React.useCallback(() => {
      fetchAllEmployeeInfo();
    }, [])
  );

  const fetchAllEmployeeInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert("Error", "Token not found. Please login again.");
        return;
      }

      const decoded = decodeJWT(token);
      const employeeId = decoded?.EmployeeId;
      if (!employeeId) {
        Alert.alert("Error", "Employee ID not found in token.");
        return;
      }

      const response = await fetch(`${BASE_URL}/Employee/GetEmployeeById?employeeId=${employeeId}`, {
        headers: { Authorization: token },
      });

      if (!response.ok) throw new Error("Failed to fetch employee data");
      const empData = await response.json();
      setEmployeeData(empData);
    } catch (error) {
      console.error("Error fetching employee info:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  if (!employeeData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading employee information...</Text>
      </View>
    );
  }

  // Format data
  const profileData = [
    { label: 'Name', value: `${employee.firstName} ${employee.middleName} ${employee.lastName}` },
    { label: 'ID', value: `#${employee.employeeId}` },
    { label: 'Mobile Number', value: employee.mobileNo },
  ];

  const personalData = [
    { label: 'Email ID', value: employee.emailId },
    { label: 'Gender', value: employee.gender === 'F' ? 'Female' : 'Male' },
    { label: 'Date of Birth', value: new Date(employee.dob).toLocaleDateString() },
    { label: 'Blood Group', value: bloodGroup ?? 'N/A' },
    { label: 'Marital Status', value: employee.maritalStatus ? 'Married' : 'Single' },
    { label: 'Emergency Contact', value: employee.emergencyContactNo }
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Full width header */}
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: 10 }}>
          <Icon name="chevron-back" size={24} color="#438AFF" />
        </TouchableOpacity>

        <Text style={styles.centeredHeaderTitle}>Personal Information</Text>

        <View style={{ paddingHorizontal: 10 }}>
          <TouchableOpacity onPress={() => navigation.navigate("EditPersonalInfo", { employeeId: employee?.employeeId })}>
            <Icon name="pencil" size={24} color="#438AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Page content with padding */}
      <View style={styles.container}>
        {/* Profile Info */}
        <Text style={styles.sectionTitle}>Profile Information</Text>
        <View style={styles.infoBox}>
          <FlatList
            data={profileData}
            keyExtractor={(item) => item.label}
            renderItem={({ item }) => {
              const isLastItem = item.label === 'Mobile Number';
              return (
                <View style={[styles.row, isLastItem && { borderBottomWidth: 0 }]}>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.value}>{item.value}</Text>
                </View>
              );
            }}
          />
        </View>

        {/* Personal Info */}
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoBox}>
          <FlatList
            data={personalData}
            keyExtractor={(item) => item.label}
            renderItem={({ item }) => {
              const hideBorder = item.label === 'Emergency Contact';
              return (
                <View style={[styles.row, hideBorder && { borderBottomWidth: 0 }]}>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.value}>{item.value}</Text>
                </View>
              );
            }}
          />
        </View>

        {/* Address Info */}
        <Text style={styles.sectionTitle}>Address</Text>
        <View style={styles.infoBox}>
          <View style={styles.addressRow}>
            <Text style={styles.label}>Current Address</Text>
            <Text style={styles.addressText}>{employee?.currentAddress ?? 'N/A'}</Text>
          </View>
          <View style={[styles.addressRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>Permanent Address</Text>
            <Text style={styles.addressText}>{employee?.permanentAddress ?? 'N/A'}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: wp('4%'), // content padding only
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  centeredHeaderTitle: {
    flex: 1,
    fontSize: wp(4.5),
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: wp('4.2%'),
    fontWeight: 'bold',
    marginVertical: hp('2%'),
    color: "#000",
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: hp('1%'),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp('1%'),
    borderBottomWidth: 0.5,
    borderColor: "#9ca3af",
  },
  label: {
    flex: 1,
    fontSize: wp('3.5%'),
    fontWeight: '400',
    color: '#9CA3AF',
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'right',
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: hp('1%'),
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  addressText: {
    flex: 2,
    fontSize: wp('3.5%'),
    fontWeight: '500',
    color: '#000',
    textAlign: 'right',
  },
});

export default PersonalInfo;
