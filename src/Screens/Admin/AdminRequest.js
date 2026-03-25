import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from "react-native-vector-icons/FontAwesome";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../config/auth-context'; // ✅ Adjust import path
import { jwtDecode } from "jwt-decode"
import BASE_URL from '../../config/server';

const AdminRequest = () => {
  const navigation = useNavigation();
  const [userName, setUserName] = useState(''); // ← holds name
  const [profileData, setProfileData] = useState(null)
  const [profileImage, setProfileImage] = useState("")
  const [currentDate, setCurrentDate] = useState('');
  const [managerRequestCounts, setManagerRequestCounts] = useState({
    empListCount: '0', // Initial placeholder
    leaveRequestCount: '0',
    loanRequestCount: '0',
    shiftRequestCount: '0',
  });
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join(""),
      )
      return JSON.parse(jsonPayload)
    } catch (e) {
      console.error("JWT Decode Error:", e)
      return null
    }
  }


  const fetchProfileData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("authToken")
      if (!token) {
        Alert.alert("Error", "Token not found")
        return
      }
      const cleanToken = token.replace("Bearer ", "")
      const decoded = decodeJWT(cleanToken)
      const employeeId = decoded?.EmployeeId
      if (!employeeId) {
        Alert.alert("Error", "Employee ID missing from token")
        return
      }

      // 🔑 Call the new function to fetch manager data
      await fetchManagerData(employeeId, cleanToken);

      const response = await fetch(`${BASE_URL}/Employee/GetEmpProfile?employeeId=${employeeId}`, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
        },
      })

      console.log("Profile response status:", response.status)
      if (!response.ok) throw new Error("Failed to fetch profile data")
      const data = await response.json()
      setProfileData(data)
      if (data.photoImage) {
        let base64 = data.photoImage.trim()
        base64 = base64.replace(/^"(.*)"$/, "$1")
        if (!base64.startsWith("data:image")) {
          base64 = `data:image/jpeg;base64,${base64}`
        }
        setProfileImage(base64)
      } else {
        console.warn("No image returned from API")
        setProfileImage(null)
      }
    } catch (error) {
      console.error("Profile Fetch Error:", error)
      Alert.alert("Error", "Failed to load profile.")
    }
  }, []);



  // 🔑 2. New function to fetch manager data
  const fetchManagerData = async (employeeId, token) => {
    try {
      // managerId in API means employeeId (as per prompt)
      const url = `${BASE_URL}/Payroll/GetManagerData?managerId=${employeeId}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log("Manager Data response status:", response.status);
      if (!response.ok) throw new Error(`Failed to fetch manager data. Status: ${response.status}`);

      const data = await response.json();
      console.log("Manager Data:", data);

      // Update state with fetched counts
      setManagerRequestCounts({
        empListCount: data.empListCount ? String(data.empListCount) : '0',
        leaveRequestCount: data.leaveRequestCount ? String(data.leaveRequestCount) : '0',
        loanRequestCount: data.loanRequestCount ? String(data.loanRequestCount) : '0',
        shiftRequestCount: data.shiftRequestCount ? String(data.shiftRequestCount) : '0',
      });
    } catch (error) {
      console.error("Manager Data Fetch Error:", error);
      // Optional: Alert.alert("Error", "Failed to load request counts.");
    }
  };

  useEffect(() => {
    formatCurrentDate();
    fetchProfileData(); // 🔑 fetchManagerData is now called inside fetchProfileData
  }, [fetchProfileData])

  const formatCurrentDate = () => {
    const date = new Date();
    const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options).toUpperCase(); // e.g., FRI, 02 AUG 2025
    setCurrentDate(formattedDate);
  };

  const gridData = [
    { title: 'Total Employees', count: managerRequestCounts.empListCount, countColor: '#0189c7', borderColor: '#0189c7', bgColor: '#f0f8ff' },
    { title: 'Shift Request', count: managerRequestCounts.shiftRequestCount, countColor: '#ff9900', borderColor: '#ff9900', bgColor: '#fffaf0' },
    { title: 'Leave Request', count: managerRequestCounts.leaveRequestCount, countColor: '#00b3b3', borderColor: '#00b3b3', bgColor: '#f0ffff' },
    { title: 'Loan Request', count: managerRequestCounts.loanRequestCount, countColor: '#cc00ff', borderColor: '#cc00ff', bgColor: '#faf0ff' },
    // Note: You had '05' in the original code, but the API response has integers.
    // We use String() to ensure the count is a string for display if needed.
  ];

  const pageMap = {
    'Total Employees': 'AdminTotalEmployees',
    'Total Present': '',
    'Total Absent': '',
    'Shift Request': 'AdminShiftRequest',
    'Leave Request': 'AdminLeaveRequest',
    'Loan Request': 'AdminLoanRequest',

  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        const page = pageMap[item.title];
        if (page) navigation.navigate(page);
      }}
      style={[
        styles.card,
        { borderColor: item.borderColor, backgroundColor: item.bgColor },
      ]}
    >
      <Text allowFontScaling={false} style={styles.cardTitle}>{item.title}</Text>
      <Text allowFontScaling={false} style={[styles.cardCount, { color: item.countColor }]}>{item.count}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with profile and notification */}
      <View style={styles.customHeader}>
        <Text allowFontScaling={false} style={styles.centeredHeaderTitle}>Home</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => console.log("Notification Clicked")}>
            <Icon name="bell-o" size={22} color="#212529" style={{ marginRight: 18 }} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.placeholderImage]} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Welcome Message */}
      <View style={styles.header}>
        <Text>Hello, <Text style={styles.name}>{profileData?.fullName ?? "Loading..."}</Text></Text>
        <Text style={styles.date}>{currentDate}</Text>
      </View>

      <FlatList
        data={gridData}
        numColumns={2}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.grid}
      />
    </View>
  );
};

export default AdminRequest;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    backgroundColor: '#f8f9fa',
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: hp(6),
    marginBottom: hp(2),
    position: "relative",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  centeredHeaderTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: wp(5),
    fontWeight: "600",
    color: "#000",
    zIndex: -1,
    color: '#000',
  },
  headerIcons: {
    position: "absolute",
    right: wp(2),
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: "#ccc",
  },
  header: {
    marginBottom: hp(2),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    fontWeight: 'bold',
    fontSize: wp(4),
    color: "#212529"
  },
  date: {
    color: '#9ca3af',
    fontSize: wp(3.5),
  },
  grid: {
    paddingBottom: hp(10),
  },
  card: {
    flex: 1,
    margin: wp(2),
    padding: wp(4),
    borderWidth: 1,
    borderRadius: wp(3),
    minHeight: hp(15),
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: hp(1),
    fontSize: Math.max(wp("3.8%"), 14),
    color: '#374151',
  },
  cardCount: {
    fontSize: wp(6.5),
    fontWeight: 'bold',
  },
});

