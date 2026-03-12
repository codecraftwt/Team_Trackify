import { useEffect, useState } from "react";
import { Alert } from "react-native";
import AdminRequestPage from './AdminRequestPage';
import BASE_URL from "../../config/server";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB");
};

const decodeJWT = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    return decoded;
  } catch (e) {
    console.log("JWT decode error", e);
    return null;
  }
};

export default function AdminShiftRequest({ navigation }) {
  const [assignerId, setAssignerId] = useState(null)
  const [loading, setLoading] = useState(true)
 const [decoded, setDecoded] = useState(null);
   useEffect(() => {
    const loadAssignerId = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          Alert.alert("Error", "User not logged in");
          setLoading(false);
          return;
        }

        const jwtDecoded = decodeJWT(token);
        if (!jwtDecoded?.EmployeeId) {
          Alert.alert("Error", "Employee ID missing from token");
          setLoading(false);
          return;
        }

        setDecoded(jwtDecoded);
        setAssignerId(jwtDecoded.EmployeeId);
        setLoading(false);
      } catch (err) {
        console.error("Error loading assigner ID:", err);
        Alert.alert("Error", "Failed to load user data");
        setLoading(false);
      }
    };
    loadAssignerId();
  }, []);
  const resizeImage = async (base64Data) => {
    try {
      if (!base64Data) return null;

      // Ensure proper temp file path
      const path = `${RNFS.CachesDirectoryPath}/temp_${Date.now()}.jpg`;

      // Write the base64 data
      await RNFS.writeFile(path, base64Data, "base64");

      // Resize image
      const resized = await ImageResizer.createResizedImage(`file://${path}`, 60, 60, "JPEG", 70);

      // Convert resized image back to base64
      const resizedBase64 = await RNFS.readFile(resized.uri, "base64");

      // Clean up temporary file
      await RNFS.unlink(path);

      return `data:image/jpeg;base64,${resizedBase64}`;
    } catch (err) {
      console.error("Image resize error", err);
      return null;
    }
  };


  // Show loading state while getting assignerId
  if (loading) {
    return null // You could return a loading spinner here
  }

  // Don't render if no assignerId
  if (!assignerId) {
    return null
  }


  return (
    <AdminRequestPage
      navigation={navigation}
      title="Shift Requests"
      fetchUrl={`${BASE_URL}/Master/GetShiftRequests?managerId=${assignerId}`}
      updateUrl={`${BASE_URL}/Master/AddUpdateShiftRequest`}
      mapItem={(item) => ({
        id: item.shiftRequestID.toString(),
        name: item.employeeName, // use API employeeName
        subtitle: `Requested - ${formatDate(item.shiftFrom)} to ${formatDate(item.shiftTo)}`,
        status: item.status, // API already has Pending/Approved/Rejected
         avatar: item.employeeImage
          ? `data:image/jpeg;base64,${item.employeeImage}` // use API base64 image
          : "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.employeeName),
        ...item
      })}

      buildDetailsFields={(item) => [
        { label: "Shift Type", value: item.shiftTypeName },
        { label: 'Shift From', value: formatDate(item.shiftFrom) },
        { label: 'Shift To', value: formatDate(item.shiftTo) },
        { label: 'Description', value: item.description },
        //   { label: "Reason", value: item.reason || "-" },
        // { label: "Remark", value: item.remark || "-" },
        { label: "Contact Number", value: item.contactNumber || "-" },
        { label: "Status", value: item.status },
        { label: "Approved By", value: item.approvedBy || "-" },

      ]}
      buildPayload={(item, newStatus) => ({
        CompanyId: decoded?.CompanyId ?? item.companyId ?? 0,
        shiftRequestID: item.shiftRequestID ?? 0, // 0 = new request
        shiftID: item.shiftID,                // maps to backend "shiftID"
        employeeID: item.employeeId,
        shiftFrom: item.shiftFrom,
        shiftTo: item.shiftTo,
        description: item.description ?? "",
        status: item.shiftRequestID > 0 ? newStatus : undefined,
        assignedTo: assignerId,
        isActive: item.isActive ?? true,
        isDeleted: item.isDeleted ?? false,
      })}

    />


  );
}
