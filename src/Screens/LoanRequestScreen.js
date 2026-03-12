import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, TouchableWithoutFeedback, Keyboard } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import Button from "../Component/Button";
import { useNavigation } from "@react-navigation/native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from "../config/server";
import { jwtDecode } from "jwt-decode";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import FancyAlert from "./FancyAlert";

const LoanRequestScreen = () => {
  const navigation = useNavigation();
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [emiAmount, setEmiAmount] = useState("");
  const [disbursementDate, setDisbursementDate] = useState(null);
  const [repaymentMonth, setRepaymentMonth] = useState(null);
  const [showDisbursementPicker, setShowDisbursementPicker] = useState(false);
  const [showRepaymentPicker, setShowRepaymentPicker] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [yearsList, setYearsList] = useState([]);
  const [monthsList, setMonthsList] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedMonthId, setSelectedMonthId] = useState('');
  const [loanType, setLoanType] = useState("");
  const [loanTypes, setLoanTypes] = useState([]);
  const [applicationDate, setApplicationDate] = useState(new Date());
  const [applicationno, setapplicationno] = useState("");
  const [showApplicationDatePicker, setShowApplicationDatePicker] = useState(false);
  const [reference, setReference] = useState("");

  const formatDateDDMMYY = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
    const year = String(date.getFullYear()); // full year
    return `${day}/${month}/${year}`;
  };

  const onApplicationDateChange = (event, selectedDate) => {
    setShowApplicationDatePicker(false); // Hide first

    if (event.type === 'set' && selectedDate) {
      setApplicationDate(selectedDate);
    }
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
        const uniqueMonths = data.filter(
          (value, index, self) =>
            // index === self.findIndex((m) => m.month1 === value.month1 && m.yearId === value.yearId)
            index === self.findIndex((m) => m.month1 === value.month1)

        );
        setMonthsList(uniqueMonths);

        // ✅ Match by name instead of id
        const now = new Date();
        const currentMonthName = now.toLocaleString("default", { month: "long" });

        const currentMonthObj = uniqueMonths.find(
          (m) => m.month1.toLowerCase() === currentMonthName.toLowerCase()
        );

        if (currentMonthObj) {
          setSelectedMonthId(currentMonthObj.monthId);
          setSelectedYearId(currentMonthObj.yearId);
        } else {
          setSelectedMonthId(uniqueMonths[0]?.monthId || "");
          setSelectedYearId(uniqueMonths[0]?.yearId || "");
        }
      } else {
        console.warn("Unexpected GetMonths data format:", data);
      }
    } catch (error) {
      console.error("Error fetching months:", error);
    }
  };

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

      if (response.ok && Array.isArray(data)) {
        const uniqueYears = data.filter(
          (value, index, self) =>
            index === self.findIndex((y) => y.yearLabel === value.yearLabel)
        );
        setYearsList(uniqueYears);

        // ✅ Match current year by yearLabel, not yearId
        const now = new Date();
        const currentYear = now.getFullYear().toString();

        const currentYearObj = data.find(
          (y) => y.yearLabel.toString() === currentYear
        );

        if (currentYearObj) {
          setSelectedYearId(currentYearObj.yearId);
        } else {
          setSelectedYearId(data[0]?.yearId || "");
        }
      } else {
        console.warn("Unexpected GetYears response:", data);
      }
    } catch (error) {
      console.error("Error fetching years:", error);
    }
  };

  const fetchLoanTypes = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(`${BASE_URL}/Loan/GetLoanType`, {
        headers: {
          Authorization: token,
        },
      });

      const data = await res.json();
      // console.log("LoanType API data:", data);

      if (res.ok && Array.isArray(data)) {
        const activeLoans = data.filter(lt => lt.isActive && !lt.isDeleted);
        setLoanTypes(activeLoans);
        // if (activeLoans.length > 0) setLoanType(activeLoans[0].loanTypeId);
      setLoanType("");
      }
    } catch (err) {
      console.error("Failed to fetch loan types:", err);
    }
  };



  useEffect(() => {
    fetchLoanTypes();
    fetchYears();
    fetchMonths();
  }, []);

  const handleDisbursementDateChange = (event, selectedDate) => {
    setShowDisbursementPicker(false);
    if (selectedDate) {
      setDisbursementDate(selectedDate);
    }
  };

  const handleRepaymentMonthChange = (event, selectedDate) => {
    setShowRepaymentPicker(false);
    if (selectedDate) {
       if (disbursementDate && selectedDate <= disbursementDate) {
      Alert.alert("Invalid Date", "Repayment start date must be after the disbursement date.");
      return;
    }
      setRepaymentMonth(selectedDate);
    }
  };

  const formatDate = (date) => {
    if (!date) return null;
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
  if (disbursementDate && monthsList.length && yearsList.length) {
    const monthNumber = disbursementDate.getMonth() + 1; // JS months: 0-11
    const yearNumber = disbursementDate.getFullYear();

    // Find month object by number
    const monthObj = monthsList.find(m => m.monthNumber === monthNumber || m.monthId === monthNumber);
    if (monthObj) setSelectedMonthId(monthObj.monthId);

    // Find year object by label
    const yearObj = yearsList.find(y => y.yearLabel == yearNumber);
    if (yearObj) setSelectedYearId(yearObj.yearId);
  }
}, [disbursementDate, monthsList, yearsList]);

  const submitLoanRequest = async () => {
     if (!loanType) {
    Alert.alert("Validation Error", "Please select a Loan Type.");
    return;
  }

  if (!reason || reason.trim() === "") {
    Alert.alert("Validation Error", "Please enter a Description.");
    return;
  }

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    Alert.alert("Validation Error", "Please enter a valid Loan Amount.");
    return;
  }

  if (!emiAmount || isNaN(emiAmount) || Number(emiAmount) <= 0) {
    Alert.alert("Validation Error", "Please enter a valid EMI Amount.");
    return;
  }

  if (!disbursementDate) {
    Alert.alert("Validation Error", "Please select a Disbursement Date.");
    return;
  }

  if (!repaymentMonth) {
    Alert.alert("Validation Error", "Please select a Repayment Start Month.");
    return;
  }

  if (disbursementDate && repaymentMonth && repaymentMonth <= disbursementDate) {
    Alert.alert("Validation Error", "Repayment Start Month must be after Disbursement Date.");
    return;
  }

  // Optional: check if application date and generated number exist
  if (!applicationno) {
    Alert.alert("Error", "Application number missing.");
    return;
  }

    try {
      const token = await AsyncStorage.getItem("authToken");
      const companyId = await AsyncStorage.getItem("companyId");
      const userId = await AsyncStorage.getItem("userId");

      if (!token) {
        Alert.alert("Error", "Authentication required!");
        return;
      }

      const cleanToken = token?.replace("Bearer ", "") || "";
      const decoded = jwtDecode(cleanToken);
      const employeeID = Number(decoded?.EmployeeId || userId);

      const payload = {
        companyId: Number(companyId),
        yearId: selectedYearId,
        monthId: selectedMonthId,
        applicationId: 0,
        applicationNo: applicationno,
        applicationDate: new Date().toISOString().split("T")[0],
        loanTypeId: loanType,
        employeeId: employeeID,
        loanAmount: Number(amount),
        reason: reason,
        status: "Pending",
        isDisbursed: !!disbursementDate,
        disbursementDate: formatDate(disbursementDate),
        reference: reference,
        emiamount: Number(emiAmount),
        emistartDate: formatDate(repaymentMonth),
        loanBalanceAmount: Number(amount),
        isDeleted: false,
        isActive: true,
      };

      const response = await fetch(`${BASE_URL}/Loan/AddUpdateLoanApplication`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(payload),
      });
      console.log('loan request :', response);
      console.log('loan request :', payload);

      if (response.status === 200) {
        setAlertVisible(true);
        setTimeout(() => {
          setAlertVisible(false);
          navigation.navigate("UserTabs", { screen: "Settings" });
        }, 4000);
      } else {
        Alert.alert("Error", "Failed to submit loan application.");
      }
    } catch (error) {
      console.error("Submit Loan Error:", error);
      Alert.alert("Error", "Unable to submit loan request");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAwareScrollView style={{ flex: 1, backgroundColor: "#f8f9fa" }} contentContainerStyle={{ flexGrow: 1 }} extraScrollHeight={50} enableOnAndroid={true} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>

          <View style={styles.dateRow}>
            {/* <View style={styles.inputBox}>
              <Text style={styles.label}>Application Date</Text>
              <TouchableOpacity onPress={() => setShowApplicationDatePicker(true)} style={styles.dateInput}>
                <Text style={{ color: applicationDate ? '#212529' : '#9CA3AF' }}>
                  {applicationDate ? formatDateDDMMYY(applicationDate) : "Select Date"}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#374151" />
              </TouchableOpacity>
              {showApplicationDatePicker && (
                <DateTimePicker
                  value={applicationDate}
                  mode="date"
                  display="default"
                  onChange={onApplicationDateChange}
                />
              )}
            </View> */}

            {/* <View style={[styles.inputBox, { marginRight: 0 }]}>
              <Text style={styles.label}>Application No.</Text>
              <View style={styles.readonlyBox}>
                <Text style={styles.readonlyText}>{applicationno}</Text>
              </View>
            </View> */}
          </View>



          <Text style={styles.label}>Loan Type<Text style={{ color: "red" }}>*</Text></Text>
          <View style={styles.pickerContainer}>
            <Picker
             style={{
                height: 50,
                color: loanType === '' ? '#9CA3AF' : '#212529',
              }}
              selectedValue={loanType}
              onValueChange={(itemValue) => setLoanType(itemValue)}
            >
              <Picker.Item label="Select Loan Type" value="" color="#9CA3AF" />
              {loanTypes.map((lt) => (
                <Picker.Item key={lt.loanTypeId} label={lt.loanType1} value={lt.loanTypeId} />
              ))}
            </Picker>

          </View>




          {/* <View style={styles.rowContainer}>
            <View style={styles.flexPicker}>
              <Text style={styles.label}>Year</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={selectedYearId}
                  onValueChange={(itemValue) => setSelectedYearId(itemValue)}>
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

            <View style={styles.flexPicker}>
              <Text style={styles.label}>Month</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={selectedMonthId}
                  onValueChange={(itemValue) => setSelectedMonthId(itemValue)}>
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
          </View> */}


          <Text style={styles.label}>Description<Text style={{ color: "red" }}>*</Text></Text>
          <TextInput style={styles.input} placeholder="Enter" placeholderTextColor="#9CA3AF" value={reason} onChangeText={setReason} />

          {/* <Text style={styles.label}>Reference</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Reference"
            placeholderTextColor="#9CA3AF"
            value={reference}
            onChangeText={setReference}
          /> */}

          <Text style={styles.label}>Amount<Text style={{ color: "red" }}>*</Text></Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput style={styles.amountInput} placeholder="Enter" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={amount} onChangeText={setAmount} />
          </View>


          <Text style={styles.label}>Disbursement Date<Text style={{ color: "red" }}>*</Text></Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowDisbursementPicker(true)}>
            <Text style={disbursementDate ? styles.dateText : styles.placeholderText}>{disbursementDate ? formatDateDDMMYY(disbursementDate) : "Select Date"}</Text>
            <Ionicons name="calendar-outline" size={20} color="#374151" />
          </TouchableOpacity>
          {showDisbursementPicker && 
          <DateTimePicker value={new Date()} mode="date" display="default" onChange={handleDisbursementDateChange}
           minimumDate={new Date()}  />}

          <Text style={styles.label}>Repayment Start Month<Text style={{ color: "red" }}>*</Text></Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowRepaymentPicker(true)}>
            <Text style={repaymentMonth ? styles.dateText : styles.placeholderText}>{repaymentMonth ? formatDateDDMMYY(repaymentMonth) : "Select Date"}</Text>
            <Ionicons name="calendar-outline" size={20} color="#374151" />
          </TouchableOpacity>
          {showRepaymentPicker && 
          <DateTimePicker value={new Date()} mode="date" display="default" onChange={handleRepaymentMonthChange} 
           minimumDate={disbursementDate ? new Date(disbursementDate.getTime() + 24 * 60 * 60 * 1000) : new Date()} />}

          <Text style={styles.label}>EMI Amount<Text style={{ color: "red" }}>*</Text></Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput style={styles.amountInput} placeholder="Enter" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={emiAmount} onChangeText={setEmiAmount} />
          </View>

          <Button title="Send For Approval" backgroundColor="#438AFF" onPress={submitLoanRequest} style={styles.button} />

          <FancyAlert visible={alertVisible} onClose={() => setAlertVisible(false)} type="success" title="Success" message="Loan application submitted successfully." showConfirm={false} hideButtons />
        </View>
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback >
  );
};

