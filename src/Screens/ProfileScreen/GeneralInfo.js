import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../../config/server';


const decodeJWT = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (e) {
    console.log("JWT decode error", e);
    return null;
  }
};

const GeneralInfoCard = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployeeProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert("Error", "Token not found");
        return;
      }
      const decoded = decodeJWT(token);
      const employeeId = decoded?.EmployeeId;
      if (!employeeId) {
        Alert.alert("Error", "Employee ID missing from token");
        return;
      }
      const response = await fetch(`${BASE_URL}/Employee/GetProfileByEmployeeId?employeeId=${employeeId}`, {
        headers: {
          Authorization: token,
        },
      });

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        // Show the latest or first record
        setProfile(data[0]);
      } else {
        throw new Error('Profile not found');
      }
    } catch (error) {
      // console.error('Error fetching profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeProfile();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#000" style={{ marginTop: hp('4%') }} />;
  }

if (!profile) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: hp('4%') }}>
      <Text style={{ fontSize: wp('4%'), color: '#888' }}>No profile information added.</Text>
    </View>
  );
}


  const {
    shift,
    weeklyOffTemplate,
    holidayTemplate,
    designation,
    category,
    grade,
    contractType,
    location,
    attendanceMode,
    role,
    salaryTemplate,
    employeeProfile,
  } = profile;

  const { ctcType, monthlyGrossAmount } = employeeProfile || {};

  return (
   <View style={styles.card}>
  <View style={styles.row}>
    <Text style={styles.label}>Designation</Text>
    <Text style={styles.value}>{designation || 'N/A'}</Text>
  </View>

  <View style={styles.row}>
    <Text style={styles.label}>Category</Text>
    <Text style={styles.value}>{category || 'N/A'}</Text>
  </View>

  <View style={styles.row}>
    <Text style={styles.label}>Grade</Text>
    <Text style={styles.value}>{grade || 'N/A'}</Text>
  </View>

  <View style={styles.row}>
    <Text style={styles.label}>Contract Type</Text>
    <Text style={styles.value}>{contractType || 'N/A'}</Text>
  </View>

  <View style={styles.row}>
    <Text style={styles.label}>Location</Text>
    <Text style={styles.value}>{location || 'N/A'}</Text>
  </View>

  <View style={styles.row}>
    <Text style={styles.label}>Shift</Text>
    <Text style={styles.value}>{shift || 'N/A'}</Text>
  </View>

  <View style={styles.row}>
    <Text style={styles.label}>Weekly-off Template</Text>
    <Text style={styles.value}>{weeklyOffTemplate || 'N/A'}</Text>
  </View>

  <View style={styles.row}>
    <Text style={styles.label}>Attendance Mode</Text>
    <Text style={styles.value}>{attendanceMode || 'N/A'}</Text>
  </View>

  <View style={styles.row}>
    <Text style={styles.label}>Role</Text>
    <Text style={styles.value}>{role || 'N/A'}</Text>
  </View>

  <View style={styles.row}>
    <Text style={styles.label}>CTC Type</Text>
    <Text style={styles.value}>{ctcType || 'N/A'}</Text>
  </View>

  <View style={styles.row}>
    <Text style={styles.label}>Gross Monthly Amount</Text>
    <Text style={styles.value}>{monthlyGrossAmount || 'N/A'}</Text>
  </View>

{/* <View style={styles.row}>
        <Text style={styles.label}>Salary Template</Text>
        <Text style={styles.value}>{salaryTemplate || 'N/A'}</Text>
      </View> */}
      
  <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('FixedHolidays')}>
    <Text style={styles.label}>Holiday Policy</Text>
    <View style={styles.rightSection}>
      <Text style={[styles.value, styles.linkText]}>{holidayTemplate || 'N/A'}</Text>
      <Icon name="chevron-right" size={wp('3.5%')} color="#374151" />
    </View>
  </TouchableOpacity>

  <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('LeavePolicy')}>
    <Text style={styles.label}>Leave Policy</Text>
    <View style={styles.rightSection}>
      <Text style={[styles.value, styles.linkText]}>20 Leaves</Text>
      <Icon name="chevron-right" size={wp('3.5%')} color="#374151" />
    </View>
  </TouchableOpacity>
</View>

  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: wp('2.5%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
   borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowRadius: 4,
    margin: wp('4%'),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('1.2%'),
     borderBottomWidth: 0.5,
    borderColor: "#9ca3af",
  },
  label: {
    fontSize: wp('3.8%'),
     color: '#374151',
  },
  value: {
   fontSize: wp('3.8%'),
    fontWeight: '500',
    color: '#212529',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  linkText: {
     color: '#212529',
  },
});

export default GeneralInfoCard;
