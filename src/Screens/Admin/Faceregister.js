import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Linking, Platform } from 'react-native'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRoute, useNavigation } from '@react-navigation/native'
// NOTE: useCameraPermissions is removed to fix the error.
import { Camera, useCameraDevice } from "react-native-vision-camera"
import RNFS from 'react-native-fs'; // <-- REQUIRED for Base64 conversion
import AsyncStorage from "@react-native-async-storage/async-storage"
import BASE_URL from "../../config/server" 
import { SafeAreaView } from "react-native-safe-area-context"
const Faceregister = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { employeeId, employeeName } = route.params;

  const device = useCameraDevice('front');
  const cameraRef = useRef(null);

  const [cameraPermission, setCameraPermission] = useState(null); // Use a state similar to your reference
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Permission Check Logic (Adapted from your reference) ---
  const checkCameraPermission = async () => {
    try {
      // Use the static method available in older versions
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
      setCameraPermission(false);
    }
  }
  
  useEffect(() => {
    checkCameraPermission();
  }, []);

  // --- API Call and Base64 Conversion ---
  const updateEmployeeImage = useCallback(async (base64String) => {
    setIsProcessing(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("Authentication token not found.");
      const cleanToken = token.startsWith("Bearer ") ? token.replace("Bearer ", "") : token;

      const apiData = {
        employeeId: employeeId,
        // The raw base64 string
        imageBase64: base64String, 
      };

      const response = await fetch(`${BASE_URL}/Employee/UpdateEmployeeImage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanToken}`,
        },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        Alert.alert("Success", `${employeeName}'s face registered successfully!`);
        navigation.goBack();
      } else {
        const errorText = await response.text();
        console.error("API Error Response:", errorText); 
        throw new Error(`API failed with status ${response.status}.`);
      }
    } catch (error) {
      console.error("Face Registration Error:", error);
      Alert.alert("Registration Failed", `Could not register face. ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [employeeId, employeeName, navigation]);

  // --- Take Picture Function ---
  const handleRegisterFace = async () => {
    if (cameraRef.current && !isProcessing) {
      try {
        const photo = await cameraRef.current.takePhoto({
          qualityPrioritization: 'speed',
          flash: 'off',
          skipMetadata: true,
        });

        if (photo.path) {
          // 1. Read the file from the path and convert to Base64
          // NOTE: This requires installing react-native-fs: npm install react-native-fs
          const rawBase64 = await RNFS.readFile(photo.path, 'base64');

          // 2. Call the API
          await updateEmployeeImage(rawBase64);
          
          // 3. (Optional) Clean up the temporary file
          await RNFS.unlink(photo.path);
          
        } else {
            Alert.alert("Error", "Failed to capture image file path.");
        }
      } catch (e) {
        console.error("Camera Capture Error:", e);
        Alert.alert("Camera Error", "Could not take picture.");
      }
    }
  };

  // --- Render Logic ---
  
  if (cameraPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="blue" />
        <Text style={{ marginTop: 10 }}>Checking camera permission...</Text>
      </View>
    );
  }

  if (cameraPermission === false) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.headerText}>Camera Access Required</Text>
        <TouchableOpacity style={styles.registerButton} onPress={checkCameraPermission}>
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.registerButton, { marginTop: 10, backgroundColor: '#ccc' }]} onPress={() => Linking.openSettings()}>
          <Text style={styles.buttonText}>Open Settings</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (device == null) {
    return <View style={styles.loadingContainer}><Text>No camera device found.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerText}>Register Face for: {employeeName}</Text>
      
      {/* Camera View */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* Register Button */}
      <TouchableOpacity 
        style={styles.registerButton} 
        onPress={handleRegisterFace} 
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>REGISTER FACE</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  )
}

export default Faceregister

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  camera: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  registerButton: {
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});