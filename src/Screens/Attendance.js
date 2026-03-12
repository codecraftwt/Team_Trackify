import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AttendanceItem from '../Component/AttendanceItem';
import AttendanceHeader from '../Component/AttendanceHeader';
import BASE_URL from "../config/server";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import dayjs from 'dayjs';

const { width } = Dimensions.get("window");

const Attendance = () => {
  const navigation = useNavigation();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch API
const fetchAttendance = useCallback(async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return;

    const cleanToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    const decoded = jwtDecode(cleanToken);

    const empId = decoded?.EmpId || decoded?.EmployeeId || decoded?.employeeId;
    if (!empId) {
      console.warn("empId missing from token");
      setLoading(false);
      return;
    }

    const url = `${BASE_URL}/Attendance/GetAttendanceDailyByEmpId?empId=${empId}`;
    console.log("Fetching:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cleanToken}`,
      },
    });

    const data = await response.json();
    console.log("API data:", data);

    const filtered = Array.isArray(data) ? data : [];

    // Direct mapping (backend already merged by date)
// Direct mapping (backend already merged by date)
const mapped = filtered
  .map(item => {
    const punchInTime = item.inTime ? dayjs(item.inTime) : null;
    const punchOutTime = item.outTime ? dayjs(item.outTime) : null;

    let punchOutDisplay = "—";
    let displayStatus = item.remark || item.attendanceStatus || "";

    const remarkText = item.remark ? item.remark.toLowerCase().replace(/\s|-/g, "") : "";

    // ✅ Include all possible PunchOut remarks
    const punchOutRemarks = ["punchout", "clockedout", "punchoutdone", "out", "logout"];

    if (punchOutTime && punchOutRemarks.includes(remarkText)) {
      punchOutDisplay = punchOutTime.format("hh:mm A");
    } 
    // Optional: show WorkOut / BreakOut in status column
    else if (remarkText === "workout" || remarkText === "breakout") {
      displayStatus = item.remark;
    }

    return {
      date: dayjs(item.workingDay).format("MMM,DD"),
      day: dayjs(item.workingDay).format("ddd"),
      punchIn: punchInTime ? punchInTime.format("hh:mm A") : "—",
      punchOut: punchOutDisplay,
      totalHours: item.workingHrs || "—",
      image: item.image,
      status: displayStatus,
    };
  })
  .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix()); // latest first

 // latest first



    setAttendanceData(mapped);
  } catch (err) {
    console.error("Fetch error:", err);
    setAttendanceData([]);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, []);


  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAttendance();
  }, [fetchAttendance]);

  // Initial load
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.innerWrapper}>
          <AttendanceHeader />
          {loading ? (
            <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
          ) : attendanceData.length === 0 ? (
            <AttendanceItem punchIn="No attendance data" />
          ) : (
            attendanceData.map((item, index) => (
              <TouchableOpacity key={index} activeOpacity={0.8}>
                <AttendanceItem
                  date={item.date}
                  day={item.day}
                  punchIn={item.punchIn}
                  punchOut={item.punchOut}
                  totalHours={item.totalHours}
                  // status={item.status}
                  type={null}
                  image={item.image}
                />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
  },
  innerWrapper: {
    width: "100%",
    maxWidth: width > 600 ? 600 : "100%",
    alignSelf: "center",
  },
});

export default Attendance;
