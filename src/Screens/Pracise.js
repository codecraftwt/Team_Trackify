import { useState, useEffect,useCallback } from "react"
import { Platform, Linking } from 'react-native';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, TextInput,ActivityIndicator,PermissionsAndroid } from "react-native"
import Icon from "react-native-vector-icons/FontAwesome"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen"
import BASE_URL from "../config/server"
import { requestCameraPermission } from "./CameraPermissionService"
import FancyAlert from "./FancyAlert"
import { callAttendanceLogAPI } from "../services/AttendanceService"
import { formatDuration, formatTo12Hour, toMsFromHHMMSS } from "./utils/AttendanceUtils"
import { SafeAreaView } from "react-native-safe-area-context"
import StartBreakWork from "../Component/StartBreakWork"
import GetLocation from "react-native-get-location"
import Geolocation from 'react-native-geolocation-service';

const Home = ({ navigation, route }) => {
  const [showWelcome, setShowWelcome] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [profileData, setProfileData] = useState(null)
  const [profileImage, setProfileImage] = useState(null)
  const [isPunchedIn, setIsPunchedIn] = useState(false)
  const [punchInTime, setPunchInTime] = useState(null)
  const [punchOutTime, setPunchOutTime] = useState(null)
  const [totalDailyWorkingTime, setTotalDailyWorkingTime] = useState(0)
  const [totalBreakTime, setTotalBreakTime] = useState(0)
  const [totalWorkTime, setTotalWorkTime] = useState(0)
  const [isBreakStarted, setIsBreakStarted] = useState(false)
  const [isOutForWork, setIsOutForWork] = useState(false)
  const [workingTimeElapsed, setWorkingTimeElapsed] = useState(0)
  const [fancyAlertVisible, setFancyAlertVisible] = useState(false)
  const [fancyAlertTitle, setFancyAlertTitle] = useState("")
  const [fancyAlertMessage, setFancyAlertMessage] = useState("")
  const [fancyAlertType, setFancyAlertType] = useState("success")
  const [showPunchOutAlert, setShowPunchOutAlert] = useState(false)
  const [lateInTime, setLateInTime] = useState(null)
  const [earlyOutTime, setEarlyOutTime] = useState(null)
const [isLoading, setIsLoading] = useState(false)
  const [breakModalVisible, setBreakModalVisible] = useState(false)
  const [selectedBreak, setSelectedBreak] = useState(null)
  const [lastBreakType, setLastBreakType] = useState(null)
  const [currentBreakElapsed, setCurrentBreakElapsed] = useState(0)

  const [workModalVisible, setWorkModalVisible] = useState(false)
  const [workReason, setWorkReason] = useState("")
  const [currentWorkElapsed, setCurrentWorkElapsed] = useState(0)
  const [fancyAlertButtons, setFancyAlertButtons] = useState(undefined);

 const showFancyAlert = (title, message, type = "success", buttons) => {
    setFancyAlertTitle(title)
    setFancyAlertMessage(message)
    setFancyAlertType(type)
    setFancyAlertButtons(buttons) // NEW: Set buttons state
    setFancyAlertVisible(true)
  }
 // Utility function to check location status and prompt
// Utility function to check location status and prompt
const requestLocationPermission = async () => {
  try {
    // <CHANGE> For Android, request native permission dialog
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "This app needs access to your location for attendance tracking",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "Allow",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    // For iOS, it's handled automatically
    return true;
  } catch (err) {
    console.log("[v0] Permission request error:", err);
    return false;
  }
};

const checkLocationStatusAndPrompt = async (alertFunction) => {
  // <CHANGE> First check if app has permission
  const hasPermission = await requestLocationPermission();

  if (!hasPermission) {
    // <CHANGE> User denied permission - show fancy alert to open settings
    alertFunction(
      "Permission Required",
      "Please enable location access in settings.",
      "error",
      [
        { text: "Open Settings", onPress: () => Linking.openSettings() },
        { text: "Cancel", style: "cancel" },
      ]
    );
    return false;
  }

  // <CHANGE> Permission granted, now check if Location Services are ON
  try {
    await GetLocation.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 10000,
    });
    return true; // Location is active
  } catch (error) {
    // <CHANGE> Location Services are OFF - show fancy alert
    alertFunction(
      "Location Services Disabled",
      "Please enable GPS/Location services on your device.",
      "warning",
      [
        { text: "Open Settings", onPress: () => Linking.openSettings() },
        { text: "Cancel", style: "cancel" },
      ]
    );
    return false;
  }
};


  const decodeJWT = (token) => {
    try {
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error("JWT Decode Error:", error)
      return null
    }
  }
