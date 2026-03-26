// EmailVerificationScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { verifyEmailOtp, resendEmailOtp } from '../config/AdminService';

const EmailVerificationScreen = ({ navigation, route }) => {
  const { email, userData } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (text, index) => {
    if (text.length > 1) {
      text = text[text.length - 1];
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      const response = await verifyEmailOtp(email, otpString);

      if (response.success) {
        // Alert.alert(
        //   'Success',
        //   'Email verified successfully!',
        //   [
        //     {
        //       text: 'OK',
        //       onPress: () => {
        //         // Navigate to login or dashboard based on user type
        //         if (userData?.role_id === 1) {
        //           // For admin users, navigate to admin dashboard
        //           navigation.replace('AdminTabs');
        //         } else {
        //           // For regular users, navigate to user dashboard
        //           navigation.replace('UserTabs');
        //         }
        //       },
        //     },
        //   ]
        // );
        Alert.alert(
  'Success',
  'Email verified successfully!',
  [
    {
      text: 'OK',
      onPress: () => {
        navigation.replace('LoginScreen');
      },
    },
  ]
);
      } else {
        Alert.alert('Verification Failed', response.message);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) {
      Alert.alert('Please wait', `Please wait ${timer} seconds before resending`);
      return;
    }

    setResendLoading(true);

    try {
      const response = await resendEmailOtp(email);

      if (response.success) {
        Alert.alert('Success', 'OTP resent successfully');
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();

        // Restart timer
        const interval = setInterval(() => {
          setTimer((prevTimer) => {
            if (prevTimer <= 1) {
              clearInterval(interval);
              setCanResend(true);
              return 0;
            }
            return prevTimer - 1;
          });
        }, 1000);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a verification code to
        </Text>
        <Text style={styles.emailText}>{email}</Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={styles.otpInput}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.disabledButton]}
          onPress={handleVerifyOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify Email</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          {canResend ? (
            <TouchableOpacity onPress={handleResendOtp} disabled={resendLoading}>
              <Text style={styles.resendLink}>
                {resendLoading ? 'Sending...' : 'Resend'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>Resend in {timer}s</Text>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    marginTop: Platform.OS === 'ios' ? 60 : 20,
    marginLeft: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 5,
    marginBottom: 30,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#fff',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  timerText: {
    fontSize: 14,
    color: '#999',
  },
});

export default EmailVerificationScreen;