// import React, { useEffect, useState } from 'react';
// import { View, StyleSheet, KeyboardAvoidingView, Platform, useWindowDimensions, Alert, } from 'react-native';
// import { SafeAreaView } from "react-native-safe-area-context"
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import InputField from '../../src/Component/InputField';
// import Button from '../../src/Component/Button';
// import Title from '../../src/Component/Title';
// import BASE_URL from '../config/server';
// import { useAuth } from '../config/auth-context';
// import { CommonActions } from '@react-navigation/native'; // Import CommonActions
// import FancyAlert from './FancyAlert';
// // 1. Import NotificationManager
// import NotificationManager from '../Notifications/NotificationManager'; // Adjust the path as necessary

// const LoginScreen = ({ navigation }) => {
//     const [mobileNumber, setMobileNumber] = useState('');
//     const { setAuthData } = useAuth(); // Use setAuthData from context

//     const [showAlert, setShowAlert] = useState(false);
//     const [alertMessage, setAlertMessage] = useState("");
//     const [alertType, setAlertType] = useState("danger");
//     const [alertTitle, setAlertTitle] = useState("Alert");

//     useEffect(() => {
//         let timer;
//         if (showAlert) {
//             timer = setTimeout(() => {
//                 setShowAlert(false);
//             }, 60000); // 1 min = 60000ms
//         }
//         return () => clearTimeout(timer);
//     }, [showAlert]);

//     const handleSendOTP = async () => {
//         console.log("BASE_URL",BASE_URL);

//         if (mobileNumber.length !== 10) {
//             setAlertTitle("Invalid Number");
//             setAlertMessage("Please enter a valid 10-digit mobile number.");
//             setAlertType("danger");
//             setShowAlert(true);
//             return;
//         }
//         try {
//             const response = await fetch(`${BASE_URL}/Auth/MobLogin`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     mobileNo: mobileNumber,
//                 }),
//             });
//             const text = await response.text();
//             if (!text) {
//                 // console.error("Empty response from server");
//                 setAlertTitle("Login Failed");
//                 setAlertMessage("Please enter a valid mobile number.");
//                 setAlertType("danger");
//                 setShowAlert(true);
//                 return;
//             }
//             let data;
//             try {
//                 data = JSON.parse(text);
//             } catch (err) {
//                 console.error("Login API Error: Invalid JSON", err, text);
//                 setAlertTitle("Login Failed");
//                 setAlertMessage("Invalid response format from server.");
//                 setAlertType("danger");
//                 setShowAlert(true);
//                 return;
//             }
//             console.log("Login API Response:", data);
//             const token = data.token;
//             const refreshToken = data.refreshToken;
//             const user = data.userDetails;

//             if (response.ok && data.token) {
//                 const role = data.roleDetails?.role1;
//                 if (role) {
//                     // Use setAuthData from context to store all auth info
//                     await setAuthData(token, user.userId.toString(), user.companyId.toString(), role);
//                     console.log('User Role:', role);
//                     if (data.companyName) {
//                         await AsyncStorage.setItem("companyName", data.companyName);
//                         console.log("Company Name stored:", data.companyName);
//                     }
//                     await checkTodayAttendance();

//                     // --- START OF NEW CODE ---
//                     // 2. Get and Log the FCM Token (FirebaseID)
//                     const fcmToken = await NotificationManager.getFCMToken();
//                     console.log("🔥 Successfully Logged In. Firebase ID (FCM Token):", fcmToken);
//                     // --- END OF NEW CODE ---

//                     // Reset navigation stack to the authenticated flow
//                     navigation.dispatch(
//                         CommonActions.reset({
//                             index: 0,
//                             routes: [{ name: 'Authenticated', params: { userRole: role } }],
//                         })
//                     );
//                 } else {
//                     setAlertTitle("Login Failed");
//                     setAlertMessage("User role not found.");
//                     setAlertType("danger");
//                     setShowAlert(true);
//                 }
//             } else {
//                 setAlertTitle("Login Failed");
//                 setAlertMessage("Invalid credentials or server error.");
//                 setAlertType("danger");
//                 setShowAlert(true);
//             }
//         } catch (error) {
//             console.error('Login API Error:', error);
//             setAlertTitle("Error");
//             setAlertMessage("Something went wrong. Please try again later.");
//             setAlertType("danger");
//             setShowAlert(true);
//         }
//     };

