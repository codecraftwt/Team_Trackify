import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Picker } from '@react-native-picker/picker';
import Button from '../Component/Button';
import Ionicons from "react-native-vector-icons/Ionicons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import BASE_URL from "../config/server";
import FancyAlert from './FancyAlert';

const ShiftRequestScreen = () => {
  const navigation = useNavigation();
  const [selectedShift, setSelectedShift] = useState('');
  const [shiftFrom, setShiftFrom] = useState(null);
  const [shiftTo, setShiftTo] = useState(null);
  const [description, setDescription] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [shifts, setShifts] = useState([]);

  const [alertVisible, setAlertVisible] = useState(false);

  // Utility function to format date as DD/MM/YY
 const formatDateDDMMYY = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
    const year = String(date.getFullYear()); // full year
    return `${day}/${month}/${year}`;
  };

 const handleDateChange = (event, selectedDate, type) => {
  if (type === 'from') {
    setShowFromPicker(false);
    if (selectedDate) {
      setShiftFrom(selectedDate);

      // reset shiftTo if it’s earlier than new shiftFrom
      if (shiftTo && selectedDate > shiftTo) {
        setShiftTo(null);
        alert("Shift To date must be after Shift From date.");
      }
    }
  } else {
    setShowToPicker(false);
    if (selectedDate) {
      if (shiftFrom && selectedDate < shiftFrom) {
        alert("Shift To date must be after Shift From date.");
        return;
      }
      setShiftTo(selectedDate);
    }
  }
};


  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch(`${BASE_URL}/Master/GetShifts`, {
          headers: { Authorization: token },
        });

        const json = await response.json();
        if (Array.isArray(json)) setShifts(json);
      } catch (error) {
        // console.error('Shift API error:', error);
      }
    };

    fetchShifts();
  }, []);

  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const cleanToken = token.replace("Bearer ", "");
      const decoded = jwtDecode(cleanToken);

      if (!selectedShift || !shiftFrom || !shiftTo || !description) {
        alert("Please fill in all required fields.");
        return;
      }

      const payload = {
        companyID: parseInt(decoded.CompanyId),
        shiftRequestID: 0,
        shiftID: parseInt(selectedShift),
        shiftFrom: shiftFrom.toISOString(),
        shiftTo: shiftTo.toISOString(),
        description,
        EmployeeID: parseInt(decoded.EmployeeId),
        status: "pending",
        isDeleted: false,
        isActive: true
      };

      console.log("payload",payload);
      

      const response = await axios.post(
        `${BASE_URL}/Master/AddUpdateShiftRequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${cleanToken}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.status === 200) {
        setAlertVisible(true);

        // auto close after 2 seconds and navigate
        setTimeout(() => {
          setAlertVisible(false);
          navigation.navigate("UserTabs", { screen: "Settings" });
        }, 4000); // 2000 ms = 2 seconds
      } else {
        Alert.alert("Error", "Failed to submit shift application.");
      }

    } catch (error) {
      alert("Something went wrong while submitting the shift request.");
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
          {/* Shift Dropdown */}
          <Text style={styles.label}>Shift<Text style={{ color: "red" }}>*</Text></Text>
          <View style={styles.inputContainer}>
            <Picker
              selectedValue={selectedShift}
              onValueChange={(itemValue) => setSelectedShift(itemValue)}
              style={[
                styles.picker,
                { color: selectedShift === "" ? "#9CA3AF" : "#000" }
              ]}
            >
              <Picker.Item label="Select Shift" value="" />
              {shifts.map((shift) => (
                <Picker.Item
                  key={shift.shiftId}
                  label={shift.shiftName}
                  value={shift.shiftId}
                />
              ))}
            </Picker>
          </View>

          {/* Shift From & To */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Shift From<Text style={{ color: "red" }}>*</Text></Text>
              <TouchableOpacity style={styles.datePicker} onPress={() => setShowFromPicker(true)}>
                <Text style={[styles.placeholderText, shiftFrom && styles.selectedDate]}>
                {shiftFrom ? formatDateDDMMYY(shiftFrom) : 'Select Date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.column}>
              <Text style={styles.label}>Shift To<Text style={{ color: "red" }}>*</Text></Text>
              <TouchableOpacity style={styles.datePicker} onPress={() => setShowToPicker(true)}>
                <Text style={[styles.placeholderText, shiftTo && styles.selectedDate]}>
                 {shiftTo ? formatDateDDMMYY(shiftTo) : 'Select Date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Native Pickers */}
          {showFromPicker && (
            <DateTimePicker
              value={shiftFrom || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => handleDateChange(event, date, 'from')}
            minimumDate={new Date()} 
              />
          )}
          {showToPicker && (
            <DateTimePicker
              value={shiftTo || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => handleDateChange(event, date, 'to')}
               minimumDate={shiftFrom || new Date()} 
            />
          )}

          {/* Description */}
          <Text style={styles.label}>Description<Text style={{ color: "red" }}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter"
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
          />
 <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}>
            <Text style={styles.buttonText}>Send for Approval</Text>
          </TouchableOpacity>
          {/* Submit Button */}
          {/* <View style={styles.buttonWrapper}>
            <Button
              title="Send For Approval"
              backgroundColor="#438aff"
              onPress={handleSubmit}
            />
          </View> */}
        </View>

        <FancyAlert
          visible={alertVisible}
          onClose={() => setAlertVisible(false)}
          type="success"
          title="Success"
          message="Shift application submitted successfully."
          showConfirm={false}
          hideButtons
        />
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
};

export default ShiftRequestScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: wp("4%"),
  },
  label: {
    fontSize: Math.max(wp("3.8%"), 14),
    fontWeight: "500",
    marginBottom: hp("0.8%"),
    marginTop: hp("1.5%"),
    color: "#374151",
    marginLeft: wp('3%'),
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: wp("2%"),
    backgroundColor: "#ffffff",
    height: hp("6%"),
    justifyContent: "center",
    paddingHorizontal: wp("2%"),
    marginLeft: wp('1.8%'),

  },
  picker: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: hp("1.5%"),
  },
  column: {
    flex: 1,
    marginHorizontal: wp("1%"),
  },
  datePicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: wp("2%"),
    padding: wp("3%"),
    backgroundColor: "#ffffff",
  },
  selectedDate: {
    color: "#212529",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: wp("2%"),
    padding: wp("3%"),
    backgroundColor: "#ffffff",
    fontSize: wp("4%"),
    textAlignVertical: "top",
    minHeight: hp("10%"),
    color: "#212529",
    marginLeft: wp('1.8%'),

  },
  placeholderText: {
    color: "#9ca3af",
    fontSize: wp("3.8%"),
  },
   button: {
    backgroundColor: '#438AFF',
    borderRadius: wp(2),
    paddingVertical: hp(1.5),
    marginTop: hp("7%"),
    alignItems: 'center',


  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: wp('4%'),
  },
  buttonWrapper: {
    marginTop: hp("0.8%"),
  },
});
