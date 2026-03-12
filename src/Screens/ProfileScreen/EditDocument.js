import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";


export default function EditDocument({ navigation }) {
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [qualificationType, setQualificationType] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [completionDate, setCompletionDate] = useState('')

  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [relevantExperience, setRelevantExperience] = useState('');
  const [experienceMonths, setExperienceMonths] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [activeField, setActiveField] = useState('');

  // Mock: Load existing data for editing
  useEffect(() => {
    setAadhaar('1234-5678-9012');
    setPan('ABCDE1234F');
    setEmployeeName('John Doe');
    setQualificationType('Bachelor of Technology');
    setSpecialization('Computer Science');
    setCompletionDate('2022-06-10');
    setCompanyName('Tech Solutions Inc.');
    setJobTitle('Software Engineer');
    setFromDate('2020-01-15');
    setToDate('2023-03-30');
    setRelevantExperience('IT Industry');
    setExperienceMonths('38');
    setJobDescription('Developed enterprise-grade applications using React Native and Node.js.');
  }, []);

  const handleConfirm = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    if (activeField === 'completion') setCompletionDate(formattedDate);
    else if (activeField === 'from') setFromDate(formattedDate);
    else if (activeField === 'to') setToDate(formattedDate);
    setDatePickerVisible(false);
  };

  const handleSave = () => {
    // Here you can implement API call or local storage update
    console.log('Updated Info:', {
      aadhaar, pan, employeeName, qualificationType, specialization, completionDate,
      companyName, jobTitle, fromDate, toDate, relevantExperience,
      experienceMonths, jobDescription
    });
    alert('Document updated successfully!');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* <Text style={styles.aadhaarlabel}>Aadhaar Number</Text> */}
      <TextInput
        value={aadhaar}
        onChangeText={setAadhaar}
        style={styles.input}
      />

      <Text style={styles.panlabel}>Pan Number</Text>
      <TextInput
        value={pan}
        onChangeText={setPan}
        style={styles.input}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Qualification Details</Text>
        <Icon name="plus-circle-outline" size={20} color="#000" />
      </View>

      <Text style={styles.label}>Employee Name</Text>
      <TextInput
        value={employeeName}
        onChangeText={setEmployeeName}
        style={styles.input}
      />

      <Text style={styles.label}>Qualification Type</Text>
      <TextInput
        value={qualificationType}
        onChangeText={setQualificationType}
        style={styles.input}
      />

      <Text style={styles.label}>Specialization</Text>
      <TextInput
        value={specialization}
        onChangeText={setSpecialization}
        style={styles.input}
      />

      <Text style={styles.label}>Completion Date</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => {
          setActiveField('completion');
          setDatePickerVisible(true);
        }}
      >
        <Text style={styles.inputText}>{completionDate || 'Select date'}</Text>
        <Ionicons name="calendar-outline" size={20} color="#7b7b7d" />
      </TouchableOpacity>

      <Text style={styles.label}>
        Attach File <Text style={{ color: 'red' }}>*</Text>
      </Text>
      <View style={styles.attachment}>
        <Text style={styles.attachmentText}>Attach File</Text>
        <Icon name="paperclip" size={20} color="#999" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Experience</Text>
        <Icon name="plus-circle-outline" size={20} color="#000" />
      </View>

      <Text style={styles.label}>Employee Name</Text>
      <TextInput
        value={companyName}
        onChangeText={setEmployeeName}
        style={styles.input}
      />

      <Text style={styles.label}>Company Name</Text>
      <TextInput
        value={companyName}
        onChangeText={setCompanyName}
        style={styles.input}
      />

      <Text style={styles.label}>Job Title</Text>
      <TextInput
        value={jobTitle}
        onChangeText={setJobTitle}
        style={styles.input}
      />

      <View style={styles.row}>
        <View style={styles.dateColumn}>
          <Text style={styles.label}>From Date</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => {
              setActiveField('from');
              setDatePickerVisible(true);
            }}
          >
            <Text style={styles.inputText}>{fromDate || 'Select date'}</Text>
            <Ionicons name="calendar-outline" size={20} color="#7b7b7d" />
          </TouchableOpacity>
        </View>

        <View style={styles.dateColumn}>
          <Text style={styles.label}>To Date</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => {
              setActiveField('to');
              setDatePickerVisible(true);
            }}
          >
            <Text style={styles.inputText}>{toDate || 'Select date'}</Text>
            <Ionicons name="calendar-outline" size={20} color="#7b7b7d" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.label}>Relevant Experience</Text>
      <TextInput
        value={relevantExperience}
        onChangeText={setRelevantExperience}
        style={styles.input}
      />

      <Text style={styles.label}>Experience (in Months)</Text>
      <TextInput
        value={experienceMonths}
        onChangeText={setExperienceMonths}
        style={styles.input}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Job Description</Text>
      <TextInput
        value={jobDescription}
        onChangeText={setJobDescription}
        style={styles.input}
        multiline
      />

      <Text style={styles.label}>
        Attach File <Text style={{ color: 'red' }}>*</Text>
      </Text>
      <View style={styles.attachment}>
        <Text style={styles.attachmentText}>Attach File</Text>
        <Icon name="paperclip" size={20} color="#999" />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={() => navigation.goBack()}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={() => setDatePickerVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: '#5f6368',
    left: 10,
  },
  aadhaarlabel: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
    fontWeight: 'bold',
  },
  panlabel: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
    fontWeight: 'bold',
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    backgroundColor: '#f5f6fa',
  },
  inputText: {
    fontSize: 14,
    color: '#000',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dateColumn: {
    flex: 1,
  },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    backgroundColor: '#f5f6fa',
  },
  attachmentText: {
    fontSize: 14,
    color: '#999',
  },
  saveButton: {
    backgroundColor: '#0189c7',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
