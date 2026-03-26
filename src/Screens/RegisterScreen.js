// // RegisterScreen.js - Updated with navigation to OTP screen
// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   Alert,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Image,
// } from 'react-native';
// import { launchImageLibrary } from 'react-native-image-picker';
// import { registerUser } from '../config/AdminService';

// const RegisterScreen = ({ navigation, route }) => {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//     mobile_no: '',
//     address: '',
//     avtar: null,
//   });
  
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [errors, setErrors] = useState({});

//   // Get createdby from route params (current admin ID)
//   const createdby = route.params?.adminId || null;

//   const handleInputChange = (field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//     // Clear error for this field when user starts typing
//     if (errors[field]) {
//       setErrors(prev => ({ ...prev, [field]: null }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     // Name validation
//     if (!formData.name.trim()) {
//       newErrors.name = 'Name is required';
//     } else if (formData.name.trim().length < 2 || formData.name.trim().length > 50) {
//       newErrors.name = 'Name must be between 2 and 50 characters';
//     } else if (!/^[A-Za-z\s]+$/.test(formData.name.trim())) {
//       newErrors.name = 'Name must contain only letters and spaces';
//     }

//     // Email validation
//     const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
//     if (!formData.email.trim()) {
//       newErrors.email = 'Email is required';
//     } else if (!emailRegex.test(formData.email.trim())) {
//       newErrors.email = 'Please enter a valid email address';
//     }

//     // Password validation
//     if (!formData.password) {
//       newErrors.password = 'Password is required';
//     } else if (formData.password.length < 8) {
//       newErrors.password = 'Password must be at least 8 characters long';
//     }

//     // Confirm password validation
//     if (!formData.confirmPassword) {
//       newErrors.confirmPassword = 'Please confirm your password';
//     } else if (formData.password !== formData.confirmPassword) {
//       newErrors.confirmPassword = 'Passwords do not match';
//     }

//     // Mobile number validation
//     if (!formData.mobile_no) {
//       newErrors.mobile_no = 'Mobile number is required';
//     } else if (!/^\d{10}$/.test(formData.mobile_no)) {
//       newErrors.mobile_no = 'Mobile number must be exactly 10 digits';
//     }

//     // Address validation (optional)
//     if (formData.address && (formData.address.trim().length < 5 || formData.address.trim().length > 200)) {
//       newErrors.address = 'Address must be between 5 and 200 characters';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const pickImage = () => {
//     const options = {
//       mediaType: 'photo',
//       quality: 0.8,
//       maxWidth: 1000,
//       maxHeight: 1000,
//       includeBase64: false,
//       selectionLimit: 1,
//     };

//     launchImageLibrary(options, (response) => {
//       if (response.didCancel) {
//         console.log('User cancelled image picker');
//       } else if (response.error) {
//         console.log('ImagePicker Error: ', response.error);
//         Alert.alert('Error', 'Failed to pick image. Please try again.');
//       } else if (response.assets && response.assets[0]) {
//         const selectedAsset = response.assets[0];
        
//         // Check file size (5MB max)
//         if (selectedAsset.fileSize && selectedAsset.fileSize > 5 * 1024 * 1024) {
//           Alert.alert('Error', 'Image size should be less than 5MB');
//           return;
//         }

//         // Get file extension from uri or fileName
//         const uri = selectedAsset.uri;
//         const fileName = selectedAsset.fileName || 'avatar.jpg';
//         const type = selectedAsset.type || getMimeType(fileName);
        
//         setFormData(prev => ({
//           ...prev,
//           avtar: {
//             uri: uri,
//             type: type,
//             name: fileName,
//           },
//         }));
//       }
//     });
//   };

//   // Helper function to get mime type from file name
//   const getMimeType = (fileName) => {
//     const extension = fileName.split('.').pop().toLowerCase();
//     switch (extension) {
//       case 'jpg':
//       case 'jpeg':
//         return 'image/jpeg';
//       case 'png':
//         return 'image/png';
//       case 'gif':
//         return 'image/gif';
//       default:
//         return 'image/jpeg';
//     }
//   };

//   const handleSubmit = async () => {
//     if (!validateForm()) {
//       return;
//     }

//     setLoading(true);
    
