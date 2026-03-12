import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { Buffer } from "buffer";
import BASE_URL from "../../config/server";
import AdminRequestPage from "./AdminRequestPage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ImageResizer from "react-native-image-resizer";
import RNFS from "react-native-fs";

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB");
};

const decodeJWT = (token) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
  } catch (e) {
    console.log("JWT decode error", e);
    return null;
  }
};

export default function AdminLeaveRequest({ navigation }) {
  const [assignerId, setAssignerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decoded, setDecoded] = useState(null);
  const [years, setYears] = useState([]);

  // Fetch years from API
  useEffect(() => {
    const loadYears = async () => {
      try {
        const res = await fetch(`${BASE_URL}/Master/GetYears`);
        const data = await res.json();
        setYears(data); // [{ yearId: 1, yearLabel: "2025" }, ...]
      } catch (err) {
        console.error("Failed to fetch years", err);
      }
    };
    loadYears();
  }, []);

  // Load JWT and assignerId
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

  // Image resizing utility
  const resizeImage = async (base64Data) => {
    if (!base64Data) return null;
    try {
      const path = `${RNFS.CachesDirectoryPath}/temp_${Date.now()}.jpg`;
      await RNFS.writeFile(path, base64Data, "base64");
      const resized = await ImageResizer.createResizedImage(
        `file://${path}`,
        60,
        60,
        "JPEG",
        70
      );
      const resizedBase64 = await RNFS.readFile(resized.uri, "base64");
      await RNFS.unlink(path);
      return `data:image/jpeg;base64,${resizedBase64}`;
    } catch (err) {
      console.error("Image resize error", err);
      return null;
    }
  };

  if (loading || !assignerId) return null;

  return (
    <AdminRequestPage
      navigation={navigation}
      title="Leave Request"
      fetchUrl={`${BASE_URL}/Leave/GetLeaveRequests?assignerId=${assignerId}`}
      assignerId={assignerId}
      updateUrl={`${BASE_URL}/Leave/AddUpdateLeaveApplications`}
      mapItem={async (item) => ({
        id: item.applicationId.toString(),
        name: item.employeeName,
        subtitle: `Requested - ${formatDate(item.fromDate)} to ${formatDate(
          item.toDate
        )}`,
        status: item.status,
         avatar: item.employeeImage
          ? `data:image/jpeg;base64,${item.employeeImage}` // use API base64 image
          : "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.employeeName),
        applicationId: item.applicationId,
        applicationNo: item.applicationNo,
        applicationDate: item.applicationDate,
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        employeeImage: item.employeeImage,
        contactNumber: item.contactNumber,
        leaveTypeId: item.leaveTypeId,
        leaveTypeName: item.leaveTypeName,
        fromDate: item.fromDate,
        toDate: item.toDate,
        reason: item.reason,
        remark: item.remark,
        approvedBy: item.approvedBy,
        isDeleted: item.isDeleted,
        isActive: item.isActive,
      })}
      buildDetailsFields={(item) => [
        { label: "Application No", value: item.applicationNo || "-" },
        { label: "Applied On", value: item.applicationDate || "-" },
        { label: "Leave Type", value: item.leaveTypeName },
        { label: "Date From", value: item.fromDate || "-" },
        { label: "Date To", value: item.toDate || "-" },
        { label: "Reason", value: item.reason || "-" },
        { label: "Remark", value: item.remark || "-" },
        { label: "Contact Number", value: item.contactNumber || "-" },
        { label: "Status", value: item.status },
        { label: "Approved By", value: item.approvedBy || "-" },
      ]}
      buildPayload={(item, newStatus) => {
        const leaveStart = new Date(item.fromDate ?? item.FromDate);

        // Determine YearId
        let yearId = item.YearID ?? item.yearId;
        if (!yearId || yearId === 0) {
          const appYear = leaveStart.getFullYear();
          const yearMatch = years.find((y) => y.yearLabel === appYear.toString());
          yearId = yearMatch?.yearId ?? appYear;
        }

        // Determine MonthId
        let monthId = item.MonthID ?? item.monthId;
        if (!monthId || monthId === 0) monthId = leaveStart.getMonth() + 1;

        return {
          CompanyId: decoded?.CompanyId ?? item.companyId ?? 0,
          YearId: yearId,
          MonthId: monthId,
          ApplicationId: item.applicationId,
          ApplicationNo: item.applicationNo,
          ApplicationDate:
            item.applicationDate || new Date().toISOString().split("T")[0],
          EmployeeId: item.employeeId,
          LeaveTypeId: item.leaveTypeId,
          FromDate: item.fromDate,
          ToDate: item.toDate,
          Reason: item.reason ?? "",
          Status: newStatus,
          IsDeleted: item.isDeleted ?? false,
          IsActive: item.isActive ?? true,
        };
      }}
    />
  );
}
