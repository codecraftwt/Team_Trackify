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

export default function AadharDetailsEdit() {
  const route = useRoute();
  const navigation = useNavigation();
  const { aadharNumber, fileData } = route.params || {};

  return (
    <View style={styles.container}>
      {/* Aadhar Number */}
      <Text style={styles.label}>Aadhar Number</Text>
      <TextInput
        value={aadharNumber}
        editable={false}
        style={styles.input}
        placeholderTextColor="#ccc"
      />

      {/* Attached File */}
      <Text style={styles.label}>Attached File</Text>
      <View style={styles.fileContainer}>
        <View style={styles.fileIcon}>
          <MaterialCommunityIcons name="file-pdf-box" size={hp(6)} color="red" />
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
    backgroundColor: '#f8f9fa', 
    paddingHorizontal: wp(4), 
    paddingTop: hp(2), 
  },
  label: { 
    fontSize: wp('3.5%'),
    color: '#5F6368',
    fontWeight: '500',
    marginBottom: hp(1),
    marginTop: hp(2),
   
  },
  input: {
    height: hp(6), 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: '#f5f5f5',
    paddingHorizontal: wp(2), 
    color: '#000',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: wp(3),
    marginTop: hp(2),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  fileIcon: { marginRight: wp(3) }, 
  fileInfo: { flex: 1 },
  fileName: { fontSize: wp(4), color: '#000' },
  fileSize: { fontSize: wp(3.5), color: '#999' },
  viewButton: { paddingHorizontal: wp(2) }, 
  viewText: { color: '#007BFF', fontWeight: '600', fontSize: wp(4) }, 
});
