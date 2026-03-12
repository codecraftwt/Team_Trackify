import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { pick } from '@react-native-documents/picker';
import BASE_URL from "../config/server"
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode"
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import FancyAlert from './FancyAlert';

const decodeJWT = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (e) {
    console.log("JWT decode error", e);
    return null;
  }
};

const LeaveApproval = () => {
  const navigation = useNavigation();
  const scrollRef = useRef(null);
  const [leaveType, setLeaveType] = useState('');
  const [shiftTime, setShiftTime] = useState('');
  const [applicationno, setapplicationno] = useState('');

  const [reason, setreason] = useState('');
  const [status, setstatus] = useState('');

  const [attachment, setAttachment] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [applicationDate, setApplicationDate] = useState(new Date());
  const [showApplicationDatePicker, setShowApplicationDatePicker] = useState(false);


  const [showFromDate, setShowFromDate] = useState(false);
  const [showToDate, setShowToDate] = useState(false);
  const [isFullDay, setIsFullDay] = useState(true);
  const [toDateSelected, setToDateSelected] = useState(false);
  const [fileData, setFileData] = useState(null);
  const [monthsList, setMonthsList] = useState([]);
  const [selectedMonthId, setSelectedMonthId] = useState('');
  const [yearsList, setYearsList] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [alertVisible, setAlertVisible] = useState(false);

  const formatDateDDMMYY = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
    const year = String(date.getFullYear()); // full year
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const generate10DigitApplicationNo = () => {

      const timestamp = Date.now().toString();

      const timePart = timestamp.slice(-6);

      const randomPart = Math.floor(1000 + Math.random() * 9000);

      return timePart + randomPart;
    };

    setapplicationno(generate10DigitApplicationNo());
  }, []);


  useEffect(() => {
    if (fromDate && monthsList.length && yearsList.length) {
      // Get month number (1-12)
      const monthNumber = fromDate.getMonth() + 1;
      const yearNumber = fromDate.getFullYear();

      const monthObj = monthsList.find(m => m.monthNumber === monthNumber || m.monthId === monthNumber);
      if (monthObj) setSelectedMonthId(monthObj.monthId);

      const yearObj = yearsList.find(y => y.yearLabel == yearNumber);
      if (yearObj) setSelectedYearId(yearObj.yearId);
    }
  }, [fromDate, monthsList, yearsList]);

  const onFromDateChange = (event, selectedDate) => {
    setShowFromDate(false); // Hide first

    if (event.type === 'set' && selectedDate) {
      setFromDate(selectedDate);

      // reset To Date if it's before new From Date
      if (toDate && selectedDate > toDate) {
        setToDate(null);
        setToDateSelected(false);
        Alert.alert("Invalid Date", "Leave To Date must be after Leave From Date.");
      }
    }
  };
  const onToDateChange = (event, selectedDate) => {
    setShowToDate(false); // Always hide picker first

    if (event.type === 'set' && selectedDate) {
      if (fromDate && selectedDate < fromDate) {
        Alert.alert("Invalid Date", "Leave To Date must be after Leave From Date.");
        return;
      }
      setToDate(selectedDate);
      setToDateSelected(true);
    }
  };


  useEffect(() => {
    const fetchMonths = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const companyId = await AsyncStorage.getItem("companyId")
        const userId = await AsyncStorage.getItem("userId")


        const cleanToken = token?.replace("Bearer ", "") || "";

        const decoded = jwtDecode(cleanToken)
        const employeeID = Number(decoded?.EmployeeId || userId)

        const response = await fetch(`${BASE_URL}/Master/GetMonths`, {
          headers: {
            Authorization: token,
          },
        });

        const data = await response.json();
        // console.log('get months:', response);

        if (response.ok && Array.isArray(data)) {
          // Remove duplicates by month name (month1)
          const uniqueMonths = data.filter(
            (value, index, self) =>
              index === self.findIndex((m) => m.month1 === value.month1)
          );
          setMonthsList(uniqueMonths);
        }

        else {
          console.warn('Unexpected GetMonths data format:', data);
        }
      } catch (error) {
        console.error('Error fetching months:', error);
      }
    };

    fetchMonths();
  }, []);

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');

        const response = await fetch(`${BASE_URL}/Master/GetYears`, {
          headers: {
            Authorization: token,
          },
        });

        const data = await response.json();

        // console.log('Years data:', data);

        if (Array.isArray(data)) {
          const activeYears = data.filter(year => year.isActive && !year.isDeleted);
          setYearsList(activeYears);
        } else {
          console.warn('Unexpected GetYears data format:', data);
        }
      } catch (error) {
        console.error('Error fetching years:', error);
      }
    };

    fetchYears();
  }, []);

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');

        const response = await fetch(`${BASE_URL}/Leave/GetLeaveTypes`, {
          headers: {
            Authorization: token,
          },
        });

        const data = await response.json();
        // console.log("Leave Types:", data);

        if (Array.isArray(data)) {
          const activeTypes = data.filter(item => item.isActive && !item.isDeleted);
          setLeaveTypes(activeTypes);
        } else {
          console.warn('Unexpected GetLeaveTypes data format:', data);
        }
      } catch (error) {
        console.error('Error fetching leave types:', error);
      }
    };

    fetchLeaveTypes();
  }, []);

  const calculateDuration = () => {
    if (!fromDate) return "0 day";

    if (isFullDay) {
      // If only From Date is selected, it's 1 day
      if (fromDate && !toDate) {
        return "1 day";
      }

      if (fromDate && toDate) {
        const diffTime = toDate.setHours(0, 0, 0, 0) - fromDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
        return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
      }

      return "0 day";
    } else {
      // Half Day
      return "0.5 Day"; // ✅ clearer than "6 hour"
    }
  };


  const handleSubmit = async () => {
    if (!leaveType) {
      Alert.alert("Validation Error", "Please select a Leave Type.");
      return;
    }

    if (!fromDate) {
      Alert.alert("Validation Error", "Please select Leave From date.");
      return;
    }

    if (isFullDay && !toDate) {
      Alert.alert("Validation Error", "Please select Leave To date.");
      return;
    }

    if (!isFullDay && !shiftTime) {
      Alert.alert("Validation Error", "Please select Shift Time for Half Day leave.");
      return;
    }

    if (toDate && fromDate > toDate) {
      Alert.alert("Validation Error", "Leave To date cannot be before Leave From date.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      const companyId = await AsyncStorage.getItem("companyId");
      const cleanToken = token?.replace("Bearer ", "") || "";
      const decoded = jwtDecode(cleanToken);
      const employeeId = Number(decoded?.EmployeeId);
      const applicationDate = new Date();

      // Convert JS Date to required format
      const toDateObj = isFullDay ? toDate : fromDate;

      const formatDate = (date) => ({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      });

      const formatDateISO = (date) => date.toISOString();

      const payload = {
        companyId: Number(companyId),
        yearId: selectedYearId,
        monthId: selectedMonthId,
        applicationId: 0,
        applicationNo: applicationno,
        applicationDate: applicationDate?.toISOString().split("T")[0],
        employeeId: employeeId,
        leaveTypeId: Number(leaveType),
        fromDate: fromDate?.toISOString().split("T")[0],
        toDate: toDate?.toISOString().split("T")[0],
        reason: reason,
        status: "pending",
        isDeleted: false,
        isActive: true,
      };

      console.log("Submitting leave application:", payload);
      console.log('leave post:', response);


      const response = await axios.post(
        `${BASE_URL}/Leave/AddUpdateLeaveApplications`,
        payload,
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json"
          }
        }
      );
      console.log("Submitting leave application:", payload);
      console.log('leave post:', response);

      console.log('leave request:', response);

      if (response.status === 200) {
        setAlertVisible(true);

        // auto close after 2 seconds and navigate
        setTimeout(() => {
          setAlertVisible(false);
          navigation.navigate("UserTabs", { screen: "Settings" });
        }, 4000); // 2000 ms = 2 seconds
      } else {
        Alert.alert("Error", "Failed to submit leave application.");
      }


    } catch (error) {
      console.error("Submission error:", error);
      Alert.alert("Error", "Something went wrong during submission.");
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
          {/* {/ Full Day / Half Day /} */}
          <View style={styles.radioGroup}>
            <TouchableOpacity onPress={() => setIsFullDay(true)} style={styles.radioButton}>
              <View style={[styles.radioCircle, isFullDay && styles.radioCircleSelected]}>
                {isFullDay && <View style={styles.radioDot} />}
              </View>
              <Text
                style={[
                  styles.radioText,
                  isFullDay && styles.radioTextSelected, // 👈 Apply selected style
                ]}
              >Full Day</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsFullDay(false)} style={styles.radioButton}>
              <View style={[styles.radioCircle, !isFullDay && styles.radioCircleSelected]}>
                {!isFullDay && <View style={styles.radioDot} />}
              </View>
              <Text
                style={[
                  styles.radioText,
                  !isFullDay && styles.radioTextSelected, // 👈 Apply selected style
                ]}
              >Half Day</Text>
            </TouchableOpacity>

            {/* <Text style={{ fontWeight: '500', fontSize: wp('3.5%'), color: '#000' }}>
              Application No: {applicationno}
            </Text> */}
          </View>

          {/* <View style={styles.dateRow}>
            <View style={styles.inputBox}>
              <Text style={styles.label}>Application Date</Text>
              <TouchableOpacity onPress={() => setShowApplicationDatePicker(true)} style={styles.dateInput}>
                <Text style={{ color: applicationDate ? '#000' : '#9CA3AF' }}>
                  {applicationDate.toDateString()}
                </Text>
                <Icon name="calendar-outline" size={20} color="#374151" />
              </TouchableOpacity>

            </View>

            <View style={styles.inputBox}>
              <Text style={styles.label}>Application No.</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor="#9CA3AF"
                placeholder="Enter"
                value={applicationno}
                onChangeText={setapplicationno}
              />
            </View>
          </View> */}


          {/* <View style={styles.dateRow}>
            <View style={styles.inputBox}>
              <Text style={styles.label}>Select Month</Text>
              <View style={styles.dropdown}>
                <Picker
                  selectedValue={selectedMonthId}
                  onValueChange={(itemValue) => setSelectedMonthId(itemValue)}
                  style={{
                    height: 50,
                    color: selectedMonthId === '' ? '#9CA3AF' : '#000',
                  }}
                >
                  <Picker.Item label="Select Month" value="" />
                  {monthsList
                    .filter(
                      (value, index, self) =>
                        index === self.findIndex((m) => m.monthId === value.monthId)
                    )
                    .map((month) => (
                      <Picker.Item
                        key={month.monthId}
                        label={month.month1}
                        value={month.monthId}
                      />
                    ))}

                </Picker>

              </View>
            </View>

            <View style={styles.inputBox}>
              <Text style={styles.label}>Select Year</Text>
              <View style={styles.dropdown}>
                <Picker
                  selectedValue={selectedYearId}
                  onValueChange={(itemValue) => setSelectedYearId(itemValue)}
                  style={{
                    height: 50,
                    color: selectedYearId === '' ? '#9CA3AF' : '#000',
                  }}
                >
                  <Picker.Item label="Select Year" value="" />
                  {yearsList.map((year) => (
                    <Picker.Item
                      key={year.yearId}
                      label={year.yearLabel}
                      value={year.yearId}
                    />
                  ))}
                </Picker>
              </View>

            </View>
          </View> */}

          <Text style={styles.label}>Leave Type<Text style={{ color: "red" }}>*</Text></Text>
          <View style={styles.dropdown}>
            <Picker
              style={{
               width: "100%",
                color: leaveType === '' ? '#9CA3AF' : '#000',
              }}
              selectedValue={leaveType}
              onValueChange={(itemValue) => setLeaveType(itemValue)}
            >
              <Picker.Item label="Select Type" value="" color="#9CA3AF" />
              {leaveTypes.map((type) => (
                <Picker.Item
                  key={type.leaveTypeId}
                  label={type.leaveType1}
                  value={type.leaveTypeId}
                />
              ))}
            </Picker>
          </View>





          {/* {/ Leave From / To /} */}
          <View style={styles.dateRow}>
            <View style={styles.inputBox}>
              <Text style={styles.label}>Leave From<Text style={{ color: "red" }}>*</Text></Text>
              <TouchableOpacity onPress={() => setShowFromDate(true)} style={styles.dateInput}>
                <Text style={{ color: fromDate ? '#000' : '#9CA3AF', }}>
                  {fromDate ? formatDateDDMMYY(fromDate) : 'Select Date'}
                </Text>
                <Icon name="calendar-outline" size={20} color="#374151" />
              </TouchableOpacity>

            </View>

            {isFullDay ? (
              <View style={styles.inputBox}>
                <Text style={styles.label}>Leave To<Text style={{ color: "red" }}>*</Text></Text>
                <TouchableOpacity onPress={() => setShowToDate(true)} style={styles.dateInput}>
                  <Text style={{ color: toDateSelected ? '#000' : '#9CA3AF' }}>
                    {toDateSelected ? formatDateDDMMYY(toDate) : 'Select Date'}
                  </Text>
                  <Icon name="calendar-outline" size={20} color="#374151" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputBox}>
                <Text style={styles.label}>Shift Time<Text style={{ color: "red" }}>*</Text></Text>
                <View style={styles.shiftDropdown}>
                  <Picker
                    selectedValue={shiftTime}
                    onValueChange={(itemValue) => setShiftTime(itemValue)}
                    style={{
                      height: 50,
                      color: shiftTime === '' ? '#9CA3AF' : '#000',
                    }}
                  >
                    <Picker.Item label="Select Shift" value="" />
                    <Picker.Item label="First Shift" value="first_shift" />
                    <Picker.Item label="Second Shift" value="second_shift" />
                    <Picker.Item label="Third Shift" value="third_shift" />
                  </Picker>
                </View>
              </View>

            )}
          </View>

          {/* {showApplicationDatePicker && (
            <DateTimePicker
              value={applicationDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onApplicationDateChange}
            />
          )} */}

          {/* {/ Date Pickers /} */}
          {showFromDate && (
            <DateTimePicker
              value={fromDate || new Date()} // fallback if null
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onFromDateChange}
              minimumDate={new Date()}
            />
          )}
          {showToDate && isFullDay && (
            <DateTimePicker
              value={toDate || new Date()} // added fallback to avoid undefined
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onToDateChange}
              minimumDate={fromDate || new Date()}
            />
          )}


          {/* {/ Duration /} */}
          <Text style={styles.durationText}>
            Leave Duration : <Text style={styles.durationcalculateText}>{calculateDuration()}</Text>
          </Text>


          {/* {/ reason /} */}
          <Text style={styles.label}>Reason</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor="#9CA3AF"
            placeholder="Enter"
            value={reason}
            onChangeText={setreason}
          />

          {/* {/ Submit /} */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}>
            <Text style={styles.buttonText}>Send for Approval</Text>
          </TouchableOpacity>
        </View>
        <FancyAlert
          visible={alertVisible}
          onClose={() => setAlertVisible(false)}
          type="success"
          title="Success"
          message="Leave application submitted successfully."
          showConfirm={false}
          hideButtons
        />
      </KeyboardAwareScrollView>
      {/* </ScrollView> */}
    </TouchableWithoutFeedback>



  );


};

