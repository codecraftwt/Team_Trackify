import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

export default function PANDetailsEdit() {
  const route = useRoute();
  const navigation = useNavigation();
  const { aadharNumber, fileData } = route.params || {};

  return (
    <View style={styles.container}>

      {/* Aadhar Number */}
      <Text style={styles.label}>PAN Number</Text>
      <TextInput
        value={aadharNumber}
        editable={false}
        style={styles.input}
        placeholderTextColor="#ccc"
      />

      {/* Attach File */}
      <Text style={styles.label}>Attached File</Text>
      <View style={styles.fileContainer}>
        <View style={styles.fileIcon}>
          <MaterialCommunityIcons name="file-pdf-box" size={wp(10)} color="red" />
        </View>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName}>{fileData?.name || 'File'}</Text>
          <Text style={styles.fileSize}>{fileData?.size || ''}</Text>
        </View>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: wp(4),   // Adjusted for responsive horizontal padding
    paddingTop: hp(3),         // Adjusted for responsive top padding
  },
  label: {
    fontSize: wp(4),           // Adjusted for responsive font size
    marginBottom: hp(1),       // Adjusted margin for spacing
    marginTop: hp(2),          // Adjusted margin for spacing
    color: '#000',
  },
  input: {
    height: hp(6),             // Adjusted height for responsive input field
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: wp(3),  // Adjusted horizontal padding inside the input field
    color: '#000',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: wp(3),            // Adjusted for responsive padding inside the container
    marginTop: hp(2),          // Adjusted margin for spacing between sections
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  fileIcon: { 
    marginRight: wp(4),        // Adjusted margin for spacing between icon and text
  },
  fileInfo: { 
    flex: 1,
  },
  fileName: { 
    fontSize: wp(4),           // Adjusted font size for file name
    color: '#000',
  },
  fileSize: { 
    fontSize: wp(3.5),         // Adjusted font size for file size
    color: '#999',
  },
  viewButton: { 
    paddingHorizontal: wp(3),  // Adjusted horizontal padding for button
  },
  viewText: { 
    color: '#007BFF', 
    fontWeight: '600', 
    fontSize: wp(4),           // Adjusted font size for the button text
  },
});