useEffect(() => {
    console.log("Alert Visible State:", fancyAlertVisible);
}, [fancyAlertVisible]);
  useEffect(() => {
    const loadActiveState = async () => {
      console.log("Loading active state from AsyncStorage...")

      // 1. Check for Active Break
      const breakActive = await AsyncStorage.getItem("isBreakActive")
      const breakStartTimeISO = await AsyncStorage.getItem("breakStartTime")
      const savedBreakType = await AsyncStorage.getItem("lastBreakType")

      console.log("Break state:", { breakActive, breakStartTimeISO, savedBreakType })

      if (breakActive === "true" && breakStartTimeISO) {
        const startTime = new Date(breakStartTimeISO)
        const now = new Date()
        const elapsed = now.getTime() - startTime.getTime()

        console.log("[v0] Break is active! Elapsed time:", elapsed, "ms")

        setIsBreakStarted(true)
        setLastBreakType(savedBreakType)
        setCurrentBreakElapsed(elapsed)
      }

      // 2. Check for Active Outside Work
      const workActive = await AsyncStorage.getItem("isWorkActive")
      const workStartTimeISO = await AsyncStorage.getItem("workStartTime")

      console.log("[v0] Work state:", { workActive, workStartTimeISO })

      if (workActive === "true" && workStartTimeISO) {
        const startTime = new Date(workStartTimeISO)
        const now = new Date()
        const elapsed = now.getTime() - startTime.getTime()

        console.log("[v0] Work is active! Elapsed time:", elapsed, "ms")

        setIsOutForWork(true)
        setCurrentWorkElapsed(elapsed)
      }
    }

    loadActiveState()
    // fetchProfileData()
  }, [])

  useEffect(() => {
    let t
    if (isBreakStarted) {
      console.log("[v0] Break timer started, current elapsed:", currentBreakElapsed)
      t = setInterval(() => setCurrentBreakElapsed((prev) => prev + 1000), 1000)
    }
    return () => t && clearInterval(t)
  }, [isBreakStarted])

  useEffect(() => {
    let t
    if (isOutForWork) {
      console.log("[v0] Work timer started, current elapsed:", currentWorkElapsed)
      t = setInterval(() => setCurrentWorkElapsed((prev) => prev + 1000), 1000)
    }
    return () => t && clearInterval(t)
  }, [isOutForWork])

