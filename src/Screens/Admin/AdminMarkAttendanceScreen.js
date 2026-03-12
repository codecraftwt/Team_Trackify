import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,  
  Linking,
} from "react-native"
import { Camera, useCameraDevice } from "react-native-vision-camera"
import GetLocation from "react-native-get-location"
import Icon from "react-native-vector-icons/FontAwesome"
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen"
import FancyAlert from "../FancyAlert"
import { SafeAreaView } from "react-native-safe-area-context"
const MarkAttendanceScreen = ({ navigation,route }) => {
  const [photo, setPhoto] = useState(null)
  const [address, setAddress] = useState("")
  const [currentLocationData, setCurrentLocationData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(true)
  const [cameraPermission, setCameraPermission] = useState(null)
  const [isCameraActive, setIsCameraActive] = useState(true)
  const [isPhotoReady, setIsPhotoReady] = useState(false)
  const device = useCameraDevice("front")
  const camera = useRef(null)
  const [fancyAlertVisible, setFancyAlertVisible] = useState(false)
  const [fancyAlertTitle, setFancyAlertTitle] = useState("")
  const [fancyAlertMessage, setFancyAlertMessage] = useState("")
  const [fancyAlertType, setFancyAlertType] = useState("error")

  const showFancyAlert = (title, message, type = "error", buttons = []) => {
    setFancyAlertTitle(title)
    setFancyAlertMessage(message)
    setFancyAlertType(type)
    setFancyAlertVisible(true)
  }

  useEffect(() => {
    getCurrentLocation(true) 
    checkCameraPermission()
  }, [])



  const checkCameraPermission = async () => {
    try {
      const status = await Camera.getCameraPermissionStatus()
      if (status === "granted") {
        setCameraPermission(true)
      } else if (status === "not-determined") {
        const permission = await Camera.requestCameraPermission()
        setCameraPermission(permission === "granted")
      } else {
        setCameraPermission(false)
      }
    } catch (error) {
      console.error("Error checking camera permission:", error)
    }
  }

  const requestPermission = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
        title: "Location Permission",
        message: "App needs access to your location",
        buttonPositive: "OK",
      })
      return granted === PermissionsAndroid.RESULTS.GRANTED
    }
    return true
  }

   const getCurrentLocation = async (skipAlert = false) => {
    const hasPermission = await requestPermission()

  if (!hasPermission) {
      // 👇 CORRECTION: Pass Title, Message, Type (error), then Buttons
      showFancyAlert("Location Permission Denied", "Please enable location access in settings.", "error", [ 
        {
          text: "Open Settings",
          onPress: () => Linking.openSettings(),
        },
        { text: "Cancel", style: "cancel" },
      ])
      setLocationLoading(false)
      return
    }
    setLocationLoading(true)
    setCurrentLocationData(null)
    setAddress("Fetching location...")


    GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 25000,
    })
      .then((location) => {
        setCurrentLocationData(location)
        getAddressFromCoordinates(location.latitude, location.longitude)
      })
     .catch((error) => {
        setLocationLoading(false)
        setAddress("Unable to fetch location")
        setCurrentLocationData(null) 

        if (skipAlert) {
            console.log("Initial load location failure. Skipping alert.")
            return 
        }

        // Define error types using strings (to handle both string and numeric codes)
        const code = error.code;
        
        const isUnavailable = code === 3 || code === 'UNAVAILABLE';
        const isTimeout = code === 2 || code === 'TIMEOUT';
        const isCancelled = code === 'CANCELLED';

       if (isUnavailable) {
          // HARD FAILURE: GPS SWITCH IS OFF
          showFancyAlert("Location Services Disabled", "Please enable GPS/Location services on your device settings.", "warning", [ 
            {
              text: "Open Settings",
              onPress: () => {
                // ... existing settings logic ...
              },
            },
            { text: "Cancel", style: "cancel" },
          ])
        } else if (isTimeout) {
            // SOFT FAILURE: Location is slow. Suggest a refresh/wait.
            showFancyAlert(
                "Location Timeout", 
                "We couldn't get a lock in time. Please ensure you have a clear sky view and try refreshing.", 
                "warning"
            );
        } else if (isCancelled) {
            // IGNORE: User action or competing requests. Log and continue.
            console.warn("Location Request Cancelled:", error.message);
        }
        else {
          console.error("Unexpected Location Error:", code, error.message); 
          showFancyAlert("Error", "Failed to retrieve location", "error")
        }
      })
  }

  const getAddressFromCoordinates = (lat, lon) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
      headers: {
        "User-Agent": "ReactNativeApp/1.0",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data && data.address) {
          const { road, suburb, village, town, city_district, city, state_district, county, state, postcode } =
            data.address
          const formatted = [
            road || suburb || village || town,
            city_district || city || state_district || county,
            state,
            postcode,
          ]
            .filter(Boolean)
            .join(", ")
          setAddress(formatted)
        } else {
          setAddress("Address not found")
        }
        setLocationLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setAddress("Error retrieving address")
        setLocationLoading(false)
      })
  }

  const takePicture = async () => {
    if (camera.current && isCameraActive) {
      try {
        const capturedPhoto = await camera.current.takePhoto({
          flash: "off",
          quality: 0.8,
        })
        setIsCameraActive(false)
        if (capturedPhoto && capturedPhoto.path) {
          const photoUri = `file://${capturedPhoto.path}`
          setPhoto({
            uri: photoUri,
            type: "image/jpeg",
            name: "attendance.jpg",
            path: capturedPhoto.path, 
          })
          setIsPhotoReady(true)
          console.log("MarkAttendanceScreen: Photo captured. Path:", capturedPhoto.path)
        } else {
          showFancyAlert("error", "Error", "Failed to capture photo")
        }
      } catch (error) {
        console.error("Error capturing photo:", error)
        showFancyAlert("error", "Error", "Failed to capture photo")
      }
    }
  }

  const retakePhoto = () => {
    setPhoto(null)
    setIsPhotoReady(false)
    setIsCameraActive(true)
  }

