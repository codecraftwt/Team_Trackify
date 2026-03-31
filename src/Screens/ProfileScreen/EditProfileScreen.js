import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import { useNavigation, useRoute } from "@react-navigation/native"
import { launchCamera, launchImageLibrary } from "react-native-image-picker"
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen"
import { useAuth } from "../../config/auth-context"
import { updateUser } from "../../services/UserService"

const EditProfileScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { userId, userProfile, updateUserProfile } = useAuth()

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile_no: "",
    address: "",
  })
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [avatarUri, setAvatarUri] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    email: "",
    mobile_no: "",
    address: "",
    password: "",
    confirmPassword: "",
  })

  const profile = userProfile || route.params?.userProfile || {}

  useEffect(() => {
    setFormData({
      name: profile.name || "",
      email: profile.email || "",
      mobile_no: profile.mobile_no || profile.mobileNo || "",
      address: profile.address || "",
    })
    setAvatarUrl(profile.avtar || profile.avatar || null)
  }, [profile])

  const handleClose = () => navigation.goBack()

  const handleSelectAvatar = () => {
    Alert.alert("Profile Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: () => {
          launchCamera(
            { mediaType: "photo", cameraType: "front", quality: 0.7 },
            (res) => {
              if (res.assets?.[0]?.uri) setAvatarUri(res.assets[0].uri)
            }
          )
        },
      },
      {
        text: "Choose from Gallery",
        onPress: () => {
          launchImageLibrary({ mediaType: "photo", quality: 0.7 }, (res) => {
            if (res.assets?.[0]?.uri) setAvatarUri(res.assets[0].uri)
          })
        },
      },
      { text: "Cancel", style: "cancel" },
    ])
  }

  // Function to map backend validation errors to specific fields
  const mapValidationErrors = (errorsArray) => {
    const mappedErrors = {
      name: "",
      email: "",
      mobile_no: "",
      address: "",
      password: "",
      confirmPassword: "",
    }

    if (!errorsArray || !Array.isArray(errorsArray)) {
      return mappedErrors
    }

    errorsArray.forEach(error => {
      const lowerError = error.toLowerCase()
      // Map error messages to fields based on keywords
      if (lowerError.includes('name')) {
        mappedErrors.name = error
      }
      else if (lowerError.includes('email')) {
        mappedErrors.email = error
      }
      else if (lowerError.includes('password')) {
        mappedErrors.password = error
      }
      else if (lowerError.includes('mobile')) {
        mappedErrors.mobile_no = error
      }
      else if (lowerError.includes('address')) {
        mappedErrors.address = error
      }
    })

    return mappedErrors
  }

  const validate = () => {
    // Clear previous errors
    setFieldErrors({
      name: "",
      email: "",
      mobile_no: "",
      address: "",
      password: "",
      confirmPassword: "",
    })

    let isValid = true

    if (!formData.name?.trim()) {
      setFieldErrors(prev => ({ ...prev, name: "Full Name is required" }))
      isValid = false
    }
    if (!formData.email?.trim()) {
      setFieldErrors(prev => ({ ...prev, email: "Email Address is required" }))
      isValid = false
    }
    if (!formData.mobile_no?.trim()) {
      setFieldErrors(prev => ({ ...prev, mobile_no: "Mobile Number is required" }))
      isValid = false
    }
    if (password && password !== confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }))
      isValid = false
    }
    return isValid
  }

  const handleUpdate = async () => {
    if (!validate()) return

    const effectiveUserId = userId || route.params?.userId || profile._id
    if (!effectiveUserId) {
      Alert.alert("Error", "User ID not found")
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile_no: formData.mobile_no.trim(),
        address: formData.address?.trim() || "",
        isActive: true,
      }

      const result = await updateUser(effectiveUserId, payload, avatarUri || undefined)

      // Check if the update was successful
      if (!result.success) {
        // Handle validation errors
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          // Map backend errors to specific fields
          const mappedErrors = mapValidationErrors(result.errors)
          setFieldErrors(mappedErrors)
        } else {
          Alert.alert("Error", result.message || "Failed to update profile")
        }
        return
      }

      const updatedUser = result.user || result.data || result
      const merged = { ...profile, ...updatedUser, ...payload }
      if (updatedUser?.avtar) merged.avtar = updatedUser.avtar
      if (updatedUser?.avatar) merged.avatar = updatedUser.avatar

      await updateUserProfile(merged)
      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ])
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const displayAvatar = avatarUri || avatarUrl

  return (
    <View style={styles.container}>
      {/* Blue Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.avatarWrapper} onPress={handleSelectAvatar}>
          <View style={styles.avatarCircle}>
            {displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="image-outline" size={40} color="#438AFF" />
                <View style={styles.avatarPlus}>
                  <Ionicons name="add" size={20} color="#fff" />
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Update User</Text>
        <Text style={styles.headerSubtitle}>Get your Walstar Tracking Acc Now</Text>
      </View>

      {/* White Content Card */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Personal Information */}
          <View style={styles.section}>
            <Ionicons name="person" size={18} color="#438AFF" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#438AFF" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, fieldErrors.name ? styles.inputError : null]}
              placeholder="Full Name"
              placeholderTextColor="#9CA3AF"
              value={formData.name}
              onChangeText={(t) => {
                setFormData((p) => ({ ...p, name: t }))
                if (fieldErrors.name) {
                  setFieldErrors(prev => ({ ...prev, name: '' }))
                }
              }}
            />
          </View>
          {fieldErrors.name ? (
            <Text style={styles.errorText}>{fieldErrors.name}</Text>
          ) : null}

          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.inputWrapper, profile.role_id === 0 && styles.disabledInputWrapper]}>
            <Ionicons name="mail-outline" size={20} color={profile.role_id === 0 ? "#9CA3AF" : "#438AFF"} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, profile.role_id === 0 && styles.disabledInput, fieldErrors.email ? styles.inputError : null]}
              placeholder="Email Address"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(t) => {
                setFormData((p) => ({ ...p, email: t }))
                if (fieldErrors.email) {
                  setFieldErrors(prev => ({ ...prev, email: '' }))
                }
              }}
              editable={profile.role_id !== 0}
              selectTextOnFocus={profile.role_id !== 0}
            />
          </View>
          {fieldErrors.email ? (
            <Text style={styles.errorText}>{fieldErrors.email}</Text>
          ) : null}

          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={20} color="#438AFF" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, fieldErrors.mobile_no ? styles.inputError : null]}
              placeholder="Mobile Number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={formData.mobile_no}
              onChangeText={(t) => {
                setFormData((p) => ({ ...p, mobile_no: t }))
                if (fieldErrors.mobile_no) {
                  setFieldErrors(prev => ({ ...prev, mobile_no: '' }))
                }
              }}
            />
          </View>
          {fieldErrors.mobile_no ? (
            <Text style={styles.errorText}>{fieldErrors.mobile_no}</Text>
          ) : null}

          <Text style={styles.label}>Address</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={20} color="#438AFF" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, fieldErrors.address ? styles.inputError : null]}
              placeholder="Address"
              placeholderTextColor="#9CA3AF"
              value={formData.address}
              onChangeText={(t) => {
                setFormData((p) => ({ ...p, address: t }))
                if (fieldErrors.address) {
                  setFieldErrors(prev => ({ ...prev, address: '' }))
                }
              }}
            />
          </View>
          {fieldErrors.address ? (
            <Text style={styles.errorText}>{fieldErrors.address}</Text>
          ) : null}

          {/* Security */}
          <View style={[styles.section, { marginTop: hp(2) }]}>
            <Ionicons name="shield-checkmark" size={18} color="#438AFF" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#438AFF" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, fieldErrors.password ? styles.inputError : null]}
              placeholder="Enter password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(t) => {
                setPassword(t)
                if (fieldErrors.password) {
                  setFieldErrors(prev => ({ ...prev, password: '' }))
                }
              }}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((p) => !p)}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
          {fieldErrors.password ? (
            <Text style={styles.errorText}>{fieldErrors.password}</Text>
          ) : null}

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#438AFF" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, fieldErrors.confirmPassword ? styles.inputError : null]}
              placeholder="Confirm password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t)
                if (fieldErrors.confirmPassword) {
                  setFieldErrors(prev => ({ ...prev, confirmPassword: '' }))
                }
              }}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword((p) => !p)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
          {fieldErrors.confirmPassword ? (
            <Text style={styles.errorText}>{fieldErrors.confirmPassword}</Text>
          ) : null}

          {/* Update Button */}
          <TouchableOpacity
            style={[styles.updateButton, loading && styles.updateButtonDisabled]}
            onPress={handleUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="refresh" size={22} color="#fff" style={styles.updateButtonIcon} />
                <Text style={styles.updateButtonText}>Update User</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F7FB",
  },
  header: {
    backgroundColor: "#438AFF",
    paddingTop: hp(6),
    paddingBottom: hp(4),
    paddingHorizontal: wp(5),
    borderBottomLeftRadius: hp(4),
    borderBottomRightRadius: hp(4),
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: hp(5),
    right: wp(5),
    zIndex: 1,
  },
  avatarWrapper: {
    marginBottom: hp(2),
  },
  avatarCircle: {
    width: wp(22),
    height: wp(22),
    borderRadius: wp(11),
    backgroundColor: "#fff",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarPlus: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#438AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: wp(6),
    fontWeight: "700",
    color: "#fff",
    marginBottom: hp(0.5),
  },
  headerSubtitle: {
    fontSize: wp(3.5),
    color: "rgba(255,255,255,0.9)",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(3),
    paddingBottom: hp(6),
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: hp(2.5),
    padding: wp(5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(2),
  },
  sectionIcon: {
    marginRight: wp(2),
  },
  sectionTitle: {
    fontSize: wp(4.2),
    fontWeight: "600",
    color: "#111827",
  },
  label: {
    fontSize: wp(3.5),
    color: "#374151",
    fontWeight: "500",
    marginBottom: hp(0.8),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: wp(2.5),
    paddingHorizontal: wp(4),
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  disabledInputWrapper: {
    backgroundColor: "#E5E7EB",
    borderColor: "#D1D5DB",
  },
  inputIcon: {
    marginRight: wp(3),
  },
  input: {
    flex: 1,
    paddingVertical: hp(1.6),
    fontSize: wp(4),
    color: "#111827",
  },
  disabledInput: {
    color: "#6B7280",
  },
  eyeButton: {
    padding: wp(2),
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#438AFF",
    paddingVertical: hp(2),
    borderRadius: wp(2.5),
    marginTop: hp(4),
  },
  updateButtonDisabled: {
    opacity: 0.7,
  },
  updateButtonIcon: {
    marginRight: wp(2),
  },
  updateButtonText: {
    color: "#fff",
    fontSize: wp(4.2),
    fontWeight: "700",
  },
  inputError: {
    borderColor: "#F44336",
  },
  errorText: {
    color: "#F44336",
    fontSize: wp(3),
    marginTop: hp(0.5),
    marginBottom: hp(1),
  },
})

export default EditProfileScreen