const fetchProfileData = useCallback(async () => {
    try {
        const token = await AsyncStorage.getItem("authToken")
        if (!token) return

        const cleanToken = token.replace("Bearer ", "")
        const decoded = decodeJWT(cleanToken)
        const employeeId = decoded?.EmployeeId
        if (!employeeId) return

        const response = await fetch(`${BASE_URL}/Employee/GetEmpProfile?employeeId=${employeeId}`, {
            headers: { Authorization: `Bearer ${cleanToken}` },
        })

        if (!response.ok) throw new Error("Profile fetch failed")
        const data = await response.json()
        setProfileData(data)
        console.log("profile data",data);
        
        if (data.photoImage) {
            let base64 = data.photoImage
                .trim()
                .replace(/^"(.*)"$/, "$1")
                .replace(/\r?\n|\r/g, "")
            if (!base64.startsWith("data:image")) base64 = `data:image/jpeg;base64,${base64}`
            setProfileImage(base64)
        } else {
            setProfileImage(null)
        }

        setPunchInTime(data.punchInTime ? new Date(data.punchInTime) : null)
        setPunchOutTime(data.punchOutTime ? new Date(data.punchOutTime) : null)
        setIsPunchedIn(!!data.punchInTime && !data.punchOutTime)
        setLateInTime(data.lateInTime)
        setEarlyOutTime(data.earlyOutTime)

        if (data.punchInTime && !data.punchOutTime) {
            const inTime = new Date(data.punchInTime)
            const now = new Date()
            const diffMs = now - inTime
            if (diffMs > 0) setWorkingTimeElapsed(diffMs)
        } else if (data.totalWorkingHours) {
            setWorkingTimeElapsed(toMsFromHHMMSS(data.totalWorkingHours))
        } else {
            setWorkingTimeElapsed(0)
        }

        setTotalBreakTime(toMsFromHHMMSS(data.totalBreakTime))
        setTotalWorkTime(toMsFromHHMMSS(data.totalWorkoutsideTime))
    } catch (err) {
        console.error("Profile Fetch Error:", err)
    }
}, [
    // Dependency Array: List ALL state setters used inside the function
    setProfileData, 
    setProfileImage, 
    setPunchInTime, 
    setPunchOutTime, 
    setIsPunchedIn, 
    setLateInTime, 
    setEarlyOutTime, 
    setWorkingTimeElapsed, 
    setTotalBreakTime, 
    setTotalWorkTime,
    decodeJWT, // Include external, non-primitive dependencies
    toMsFromHHMMSS, // Include external, non-primitive dependencies
]); // <--- CLOSING BRACKET AND DEPENDENCY ARRAY for useCallback

  // const showFancyAlert = (title, message, type = "success") => {
  //   setFancyAlertTitle(title)
  //   setFancyAlertMessage(message)
  //   setFancyAlertType(type)
  //   setFancyAlertVisible(true)
  // }
-
 useEffect(() => {
    fetchProfileData()
}, [])

  useEffect(() => {
    let timer
    if (isPunchedIn) {
      timer = setInterval(() => setWorkingTimeElapsed((prev) => prev + 1000), 1000)
    } else clearInterval(timer)
    return () => clearInterval(timer)
  }, [isPunchedIn])

