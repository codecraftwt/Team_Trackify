import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  Image,
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';

const PunchInScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        getCurrentLocation();
      }
    } else {
      getCurrentLocation();
    }
  };

 const getCurrentLocation = () => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setLocation(coords);
      console.log("Current Location (Lat, Lng):", coords.latitude, coords.longitude); // 👈 Log here
    },
    (error) => {
      console.log("Location Error:", error);
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
  );
};


  const handleCaptureImage = () => {
    launchCamera(
      {
        mediaType: 'photo',
        cameraType: 'front',
        saveToPhotos: true,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.log('ImagePicker Error: ', response.errorMessage);
        } else {
          const source = { uri: response.assets[0].uri };
          setCapturedImage(source);
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={25} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Mark Attendance</Text>
        <Icon name="camera" size={25} color="#000" />
      </View>

      {/* Live Map Location */}
      {location && (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={location}
          showsUserLocation={true}
        >
          <Marker coordinate={location} />
        </MapView>
      )}

      {/* Captured Image Preview */}
      {capturedImage && (
        <Image source={capturedImage} style={styles.previewImage} />
      )}

      {/* Capture Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.captureButton} onPress={handleCaptureImage} />
        <TouchableOpacity>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PunchInScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  map: {
    height: 300,
    width: '100%',
  },
  previewImage: {
    width: '90%',
    height: 200,
    alignSelf: 'center',
    marginTop: 15,
    borderRadius: 10,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2196F3',
    borderWidth: 4,
    borderColor: '#fff',
    marginBottom: 10,
  },
  cancelText: {
    fontSize: 16,
    color: '#888',
  },
});