const styles = StyleSheet.create({
  scrollContent: {
    // padding: wp('4%'),
    backgroundColor: '#f8f9fa',

  },
  container: {
    padding: wp('4%'),
    backgroundColor: '#f8f9fa',
    flex: 1,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: hp('2%'),
    marginLeft: wp('2.5%'),

  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp('5%'),
  },
  radioText: {
    marginLeft: wp('1.5%'),
    fontSize: Math.max(wp("3.8%"), 14),
    color: '#374151',
  },
  radioTextSelected: {
    color: '#212529',
    fontWeight: '500',
  },
  radioCircle: {
    height: wp('4.5%'),
    width: wp('4.5%'),
    borderRadius: wp('2.5%'),
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#0189c7',
  },
  radioDot: {
    height: wp('2.5%'),
    width: wp('2.5%'),
    borderRadius: wp('1.5%'),
    backgroundColor: '#0189c7',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginVertical: hp('1.2%'),
  },
  label: {
    fontSize: Math.max(wp("3.8%"), 14),
    marginBottom: hp('0.5%'),
    fontWeight: '500',
    color: "#374151",
    marginLeft: wp('2.5%'),
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp("2%"),
    paddingVertical: wp("1%"),
    fontSize: wp('3.5%'),
    height: hp("6%"),
    backgroundColor: '#ffffff',
    marginLeft: wp('2%'),

  },
  durationText: {
    fontSize: Math.max(wp("4%"), 14),
    marginVertical: hp('1%'),
    fontWeight: '500',
    color: '#5F6368',
    marginBottom: hp('2%'),
    marginLeft: wp('2.5%'),

  },
  durationcalculateText: {
    fontSize: wp('3.8%'),
    fontWeight: '500',
    color: '#000000',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: wp("2%"),
    backgroundColor: "#ffffff",
    height: hp("6%"),
    justifyContent: "center",
    paddingHorizontal: wp("2%"),
    marginLeft: wp('1.8%'),

  },
  shiftDropdown: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('1%'),
    width: '100%',
    justifyContent: 'center',
    backgroundColor: '#ffffff',

  },
  inputBox: {
    width: '48%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp('2%'),
    padding: wp('2.5%'),
    marginBottom: hp('1%'),
    fontSize: wp('3.5%'),
    backgroundColor: '#ffffff',
    color: "#212529",
    marginLeft: wp('2.5%'),

  },
  attachmentRow: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    marginBottom: hp('3%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  attachmentText: {
    color: '#d5d5d5',
    fontSize: wp('3.5%'),

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
});
export default LeaveApproval;