//     // ... (rest of the LoginScreen component remains the same)

//     const checkTodayAttendance = async () => {
//         // ... (checkTodayAttendance implementation)
//     }

//     return (
//         <SafeAreaView style={styles.safeArea}>
//             <KeyboardAvoidingView
//                 behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//                 style={styles.keyboardAvoiding}
//             >
//                 <View style={styles.container}>
//                     <View style={styles.innerContainer}>
//                         <Title text="Log In" color="#000" />
//                         <Title text="Please enter your valid number" isSubtitle color="red" />
//                         <InputField
//                             value={mobileNumber}
//                             onChangeText={setMobileNumber}
//                             keyboardType="phone-pad"
//                         />
//                         <View style={{ marginTop: -45 }}>
//                             <Button
//                                 backgroundColor="#438aff"
//                                 title="Login"
//                                 onPress={handleSendOTP}
//                             />
//                         </View>
//                     </View>
//                 </View>
//             </KeyboardAvoidingView>

//             <FancyAlert
//                 visible={showAlert}
//                 title={alertTitle}
//                 message={alertMessage}
//                 type={alertType}
//                 onClose={() => setShowAlert(false)}
//             // hideButtons

//             />

//         </SafeAreaView>
//     );
// };

// export default LoginScreen;

// const styles = StyleSheet.create({
//     safeArea: {
//         flex: 1,
//         backgroundColor: '#f8f9fa',
//     },
//     keyboardAvoiding: {
//         flex: 1,
//     },
//     container: {
//         flex: 1,
//         paddingHorizontal: 20,
//         justifyContent: 'center',
//     },
//     innerContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         gap: 5,
//     },
// });
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, useWindowDimensions, Alert, } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context"
import AsyncStorage from '@react-native-async-storage/async-storage';
import InputField from '../../src/Component/InputField';
import Button from '../../src/Component/Button';
import Title from '../../src/Component/Title';
import BASE_URL from '../config/server';
import { useAuth } from '../config/auth-context';
import { CommonActions } from '@react-navigation/native';
import FancyAlert from './FancyAlert';
import NotificationManager from '../Notifications/NotificationManager';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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

    const handleLogin = async () => {
        console.log("BASE_URL", BASE_URL);

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
                await setAuthData(
                    token, 
                    user._id.toString(), 
                    user.createdby || '', 
                    user.role || 'user'
                );
                
                console.log('User Logged In:', user.name);
                
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
                                userRole: user.role || 'user',
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
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoiding}
            >
                <View style={styles.container}>
                    <View style={styles.innerContainer}>
                        <Title text="Welcome Back" color="#000" />
                        <Title text="Please enter your credentials to login" isSubtitle color="red" />
                        
                        {/* Email Input Field - No character limit */}
                        <InputField
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholder="Enter your email"
                            editable={!isLoading}
                        />
                        
                        {/* Password Input Field - No character limit */}
                        <InputField
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={true}
                            placeholder="Enter your password"
                            editable={!isLoading}
                        />
                        
                        {/* Forgot Password Link */}
                        <View style={styles.forgotPasswordContainer}>
                            <Button
                                backgroundColor="transparent"
                                title="Forgot Password?"
                                onPress={handleForgotPassword}
                                textStyle={styles.forgotPasswordText}
                            />
                        </View>
                        
                        {/* Login Button */}
                        <View style={styles.buttonContainer}>
                            <Button
                                backgroundColor="#438aff"
                                title={isLoading ? "Logging in..." : "Login"}
                                onPress={handleLogin}
                                disabled={isLoading}
                            />
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <FancyAlert
                visible={showAlert}
                title={alertTitle}
                message={alertMessage}
                type={alertType}
                onClose={() => setShowAlert(false)}
            />
        </SafeAreaView>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
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
    buttonContainer: {
        marginTop: 10,
    },
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginTop: -30,
        marginBottom: 10,
    },
    forgotPasswordText: {
        color: '#438aff',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});