//     try {
//       const userData = {
//         name: formData.name.trim(),
//         email: formData.email.trim().toLowerCase(),
//         password: formData.password,
//         mobile_no: formData.mobile_no.trim(),
//         address: formData.address ? formData.address.trim() : '',
//         avtar: formData.avtar,
//         createdby: createdby,
//         role_id: 1, // Explicitly set role_id to 1 for admin
//       };

//       const response = await registerUser(userData);

//       if (response.success) {
//         // Check if OTP was sent (self registration) or admin creation
//         if (response.data?.isEmailVerified === false) {
//           // For self registration, navigate to OTP verification
//           Alert.alert(
//             'Success',
//             'Registration successful! Please verify your email.',
//             [
//               {
//                 text: 'Verify Now',
//                 onPress: () => {
//                   navigation.replace('EmailVerificationScreen', {
//                     email: userData.email,
//                     userData: response.data,
//                   });
//                 },
//               },
//             ]
//           );
//         } else {
//           // For admin-created users, go back
//           Alert.alert(
//             'Success',
//             response.message || 'Admin user registered successfully',
//             [
//               {
//                 text: 'OK',
//                 onPress: () => {
//                   setFormData({
//                     name: '',
//                     email: '',
//                     password: '',
//                     confirmPassword: '',
//                     mobile_no: '',
//                     address: '',
//                     avtar: null,
//                   });
//                   navigation.goBack();
//                 },
//               },
//             ]
//           );
//         }
//       } else {
//         // Handle validation errors from server
//         if (response.errors && Array.isArray(response.errors)) {
//           const serverErrors = {};
//           response.errors.forEach(error => {
//             // Map server errors to form fields
//             if (error.includes('Name')) serverErrors.name = error;
//             else if (error.includes('email')) serverErrors.email = error;
//             else if (error.includes('Password')) serverErrors.password = error;
//             else if (error.includes('Mobile')) serverErrors.mobile_no = error;
//             else if (error.includes('Address')) serverErrors.address = error;
//             else {
//               Alert.alert('Error', error);
//             }
//           });
//           setErrors(prev => ({ ...prev, ...serverErrors }));
//         } else {
//           Alert.alert('Error', response.message || 'Failed to register admin user');
//         }
//       }
//     } catch (error) {
//       console.error('Registration error:', error);
//       Alert.alert('Error', 'Something went wrong. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <ScrollView
//         contentContainerStyle={styles.scrollContainer}
//         showsVerticalScrollIndicator={false}
//       >
//         <View style={styles.header}>
//           <Text style={styles.title}>Register Admin User</Text>
//           <Text style={styles.subtitle}>Create a new admin account</Text>
//         </View>

//         {/* Avatar Picker */}
//         <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
//           {formData.avtar ? (
//             <Image source={{ uri: formData.avtar.uri }} style={styles.avatar} />
//           ) : (
//             <View style={styles.avatarPlaceholder}>
//               <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
//             </View>
//           )}
//         </TouchableOpacity>

//         {/* Name Input */}
//         <View style={styles.inputContainer}>
//           <Text style={styles.label}>Full Name *</Text>
//           <TextInput
//             style={[styles.input, errors.name && styles.inputError]}
//             placeholder="Enter full name"
//             value={formData.name}
//             onChangeText={(text) => handleInputChange('name', text)}
//           />
//           {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
//         </View>

//         {/* Email Input */}
//         <View style={styles.inputContainer}>
//           <Text style={styles.label}>Email Address *</Text>
//           <TextInput
//             style={[styles.input, errors.email && styles.inputError]}
//             placeholder="Enter email address"
//             value={formData.email}
//             onChangeText={(text) => handleInputChange('email', text)}
//             autoCapitalize="none"
//             keyboardType="email-address"
//           />
//           {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
//         </View>

//         {/* Password Input */}
//         <View style={styles.inputContainer}>
//           <Text style={styles.label}>Password *</Text>
//           <View style={styles.passwordContainer}>
//             <TextInput
//               style={[styles.passwordInput, errors.password && styles.inputError]}
//               placeholder="Enter password"
//               value={formData.password}
//               onChangeText={(text) => handleInputChange('password', text)}
//               secureTextEntry={!showPassword}
//             />
//             <TouchableOpacity
//               style={styles.eyeButton}
//               onPress={() => setShowPassword(!showPassword)}
//             >
//               <Text>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
//             </TouchableOpacity>
//           </View>
//           {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
//         </View>

