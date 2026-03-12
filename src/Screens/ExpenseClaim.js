import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Button from '../Component/Button';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { pick } from '@react-native-documents/picker'; // ✅ ADDED

const ExpenseClaim = () => {
  const navigation = useNavigation();
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [fileData, setFileData] = useState(null);
  const [expenseType, setExpenseType] = useState('');

  const formatDateDDMMYY = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
    const year = String(date.getFullYear()); // full year
    return `${day}/${month}/${year}`;
  };
  const handleDateChange = (event, selected) => {
    setShowPicker(Platform.OS === 'ios');
    if (selected) {
      setDate(selected);
      setSelectedDate(formatDateDDMMYY(selected));

    }
  };

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

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Expense Type</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={expenseType}
          onValueChange={(itemValue) => setExpenseType(itemValue)}
          style={[
            styles.picker,
            { color: expenseType ? "#212529" : "#9CA3AF" }, // 👈 conditional color
          ]}
        >
          <Picker.Item label="Select Type" value="" />
          <Picker.Item label="Travel" value="travel" />
          <Picker.Item label="Food" value="food" />
          <Picker.Item label="Accommodation" value="accommodation" />
          <Picker.Item label="Other" value="other" />
        </Picker>
      </View>
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
            <Text style={[styles.placeholder, selectedDate && styles.selectedDate]}>
              {selectedDate || 'Select Date'}
            </Text>
            <Icon name="calendar-outline" size={18} color="#374151" />
          </TouchableOpacity>
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Bill Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      <Text style={styles.label}>Amount</Text>
      <View style={styles.amountInput}>
        <MaterialCommunityIcons
          name="currency-inr"
          size={18}
          color="#374151"
          style={styles.icon}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Enter"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.label}>Attachments<Text style={{ color: "red" }}></Text></Text>
      <TouchableOpacity style={styles.input} onPress={handlePickDocument}>
        <Text
          style={[
            styles.placeholder,
            { color: fileData ? "#212529" : '#9CA3AF' } // conditional color
          ]}
        >
          {fileData ? fileData.name : 'Tap to attach PDF'}
        </Text>
        <Icon name="attach-outline" size={18} color="#374151" />
      </TouchableOpacity>

      <Button
        title="Send For Approval"
        backgroundColor="#438aff"
        onPress={() => navigation.navigate("UserTabs", { screen: "Settings" })}
        style={styles.submitButton}
      />
    </View>
  );
};

export default ExpenseClaim;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
  },
  label: {
    fontSize: Math.max(wp("3.8%"), 14),
    fontWeight: '500',
    marginTop: hp('2%'),
    marginBottom: hp("0.2%"),
    color: "#374151",
    marginLeft: wp('3%'),
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp('2%'),
    // marginBottom: hp('1.5%'),
    backgroundColor: '#ffffff',
    height: hp('6%'), // Increase height for better visibility
    justifyContent: 'center',
    paddingHorizontal: wp('2.5%'),
    marginTop: hp('0.8%'),

  },
  picker: {
    height: hp('8%'), // Increase height for better visibility
    width: '100%',
    fontSize: wp('4%'),
    color: "#212529",
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    height: hp("6%"),
    paddingHorizontal: wp('3%'),
    borderRadius: wp('2%'),
    justifyContent: 'space-between',
    marginTop: hp('0.8%'),
    color: "#212529",

  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    // paddingVertical: hp('1.5%'),
    height: hp("6%"),
    paddingHorizontal: wp('3%'),
    borderRadius: wp('2%'),
    marginTop: hp('0.8%'),
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: "#212529",

  },
  selectedDate: {
    color: "#212529",

  },
  placeholder: {
    color: '#9CA3AF',
    fontSize: Math.max(wp("3.8%"), 14),
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    height: hp("6%"),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('2%'),
    marginTop: hp('0.8%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: "#212529",

  },
  icon: {
    marginRight: wp('2%'),
  },
  textInput: {
    flex: 1,
    fontSize: wp('3.6%'),
    color: "#212529",

  },
  submitButton: {
    marginTop: hp("8%"),
    width: '100%',
  },
});
