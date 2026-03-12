import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { pick } from '@react-native-documents/picker';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage"
import BASE_URL from "../../config/server"
import { Buffer } from "buffer"
import RNFS from "react-native-fs"

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

export default function PANDetails() {
  const navigation = useNavigation();
  const [panNumber, setPanNumber] = useState('');
  const [fileData, setFileData] = useState(null);
  const [type, setType] = useState(''); // PAN document type ID
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [decodedToken, setDecodedToken] = useState(null);

  // Fetch PAN document type from API
  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) throw new Error("Auth token not found");
        const decoded = decodeJWT(token);
        setDecodedToken(decoded);

        const response = await fetch(`${BASE_URL}/Master/GetDocumentTypes`, {
          headers: { Authorization: token },
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();

        if (Array.isArray(data)) {
          const filtered = data.filter(d => d.isActive && !d.isDeleted);
          // Auto-select PAN document type
          const panDoc = filtered.find(d =>
            (d.documentType1 || d.documentType || "").toLowerCase().includes("pan")
          );
          if (panDoc) {
            setType(String(panDoc.documentTypeId));
            console.log("PAN Document Type ID:", panDoc.documentTypeId);
          } else {
            console.warn("PAN document type not found in API response");
          }
        } else {
          console.warn("Unexpected API response format:", data);
        }
      } catch (error) {
        console.error("Error fetching document types:", error);
        Alert.alert("Error", "Failed to load document types");
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const handlePickDocument = async () => {
    try {
      const res = await pick({ type: ['application/pdf'] });
      if (res && res[0]) setFileData(res[0]);
    } catch (err) {
      if (err.code !== "DOCUMENT_PICKER_CANCELED") {
        console.error("Document pick error:", err);
        Alert.alert("Error", "Failed to pick document");
      }
    }
  };

  const handleSave = async () => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;

    if (!panNumber.trim()) return Alert.alert('Validation', 'Please enter PAN Number');
    if (!panRegex.test(panNumber)) return Alert.alert('Validation', 'Please enter a valid PAN number (e.g., ABCDE1234F)');
    if (!type) return Alert.alert("Validation", "PAN document type not found");
    if (!fileData) return Alert.alert("Validation", "Please attach a document");

    try {
      setUploading(true);

      const token = await AsyncStorage.getItem("authToken");
      const decoded = decodedToken ?? decodeJWT(token);
      if (!decoded) throw new Error("Invalid token");

      const userId = parseInt(decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ?? "0", 10);
      const companyId = parseInt(decoded.CompanyId ?? "0", 10);
      const employeeId = parseInt(decoded.EmployeeId ?? decoded.employeeId ?? "0", 10);

      if (!userId || !companyId || !employeeId) throw new Error("Invalid token: Missing IDs");

      const fileContent = await RNFS.readFile(fileData.uri, "base64");
      const fileName = fileData.name || fileData.uri.split("/").pop() || "document.pdf";

      const payload = {
        companyId,
        employeeDocumentId: 0,
        employeeId,
        submitDate: new Date().toISOString(),
        documentTypeId: parseInt(type, 10),
        document: fileName,
        documentData: fileContent,
        note: panNumber,
        documentPath: fileName,
        isDeleted: false,
        isActive: true,
        createLoginId: userId,
        createDate: new Date().toISOString(),
        updateLoginId: userId,
        updateDate: new Date().toISOString(),
      };

      const response = await fetch(`${BASE_URL}/Employee/AddUpdateEmployeeDocument`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      if (response.ok) {
        Alert.alert("Success", "PAN document uploaded successfully");
        navigation.goBack();
      } else {
        let errorMessage = responseText;
        try { errorMessage = JSON.parse(responseText).message || responseText; } catch {}
        Alert.alert("Error", errorMessage);
      }
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Error", err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#438aff" style={{ flex: 1, justifyContent: 'center' }} />;

  return (
    <View style={styles.container}>

        {/* <Text style={styles.label}>Type</Text>
      <View style={styles.pickerContainer}>
        {loading ? (
          <ActivityIndicator size="small" color="#374151" />
        ) : (
          <Picker
            selectedValue={type}
            onValueChange={(itemValue) => setType(String(itemValue))}
            mode="dropdown"
            style={[
              styles.picker,
              { color: type === "" ? "#9ca3af" : "#212529" }, // 👈 dynamic color
            ]}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="Select Type" value="" enabled={false} />
            {documentTypes.map((item) => (
              <Picker.Item key={item.documentTypeId} label={item.documentType1} value={String(item.documentTypeId)} />
            ))}
          </Picker>
        )}
      </View> */}

      <Text style={styles.label}>PAN Number <Text style={{ color: "red" }}>*</Text></Text>
      <TextInput
        placeholder="Type Here"
        value={panNumber}
        onChangeText={setPanNumber}
        style={styles.input}
        placeholderTextColor="#9ca3af"
        autoCapitalize="characters"
        keyboardType="default"
        maxLength={10}
      />


      <Text style={styles.label}>Attach File <Text style={{ color: 'red' }}>*</Text></Text>
      <TouchableOpacity style={styles.attachBox} onPress={handlePickDocument}>
        <View style={styles.attachIconWrapper}>
          <Text style={{ color: fileData ? '#212529' : '#9ca3af', flex: 1 }}>
            {fileData ? fileData.name : 'Tap to attach PDF'}
          </Text>
          <Icon name="attach" size={20} color="#374151" />
        </View>
      </TouchableOpacity>

      {uploading && <ActivityIndicator size="large" color="#438aff" style={{ marginBottom: hp(2) }} />}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={uploading}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", paddingHorizontal: wp(4), paddingTop: hp(2) },
  label: { fontSize: wp("3.5%"), color: "#374151", fontWeight: "500", marginBottom: hp(1), marginTop: hp(1), marginLeft: wp("1.5%") },
  input: { height: hp(6), borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", paddingHorizontal: wp(2), marginBottom: hp(2), color: "#212529" },
  attachBox: { height: hp(6), borderRadius: 8, borderWidth: 1, borderColor: "#e0e0e0", backgroundColor: "#fff", paddingHorizontal: wp(2), justifyContent: "center", marginBottom: hp(3) },
  attachIconWrapper: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center" },
  saveButton: { backgroundColor: "#438aff", borderRadius: 6, paddingVertical: hp(2), alignItems: "center" },
  saveButtonText: { color: "#fff", fontSize: wp(4.5), fontWeight: "600" },
});
