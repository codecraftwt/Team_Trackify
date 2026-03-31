import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../config/server';
import { useAuth } from '../config/auth-context';
import { CommonActions } from '@react-navigation/native';
import NotificationManager from '../Notifications/NotificationManager';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const { setAuthData } = useAuth();

  useEffect(() => {
    // Keyboard event listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const showToast = (message, type = 'error') => {
    Toast.show({
      type: type,
      text1: type === 'error' ? 'Error' : 'Success',
      text2: message,
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 50,
      bottomOffset: 40,
    });
  };

  const handleLogin = async () => {

    // Validate email and password
    if (!email.trim()) {
      showToast("Please enter your email address.");
      return;
    }

    if (!password.trim()) {
      showToast("Please enter your password.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const text = await response.text();

      if (!text) {
        showToast("Empty response from server.");
        setIsLoading(false);
        return;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Login API Error: Invalid JSON", err, text);
        showToast("Invalid response format from server.");
        setIsLoading(false);
        return;
      }

      // Check if login was successful (status: 1)
      if (response.ok && data.status === 1 && data.token) {
        const token = data.token;
        const user = data.user;

        // Store user data in auth context
        const userRole = user.role_id === 1 ? 'Admin' : 'user';
        const subscriptionStatusData = data.subscriptionStatus || null;

        await setAuthData(
          token,
          user._id.toString(),
          user.createdby || '',
          userRole,
          user,
          subscriptionStatusData
        );

        // Store additional user info in AsyncStorage if needed
        if (user.name) {
          await AsyncStorage.setItem("userName", user.name);
        }
        if (user.email) {
          await AsyncStorage.setItem("userEmail", user.email);
        }

        // Get and Log the FCM Token
        const fcmToken = await NotificationManager.getFCMToken();
        
        // Show success toast
        showToast("Login successful! Welcome back.", "success");

        // Reset navigation stack to the authenticated flow
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{
              name: 'Authenticated',
              params: {
                userRole: userRole,
                userData: user,
                subscriptionStatus: subscriptionStatusData
              }
            }],
          })
        );
      } else {
        // Handle login failure
        showToast(data.message || "Invalid email or password.");
      }
    } catch (error) {
      console.error('Login API Error:', error);
      showToast("Something went wrong. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Navigate to forgot password screen
    navigation.navigate('ForgotPassword');
  };

  const handleRegister = () => {
    // Navigate to register screen
    navigation.navigate('RegisterScreen');
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#3088C7" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <ScrollView
              contentContainerStyle={[
                styles.scrollContainer,
                keyboardVisible && styles.scrollContainerKeyboardActive
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Logo Container - Hidden when keyboard is open */}
              {!keyboardVisible && (
                <View style={styles.logoContainer}>
                  <Image
                    source={require('../assets/app-icon1-10.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
              )}

              {/* Form Container - Always visible */}
              <View style={[
                styles.formContainer,
                keyboardVisible && styles.formContainerKeyboardActive
              ]}>
                <Text style={styles.title}>Welcome Back!</Text>
                <Text style={styles.subtitle}>Please log in to continue.</Text>

                {/* Email Input with Icon */}
                <View style={styles.inputWrapper}>
                  <View style={styles.iconContainer}>
                    <Icon
                      name="email"
                      size={20}
                      color="#A8A8A8"
                      style={styles.icon}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    onChangeText={setEmail}
                    value={email}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>

                {/* Password Input with Icon */}
                <View style={styles.inputWrapper}>
                  <View style={styles.iconContainer}>
                    <Icon
                      name="lock"
                      size={20}
                      color="#A8A8A8"
                      style={styles.icon}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    onChangeText={setPassword}
                    value={password}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={toggleShowPassword}
                    style={styles.eyeIcon}>
                    <Icon
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={20}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  style={styles.forgotPasswordContainer}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
{/* 
                <TouchableOpacity
                  onPress={handleRegister}
                  style={{ flexDirection: 'row', marginTop: -10, justifyContent: 'center', marginBottom: 10 }}
                >
                  <Text style={{ marginRight: 5 }}>Don't have an account?</Text>
                  <Text style={{ color: '#3088C7', fontWeight: 'bold' }}>Sign Up</Text>
                </TouchableOpacity> */}

                {/* Login Button */}
                <TouchableOpacity
                  onPress={handleLogin}
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  disabled={isLoading}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <Toast />
    </View>
  );
};

const styles = {
  mainContainer: {
    flex: 1,
    backgroundColor: '#3088C7',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  scrollContainerKeyboardActive: {
    justifyContent: 'flex-start',
    paddingVertical: 20,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  formContainer: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formContainerKeyboardActive: {
    marginTop: 70, // Add some top margin when keyboard is open
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#555',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#F8F8F8',
    height: 50,
  },
  iconContainer: {
    width: 45,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#333',
  },
  eyeIcon: {
    paddingHorizontal: 12,
    height: 50,
    justifyContent: 'center',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 25,
    marginTop: 5,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#3088C7',
  },
  loginButton: {
    backgroundColor: '#000000',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#666666',
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
};

export default LoginScreen;
