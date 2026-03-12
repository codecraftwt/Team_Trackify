import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

const AddBankDetails = ({ navigation, route }) => {
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branch, setBranch] = useState('');
  const [isPrimary, setIsPrimary] = useState(null); // null / true / false
  const { onBankAdded } = route.params || {};

    const validateForm = () => {
    if (!bankName.trim()) {
      Alert.alert("Validation Error", "Please enter Bank Name.");
      return false;
    }
    if (!accountHolder.trim()) {
      Alert.alert("Validation Error", "Please enter Account Holder Name.");
      return false;
    }
    if (!accountNumber.trim()) {
      Alert.alert("Validation Error", "Please enter Account Number.");
      return false;
    }
    if (!/^\d{9,18}$/.test(accountNumber)) {
      Alert.alert("Validation Error", "Account Number must be 9 to 18 digits.");
      return false;
    }
    if (!ifscCode.trim()) {
      Alert.alert("Validation Error", "Please enter IFSC Code.");
      return false;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      Alert.alert("Validation Error", "Please enter a valid IFSC Code (e.g., SBIN0001234).");
      return false;
    }
    if (isPrimary === null) {
      Alert.alert("Validation Error", "Please select if this is the Primary Bank.");
      return false;
    }
    return true;
  };


  const handleSave = () => {
    if (!validateForm()) return;
    const newBank = {
      bankName,
      accountHolder,
      accountNumber,
      ifscCode,
      branch,
      isPrimary,
    };
  
    if (onBankAdded) {
      onBankAdded(newBank); // Call the callback
    }

    navigation.goBack(); // Go back to BankDetails
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
      <Text style={styles.header}>Add Bank Details</Text>
 <View style={styles.card}>
      <Text style={styles.label}>Bank Name <Text style={{ color: "red" }}>*</Text></Text>
      <TextInput
        style={styles.input}
        value={bankName}
        onChangeText={setBankName}
        placeholder="Enter bank name"
        placeholderTextColor="#9CA3AF"  
      />

      <Text style={styles.label}>Account Holder Name <Text style={{ color: "red" }}>*</Text></Text>
      <TextInput
        style={styles.input}
        value={accountHolder}
        onChangeText={setAccountHolder}
        placeholder="Enter account holder name"
        placeholderTextColor="#9CA3AF"  
      />

      <Text style={styles.label}>Account Number <Text style={{ color: "red" }}>*</Text></Text>
      <TextInput
        style={styles.input}
        value={accountNumber}
        onChangeText={setAccountNumber}
        placeholder="Enter account number"
        placeholderTextColor="#9CA3AF"  
        keyboardType="numeric"
      />

      <Text style={styles.label}>IFSC Code <Text style={{ color: "red" }}>*</Text></Text>
      <TextInput
        style={styles.input}
        value={ifscCode}
        onChangeText={setIfscCode}
        placeholder="Enter IFSC code"
        placeholderTextColor="#9CA3AF"  
      />

      {/* <Text style={styles.label}>Branch</Text>
      <TextInput
        style={styles.input}
        value={branch}
        onChangeText={setBranch}
        placeholder="Enter branch name"
        placeholderTextColor="#9CA3AF"  
      /> */}

      {/* Set as Primary Bank */}
      {/* <Text style={styles.label}>Set as Primary Bank <Text style={{ color: "red" }}>*</Text></Text>
      <View style={styles.radioGroup}>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => setIsPrimary(true)}
        >
          <View style={styles.radioCircle}>
            {isPrimary === true && <View style={styles.selectedDot} />}
          </View>
          <Text style={styles.radioLabel}>Yes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => setIsPrimary(false)}
        >
          <View style={styles.radioCircle}>
            {isPrimary === false && <View style={styles.selectedDot} />}
          </View>
          <Text style={styles.radioLabel}>No</Text>
        </TouchableOpacity>
      </View> */}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
    </View>
    </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: wp(5),
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
    card: {
    // backgroundColor: '#ffffff', // card bg
    borderRadius: wp('3%'),
    padding: wp('1%'),
   
  },
  header: {
    fontSize: wp(5),
    fontWeight: '700',
    marginBottom: hp(1),
    color: '#438aff',
  },
  label: {
    fontSize: wp('3.5%'),
    color: '#374151',
    fontWeight: '500',
    marginTop: hp(2),
    marginLeft: wp("1.5%"),

  },
  input: {
    height: hp(5),
    borderRadius: wp(2),
    backgroundColor: '#ffffff',
    paddingHorizontal: wp(3),
    fontSize: wp("3.8%"),
    marginTop: hp(1),
    borderWidth: 0.3,
    // fontWeight: '500',
    color: '#212529',
  },
  radioGroup: {
    flexDirection: 'row',
    marginTop: hp(2),
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(5),
  },
  radioCircle: {
    height: wp(5),
    width: wp(5),
    borderRadius: wp(2.5),
    borderWidth: 2,
    borderColor: '#438aff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  selectedDot: {
    width: wp(2.5),
    height: wp(2.5),
    borderRadius: wp(1.25),
    backgroundColor: '#438aff',
  },
  radioLabel: {
    fontSize: wp(4),
    fontWeight: '500',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#438aff',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(10),
    borderRadius: wp(3),
    marginTop: hp(4),
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: wp(4.5),
  },
});

export default AddBankDetails;
