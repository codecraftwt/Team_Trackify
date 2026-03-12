import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const EditBankDetails = ({ navigation, route }) => {
  const { bankData, onBankUpdated } = route.params || {};
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  // const [branch, setBranch] = useState('');
  const [isPrimary, setIsPrimary] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bankData) {
      setBankName(bankData.bankName || '');
      setAccountHolder(bankData.accountHolder || '');
      setAccountNumber(bankData.accountNumber || '');
      setIfscCode(bankData.ifscCode || '');
      // setBranch(bankData.branch || '');
      setIsPrimary(
        bankData.isPrimary === true ? true : bankData.isPrimary === false ? false : null
      );
    }
  }, []);

  const validateForm = () => {
    if (!bankName.trim()) {
      Alert.alert('Validation Error', 'Please enter Bank Name.');
      return false;
    }
    if (!accountHolder.trim()) {
      Alert.alert('Validation Error', 'Please enter Account Holder Name.');
      return false;
    }
    if (!accountNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter Account Number.');
      return false;
    }
    if (!/^\d{9,18}$/.test(accountNumber)) {
      Alert.alert('Validation Error', 'Account Number must be 9 to 18 digits.');
      return false;
    }
    if (!ifscCode.trim()) {
      Alert.alert('Validation Error', 'Please enter IFSC Code.');
      return false;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      Alert.alert(
        'Validation Error',
        'Please enter a valid IFSC Code (e.g., SBIN0001234).'
      );
      return false;
    }
    if (isPrimary === null) {
      Alert.alert('Validation Error', 'Please select if this is the Primary Bank.');
      return false;
    }
    return true;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    setSaving(true);
    const updatedBank = {
      ...bankData,
      bankName,
      accountHolder,
      accountNumber,
      ifscCode,
      // branch,
      isPrimary,
    };

    if (onBankUpdated) {
      await onBankUpdated(updatedBank); // ensure backend save is complete
    }

    navigation.goBack();
  };


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor: "#f8f9fa" }}
        contentContainerStyle={{ flexGrow: 1 }}
        extraScrollHeight={50}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.label}>Bank Name  <Text style={{ color: "red" }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={bankName}
              onChangeText={setBankName}
            />

            <Text style={styles.label}>Account Holder Name  <Text style={{ color: "red" }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={accountHolder}
              onChangeText={setAccountHolder}
            />

            <Text style={styles.label}>Account Number <Text style={{ color: "red" }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
            />

            <Text style={styles.label}>IFSC Code <Text style={{ color: "red" }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={ifscCode}
              onChangeText={setIfscCode}
            />



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

            <TouchableOpacity
              style={[styles.saveButton, saving && { backgroundColor: '#ccc' }]}
              onPress={handleUpdate}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: wp('5%'),
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  card: {
    // backgroundColor: '#ffffff', // card bg
    borderRadius: wp('3%'),
    padding: wp('1%'),

  },
  label: {
    fontSize: wp('3.5%'),
    fontWeight: '500',
    marginTop: hp('1.5%'),
    color: '#374151',
    marginLeft: wp("1.5%"),

  },
  input: {
    height: hp('5.5%'),
    borderRadius: wp('2%'),
    backgroundColor: '#ffffff',
    paddingHorizontal: wp('3%'),
    fontSize: wp('3.5%'),
    marginTop: hp('0.8%'),
    borderWidth: 0.3,
    fontWeight: '500',
    color: '#212529',
  },
  radioGroup: {
    flexDirection: 'row',
    marginTop: hp('1%'),
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp('5%'),
  },
  radioCircle: {
    height: wp('5%'),
    width: wp('5%'),
    borderRadius: wp('2.5%'),
    borderWidth: 2,
    borderColor: '#438aff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('2%'),
  },
  selectedDot: {
    width: wp('2.5%'),
    height: wp('2.5%'),
    borderRadius: wp('1.25%'),
    backgroundColor: '#438aff',
  },
  radioLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '500',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#438aff',
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
    marginTop: hp('4%'),
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: wp('4%'),
  },
});

export default EditBankDetails;
