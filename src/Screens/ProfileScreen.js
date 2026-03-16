import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../config/auth-context';
import BASE_URL from '../config/server';
import { CommonActions } from '@react-navigation/native';
import ModalComponent from '../Component/ModalComponent';

const { width: w } = Dimensions.get('window');
const f = (n) => wp(n * 1.2);

const ProfileScreen = ({ navigation }) => {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const { clearAuthData, userProfile } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [tempImage, setTempImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setProfileData(userProfile);
    }
  }, [userProfile]);

  const toggleImageModal = () => setShowImageModal((prev) => !prev);

  const handleSelectImage = async (source) => {
    try {
      const result =
        source === 'camera'
          ? await launchCamera({
              mediaType: 'photo',
              cameraType: 'front',
              quality: 0.7,
              saveToPhotos: true,
            })
          : await launchImageLibrary({ mediaType: 'photo', quality: 0.7 });

      const uri = result.assets?.[0]?.uri;
      if (uri) {
        setTempImage(uri);
      }
    } catch (error) {
      console.error('Image pick error:', error);
    }
  };

  const handleSaveImage = async () => {
    if (!tempImage) return;
    setLoading(true);
    try {
      setProfileImage(tempImage);
      setTempImage(null);
      Alert.alert('Success', 'Profile image updated locally.');
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Error', 'Failed to update image.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelImage = () => {
    setTempImage(null);
    setShowImageModal(false);
  };

  const handleEditProfileImage = () => {
    Alert.alert('Edit Profile Image', 'Choose an option', [
      { text: 'Take Photo', onPress: () => handleSelectImage('camera') },
      { text: 'Choose from Gallery', onPress: () => handleSelectImage('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ], { cancelable: true });
  };

  const handleLogout = () => setLogoutModalVisible(true);

  const confirmLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (token) {
        await fetch(`${BASE_URL}/api/users/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: token },
        });
      }

      await clearAuthData();
      await AsyncStorage.removeItem('hasSeenWelcome');
      setLogoutModalVisible(false);
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] }));
    } catch (error) {
      console.error('Logout Error:', error);
      Alert.alert('Logout Failed', 'Something went wrong while logging out.');
    }
  };

  const userData = profileData || {};
  const displayImage = tempImage || profileImage || userData?.avtar;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.editIconContainer}
            onPress={() => setShowDropdown(!showDropdown)}>
            <Ionicons name="settings-sharp" size={f(6)} color="#fff" />
          </TouchableOpacity>

          {showDropdown && (
            <>
              <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={() => setShowDropdown(false)}
              />
              <View style={styles.dropdownContent}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    const parent = navigation.getParent();
                    if (parent?.navigate) {
                      parent.navigate('EditProfile');
                    } else {
                      navigation.navigate('EditProfile');
                    }
                    setShowDropdown(false);
                  }}>
                  <Text style={styles.dropdownText}>Edit Profile</Text>
                </TouchableOpacity>
                {(userData?.role_id === 1 || userData?.role_id === 2) && (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      try {
                        navigation.navigate('Complaint');
                      } catch (_) {}
                      setShowDropdown(false);
                    }}>
                    <Text style={styles.dropdownText}>Complaints</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          <TouchableOpacity onPress={toggleImageModal} style={styles.profileImageContainer}>
            {displayImage ? (
              <Image source={{ uri: displayImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <Icon name="user" size={wp(12)} color="#3088C7" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.userName}>{userData?.name || 'User'}</Text>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Icon name="envelope" size={f(4)} color="#3088C7" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userData?.email || 'Not Available'}</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.infoItem}>
              <Icon name="phone-alt" size={f(4)} color="#3088C7" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Mobile</Text>
                <Text style={styles.infoValue}>{userData?.mobile_no || 'Not Available'}</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.infoItem}>
              <Icon name="map-marker-alt" size={f(4)} color="#3088C7" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{userData?.address || 'Not Available'}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.85}>
            <Icon name="sign-out-alt" size={f(4)} color="#fff" style={{ marginRight: wp(2) }} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <ModalComponent
          isVisible={logoutModalVisible}
          onClose={() => setLogoutModalVisible(false)}
          iconName="sign-out-alt"
          iconColor="#E94B3C"
          title="Do you really want to log out?"
          content={<Text style={styles.logoutModalText}>Are you sure you want to log out?</Text>}
          buttonText="Logout"
          onConfirm={confirmLogout}
        />

        <Modal
          visible={showImageModal}
          transparent
          animationType="fade"
          onRequestClose={toggleImageModal}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={toggleImageModal}>
            <View style={styles.imageModalContent}>
              {displayImage ? (
                <Image source={{ uri: displayImage }} style={styles.fullImage} />
              ) : (
                <View style={[styles.fullImage, styles.profileImagePlaceholder]}>
                  <Icon name="user" size={120} color="#3088C7" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Modal>

        {tempImage ? (
          <Modal visible={true} transparent animationType="fade" onRequestClose={handleCancelImage}>
            <View style={styles.modalOverlay}>
              <View style={styles.saveModalContent}>
                <Text style={styles.saveModalTitle}>Do you want to save this image?</Text>
                <Image source={{ uri: tempImage }} style={styles.saveModalPreview} />
                <View style={styles.saveModalActions}>
                  <TouchableOpacity
                    style={[styles.saveButton, styles.cancelButton]}
                    onPress={handleCancelImage}
                    disabled={loading}>
                    <Text style={styles.saveButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, styles.confirmButton]}
                    onPress={handleSaveImage}
                    disabled={loading}>
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F7FB',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#3088C7',
    paddingVertical: hp(4.4),
    alignItems: 'center',
    borderBottomLeftRadius: hp(5),
    borderBottomRightRadius: hp(5),
    marginBottom: hp(5),
    paddingTop: hp(5.4),
  },
  editIconContainer: {
    position: 'absolute',
    top: hp(6),
    right: wp(5),
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 1,
  },
  dropdownContent: {
    position: 'absolute',
    top: hp(6.7),
    right: wp(5),
    backgroundColor: 'white',
    borderRadius: hp(1),
    padding: hp(2),
    width: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 2,
  },
  dropdownItem: {
    paddingVertical: hp(1.1),
    paddingHorizontal: hp(2),
  },
  dropdownText: {
    fontSize: wp(4.5),
    color: '#1A1A1A',
    fontWeight: '600',
  },
  profileImageContainer: {
    marginBottom: wp(3),
  },
  profileImage: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(25) / 2,
    borderWidth: 3,
    borderColor: '#F2F7FB',
    marginTop: hp(1.2),
  },
  profileImagePlaceholder: {
    backgroundColor: '#E8F0F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: wp(5.5),
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: 'center',
  },
  contentContainer: {
    paddingHorizontal: wp(5),
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: hp(3),
    padding: wp(5),
    marginBottom: wp(5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: wp(3),
  },
  infoTextContainer: {
    marginLeft: wp(4),
    flex: 1,
  },
  infoLabel: {
    fontSize: wp(3.8),
    color: '#7D7D7D',
    marginBottom: wp(1),
  },
  infoValue: {
    fontSize: wp(4.2),
    color: '#2D2D2D',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginVertical: wp(2),
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(1.6),
    paddingHorizontal: wp(2),
    borderRadius: hp(2.4),
    backgroundColor: '#E94B3C',
    marginVertical: wp(7),
    shadowColor: '#E94B3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    color: '#fff',
    fontSize: wp(4),
    fontWeight: '600',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  imageModalContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  fullImage: {
    width: Math.min(w - 40, 380),
    height: Math.min(w - 40, 380),
    resizeMode: 'contain',
  },
  saveModalContent: {
    width: wp(85),
    backgroundColor: '#fff',
    borderRadius: hp(2),
    padding: wp(5),
    alignItems: 'center',
  },
  saveModalTitle: {
    fontSize: wp(4),
    marginBottom: hp(2),
    color: '#2D2D2D',
  },
  saveModalPreview: {
    width: wp(50),
    height: wp(50),
    borderRadius: wp(25),
    marginBottom: hp(2),
  },
  saveModalActions: {
    flexDirection: 'row',
    gap: wp(3),
  },
  saveButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: hp(1.5),
    alignItems: 'center',
  },
  cancelButton: { backgroundColor: '#9ca3af' },
  confirmButton: { backgroundColor: '#438aff' },
  saveButtonText: { color: '#fff', fontSize: wp(3.8), fontWeight: '600' },
  logoutModalText: {
    textAlign: 'center',
    fontSize: wp(3.8),
    color: '#6B7280',
    marginBottom: hp(1),
  },
});
