import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Modal } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../config/auth-context";
import BASE_URL from "../config/server";
import RNFS from "react-native-fs";
import { CommonActions } from '@react-navigation/native';
import ImageResizer from 'react-native-image-resizer';
import ModalComponent from '../Component/ModalComponent';

const decodeJWT = (token) => {
  try {  
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (e) {
    console.log("JWT decode error", e);
    return null;
  }
};

const ProfileScreen = ({ navigation }) => {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const { clearAuthData } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [tempImage, setTempImage] = useState(null); // temporary selected image
  const [showImageModal, setShowImageModal] = useState(false); // modal for save/cancel
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return Alert.alert("Error", "Token not found");
      const decoded = decodeJWT(token);
      const employeeId = decoded?.EmployeeId;
      if (!employeeId) return Alert.alert("Error", "Employee ID missing from token");

      const response = await fetch(`${BASE_URL}/Employee/GetEmpProfile?employeeId=${employeeId}`, {
        headers: { Authorization: token },
      });

      if (!response.ok) throw new Error("Failed to fetch profile data");
      const data = await response.json();
      setProfileData(data);

      if (data.photoImage) {
        let base64 = data.photoImage.trim().replace(/^"(.*)"$/, "$1");
        if (!base64.startsWith("data:image")) base64 = `data:image/jpeg;base64,${base64}`;
        setProfileImage(base64);
      } else setProfileImage(null);
    } catch (error) {
      console.error("Profile Fetch Error:", error);
      Alert.alert("Error", "Failed to load profile.");
    }
  };

  const handleSelectImage = async (source) => {
    try {
      const result = source === "camera"
        ? await launchCamera({ mediaType: "photo", cameraType: "front", quality: 0.7, saveToPhotos: true })
        : await launchImageLibrary({ mediaType: "photo", quality: 0.7 });

      const uri = result.assets?.[0]?.uri;
      if (uri) {
        setTempImage(uri);
        setShowImageModal(true); // show save/cancel modal
      }
    } catch (error) {
      console.error("Image pick error:", error);
    }
  };

  const handleSaveImage = async () => {
    if (!tempImage) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      const decoded = decodeJWT(token);
      const empId = decoded?.EmployeeId;

      const resized = await ImageResizer.createResizedImage(tempImage, 40, 40, 'JPEG', 70);
      const base64Data = await RNFS.readFile(resized.uri, 'base64');

      const response = await fetch(
        `${BASE_URL}/Employee/UpdateEmpProfile?empId=${empId}&image=${encodeURIComponent(base64Data)}`,
        { method: "POST", headers: { Authorization: token } }
      );

      if (!response.ok) throw new Error(await response.text() || "Upload failed");

      setProfileImage(`data:image/jpeg;base64,${base64Data}`);
      setTempImage(null);
      setShowImageModal(false);
      Alert.alert("Success", "Profile image updated!");
    } catch (error) {
      console.error("Upload Error:", error);
      Alert.alert("Error", "Failed to update image.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelImage = () => {
    setTempImage(null);
    setShowImageModal(false);
  };

  const handleEditProfileImage = () => {
    Alert.alert(
      "Edit Profile Image",
      "Choose an option",
      [
        { text: "Take Photo", onPress: () => handleSelectImage("camera") },
        { text: "Choose from Gallery", onPress: () => handleSelectImage("gallery") },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const handleLogout = () => setLogoutModalVisible(true);

  const confirmLogout = async () => {
    try {
      const punchInDate = await AsyncStorage.getItem("punchInDate");
      const punchInTime = await AsyncStorage.getItem("punchInTime");
      const punchOutTime = await AsyncStorage.getItem("punchOutTime");

      await clearAuthData();
      await AsyncStorage.removeItem("hasSeenWelcome");
      if (punchInDate) await AsyncStorage.setItem("punchInDate", punchInDate);
      if (punchInTime) await AsyncStorage.setItem("punchInTime", punchInTime);
      if (punchOutTime) await AsyncStorage.setItem("punchOutTime", punchOutTime);

      setLogoutModalVisible(false);
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] }));
    } catch (error) {
      console.error("Logout Error:", error);
      Alert.alert("Logout Failed", "Something went wrong while logging out.");
    }
  };

  const menuItems = [
    { title: "Personal Informations", icon: "info-circle", color: "#438aff", screen: "PersonalInfo" },
    { title: "Bank Details", icon: "university", color: "#A30000", screen: "BankDetails" },
    { title: "General Information", icon: "address-card", color: "#00B894", screen: "GeneralInfo" },
    { title: "My Document", icon: "file-alt", color: "#A67CFF", screen: "MyDocument" },
    { title: "Log Out", icon: "sign-out-alt", color: "#c6303e" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileImageWrapper}>
        <Image
          source={{ uri: tempImage ? tempImage : profileImage }}
          style={styles.profileImage}
        />
        <TouchableOpacity style={styles.editIcon} onPress={handleEditProfileImage}>
          <Icon name="pencil-alt" size={wp("4%")} color="#FFF" />
        </TouchableOpacity>
      </View>

      <Text style={styles.profileName}>{profileData?.fullName ?? "Loading..."}</Text>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => item.title === "Log Out" ? handleLogout() : item.screen && navigation.navigate(item.screen)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              <Icon name={item.icon} size={wp("5%")} color="#FFF" />
            </View>
            <Text style={styles.menuText} allowFontScaling={false}>{item.title}</Text>
            <Icon name="chevron-right" size={wp("4%")} color="#438aff" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Image Save/Cancel Modal */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelImage}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: wp(4), marginBottom: hp(2) }}>Do you want to save this image?</Text>
            <Image source={{ uri: tempImage }} style={{ width: wp(50), height: wp(50), borderRadius: wp(25), marginBottom: hp(2) }} />
            <View style={{ flexDirection: "row" }}>
             
              <TouchableOpacity
                style={[styles.saveButton, { marginRight: wp(3) }, { backgroundColor: "#9ca3af" }]}
                onPress={handleCancelImage}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>Cancel</Text>
              </TouchableOpacity>

               <TouchableOpacity
                style={[styles.saveButton, { marginRight: wp(3) }]}
                onPress={handleSaveImage}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Modal */}
      <ModalComponent
        isVisible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        iconName="sign-out"
        iconColor="#C6303E"
        title="Do you really want to log out?"
        content={<Text style={styles.logoutModalText}>Can remove HRMS data from the app.</Text>}
        buttonText="Logout"
        onConfirm={confirmLogout}
        showCancel={true}
      />
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingVertical: hp("5%"),
  },
  profileImageWrapper: {
    position: "relative",
    width: wp("30%"),
    height: wp("30%"),
    marginBottom: hp("2%"),
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: wp("35%"),
    height: wp("35%"),
    borderRadius: wp("20%"),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#438aff",
    borderRadius: wp("5%"),
    padding: wp("2%"),
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    fontSize: wp("5.5%"),
    fontWeight: "bold",
    marginVertical: hp("2%"),
    color: "#438aff",
  },
  menuContainer: {
    width: "90%",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: hp("1.5%"),
    paddingHorizontal: wp("4%"),
    marginVertical: hp("1%"),
    borderRadius: wp("3%"),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  iconContainer: {
    width: wp("12%"),
    height: wp("12%"),
    borderRadius: wp("6%"),
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp("4%"),
  },
  menuText: {
    flex: 1,
    fontSize: wp("4.2%"),
    color: "#374151",
    fontWeight: "500",
  },
  modalContent: {
    textAlign: "center",
    fontSize: wp("3.5%"),
    color: "#9ca3af",
    marginBottom: hp("2%"),
  },
  saveButton: {
    backgroundColor: "#438aff",
    borderRadius: 6,
    paddingVertical: hp(1),
    paddingHorizontal: wp(5),
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: wp("3.5%"),
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutModalText: {   // renamed this one
    textAlign: "center",
    fontSize: wp("3.5%"),
    color: "#9ca3af",
    marginBottom: hp("2%"),
  },
  modalContent: {
     width: wp("80%"),
  backgroundColor: "#fff",
  borderRadius: 10,
  padding: wp("5%"),
  alignItems: "center",
  },
});
