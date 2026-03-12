import { useNavigation, useRoute } from "@react-navigation/native"
import { useState, useEffect } from "react"
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Keyboard,
    Alert,
    TouchableWithoutFeedback,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DateTimePickerModal from "react-native-modal-datetime-picker"
import Ionicons from "react-native-vector-icons/Ionicons"
import { pick } from '@react-native-documents/picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { Buffer } from "buffer";
import BASE_URL from '../../config/server';

global.Buffer = global.Buffer || Buffer;

const decodeJWT = (token) => {
    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
        console.log("Decoded JWT Payload:", decoded);
        return decoded;
    } catch (e) {
        console.log("JWT decode error", e);
        return null;
    }
};

const ExperienceDetails = () => {
    const navigation = useNavigation()
    const route = useRoute()
    const editData = route.params?.editData
    const editIndex = route.params?.editIndex
    const isEditing = !!editData
    const [companyName, setCompanyName] = useState("")
    const [jobTitle, setJobTitle] = useState("")
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [relevantExperience, setRelevantExperience] = useState("")
    const [experienceInMonths, setExperienceInMonths] = useState("")
    const [jobDescription, setJobDescription] = useState("")
    const [isFromDatePickerVisible, setFromDatePickerVisible] = useState(false)
    const [isToDatePickerVisible, setToDatePickerVisible] = useState(false)
    const [fileData, setFileData] = useState(null)
    const [decodedToken, setDecodedToken] = useState(null);
    const [employeeId, setEmployeeId] = useState(null);
    // If editing, populate the form with existing data
    useEffect(() => {
        if (editData) {
            setCompanyName(editData.companyName || "")
            setJobTitle(editData.jobTitle || "")

            // Handle date conversion
            if (editData.fromDate) {
                setFromDate(editData.fromDate instanceof Date ?
                    editData.fromDate : new Date(editData.fromDate))
            }

            if (editData.toDate) {
                setToDate(editData.toDate instanceof Date ?
                    editData.toDate : new Date(editData.toDate))
            }

            setRelevantExperience(editData.relevantExperience || "")
            setExperienceInMonths(editData.experienceInMonths?.toString() || "")
            setJobDescription(editData.jobDescription || "")
            setFileData(editData.fileData || null)
        }
    }, [editData])

    const handleFromDateConfirm = (date) => {
        setFromDate(date)
        setFromDatePickerVisible(false)
    }

    const handleToDateConfirm = (date) => {
        setToDate(date)
        setToDatePickerVisible(false)
    }

    const handlePickDocument = async () => {
        try {
            const res = await pick({
                type: ['application/pdf'],
            });

            if (res && res[0]) {
                const file = res[0];
                setFileData(file);
                Alert.alert('Document Selected', `File: ${file.name}`);
            }
        } catch (err) {
            if (err.code === 'DOCUMENT_PICKER_CANCELED') {
                console.log('User cancelled document picker');
            } else {
                console.error('Document pick error:', err);
                Alert.alert('Error', 'Failed to pick document');
            }
        }
    };

    const handleSave = async () => {
        if (!companyName.trim() || !jobTitle.trim() || !fromDate) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (!fileData) {
            Alert.alert('Error', 'Please attach a file');
            return;
        }

        try {
            const token = await AsyncStorage.getItem("authToken");
            if (!token) throw new Error("Auth token not found");

            const decoded = decodeJWT(token);
            const employeeId = decoded?.EmployeeId || 0;
            const companyId = decoded?.CompanyId || 0;
            const loginId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
            const currentDate = new Date().toISOString();

            // Format date to yyyy-MM-dd
            const formatDateObject = (date) => {
                const d = new Date(date);
                return d.toISOString().split('T')[0]; // returns "YYYY-MM-DD"
            };

            const payload = {
                companyId,
                employeeExperienceId: editData?.employeeExperienceId || 0,
                employeeId,
                companyName,
                jobTitle,
                fromDate: formatDateObject(fromDate),
                toDate: toDate ? formatDateObject(toDate) : "",
                isRelevant: relevantExperience === "Yes" ? "y" : "n", // ensure "Yes"/"No" or blank
                experience: parseInt(experienceInMonths || "0"),
                jobDescription,
                isDeleted: false,
                isActive: true,
                createLoginId: loginId,
                createDate: currentDate,
                updateLoginId: loginId,
                updateDate: currentDate,
            };
            console.log("Final Payload:", JSON.stringify(payload, null, 2));

            const response = await fetch(`${BASE_URL}/Employee/AddUpdateEmployeeExperience`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                },
                body: JSON.stringify(payload),
            });

            console.log("post qualification response:", response);
            const text = await response.text();
            const result = text ? JSON.parse(text) : {};

            if (response.ok) {
                Alert.alert("Success", "Experience saved successfully", [
                    { text: "OK", onPress: () => navigation.goBack() },
                ]);
            } else {
                console.error("API Error:", result);
                Alert.alert("Error", result.title || "Something went wrong");
            }
        } catch (error) {
            console.error("Save error:", error);
            Alert.alert("Error", "Failed to save experience. Please try again.");
        }
    };





    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAwareScrollView
                style={{ flex: 1, backgroundColor: "#f8f9fa" }}
                contentContainerStyle={{ flexGrow: 1 }}
                extraScrollHeight={50}   // 👈 ensures button is visible
                enableOnAndroid={true}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.container}>
                    <Text style={styles.label}>Company Name <Text style={{ color: "red" }}>*</Text></Text>
                    <TextInput style={styles.input} placeholder="Type here" placeholderTextColor="#9ca3af" value={companyName} onChangeText={setCompanyName} />

                    <Text style={styles.label}>Job Title <Text style={{ color: "red" }}>*</Text></Text>
                    <TextInput style={styles.input} placeholder="Type here" placeholderTextColor="#9ca3af" value={jobTitle} onChangeText={setJobTitle} />

                    <View style={styles.dateRow}>
                        <View style={styles.dateColumn}>
                            <Text style={styles.label}>From Date <Text style={{ color: "red" }}>*</Text></Text>
                            <TouchableOpacity style={styles.dateInput} onPress={() => setFromDatePickerVisible(true)}>
                                <Text style={[
                                    styles.dateText,
                                    { color: fromDate ? "#212529" : "#9ca3af" } // 👈 placeholder gray if no date
                                ]}>{fromDate ? fromDate.toLocaleDateString() : "Select date"}</Text>
                                <Ionicons name="calendar" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.dateColumn}>
                            <Text style={styles.label}>To Date <Text style={{ color: "red" }}>*</Text></Text>
                            <TouchableOpacity style={styles.dateInput} onPress={() => setToDatePickerVisible(true)}>
                                <Text style={[
                                    styles.dateText,
                                    { color: fromDate ? "#212529" : "#9ca3af" } // 👈 placeholder gray if no date
                                ]}>{toDate ? toDate.toLocaleDateString() : "Select date"}</Text>
                                <Ionicons name="calendar" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.label}>Relevant Experience <Text style={{ color: "red" }}>*</Text></Text>
                    <View style={styles.radioGroup}>
                        <TouchableOpacity
                            style={styles.radioButton}
                            onPress={() => setRelevantExperience("Yes")}
                        >
                            <View style={styles.radioCircle}>
                                {relevantExperience === "Yes" && <View style={styles.selectedRb} />}
                            </View>
                            <Text style={styles.radioText}>Yes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.radioButton}
                            onPress={() => setRelevantExperience("No")}
                        >
                            <View style={styles.radioCircle}>
                                {relevantExperience === "No" && <View style={styles.selectedRb} />}
                            </View>
                            <Text style={styles.radioText}>No</Text>
                        </TouchableOpacity>
                    </View>


                    <Text style={styles.label}>Experience (In Years) <Text style={{ color: "red" }}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Type here"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                        value={experienceInMonths}
                        onChangeText={setExperienceInMonths}
                    />

                    <Text style={styles.label}>Job Description <Text style={{ color: "red" }}>*</Text></Text>
                    <TextInput style={styles.input} placeholder="Type here" placeholderTextColor="#9ca3af" value={jobDescription} onChangeText={setJobDescription} />

                    <Text style={styles.attachlabel}>
                        Attach File<Text style={{ color: "red" }}>*</Text>
                    </Text>

                    <View style={styles.attachmentContainer}>
                        <Text style={{ flex: 1, color: fileData ? '#212529' : '#9ca3af' }}>
                            {fileData ? fileData.name : 'Tap to attach PDF'}
                        </Text>
                        <TouchableOpacity onPress={handlePickDocument} style={styles.iconWrapper}>
                            <Ionicons name="attach" size={20} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>{isEditing ? 'Update' : 'Save'}</Text>
                    </TouchableOpacity>

                    <DateTimePickerModal
                        isVisible={isFromDatePickerVisible}
                        mode="date"
                        onConfirm={handleFromDateConfirm}
                        onCancel={() => setFromDatePickerVisible(false)}
                        
                    />

                    <DateTimePickerModal
                        isVisible={isToDatePickerVisible}
                        mode="date"
                        onConfirm={handleToDateConfirm}
                        onCancel={() => setToDatePickerVisible(false)}
                         minimumDate={fromDate || undefined}
                    />
                </View>
            </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>

    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: wp('4%'),
        backgroundColor: '#f8f9fa',
    },
    label: {
        fontSize: wp('3.5%'),
        color: '#374151',
        fontWeight: '500',
        marginBottom: hp('1%'),
        marginLeft: wp('2.5%'),
    },
    input: {
        borderColor: "#E5E7EB",
        borderWidth: 1,
        borderRadius: wp('2%'),
        marginBottom: hp('2%'),
        paddingLeft: wp('2.5%'),
        fontSize: wp('4%'),
        backgroundColor: '#ffffff',
       color: "#212529",
    },
    dateRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: wp('2.5%'),
        marginBottom: hp('1.5%'),
    },
    dateColumn: {
        flex: 1,
    },
    dateInput: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#E5E5E5",
        borderRadius: wp('2%'),
        backgroundColor: "#ffffff",
        paddingVertical: hp('1.2%'),
        paddingHorizontal: wp('2.5%'),
    },
    dateText: {
        color: "#000",
        fontSize: wp('4%'),
    },
    radioGroup: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: hp('2%'),
        marginLeft: wp('2.5%'),
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: wp('5%'),
    },
    radioCircle: {
        height: wp('4.5%'),
        width: wp('4.5%'),
        borderRadius: wp('2.25%'),
        borderWidth: 2,
        borderColor: '#438aff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: wp('2%'),
    },
    selectedRb: {
        width: wp('2.5%'),
        height: wp('2.5%'),
        borderRadius: wp('1.25%'),
        backgroundColor: '#438aff',
    },
    radioText: {
        fontSize: wp('4%'),
        color: '#333',
    },

    attachlabel: {
        fontSize: wp('3.5%'),
        fontWeight: "500",
        color: "gray",
        marginTop: hp('1%'),
        marginBottom: hp('1%'),
        marginLeft: wp('2.5%'),
    },
    attachmentContainer: {
        height: hp(6.8),
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E5E5",
        borderRadius: wp('2%'),
        backgroundColor: "#ffffff",
        paddingHorizontal: wp('2.5%'),
        marginBottom: hp('1.5%'),
    },
    attachmentInput: {
        flex: 1,
        color: "#000",
        fontSize: wp('4%'),
    },
    iconWrapper: {
        paddingHorizontal: wp('2%'),
        paddingVertical: hp('1%'),
    },
    saveButton: {
        backgroundColor: "#438aff",
        paddingVertical: hp('2%'),
        borderRadius: wp('2.5%'),
        alignItems: "center",
        marginTop: hp('2%'),
    },
    saveButtonText: {
        color: "white",
        fontSize: wp('4.5%'),
        fontWeight: "600",
    },
});


export default ExperienceDetails