const handleSubmit = () => {
    if (!photo) {
      showFancyAlert("error", "Error", "No photo captured to submit.")
      return
    }
    if (!currentLocationData) { 
      showFancyAlert("warning", "Location Required", "Location data is unavailable. Please ensure GPS/Location Services are enabled on your device and tap 'Refresh' to try again.")
      return
    }

    const punchType = route.params?.punchType; 

    console.log("MarkAttendanceScreen: Submitting with photo path:", photo.path)
    setLoading(true)
    navigation.navigate("AdminTabs", {
      screen: "AdminHome",
      params: {
        capturedPhoto: photo,
        latitude: currentLocationData.latitude,
        longitude: currentLocationData.longitude,
        address: address,
        punchType: punchType, 
      },
    })
  }

  if (cameraPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholderContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.placeholderText}>Checking camera permission...</Text>
        </View>
      </View>
    )
  }
  if (!cameraPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>Camera permission denied</Text>
          <TouchableOpacity style={styles.submitButton} onPress={() => navigation.goBack()}>
            <Text style={styles.submitButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }
  if (!device) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No camera device available</Text>
          <TouchableOpacity style={styles.submitButton} onPress={() => navigation.goBack()}>
            <Text style={styles.submitButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.preview} />
        ) : (
          <Camera
            ref={camera}
            style={styles.preview}
            device={device}
            isActive={isCameraActive}
            photo={true}
            enableZoomGesture={false}
          />
        )}
        {!photo && isCameraActive && (
          <View style={styles.captureButtonContainer}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={styles.locationContainer}>
        <Icon name="map-marker" size={20} color="#4285F4" style={styles.locationIcon} />
        <View style={styles.addressContainer}>
          {locationLoading ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : (
            <Text style={styles.address}>{address || "Fetching location..."}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => getCurrentLocation()} style={styles.refreshLocationButton}> 
          <Icon name="refresh" size={16} color="#4285F4" />
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
          <Icon name="camera" size={20} color="#4285F4" style={{ marginRight: 8 }} />
          <Text style={styles.retakeButtonText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading || !isPhotoReady}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
        <FancyAlert
          visible={fancyAlertVisible}
          onClose={() => setFancyAlertVisible(false)}
          title={fancyAlertTitle}
          message={fancyAlertMessage}
          type={fancyAlertType}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  placeholderText: {
    color: "#333",
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },
  captureButtonContainer: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  locationIcon: {
    marginRight: wp(2),
  },
  addressContainer: {
    flex: 1,
    marginLeft: 10,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  address: {
    fontSize: 13,
    color: "#555",
  },
  refreshLocationButton: {
    padding: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    backgroundColor: "#fff",
  },
  cancelButton: {
    padding: 10,
  },
  cancelButtonText: {
    color: "#4285F4",
    fontSize: wp(4),
    fontWeight: "500",
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4285F4",
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: 4,
  },
  retakeButtonText: {
    color: "#4285F4",
    fontSize: wp(4),
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#4285F4",
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: 4,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: wp(4),
    fontWeight: "500",
  },
})

export default MarkAttendanceScreen