//         {/* Confirm Password Input */}
//         <View style={styles.inputContainer}>
//           <Text style={styles.label}>Confirm Password *</Text>
//           <View style={styles.passwordContainer}>
//             <TextInput
//               style={[styles.passwordInput, errors.confirmPassword && styles.inputError]}
//               placeholder="Confirm password"
//               value={formData.confirmPassword}
//               onChangeText={(text) => handleInputChange('confirmPassword', text)}
//               secureTextEntry={!showConfirmPassword}
//             />
//             <TouchableOpacity
//               style={styles.eyeButton}
//               onPress={() => setShowConfirmPassword(!showConfirmPassword)}
//             >
//               <Text>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
//             </TouchableOpacity>
//           </View>
//           {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
//         </View>

//         {/* Mobile Number Input */}
//         <View style={styles.inputContainer}>
//           <Text style={styles.label}>Mobile Number *</Text>
//           <TextInput
//             style={[styles.input, errors.mobile_no && styles.inputError]}
//             placeholder="Enter 10-digit mobile number"
//             value={formData.mobile_no}
//             onChangeText={(text) => handleInputChange('mobile_no', text.replace(/[^0-9]/g, ''))}
//             keyboardType="phone-pad"
//             maxLength={10}
//           />
//           {errors.mobile_no && <Text style={styles.errorText}>{errors.mobile_no}</Text>}
//         </View>

//         {/* Address Input */}
//         <View style={styles.inputContainer}>
//           <Text style={styles.label}>Address (Optional)</Text>
//           <TextInput
//             style={[styles.input, styles.textArea, errors.address && styles.inputError]}
//             placeholder="Enter address"
//             value={formData.address}
//             onChangeText={(text) => handleInputChange('address', text)}
//             multiline
//             numberOfLines={3}
//           />
//           {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
//         </View>

//         {/* Submit Button */}
//         <TouchableOpacity
//           style={[styles.submitButton, loading && styles.disabledButton]}
//           onPress={handleSubmit}
//           disabled={loading}
//         >
//           {loading ? (
//             <ActivityIndicator color="#fff" />
//           ) : (
//             <Text style={styles.submitButtonText}>Register Admin</Text>
//           )}
//         </TouchableOpacity>

