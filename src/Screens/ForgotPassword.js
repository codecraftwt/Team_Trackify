import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Api from '../config/Api';
import {verifyOtp, resetPassword} from '../services/ForgotPasswordService';

const ForgotPassword = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = email, 2 = otp, 3 = reset
  const [isLoading, setIsLoading] = useState(false);

  const showError = (message) => {
    Alert.alert('Error', message || 'Something went wrong');
  };

  const showSuccess = (message) => {
    Alert.alert('Success', message || 'Success');
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      showError('Please enter your email');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await Api.post('/api/users/forgot-password', {
        email: email.trim().toLowerCase(),
      });

      setIsLoading(false);
      
      if (response.data.status === 1) {
        setStep(2);
        showSuccess(response.data.message || 'OTP sent to your email');
      } else {
        showError(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      setIsLoading(false);
      // Handle error response
      if (error.response) {
        showError(error.response.data?.message || 'Failed to send OTP');
      } else if (error.request) {
        showError('Network error. Please check your connection.');
      } else {
        showError('Something went wrong. Please try again.');
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (!email.trim()) {
      showError('Email is missing');
      return;
    }
    if (!otp.trim()) {
      showError('Please enter the OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyOtp(email, otp);
      
      setIsLoading(false);
      
      if (response.status === 1) {
        setStep(3);
        showSuccess(response.message || 'OTP verified successfully');
      } else {
        showError(response.message || 'Failed to verify OTP');
      }
    } catch (error) {
      setIsLoading(false);
      showError(error.message || 'Failed to verify OTP');
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      showError('Email is missing');
      return;
    }
    if (!otp.trim()) {
      showError('OTP is missing');
      return;
    }
    if (!newPassword.trim() || !confirmPassword.trim()) {
      showError('Please enter and confirm your new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetPassword(email, otp, newPassword);
      
      setIsLoading(false);
      
      if (response.status === 1) {
        showSuccess(response.message || 'Password reset successfully');
        navigation.navigate('LoginScreen');
      } else {
        showError(response.message || 'Failed to reset password');
      }
    } catch (error) {
      setIsLoading(false);
      showError(error.message || 'Failed to reset password');
    }
  };

  const renderContent = () => {
    if (step === 1) {
      return (
        <>
          <Text style={styles.subtitle}>
            Enter your registered email address and we will send you an OTP to reset your
            password.
          </Text>
          <View style={styles.inputWrapper}>
            <Icon
              name="email"
              size={20}
              color="#A8A8A8"
              style={styles.icon}
            />
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
          <TouchableOpacity
            onPress={handleSendOtp}
            style={[styles.primaryButton, isLoading && styles.disabledButton]}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? "Sending..." : "Send OTP"}
            </Text>
          </TouchableOpacity>
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <Text style={styles.subtitle}>
            We have sent an OTP to {email}. Please enter it below to verify your identity.
          </Text>
          <View style={styles.inputWrapper}>
            <Icon
              name="email"
              size={20}
              color="#A8A8A8"
              style={styles.icon}
            />
            <TextInput
              style={[styles.input, {color: '#666'}]}
              value={email}
              editable={false}
              placeholder="Email"
              placeholderTextColor="#999"
            />
          </View>
          <View style={styles.inputWrapper}>
            <Icon
              name="confirmation-number"
              size={20}
              color="#A8A8A8"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              onChangeText={setOtp}
              value={otp}
              placeholder="Enter OTP"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={6}
              editable={!isLoading}
            />
          </View>
          <TouchableOpacity
            onPress={handleVerifyOtp}
            style={[styles.primaryButton, isLoading && styles.disabledButton]}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Text>
          </TouchableOpacity>
        </>
      );
    }

    return (
      <>
        <Text style={styles.subtitle}>
          Create a new password for your account.
        </Text>
        <View style={styles.inputWrapper}>
          <Icon
            name="lock"
            size={20}
            color="#A8A8A8"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            onChangeText={setNewPassword}
            value={newPassword}
            placeholder="New Password"
            placeholderTextColor="#999"
            secureTextEntry
            editable={!isLoading}
          />
        </View>
        <View style={styles.inputWrapper}>
          <Icon
            name="lock-outline"
            size={20}
            color="#A8A8A8"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            onChangeText={setConfirmPassword}
            value={confirmPassword}
            placeholder="Confirm New Password"
            placeholderTextColor="#999"
            secureTextEntry
            editable={!isLoading}
          />
        </View>
        <TouchableOpacity
          onPress={handleResetPassword}
          style={[styles.primaryButton, isLoading && styles.disabledButton]}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </Text>
        </TouchableOpacity>
      </>
    );
  };

  const getTitle = () => {
    if (step === 1) return 'Forgot Password';
    if (step === 2) return 'Verify OTP';
    return 'Reset Password';
  };

  return (
    <ScrollView style={{flex: 1, backgroundColor: '#3088C7'}}>
      <View style={styles.scrollContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#3088C7" />
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/app-icon1-10.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.formContainer}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="#2D2D2D" />
            </TouchableOpacity>
            <Text style={styles.title}>{getTitle()}</Text>
            <View style={{width: 24}} />
          </View>
          {renderContent()}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Remember your password?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
              <Text style={styles.footerLink}> Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = {
  scrollContainer: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#3088C7',
    paddingBottom: 80,
  },
  logoContainer: {
    marginBottom: 0,
  },
  formContainer: {
    width: '90%',
    maxWidth: 350,
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  logo: {
    height: 100,
    width: 100,
    resizeMode: 'contain',
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#2D2D2D',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#555',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#A8D8FF',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingLeft: 8,
    backgroundColor: '#F8F8F8',
  },
  input: {
    flex: 1,
    height: 48,
    paddingLeft: 8,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#333',
  },
  icon: {
    marginRight: 8,
  },
  primaryButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'Poppins-Bold',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#555',
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#4A90E2',
  },
};

export default ForgotPassword;