export default LoanRequestScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: wp("5%"), backgroundColor: "#f8f9fa" },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: hp("2%"),
  },
  inputBox: {
    flex: 1,
    marginRight: wp("2%"), // spacing between columns
  },

  label: { fontSize: Math.max(wp("3.8%"), 14), fontWeight: "500",  color: "#374151", marginLeft: wp("3%"), marginBottom: hp("0.5%") },
  readonlyBox: {
    height: hp("6%"),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: wp("2%"),
    paddingHorizontal: wp("3%"),
    backgroundColor: "#ffffff", // light gray so user knows it's readonly
    justifyContent: "center",
    marginBottom: hp("2%"),
  },
  readonlyText: {
    fontSize: wp("4%"),
    color: "#374151",
  },

  input: { height: hp("6%"), borderWidth: 1, borderColor: "#E5E7EB", color: "#212529", borderRadius: wp("2%"), paddingHorizontal: wp("3%"), backgroundColor: "#ffffff", marginBottom: hp("2%"), fontSize: wp("4%") },
  amountContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: wp("2%"), paddingHorizontal: wp("3%"), backgroundColor: "#ffffff", marginBottom: hp("2%"), height: hp("6%") },
  currencySymbol: { fontSize: wp("5%"), fontWeight: "bold", marginRight: wp("2%"), color: "#5F6368" },
  amountInput: { flex: 1, fontSize: wp("4%"),  color: "#212529", },
  dateInput: { height: hp("6%"), borderWidth: 1, borderColor: "#E5E7EB", borderRadius: wp("2%"), color: "#212529", paddingHorizontal: wp("3%"), flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#ffffff", marginBottom: hp("2%") },
  dateText: { fontSize: Math.max(wp("3.8%"), 14), color: "#333" },
  placeholderText: { fontSize: Math.max(wp("3.8%"), 14), color: "#9CA3AF" },
  button: { marginTop: hp("1%") },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: hp("2%"),
  },
  flexPicker: {
    flex: 1,
    marginRight: wp("2%") // spacing between Year and Month
  },

  pickerContainer: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: wp("2%"), marginBottom: hp("2%"), backgroundColor: "#ffffff" },
});