//         {/* Cancel Button */}
//         <TouchableOpacity
//           style={styles.cancelButton}
//           onPress={() => navigation.goBack()}
//           disabled={loading}
//         >
//           <Text style={styles.cancelButtonText}>Cancel</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   scrollContainer: {
//     padding: 20,
//     paddingBottom: 40,
//   },
//   header: {
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 8,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#666',
//   },
//   avatarContainer: {
//     alignSelf: 'center',
//     marginBottom: 20,
//   },
//   avatar: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     borderWidth: 2,
//     borderColor: '#007AFF',
//   },
//   avatarPlaceholder: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: '#e0e0e0',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#ccc',
//   },
//   avatarPlaceholderText: {
//     fontSize: 12,
//     color: '#666',
//   },
//   inputContainer: {
//     marginBottom: 20,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#333',
//     marginBottom: 8,
//   },
//   input: {
//     backgroundColor: '#fff',
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     fontSize: 16,
//   },
//   textArea: {
//     minHeight: 80,
//     textAlignVertical: 'top',
//   },
//   inputError: {
//     borderColor: '#ff3b30',
//   },
//   errorText: {
//     color: '#ff3b30',
//     fontSize: 12,
//     marginTop: 4,
//   },
//   passwordContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   passwordInput: {
//     flex: 1,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     fontSize: 16,
//   },
//   eyeButton: {
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//   },
//   submitButton: {
//     backgroundColor: '#007AFF',
//     borderRadius: 8,
//     paddingVertical: 14,
//     alignItems: 'center',
//     marginTop: 10,
//     marginBottom: 10,
//   },
//   submitButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   disabledButton: {
//     opacity: 0.6,
//   },
//   cancelButton: {
//     backgroundColor: 'transparent',
//     borderRadius: 8,
//     paddingVertical: 14,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#007AFF',
//   },
//   cancelButtonText: {
//     color: '#007AFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// export default RegisterScreen;
// RegisterScreen.js - Enhanced with modern design
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { registerUser } from '../config/AdminService';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const RegisterScreen = ({ navigation, route }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile_no: '',
    address: '',
    avtar: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  const createdby = route.params?.adminId || null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2 || formData.name.trim().length > 50) {
      newErrors.name = 'Name must be between 2 and 50 characters';
    } else if (!/^[A-Za-z\s]+$/.test(formData.name.trim())) {
      newErrors.name = 'Name must contain only letters and spaces';
    }

    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.mobile_no) {
      newErrors.mobile_no = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile_no)) {
      newErrors.mobile_no = 'Mobile number must be exactly 10 digits';
    }

    if (formData.address && (formData.address.trim().length < 5 || formData.address.trim().length > 200)) {
      newErrors.address = 'Address must be between 5 and 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1000,
      maxHeight: 1000,
      includeBase64: false,
      selectionLimit: 1,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to pick image. Please try again.');
      } else if (response.assets && response.assets[0]) {
        const selectedAsset = response.assets[0];
        
        if (selectedAsset.fileSize && selectedAsset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Error', 'Image size should be less than 5MB');
          return;
        }

        const uri = selectedAsset.uri;
        const fileName = selectedAsset.fileName || 'avatar.jpg';
        const type = selectedAsset.type || getMimeType(fileName);
        
        setFormData(prev => ({
          ...prev,
          avtar: {
            uri: uri,
            type: type,
            name: fileName,
          },
        }));
      }
    });
  };

  const getMimeType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      default:
        return 'image/jpeg';
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        mobile_no: formData.mobile_no.trim(),
        address: formData.address ? formData.address.trim() : '',
        avtar: formData.avtar,
        createdby: createdby,
        role_id: 1,
      };

      const response = await registerUser(userData);

      if (response.success) {
        if (response.data?.isEmailVerified === false) {
          Alert.alert(
            'Success ✨',
            'Registration successful! Please verify your email.',
            [
              {
                text: 'Verify Now',
                onPress: () => {
                  navigation.replace('EmailVerificationScreen', {
                    email: userData.email,
                    userData: response.data,
                  });
                },
              },
            ]
          );
        } else {
          Alert.alert(
            'Success 🎉',
            response.message || 'Admin user registered successfully',
            [
              {
                text: 'OK',
                onPress: () => {
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    mobile_no: '',
                    address: '',
                    avtar: null,
                  });
                  navigation.goBack();
                },
              },
            ]
          );
        }
      } else {
        if (response.errors && Array.isArray(response.errors)) {
          const serverErrors = {};
          response.errors.forEach(error => {
            if (error.includes('Name')) serverErrors.name = error;
            else if (error.includes('email')) serverErrors.email = error;
            else if (error.includes('Password')) serverErrors.password = error;
            else if (error.includes('Mobile')) serverErrors.mobile_no = error;
            else if (error.includes('Address')) serverErrors.address = error;
            else {
              Alert.alert('Error', error);
            }
          });
          setErrors(prev => ({ ...prev, ...serverErrors }));
        } else {
          Alert.alert('Error', response.message || 'Failed to register admin user');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Icon name="people" size={40} color="#fff" />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Add a new administrator</Text>
        </View>

        {/* Avatar Picker - Enhanced */}
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} activeOpacity={0.8}>
          {formData.avtar ? (
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: formData.avtar.uri }} style={styles.avatar} />
              <View style={styles.avatarEditBadge}>
                <Icon name="camera" size={16} color="#fff" />
              </View>
            </View>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="camera" size={30} color="#666" />
              <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Name Input */}
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <Icon name="person-outline" size={18} color={focusedField === 'name' ? '#007AFF' : '#666'} />
            <Text style={[styles.label, focusedField === 'name' && styles.labelFocused]}>Full Name *</Text>
          </View>
          <TextInput
            style={[styles.input, errors.name && styles.inputError, focusedField === 'name' && styles.inputFocused]}
            placeholder="Enter full name"
            placeholderTextColor="#999"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
          />
          {errors.name && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={14} color="#ff3b30" />
              <Text style={styles.errorText}>{errors.name}</Text>
            </View>
          )}
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <Icon name="mail-outline" size={18} color={focusedField === 'email' ? '#007AFF' : '#666'} />
            <Text style={[styles.label, focusedField === 'email' && styles.labelFocused]}>Email Address *</Text>
          </View>
          <TextInput
            style={[styles.input, errors.email && styles.inputError, focusedField === 'email' && styles.inputFocused]}
            placeholder="Enter email address"
            placeholderTextColor="#999"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            autoCapitalize="none"
            keyboardType="email-address"
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
          />
          {errors.email && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={14} color="#ff3b30" />
              <Text style={styles.errorText}>{errors.email}</Text>
            </View>
          )}
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <Icon name="lock-closed-outline" size={18} color={focusedField === 'password' ? '#007AFF' : '#666'} />
            <Text style={[styles.label, focusedField === 'password' && styles.labelFocused]}>Password *</Text>
          </View>
          <View style={[styles.passwordContainer, errors.password && styles.inputError, focusedField === 'password' && styles.inputFocused]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter password"
              placeholderTextColor="#999"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry={!showPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={14} color="#ff3b30" />
              <Text style={styles.errorText}>{errors.password}</Text>
            </View>
          )}
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <Icon name="lock-closed-outline" size={18} color={focusedField === 'confirmPassword' ? '#007AFF' : '#666'} />
            <Text style={[styles.label, focusedField === 'confirmPassword' && styles.labelFocused]}>Confirm Password *</Text>
          </View>
          <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError, focusedField === 'confirmPassword' && styles.inputFocused]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm password"
              placeholderTextColor="#999"
              value={formData.confirmPassword}
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
              secureTextEntry={!showConfirmPassword}
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={() => setFocusedField(null)}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Icon name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={14} color="#ff3b30" />
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            </View>
          )}
        </View>

        {/* Mobile Number Input */}
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <Icon name="call-outline" size={18} color={focusedField === 'mobile_no' ? '#007AFF' : '#666'} />
            <Text style={[styles.label, focusedField === 'mobile_no' && styles.labelFocused]}>Mobile Number *</Text>
          </View>
          <TextInput
            style={[styles.input, errors.mobile_no && styles.inputError, focusedField === 'mobile_no' && styles.inputFocused]}
            placeholder="Enter 10-digit mobile number"
            placeholderTextColor="#999"
            value={formData.mobile_no}
            onChangeText={(text) => handleInputChange('mobile_no', text.replace(/[^0-9]/g, ''))}
            keyboardType="phone-pad"
            maxLength={10}
            onFocus={() => setFocusedField('mobile_no')}
            onBlur={() => setFocusedField(null)}
          />
          {errors.mobile_no && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={14} color="#ff3b30" />
              <Text style={styles.errorText}>{errors.mobile_no}</Text>
            </View>
          )}
        </View>

        {/* Address Input */}
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <Icon name="location-outline" size={18} color={focusedField === 'address' ? '#007AFF' : '#666'} />
            <Text style={[styles.label, focusedField === 'address' && styles.labelFocused]}>Address (Optional)</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea, errors.address && styles.inputError, focusedField === 'address' && styles.inputFocused]}
            placeholder="Enter address"
            placeholderTextColor="#999"
            value={formData.address}
            onChangeText={(text) => handleInputChange('address', text)}
            multiline
            numberOfLines={3}
            onFocus={() => setFocusedField('address')}
            onBlur={() => setFocusedField(null)}
          />
          {errors.address && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={14} color="#ff3b30" />
              <Text style={styles.errorText}>{errors.address}</Text>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Register Admin</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
          activeOpacity={0.6}
        >
          <Icon name="arrow-back-outline" size={20} color="#007AFF" />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    letterSpacing: 0.3,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 25,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#e8ecf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  avatarPlaceholderText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.3,
  },
  labelFocused: {
    color: '#007AFF',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e0e4ec',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a2e',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  inputFocused: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff3b30',
    borderWidth: 1.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e0e4ec',
    borderRadius: 12,
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a2e',
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen;