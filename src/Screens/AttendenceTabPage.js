import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import RNPickerSelect from "react-native-picker-select";
import AsyncStorage from "@react-native-async-storage/async-storage"
import { jwtDecode } from "jwt-decode"
import BASE_URL from "../config/server"


const AttendenceTabPage = () => {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState("summary");
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [monthsList, setMonthsList] = useState([]);
    const [yearsList, setYearsList] = useState([]);
    const [summaryData, setSummaryData] = useState(null);
    const [dayWiseData, setDayWiseData] = useState([]);
    const [attendanceMarksList, setAttendanceMarksList] = useState([]);
    const currentMonth = new Date().getMonth() + 1; // Jan=0 so +1
    const currentYear = new Date().getFullYear();

    const fetchEmployeeAttendance = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("authToken");
            const userId = await AsyncStorage.getItem("userId");
            const cleanToken = token?.replace("Bearer ", "") || "";
            const decoded = jwtDecode(cleanToken);
            const empId = Number(decoded?.EmployeeId || userId);

            const response = await fetch(`${BASE_URL}/Attendance/AddUpdateEmployeeAttendance`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify([empId]), // send empId in request body
            });

            const data = response.ok ? await response.json() : [];

            if (data && data.length > 0) {
                const attendance = data[0];
                setSummaryData({
                    presentDays: attendance.presentDays,
                    absentDays: attendance.absentDays,
                    halfDays: attendance.halfDays,
                    workingDays: attendance.workingDays,
                    holidayDays: attendance.holidayDays,
                    leaveDays: attendance.leaveDays,
                    totalDays: attendance.totalDays,
                });
            } else {
                setSummaryData({
                    presentDays: 0,
                    absentDays: 0,
                    halfDays: 0,
                    workingDays: 0,
                    holidayDays: 0,
                    leaveDays: 0,
                    totalDays: 0,
                });
            }
        } catch (error) {
            console.error("Error fetching employee attendance:", error);
            setSummaryData({
                presentDays: 0,
                absentDays: 0,
                halfDays: 0,
                workingDays: 0,
                holidayDays: 0,
                leaveDays: 0,
                totalDays: 0,
            });
        } finally {
            setLoading(false);
        }
    };


    const fetchMonths = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const companyId = await AsyncStorage.getItem("companyId")
            const userId = await AsyncStorage.getItem("userId")


            const cleanToken = token?.replace("Bearer ", "") || "";

            const decoded = jwtDecode(cleanToken)
            const employeeID = Number(decoded?.EmployeeId || userId)

            const response = await fetch(`${BASE_URL}/Master/GetMonths`, {
                headers: {
                    Authorization: token,
                },
            });

            const data = await response.json();
            // console.log('get months:', response);

            if (response.ok && Array.isArray(data)) {
                const uniqueMonths = data.filter(
                    (value, index, self) =>
                        // index === self.findIndex((m) => m.month1 === value.month1 && m.yearId === value.yearId)
                        index === self.findIndex((m) => m.month1 === value.month1)

                );
                setMonthsList(uniqueMonths);

                // ✅ Match by name instead of id
                const now = new Date();
                const currentMonthName = now.toLocaleString("default", { month: "long" });

                const currentMonthObj = uniqueMonths.find(
                    (m) => m.month1.toLowerCase() === currentMonthName.toLowerCase()
                );

                if (currentMonthObj) {
                    setSelectedMonth(currentMonthObj.monthId);
                    setSelectedYear(currentMonthObj.yearId);
                } else {
                    // fallback: pick first
                    setSelectedMonth(uniqueMonths[0]?.monthId || "");
                    setSelectedYear(uniqueMonths[0]?.yearId || "");
                }
            } else {
                console.warn("Unexpected GetMonths data format:", data);
            }
        } catch (error) {
            console.error("Error fetching months:", error);
        }
    };

    // const fetchYears = async () => {
    //     try {
    //         const token = await AsyncStorage.getItem('authToken');

    //         const response = await fetch(`${BASE_URL}/Master/GetYears`, {
    //             headers: {
    //                 Authorization: token,
    //             },
    //         });

    //         const data = await response.json();
    //         if (response.ok && Array.isArray(data)) {
    //             const uniqueYears = data.filter(
    //                 (value, index, self) =>
    //                     index === self.findIndex((y) => y.yearLabel === value.yearLabel)
    //             );
    //             setYearsList(uniqueYears);
    //             // ✅ Match current year by yearLabel, not yearId
    //             const now = new Date();
    //             const currentYear = now.getFullYear().toString();
    //             const currentYearObj = data.find(
    //                 (y) => y.yearLabel.toString() === currentYear
    //             );
    //             if (currentYearObj) {
    //                 setSelectedYear(currentYearObj.yearId);
    //             } else {
    //                 // fallback to latest or first year
    //                 setSelectedYear(data[0]?.yearId || "");
    //             }
    //         } else {
    //             console.warn("Unexpected GetYears response:", data);
    //         }
    //     } catch (error) {
    //         console.error("Error fetching years:", error);    }  };

    const fetchYears = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${BASE_URL}/Master/GetYears`, {
                headers: { Authorization: token },
            });

            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                setYearsList(data); // optional if you don't need the list

                const currentYearLabel = new Date().getFullYear().toString();

                const currentYearObj = data.find(
                    (y) => y.yearLabel.toString() === currentYearLabel
                );

                if (currentYearObj) {
                    setSelectedYear(currentYearObj.yearId); // Automatically select current year
                } else {
                    setSelectedYear(data[0]?.yearId || ""); // fallback
                }
            } else {
                console.warn("Unexpected GetYears response:", data);
            }
        } catch (error) {
            console.error("Error fetching years:", error);
        }
    };

    const fetchSummary = async () => {
        if (!selectedMonth || !selectedYear) return;

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("authToken");
            const userId = await AsyncStorage.getItem("userId");
            const cleanToken = token?.replace("Bearer ", "") || "";
            const decoded = jwtDecode(cleanToken);
            const empId = Number(decoded?.EmployeeId || userId);

            const response = await fetch(
                `${BASE_URL}/Attendance/GetAttendanceSummaryByMonth?empId=${empId}&yearId=${selectedYear}&monthId=${selectedMonth}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${cleanToken}`,
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                }
            );

            const text = await response.text();
            const data = response.ok && text ? JSON.parse(text) : null;

            // If data is null/empty, show 0 counts
            setSummaryData(
                data && Object.keys(data).length
                    ? data
                    : {
                        presentDays: 0,
                        absentDays: 0,
                        halfDays: 0,
                        workingDays: 0,
                        holidayDays: 0,
                        leaveDays: 0,
                        lateDays: 0,
                    }
            );
        } catch (error) {
            console.error("Error fetching summary:", error);
            setSummaryData({
                presentDays: 0,
                absentDays: 0,
                halfDays: 0,
                workingDays: 0,
                holidayDays: 0,
                leaveDays: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    const punchTypes = [
        { mark: "P", type: "Working", color: "#34a853" },
        { mark: "L", type: "Leave", color: "#f52e2e" },
        { mark: "A", type: "Absent", color: "#f52e2e" },
        { mark: "HF", type: "Half Day", color: "#f9a825" },
        { mark: "WO", type: "WeeklyOff", color: "#438aff" },
        { mark: "PW", type: "Paid Weekly Off", color: "#438aff" },
        { mark: "PL", type: "Paid Leave", color: "#c6303e" },
        { mark: "CL", type: "Casual Leave", color: "#c6303e" },
        { mark: "SL", type: "Sick Leave", color: "#c6303e" },
        { mark: "H", type: "Holiday", color: "#438aff" },
        { mark: "PC", type: "Half Causal leave", color: "#f9a825" },
    ];

    const fetchDaywise = async () => {
        if (!selectedMonth || !selectedYear) return;
        setLoading(true);

        try {
            const token = await AsyncStorage.getItem("authToken");
            const userId = await AsyncStorage.getItem("userId");
            const cleanToken = token?.replace("Bearer ", "") || "";
            const decoded = jwtDecode(cleanToken);
            const empId = Number(decoded?.EmployeeId || userId);

            const response = await fetch(
                `${BASE_URL}/Attendance/GetAttendanceByMonth?empId=${empId}&yearId=${selectedYear}&monthId=${selectedMonth}`,
                { headers: { Authorization: `Bearer ${cleanToken}` } }
            );

            const data = response.ok ? await response.json() : [];
            // console.log("month:", response);
            // console.log("Attendance data:", data);

            const mappedData = data.map((item) => {
                const punch = punchTypes.find((p) => p.mark.trim() === item.punchMark?.trim());
                const status = punch ? punch.type : item.punchMark || "Unknown";
                const color = punch ? punch.color : "#000";

                const dateObj = new Date(item.date);
                const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

                return {
                    date: dateObj.getDate().toString().padStart(2, "0"),
                    day: dayNames[dateObj.getDay()],
                    status,
                    detail: item.workTime !== "00:00:00" ? item.workTime : "",
                    color,
                    time:
                        item.inTime && item.outTime && item.inTime !== "00:00:00"
                            ? `${item.inTime} - ${item.outTime}`
                            : "00:00 - 00:00",
                };
            });

            setDayWiseData(mappedData);
        } catch (error) {
            console.error("Error fetching daywise data:", error);
            setDayWiseData([]);
        } finally {
            setLoading(false);
        }
    };


    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Promise.all([fetchSummary(), fetchDaywise()])
            .finally(() => setRefreshing(false));
    }, [selectedMonth, selectedYear]);

    useEffect(() => { fetchEmployeeAttendance(); }, []);

    useEffect(() => { fetchMonths(); }, []);
    useEffect(() => { fetchYears(); }, []);
    useEffect(() => { fetchSummary(); }, [selectedMonth, selectedYear]);
    useEffect(() => { fetchDaywise(); }, [selectedMonth, selectedYear]);

    return (
        <SafeAreaView style={styles.container}>
            {/* Tabs */}
            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "summary" && styles.activeTab]}
                    onPress={() => setActiveTab("summary")}
                >
                    <Text style={[styles.tabText, activeTab === "summary" && styles.activeTabText]}>
                        Summary
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "daywise" && styles.activeTab]}
                    onPress={() => setActiveTab("daywise")}
                >
                    <Text style={[styles.tabText, activeTab === "daywise" && styles.activeTabText]}>
                        Day wise
                    </Text>
                </TouchableOpacity>

                {/* Month-Year Selectors */}
                <View style={styles.monthYearRow}>
                    <RNPickerSelect
                        placeholder={{}}
                        onValueChange={(value) => setSelectedMonth(value)}
                        items={monthsList.map((m) => ({
                            key: m.monthId,
                            label: m.month1.substring(0, 3),
                            value: m.monthId,
                        }))}
                        value={selectedMonth}
                        style={{
                            inputIOS: styles.dropdownInput,
                            inputAndroid: styles.dropdownInput,
                            iconContainer: { top: hp(1.5), right: wp(3.5) },
                        }}
                        useNativeAndroidPickerStyle={false}
                        Icon={() => <Text style={styles.arrow}>▼</Text>}
                    />
                    {/* <RNPickerSelect
                        placeholder={{}}
                        onValueChange={(value) => setSelectedYear(value)}
                        items={yearsList.map((y) => ({
                            key: y.yearId,
                            label: y.yearLabel,   // adjust field name if API returns differently
                            value: y.yearId,
                        }))}
                        value={selectedYear}
                        style={{
                            inputIOS: styles.dropdownInput,
                            inputAndroid: styles.dropdownInput,
                            iconContainer: { top: hp(1.5), right: wp(3) },
                        }}
                        useNativeAndroidPickerStyle={false}
                        Icon={() => <Text style={styles.arrow}>▼</Text>}
                    /> */}
                </View>
            </View>

            {/* Content */}
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: hp(2) }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {loading ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", marginTop: hp(10) }}>
                        <ActivityIndicator size="large" color="#438aff" />
                    </View>
                ) : (
                    <>
                        {/* Summary */}

                        {activeTab === "summary" && summaryData && (
                            <View style={styles.summaryGrid}>
                                <View style={styles.card}>
                                    <View style={[styles.cardHeader, { backgroundColor: "#34a853" }]}>
                                        <Text style={styles.cardHeaderText}>Present Days</Text>
                                    </View>
                                    <View style={styles.cardBody}>
                                        <Text style={styles.cardValue}>{summaryData.presentDays}</Text>
                                    </View>
                                </View>

                                <View style={styles.card}>
                                    <View style={[styles.cardHeader, { backgroundColor: "#f52e2e" }]}>
                                        <Text style={styles.cardHeaderText}>Absent Days</Text>
                                    </View>
                                    <View style={styles.cardBody}>
                                        <Text style={styles.cardValue}>{summaryData.absentDays}</Text>
                                    </View>
                                </View>

                                <View style={styles.card}>
                                    <View style={[styles.cardHeader, { backgroundColor: "#ffc905" }]}>
                                        <Text style={styles.cardHeaderText}>Late Days</Text>
                                    </View>
                                    <View style={styles.cardBody}>
                                        <Text style={styles.cardValue}>{summaryData.lateDays}</Text>
                                    </View>
                                </View>

                                <View style={styles.card}>
                                    <View style={[styles.cardHeader, { backgroundColor: "#6e7079" }]}>
                                        <Text style={styles.cardHeaderText}>Half Days</Text>
                                    </View>
                                    <View style={styles.cardBody}>
                                        <Text style={styles.cardValue}>{summaryData.halfDays}</Text>
                                    </View>
                                </View>
                                {/* 
                                <View style={styles.card}>
                                    <View style={[styles.cardHeader, { backgroundColor: "#6e7079" }]}>
                                        <Text style={styles.cardHeaderText}>Working Days</Text>
                                    </View>
                                    <View style={styles.cardBody}>
                                        <Text style={styles.cardValue}>{summaryData.workingDays}</Text>
                                    </View>
                                </View> */}

                                <View style={styles.card}>
                                    <View style={[styles.cardHeader, { backgroundColor: "#438aff" }]}>
                                        <Text style={styles.cardHeaderText}>Holiday</Text>
                                    </View>
                                    <View style={styles.cardBody}>
                                        <Text style={styles.cardValue}>{summaryData.holidayDays}</Text>
                                    </View>
                                </View>

                                <View style={styles.card}>
                                    <View style={[styles.cardHeader, { backgroundColor: "#c6303e" }]}>
                                        <Text style={styles.cardHeaderText}>Leave</Text>
                                    </View>
                                    <View style={styles.cardBody}>
                                        <Text style={styles.cardValue}>{summaryData.leaveDays}</Text>
                                    </View>
                                </View>


                            </View>
                        )}

                        {/* Daywise */}
                        {activeTab === "daywise" && (
                            <View>
                                {dayWiseData.length > 0 ? (
                                    dayWiseData.map((item, idx) => {
                                        // Find the label for the punchMark
                                        const punchInfo = attendanceMarksList.find(
                                            mark => mark.attendanceMarks.trim() === item.punchMark?.trim()
                                        );

                                        const statusLabel = punchInfo ? punchInfo.attendanceType : item.status;

                                        return (
                                            <View key={idx} style={styles.dayCard}>
                                                <View style={[styles.verticalLine, { backgroundColor: item.color }]} />
                                                <View style={styles.dayDate}>
                                                    <Text style={styles.dayDateText}>{item.date}</Text>
                                                    <Text style={styles.dayDayText}>{item.day}</Text>
                                                </View>
                                                <View style={styles.verticalLine1} />
                                                <View style={styles.dayInfo}>
                                                    <Text style={styles.dayTime}>{item.time}</Text>
                                                    <View style={styles.statusRow}>
                                                        <Text style={[styles.dayStatus, { color: item.color }]}>
                                                            {statusLabel}
                                                        </Text>
                                                        {item.detail ? (
                                                            <Text style={[styles.dayDetail, { color: item.color }]}>
                                                                {" | " + item.detail}
                                                            </Text>
                                                        ) : null}
                                                    </View>
                                                </View>
                                            </View>
                                        );
                                    })
                                ) : (
                                    <View style={{ marginTop: hp(10), alignItems: "center" }}>
                                        <Text style={{ fontSize: wp(4), color: "#6B7280" }}>
                                            No records found for this month/year.
                                        </Text>
                                    </View>
                                )}

                            </View>
                        )}

                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default AttendenceTabPage;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f9fa" },

    tabRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.2),
        marginBottom: hp(2),
    },
    tab: {
        flex: 1,
        fontSize: Math.max(wp(4), 13),
        borderWidth: 1,
        borderRadius: wp(2),
        marginRight: wp(2),
        alignItems: "center",
        paddingVertical: hp(1),
        backgroundColor: "#ffffff",
        borderColor: "#438aff",
    },
    activeTab: { backgroundColor: "#438aff", borderColor: "#438aff" },
    tabText: {
        fontSize: Math.max(wp(4), 13), // scales but never too small
        color: "#438aff",
        fontWeight: "500",
    },
    activeTabText: { color: "#fff" },

    // monthYearRow: { flexDirection: "row", alignItems: "center", marginLeft: wp(1), gap: wp(2) },
    dropdownInput: {
        fontSize: Math.max(wp(4), 13),
        paddingVertical: hp(0.8),
        paddingHorizontal: wp(3.5),
        backgroundColor: "#fff",
        borderRadius: wp(2),
        borderWidth: 1,
        borderColor: "#E5E7EB",
        minWidth: wp(20),
        color: "#374151",
        fontWeight: "500",
    },

    arrow: { fontSize: wp(3.5), color: "#374151" },


    summaryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingHorizontal: wp(4),
    },
    card: {
        width: "46%",
        maxWidth: wp(41),
        backgroundColor: "#fff",
        borderRadius: wp(2),
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: "#E5E7EB",
        overflow: "hidden",
    },
    cardHeader: { paddingVertical: hp(2), paddingHorizontal: wp(2), },
    cardHeaderText: {
        fontSize: Math.max(wp("4%"), 14),
        color: "#fff",
        fontWeight: "600",
    },
    cardBody: { paddingVertical: hp(2) },
    cardValue: { fontSize: Math.min(wp(6.8), 26), fontWeight: "700", color: "#111827", marginLeft: wp(2) },
    hrsText: { fontSize: wp(3.5), color: "#9ca3af" },

    dayCard: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: wp(2),
        // padding: wp(3),
        paddingVertical: hp(1),
        marginBottom: hp(1.5),
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginHorizontal: wp(4),
    },
    dayDate: { alignItems: "center", marginRight: wp(3), width: wp(12) },
    dayDateText: { fontSize: wp(4.2), fontWeight: "700", color: "#111827" },
    dayDayText: { fontSize: wp(3.2), color: "#6B7280" },

    verticalLine: { width: wp(0.5), borderRadius: wp(1), marginLeft: wp(0.1) },
    verticalLine1: { width: wp(0.5), borderRadius: wp(1), marginHorizontal: wp(3), backgroundColor: "#E5E7EB" },

    dayInfo: { flex: 1 },
    dayTime: { fontSize: wp(3.5), color: "#374151", marginBottom: hp(0.3) },
    statusRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
    dayStatus: { fontSize: wp(3.5), fontWeight: "600" },
    dayDetail: { fontSize: wp(3.2), color: "#6B7280" },
});
