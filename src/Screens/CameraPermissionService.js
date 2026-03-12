import { Platform, Alert, Linking } from "react-native"
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions"

export const requestCameraPermission = async () => {
  try {
    const permission = Platform.OS === "ios" ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA
    const result = await check(permission)
    if (result === RESULTS.GRANTED) {
      return true
    }
    if (result === RESULTS.DENIED) {
      const requestResult = await request(permission)
      return requestResult === RESULTS.GRANTED
    }
    if (result === RESULTS.BLOCKED || result === RESULTS.UNAVAILABLE) {
      Alert.alert(
        "Camera Permission",
        "Camera permission is required to take photos. Please enable it in your device settings.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings(),
          },
        ],
      )
      return false
    }
    return false
  } catch (error) {
    console.error("Error checking camera permission:", error)
    return false
  }
}

export const requestLocationPermission = async () => {
  try {
    const permission =
      Platform.OS === "ios" ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
    const result = await check(permission)
    if (result === RESULTS.GRANTED) {
      return true
    }
    if (result === RESULTS.DENIED) {
      const requestResult = await request(permission)
      return requestResult === RESULTS.GRANTED
    }
    if (result === RESULTS.BLOCKED || result === RESULTS.UNAVAILABLE) {
      Alert.alert(
        "Location Permission",
        "Location permission is required to mark your attendance. Please enable it in your device settings.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings(),
          },
        ],
      )
      return false
    }
    return false
  } catch (error) {
    console.error("Error checking location permission:", error)
    return false
  }
}