useEffect(() => {
    const capturedPhotoFromParams = route.params?.capturedPhoto
    const latFromParams = route.params?.latitude
    const longFromParams = route.params?.longitude
    const addressFromParams = route.params?.address
    const punchTypeFromParams = route.params?.punchType 
    
    console.log("--- PUNCH PHOTO EFFECT RUN ---");
    console.log("Params Received:", { capturedPhoto: !!capturedPhotoFromParams, punchType: punchTypeFromParams });

    if (capturedPhotoFromParams && punchTypeFromParams) {
        
        console.log("--- API CALLING ---");
        
        const isActionPunchOut = punchTypeFromParams === "ClockedOut";
        const remarkType = punchTypeFromParams; 
        const now = new Date()

        const handlePunchWithPhoto = async () => {
          // <CHANGE> Pass showFancyAlert function so alerts display properly
        const locationIsReady = await checkLocationStatusAndPrompt(showFancyAlert);
          if (!locationIsReady) {
        // If the function returned false, it means we either don't have permission 
        // or we prompted the user to turn on GPS. Stop the process.
        setIsLoading(false); // Stop loader if it was started
        return; 
    }
            setIsLoading(true); // START LOADER
            const startTime = Date.now()
            try {
              console.log(`[PUNCH] Starting Attendance Log API...`);
                const apiSuccess = await callAttendanceLogAPI({
                    [isActionPunchOut ? "outTime" : "inTime"]: now,
                    remark: remarkType,
                    imageFile: capturedPhotoFromParams,
                    lat: latFromParams,
                    long: longFromParams,
                    address: addressFromParams,
                })
const timeAfterLog = Date.now();
        console.log(`[PUNCH] Attendance Log API finished in: ${timeAfterLog - startTime}ms`);
                if (apiSuccess) {
                    console.log("Attendance success, action was:", remarkType)
                    
                    // Await profile fetch to update all UI states from server data
                    await fetchProfileData() 
                    
                    // Show success alert
                    const alertTitle = isActionPunchOut ? "Punched Out successfully!" : "Punched In successfully!";
                    const alertType = isActionPunchOut ? "signOut" : "signIn";
                    showFancyAlert("Success", alertTitle, alertType);

                } else {
                    showFancyAlert("Error", "Failed to mark attendance.", "error")
                }
            } catch (error) {
                console.error("API Call Error:", error);
                showFancyAlert("Error", "An unexpected error occurred.", "error")
            } finally{
                setIsLoading(false); // STOP LOADER
                
                // Clear all parameters immediately to prevent re-runs
                navigation.setParams({
                    capturedPhoto: undefined,
                    latitude: undefined,
                    longitude: undefined,
                    address: undefined,
                    punchType: undefined,
                })
            } 
        }

        handlePunchWithPhoto()
    } else {
        console.log("--- API NOT CALLED (Missing Photo or Punch Type) ---");
    }
}, [
    route.params?.capturedPhoto,
    route.params?.punchType, 
    route.params?.latitude,
    route.params?.longitude,
    route.params?.address,
    navigation,
    // fetchProfileData, // Stable function thanks to useCallback
])


  const handlePunch = async () => {
  // <CHANGE> NEW: Check if break or outside work is active before allowing punch out
  if (isPunchedIn && (isBreakStarted || isOutForWork)) {
    // <CHANGE> NEW: Build dynamic error message based on active sessions
    let message = "Please end ";
    if (isBreakStarted && isOutForWork) {
      message += "your break and outside work";
    } else if (isBreakStarted) {
      message += "your break";
    } else {
      message += "your outside work";
    }
    message += " before punching out.";
    // <CHANGE> NEW: Show warning alert and prevent punch out
    showFancyAlert("Active Session", message, "warning");
    return;
  }
 
  // EXISTING CODE: Original permission check
  const cameraPermission = await requestCameraPermission();
  // const locationPermission = await requestLocationPermission();
 
  // if (!(cameraPermission && locationPermission)) {
  //   showFancyAlert(
  //     "Permission Required",
  //     "Camera and location permissions are required to mark attendance",
  //     "warning"
  //   );
  //   return;
  // }
const locationReady = await checkLocationStatusAndPrompt(showFancyAlert);

  // EXISTING CODE: Navigate to camera screen
if (cameraPermission && locationReady) {
  navigation.navigate("MarkAttendanceScreen", { 
    punchType: isPunchedIn ? "ClockedOut" : "ClockedIn"
  });
} else {
  // Location or camera permission is not ready - alert already shown by checkLocationStatusAndPrompt
  console.log("[v0] Navigation blocked - Location or Camera permission not ready");
}
};


  const getPunchButtonText = () => {
    if (!punchInTime) return "Punch In"
    if (punchInTime && !punchOutTime) return "Punch Out"
    return "Punch Out Done"
  }

  const getPunchButtonColor = () => {
    if (!punchInTime) return "#34a853"
    if (punchInTime && !punchOutTime) return "#C6303E"
    return "#6c757d"
  }

  if (!profileData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontSize: wp(5), color: "#000" }}>Loading...</Text>
      </View>
    )
  }
  if (isLoading) {
 return (
 <View style={styles.fullscreenLoader}>
  <ActivityIndicator size="large" color="#4285F4" />
  <Text style={styles.loaderText}>Processing attendance...</Text>
 </View>
 )
 }
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <View style={styles.customHeader}>
            <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
              <Image
                source={profileImage ? { uri: profileImage } : require("../assets/profile.png")}
                style={styles.profileImage}
              />
            </TouchableOpacity>
            <View style={styles.rightSection}>
              <View style={styles.nameRow}>
                <Text style={styles.greeting}>
                  Hello, <Text style={styles.bold}>{profileData.fullName}</Text>
                </Text>
                <Icon name="bell-o" size={wp(6)} color="#000" />
              </View>
              <Text style={styles.subtext}>{profileData.designation}</Text>
            </View>
          </View>

          <View style={styles.rmDateRow}>
            <Text style={styles.rmText}>
              <Text style={styles.rmhead}>RM :</Text>
              <Text style={styles.rm}> {profileData.managerName}</Text>
            </Text>
            <Text style={styles.date}>{new Date().toDateString()}</Text>
          </View>

          <View style={styles.timerBox}>
            <Text style={styles.timer}>{formatDuration(workingTimeElapsed)}</Text>
            <Text style={styles.timerLabel}>Working Time</Text>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoBox}>
              <View style={styles.rowContainer}>
                <View style={[styles.iconWrapper, { backgroundColor: "#34a853" }]}>
                  <Icon name="sign-in" size={18} color="#fff" />
                </View>
                <Text style={styles.infoText}>Punch In</Text>
              </View>
              <Text style={styles.time}>{formatTo12Hour(punchInTime)}</Text>
              <Text style={[styles.statusText, { color: lateInTime ? "#C6303E" : "#34a853" }]}>
                {lateInTime ? `Late` : "On Time"}
              </Text>
            </View>

            <View style={styles.infoBox}>
              <View style={styles.rowContainer}>
                <View style={[styles.iconWrapper, { backgroundColor: "#C6303E" }]}>
                  <Icon name="sign-out" size={18} color="#fff" />
                </View>
                <Text style={styles.infoText}>Punch Out</Text>
              </View>
              <Text style={styles.time}>{formatTo12Hour(punchOutTime)}</Text>
              <Text style={[styles.statusText, { color: earlyOutTime ? "#C6303E" : "#34a853" }]}>
                {earlyOutTime ? `Early Go` : "On Time"}
              </Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoBox}>
              <View style={styles.rowContainer}>
                <View style={[styles.iconWrapper, { backgroundColor: "#0d6efd" }]}>
                  <Icon name="coffee" size={18} color="#fff" />
                </View>
                <Text style={styles.infoText}>Break Time</Text>
              </View>
              <Text style={styles.breaktime}>
                {isBreakStarted ? formatDuration(currentBreakElapsed) : formatDuration(totalBreakTime)}
              </Text>
              {/* <TouchableOpacity
                onPress={async () => {
                  if (!isPunchedIn) return
                  if (!isBreakStarted) {
                    setSelectedBreak(null)
                    setBreakModalVisible(true)
                  } else {
                    const now = new Date()
                    const endRemark = lastBreakType === "Lunch" ? "LunchBreakEnd" : "TeaBreakEnd"

                    console.log("[v0] Ending break, clearing AsyncStorage...")
                    await AsyncStorage.removeItem("isBreakActive")
                    await AsyncStorage.removeItem("breakStartTime")
                    await AsyncStorage.removeItem("lastBreakType")

                    const ok = await callAttendanceLogAPI({
                      outTime: now,
                      remark: endRemark,
                    })
                    if (ok) {
                      setIsBreakStarted(false)
                      setLastBreakType(null)
                      setCurrentBreakElapsed(0)
                      showFancyAlert("Break Ended", `Ended at ${formatTo12Hour(now)}`, "coffee")
                      fetchProfileData()
                    } else {
                      showFancyAlert("Error", "Failed to end break", "error")
                    }
                  }
                }}
              >
                <Text style={{ color: "#0d6efd", marginTop: 5 }}>{isBreakStarted ? "End Break" : "Start Break"}</Text>
              </TouchableOpacity> */}
            </View>

            <View style={styles.infoBox}>
              <View style={styles.rowContainer}>
                <View style={[styles.iconWrapper, { backgroundColor: "#fede3a" }]}>
                  <Icon name="briefcase" size={18} color="#282b29" />
                </View>
                <Text style={styles.infoText}>Outside Work</Text>
              </View>
              <Text style={styles.breaktime}>
                {isOutForWork ? formatDuration(currentWorkElapsed) : formatDuration(totalWorkTime)}
              </Text>
            </View>
          </View>

   <View style={styles.buttonRow}>
  {/* First Button (Break) */}
  <StartBreakWork
    title={isBreakStarted ? "End Break" : "Add Break"}
    icon="coffee"
    backgroundColor={isBreakStarted ? "#C6303E" : "#0d6efd"}
    style={{
      flex: 1, 
      // 👇 FIX: Adjust margin to align with screen padding
      marginLeft: -wp(3.5), // Correct the left edge to align with container padding
      marginRight: wp(1.5), // Keep space between buttons
      height: 55,
      opacity: !isPunchedIn || isOutForWork ? 0.5 : 1,
    }}
    titleStyle={{ fontSize: 19 }}
    disabled={!isPunchedIn || isOutForWork}
    onPress={async () => {
      // ... (existing onPress logic remains the same)
      if (!isPunchedIn || isOutForWork) return;

      if (isBreakStarted) {
        const now = new Date()
        const endRemark = lastBreakType === "Lunch" ? "LunchBreakEnd" : "TeaBreakEnd"
        
        // ... (AsyncStorage clearing and API call) ...
        await AsyncStorage.removeItem("isBreakActive")
        await AsyncStorage.removeItem("breakStartTime")
        await AsyncStorage.removeItem("lastBreakType")

        const ok = await callAttendanceLogAPI({
          outTime: now,
          remark: endRemark,
        })
        if (ok) {
          setIsBreakStarted(false)
          setLastBreakType(null)
          setCurrentBreakElapsed(0)
          showFancyAlert("Break Ended", `Ended at ${formatTo12Hour(now)}`, "coffee")
          fetchProfileData()
        } else {
          showFancyAlert("Error", "Failed to end break", "error")
        }
      } else {
        setBreakModalVisible(true)
      }
    }} />

  {/* Second Button (Outside Work) */}
  <StartBreakWork
    title={isOutForWork ? "In From Work" : "Outside Work"} 
    icon="briefcase"
    iconColor={isOutForWork ? "#fff" : "#282b29"}
    backgroundColor={isOutForWork ? "#C6303E" : "#fede3a"}
    style={{
      flex: 1, 
      // 👇 FIX: Adjust margin to align with screen padding
      marginLeft: wp(1.5), // Keep space between buttons
      marginRight: -wp(3.5), // Correct the right edge to align with container padding
      paddingVertical: 8,
      opacity: !isPunchedIn || isBreakStarted ? 0.5 : 1,
      paddingHorizontal: 12,
      padding: 10,
      height: 55
    }}
    titleStyle={{
      fontSize: 18,
      color: isOutForWork ? "#fff" : "#282b29",
    }}
    disabled={!isPunchedIn || isBreakStarted}
    onPress={async () => {
      // ... (existing onPress logic remains the same)
      if (!isPunchedIn || isBreakStarted) return;

      if (isOutForWork) {
        const now = new Date();

        // ... (AsyncStorage clearing and API call) ...
        await AsyncStorage.removeItem("isWorkActive")
        await AsyncStorage.removeItem("workStartTime")
        await AsyncStorage.removeItem("activeWorkReason")

        const apiResult = await callAttendanceLogAPI({
          outTime: now,
          remark: "WorkOut",
        });

        if (apiResult) {
          setIsOutForWork(false);
          setCurrentWorkElapsed(0);
          showFancyAlert("Returned", `You returned at ${formatTo12Hour(now)}`, "briefcase");
          fetchProfileData();
        } else {
          showFancyAlert("Error", "Failed to punch in from work", "error");
        }
      }
      else {
        setWorkReason("")
        setWorkModalVisible(true);
      }
    }}
  />
