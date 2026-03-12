import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
    ScrollView,
      Keyboard,
    Alert,
    TouchableWithoutFeedback,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import Ionicons from 'react-native-vector-icons/Ionicons';
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

export default function QualificationDetails() {
    const navigation = useNavigation();
    const route = useRoute();
    const editData = route.params?.editData;
    const editIndex = route.params?.editIndex;
    const isEditing = !!editData;

    const [qualificationType, setQualificationType] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [institute, setInstitute] = useState('');
    const [note, setNote] = useState('');
    const [completionDate, setCompletionDate] = useState(null);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [fileData, setFileData] = useState(null);
    const [decodedToken, setDecodedToken] = useState(null);
    const [qualificationOptions, setQualificationOptions] = useState([]);

    useEffect(() => {
        fetchQualifications();
    }, []);

    const fetchQualifications = async () => {
        try {
            const token = await AsyncStorage.getItem("authToken");
            if (!token) throw new Error("Auth token not found");
            const decoded = decodeJWT(token);
            setDecodedToken(decoded);

            const response = await fetch(`${BASE_URL}/Master/GetQualification`, {
                headers: { Authorization: token },
            });
            const data = await response.json();

            const filtered = data.filter(q => q.isActive && !q.isDeleted);
            filtered.sort((a, b) => a.qualification1.localeCompare(b.qualification1));

            setQualificationOptions(filtered);
        } catch (error) {
            console.error('Failed to fetch qualifications:', error);
            Alert.alert('Error', 'Unable to load qualifications');
        }
    };

    useEffect(() => {
        if (editData) {
            setQualificationType(editData.qualificationType || '');
            setSpecialization(editData.specialization || '');
            setInstitute(editData.institute || '');
            setNote(editData.note || '');
            if (editData.completionDate) {
                try {
                    setCompletionDate(new Date(editData.completionDate));
                } catch (e) {
                    console.error('Error parsing date:', e);
                    setCompletionDate(null);
                }
            }
            setFileData(editData.fileData || null);
        }
    }, [editData]);

    const handlePickDocument = async () => {
        try {
            const res = await pick({ type: ['application/pdf'] });
            if (res && res[0]) {
                const file = res[0];
                setFileData(file);
                // Alert.alert('Document Selected', `File: ${file.name}`);
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
        if (!qualificationType.trim()) {
            Alert.alert('Error', 'Please select a qualification type');
            return;
        }
        if (!institute.trim()) {
            Alert.alert('Error', 'Institute is required');
            return;
        }
       
        if (!fileData) {
            Alert.alert('Error', 'Please attach a file');
            return;
        }
        if (!decodedToken) {
            Alert.alert('Error', 'Invalid or missing user token');
            return;
        }

        const selectedQualification = qualificationOptions.find(q => q.qualification1 === qualificationType);
        if (!selectedQualification) {
            Alert.alert('Error', 'Invalid qualification selected');
            return;
        }

        const formattedDate = completionDate
            ? completionDate.toISOString().split('T')[0]
            : null;

        const payload = {
            companyId: decodedToken.companyId,
            employeeQualificationId: editData?.employeeQualificationId || 0,
            employeeId: decodedToken.employeeId,
            qualificationId: selectedQualification.qualificationId,
            qualification: qualificationType,
            specialization: specialization || '',
            institute: institute.trim(),
            completionDate: formattedDate,
            note: note.trim(),
            isDeleted: false,
            isActive: true,
            createLoginId: decodedToken.loginId,
            createDate: new Date().toISOString(),
            updateLoginId: decodedToken.loginId,
            updateDate: new Date().toISOString(),
        };

        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${BASE_URL}/Employee/AddUpdateEmployeeQualification`, {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            console.log("post qualification response:", response);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error response:', errorText);
                Alert.alert('Error', 'Failed to save qualification data');
                return;
            }

            const result = await response.json();
            console.log('Qualification save result:', result);

            Alert.alert('Success', isEditing ? 'Qualification updated' : 'Qualification saved');
            navigation.goBack();
            //  navigation.navigate('QualificationDetailsEdit')
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Error', 'Something went wrong while saving');
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
                    {/* Qualification Type */}
                    <Text style={styles.label}>Qualification Type <Text style={{ color: "red" }}>*</Text></Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={qualificationType}
                            onValueChange={(itemValue) => setQualificationType(itemValue)}
                            style={[
                                styles.picker,
                                { color: qualificationType === "" ? "#9ca3af" :"#212529" }, // 👈 dynamic color
                            ]}
                        >
                            <Picker.Item label="Select Qualification" value="" />
                            {qualificationOptions.map((item) => (
                                <Picker.Item
                                    key={item.qualificationId}
                                    label={item.qualification1}
                                    value={item.qualification1}
                                />
                            ))}
                        </Picker>
                    </View>

                    {/* Specialization */}
                    <Text style={styles.label}>Specialization <Text style={{ color: "red" }}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter specialization"
                        placeholderTextColor="#9ca3af"
                        value={specialization}
                        onChangeText={setSpecialization}
                    />

                    {/* Institute */}
                    <Text style={styles.label}>Institute <Text style={{ color: "red" }}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter institute name"
                        placeholderTextColor="#9ca3af"
                        value={institute}
                        onChangeText={setInstitute}
                    />

                    {/* Note */}
                    <Text style={styles.label}>Note</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter note"
                        placeholderTextColor="#9ca3af"
                        value={note}
                        onChangeText={setNote}
                    />

                    {/* Completion Date */}
                    <Text style={styles.label}>Completion Date <Text style={{ color: "red" }}>*</Text></Text>
                    <View style={styles.inputWithIcon}>
                        <TextInput
                            style={{ flex: 1, color: "#212529", }}
                            value={completionDate ? completionDate.toLocaleDateString() : ''}
                            placeholder="Select date"
                            placeholderTextColor="#9ca3af"
                            editable={false}
                        />
                        <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
                            <Ionicons name="calendar-outline" size={wp(5)} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    {datePickerVisible && (
                        <DateTimePicker
                            value={completionDate || new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setDatePickerVisible(false);
                                if (selectedDate) {
                                    setCompletionDate(selectedDate);
                                }
                            }}
                        />
                    )}

                    {/* Attach File */}
                    <Text style={styles.label}>Attach File <Text style={{ color: 'red' }}>*</Text></Text>
                    <TouchableOpacity style={styles.input} onPress={handlePickDocument}>
                        <View style={styles.dateRow}>
                            <Text style={{ color: fileData ? "#212529" : '#9ca3af' }}>
                                {fileData ? fileData.name : 'Tap to attach PDF'}
                            </Text>
                            <Ionicons name="attach-outline" size={wp(5)} color="#374151" />
                        </View>
                    </TouchableOpacity>

                    {/* Save Button */}
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.saveText}>{isEditing ? 'Update' : 'Save'}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: wp(4),
    },
    pickerContainer: {
        height: hp(6),
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#ffffff",
        paddingHorizontal: wp(2),
        marginBottom: hp(1),
        justifyContent: "center",
    },
    picker: {
        height: hp(6.8),
        width: "100%",
      color: "#212529",
    fontSize: wp("4%"),

    },
    label: {
        marginTop: hp(2),
        fontSize: wp('3.5%'),
        color: '#374151',
        fontWeight: '500',
        marginBottom: hp(1),
        marginLeft: wp("2.2%"),

    },
    input: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        paddingHorizontal: wp("3%"),
        height: hp("6%"),
        borderWidth: 1,
         borderColor: "#E5E7EB",
        marginBottom: hp(1),
        color: "#212529",
    fontSize: wp("4%"),

    },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        paddingHorizontal: wp(3),
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginBottom: hp(2),
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
    },
    saveBtn: {
        marginTop: hp(2),
        backgroundColor: '#438AFF',
        paddingVertical: hp(2),
        borderRadius: 8,
        alignItems: 'center',
    },
    saveText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: wp(4.5),
    },
});
