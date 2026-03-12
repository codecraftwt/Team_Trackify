import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InputField from '../../src/Component/InputField';
import Button from '../../src/Component/Button';
import Title from '../../src/Component/Title';
import BASE_URL from '../config/server';
import { useAuth } from '../config/auth-context';
import { CommonActions } from '@react-navigation/native';

const OTPScreen = ({ navigation, route }) => {
    const { mobileNumber } = route.params;
    const [otp, setOtp] = useState('');
    const { setAuthData } = useAuth();

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) { // Assuming 6-digit OTP
            Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP.');
            return;
        }
        try {
            const response = await fetch(`${BASE_URL}/Auth/VerifyOTP`, { // Assuming a new endpoint for verifying OTP
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mobileNo: mobileNumber,
                    otp: otp,
                }),
            });

            const text = await response.text();
            if (!text) {
                console.error("Empty response from server");
                Alert.alert("Verification Failed", "Server returned no data. Please try again.");
                return;
            }
            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                console.error("Verify OTP API Error: Invalid JSON", err, text);
                Alert.alert("Verification Failed", "Invalid response format from server.");
                return;
            }

            console.log("Verify OTP API Response:", data);

            if (response.ok && data.token) {
                const role = data.roleDetails?.role1;
                if (role) {
                    await setAuthData(data.token, data.userDetails.userId.toString(), data.userDetails.companyId.toString(), role);
                    console.log('User Role:', role);
                    await checkTodayAttendance(); // Call your attendance check here

                    // Reset navigation stack to the authenticated flow
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'Authenticated', params: { userRole: role } }],
                        })
                    );
                } else {
                    Alert.alert('Login Failed', 'User role not found.');
                }
            } else {
                Alert.alert('Verification Failed', data.message || 'Invalid OTP or server error.');
            }
        } catch (error) {
            console.error('Verify OTP API Error:', error);
            Alert.alert('Error', 'Something went wrong. Please try again later.');
        }
    };

    const checkTodayAttendance = async () => {
        try {
            const authToken = await AsyncStorage.getItem("authToken")
            const userId = await AsyncStorage.getItem("userId")
            const companyId = await AsyncStorage.getItem("companyId")
            if (!authToken || !userId || !companyId) return
            const today = new Date().toISOString().split("T")[0]
            const response = await fetch(`${BASE_URL}/Attendance/GetTodayAttendance`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: authToken,
                },
                body: JSON.stringify({
                    employeeId: Number.parseInt(userId),
                    companyId: Number.parseInt(companyId),
                    date: today,
                }),
            })
            if (response.ok) {
                const attendanceData = await response.json()
                if (attendanceData.inTime && !attendanceData.outTime) {
                    await AsyncStorage.setItem("isPunchedIn", "true")
                    await AsyncStorage.setItem("punchInTime", attendanceData.inTime)
                } else if (attendanceData.outTime) {
                    await AsyncStorage.setItem("isPunchedIn", "false")
                    await AsyncStorage.setItem("punchInTime", attendanceData.inTime)
                    await AsyncStorage.setItem("punchOutTime", attendanceData.outTime)
                }
            }
        } catch (error) {
            console.error("Error checking today attendance:", error)
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoiding}
            >
                <View style={styles.container}>
                    <View style={styles.innerContainer}>
                        <Title text="Verify OTP" />
                        <Title text={`Enter the OTP sent to ${mobileNumber}`} isSubtitle />
                        <InputField
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="number-pad"
                            maxLength={6}
                        />
                        <View style={{ marginTop: -30 }}>
                            <Button
                                backgroundColor="#0189c7"
                                title="Verify OTP"
                                onPress={handleVerifyOTP}
                            />
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default OTPScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardAvoiding: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        gap: 5,
    },
});