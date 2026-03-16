import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../config/server';
import { useAuth } from '../config/auth-context';
import { CommonActions } from '@react-navigation/native';
import FancyAlert from './FancyAlert';
import NotificationManager from '../Notifications/NotificationManager';
import Icon from 'react-native-vector-icons/MaterialIcons';
 
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setAuthData } = useAuth();

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("danger");
  const [alertTitle, setAlertTitle] = useState("Alert");

  useEffect(() => {
    let timer;
    if (showAlert) {
      timer = setTimeout(() => {
        setShowAlert(false);
      }, 60000);
    }
    return () => clearTimeout(timer);
  }, [showAlert]);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    console.log("BASE_URL", BASE_URL);
    console.log("Login attempt with email:", email?.trim());

    // Validate email and password
    if (!email.trim()) {
      setAlertTitle("Validation Error");
      setAlertMessage("Please enter your email address.");
      setAlertType("danger");
      setShowAlert(true);
      return;
    }

    if (!password.trim()) {
      setAlertTitle("Validation Error");
      setAlertMessage("Please enter your password.");
      setAlertType("danger");
      setShowAlert(true);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAlertTitle("Validation Error");
      setAlertMessage("Please enter a valid email address.");
      setAlertType("danger");
      setShowAlert(true);
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

      console.log("Login---", response);

      const text = await response.text();

      if (!text) {
        setAlertTitle("Login Failed");
        setAlertMessage("Empty response from server.");
        setAlertType("danger");
        setShowAlert(true);
        setIsLoading(false);
        return;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Login API Error: Invalid JSON", err, text);
        setAlertTitle("Login Failed");
        setAlertMessage("Invalid response format from server.");
        setAlertType("danger");
        setShowAlert(true);
        setIsLoading(false);
        return;
      }

      console.log("Login API Response:", data);

      // Check if login was successful (status: 1)
      if (response.ok && data.status === 1 && data.token) {
        const token = data.token;
        const user = data.user;

        // Store user data in auth context
        // Check role_id from API response: 0 = user, 1 = admin
        const userRole = user.role_id === 1 ? 'Admin' : 'user';
        await setAuthData(
          token,
          user._id.toString(),
          user.createdby || '',
          userRole,
          user
        );

        console.log('User Logged In:', {
          name: user.name,
          id: user._id,
          role: userRole,
          roleId: user.role_id,
        });

        // Store additional user info in AsyncStorage if needed
        if (user.name) {
          await AsyncStorage.setItem("userName", user.name);
        }
        if (user.email) {
          await AsyncStorage.setItem("userEmail", user.email);
        }
        if (data.subscriptionStatus) {
          await AsyncStorage.setItem("subscriptionStatus", data.subscriptionStatus);
        }

        // Get and Log the FCM Token
        const fcmToken = await NotificationManager.getFCMToken();
        console.log("🔥 Successfully Logged In. Firebase ID (FCM Token):", fcmToken);

        // Reset navigation stack to the authenticated flow
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{
              name: 'Authenticated',
              params: {
                userRole: userRole,
                userData: user
              }
            }],
          })
        );
      } else {
        // Handle login failure
        setAlertTitle("Login Failed");
        setAlertMessage(data.message || "Invalid email or password.");
        setAlertType("danger");
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Login API Error:', error);
      setAlertTitle("Error");
      setAlertMessage("Something went wrong. Please check your connection and try again.");
      setAlertType("danger");
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Optional: Add a function to handle forgot password
  const handleForgotPassword = () => {
    // Navigate to forgot password screen or show modal
    Alert.alert(
      "Forgot Password",
      "Please contact support to reset your password.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#3088C7" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Container */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/app-icon1-10.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
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

      <FancyAlert
        visible={showAlert}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setShowAlert(false)}
      />
    </View>
  );
};

const styles = {
  mainContainer: {
    flex: 1,
    backgroundColor: '#3088C7',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
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
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 1,
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
    // borderRightWidth: 1,
    // borderRightColor: '#E0E0E0',
    // backgroundColor: '#F0F0F0',
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