</View>

          <TouchableOpacity
            style={[styles.punchButton, { backgroundColor: getPunchButtonColor() }]}
            onPress={handlePunch}
            disabled={!!(punchInTime && punchOutTime)}
          >
            <Text style={styles.punchButtonText}>{getPunchButtonText()}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

  

      <FancyAlert
        visible={showPunchOutAlert}
        onClose={() => setShowPunchOutAlert(false)}
        type="signOut"
        title="Confirm Punch Out"
        message="Are you sure you want to punch out for the day?"
        showConfirm={true}
        confirmText="Punch Out"
        cancelText="Cancel"
        onConfirm={() => {
          setShowPunchOutAlert(false)
          handlePunch()
        }}
      />

      <FancyAlert
        visible={showWelcome && companyName !== ""}
        title="Welcome 🎉"
        message={`Welcome to ${companyName}`}
        type="success"
        hideButtons
        onClose={() => setShowWelcome(false)}
        disableBackdropPress={true}
      />

       <FancyAlert
        visible={fancyAlertVisible}
        onClose={() => {setFancyAlertVisible(false); setFancyAlertButtons(undefined)}} // Reset buttons on close
        title={fancyAlertTitle}
        message={fancyAlertMessage}
        type={fancyAlertType}
        buttons={fancyAlertButtons} // PASS NEW BUTTONS PROP
      />

      <Modal
        visible={breakModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBreakModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Break</Text>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.breakOption, selectedBreak === "Tea" && styles.selectedBreak]}
                onPress={() => setSelectedBreak("Tea")}
              >
                <Text style={[styles.breakOptionText, selectedBreak === "Tea" && styles.selectedBreakText]}>
                  Tea Break
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.breakOption, selectedBreak === "Lunch" && styles.selectedBreak]}
                onPress={() => setSelectedBreak("Lunch")}
              >
                <Text style={[styles.breakOptionText, selectedBreak === "Lunch" && styles.selectedBreakText]}>
                  Lunch Break
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setBreakModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={async () => {
                  if (!selectedBreak) {
                    showFancyAlert("Select Break", "Please select Tea or Lunch.", "warning")
                    return
                  }
                  const now = new Date()
                  const startRemark = selectedBreak === "Lunch" ? "LunchBreakStart" : "TeaBreakStart"

                  console.log("[v0] Starting break, saving to AsyncStorage...")
                  console.log("[v0] Break start time:", now.toISOString())

                  await AsyncStorage.setItem("isBreakActive", "true")
                  await AsyncStorage.setItem("breakStartTime", now.toISOString())
                  await AsyncStorage.setItem("lastBreakType", selectedBreak === "Lunch" ? "Lunch" : "Tea")

                  const ok = await callAttendanceLogAPI({
                    inTime: now,
                    remark: startRemark,
                  })
                  if (ok) {
                    setIsBreakStarted(true)
                    setLastBreakType(selectedBreak === "Lunch" ? "Lunch" : "Tea")
                    setCurrentBreakElapsed(0)
                    showFancyAlert("Break Started", `Started at ${formatTo12Hour(now)}`, "coffee")
                    setBreakModalVisible(false)
                    setSelectedBreak(null)
                    fetchProfileData()
                  } else {
                    showFancyAlert("Error", "Failed to start break", "error")
                  }
                }}
              >
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={workModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWorkModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Outside Work</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Reason"
              placeholderTextColor="#6e7079"
              value={workReason}
              onChangeText={setWorkReason}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setWorkModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={async () => {
                  const now = new Date()

                  console.log("[v0] Starting work, saving to AsyncStorage...")
                  console.log("[v0] Work start time:", now.toISOString())

                  await AsyncStorage.setItem("isWorkActive", "true")
                  await AsyncStorage.setItem("workStartTime", now.toISOString())

                  const ok = await callAttendanceLogAPI({
                    inTime: now,
                    remark: "WorkIn",
                    workOutReason: workReason?.trim() || "",
                  })
                  if (ok) {
                    setIsOutForWork(true)
                    setCurrentWorkElapsed(0)
                    showFancyAlert("Outside Work", `Started at ${formatTo12Hour(now)}`, "briefcase")
                    setWorkModalVisible(false)
                    setWorkReason("")
                    fetchProfileData()
                  } else {
                    showFancyAlert("Error", "Failed to start outside work", "error")
                  }
                }}
              >
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default Home

const styles = StyleSheet.create({
  container: { flex: 1, padding: wp(5), backgroundColor: "#f8f9fa" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  customHeader: { flexDirection: "row", alignItems: "center" },
  profileImage: { width: wp(13), height: wp(13), borderRadius: wp(2), backgroundColor: "#ccc" },
  rightSection: { flex: 1, marginLeft: wp(3) },
  nameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { fontSize: wp(4.2), color: "#000" },
  bold: { fontWeight: "bold" },
  subtext: { fontSize: wp(3.6), color: "#6e7079" },
  rmDateRow: { flexDirection: "row", justifyContent: "space-between", marginTop: hp(1) },
  rmText: { fontSize: wp(3.6), color: "#000" },
  rmhead: { color: "#6C757D" },
  rm: { fontWeight: "400", color: "#000" },
  date: { fontSize: wp(3.5), color: "#000", fontWeight: "600" },
  timerBox: {
    alignItems: "center",
    backgroundColor: "#e9ecef",
    padding: wp(3),
    borderRadius: 10,
    marginVertical: hp(2),
  },
  timer: { fontSize: wp(16), fontWeight: "500", color: "#000" },
  timerLabel: { fontSize: wp(4), color: "#6e7079", fontWeight: "600" },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: hp(1),
    // Removed paddingHorizontal from here
  },
  infoBox: {
    flex: 1,
    paddingVertical: wp(4),
    paddingHorizontal: wp(2), // Added padding inside the box
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    marginHorizontal: wp(1.5), // Small margin between boxes
    backgroundColor: "#fff",
    alignItems: 'center',
    justifyContent: 'space-between',
    // Removed fixed height: hp(22)
  },
fullscreenLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white overlay
    zIndex: 100, // Ensure it's on top of everything
  },
  loaderText: {
    marginTop: 10,
    fontSize: wp(4),
    color: '#000',
  },
  rowContainer: { flexDirection: "row", alignItems: "center" },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoText: { fontSize: wp(4), color: "#212529", fontWeight: "600" },
  // Adjusted font size to prevent wrapping
  time: { fontSize: wp(5.5), fontWeight: "bold", color: "#000", marginTop: 8 },
  // Adjusted font size to prevent wrapping
  breaktime: { fontSize: wp(5.5), fontWeight: "bold", color: "#000", marginTop: 8 },
  // 👇 NEW STYLE for the button row
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(2),
    justifyContent: "space-between",
    gap: 8,
    // marginTop: -hp(12),
  },
  punchButton: {
    width: "100%",
    height: hp(7),
    borderRadius: wp(5),
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(3),
  },
  punchButtonText: { color: "#fff", fontSize: wp(7), fontWeight: "500" },
  statusText: {
    fontSize: wp(3.6),
    fontWeight: "500",
    marginTop: 4,
    marginBottom: 4, // Added bottom margin for spacing
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "86%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: wp(5),
    fontWeight: "600",
    color: "#000",
    marginBottom: hp(2),
  },
  modalButtons: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakOption: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    alignItems: "center",
  },
  selectedBreak: {
    backgroundColor: "#0d6efd",
    borderColor: "#0d6efd",
  },
  breakOptionText: {
    color: "#5a8f9b",
    fontWeight: "600",
  },
  selectedBreakText: { // Added style for selected text color
    color: "#fff",
    fontWeight: "600",
  },
  input: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#000",
  },
  submitButton: {
    backgroundColor: "#0d6efd",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  submitText: {
    color: "#fff",
    fontWeight: "600",
  },
  cancelText: {
    color: "#6e7079",
    fontWeight: "600",
  },
})
