import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { Buffer } from "buffer";
import BASE_URL from "../../config/server";
import AdminRequestPage from './AdminRequestPage';
import AsyncStorage from "@react-native-async-storage/async-storage";
import ImageResizer from "react-native-image-resizer";
import RNFS from "react-native-fs";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
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


export default function AdminLoanRequest({ navigation }) {
  const [assignerId, setAssignerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decoded, setDecoded] = useState(null);
  const [years, setYears] = useState([]);
  const [months, setMonths] = useState([]);

  // Fetch years from API
  useEffect(() => {
    const loadYears = async () => {
      try {
        const res = await fetch(`${BASE_URL}/Master/GetYears`);
        const data = await res.json();
        setYears(data);
      } catch (err) {
        console.error("Failed to fetch years", err);
      }
    };
    loadYears();
  }, []);

  useEffect(() => {
    const loadMonths = async () => {
      try {
        const res = await fetch(`${BASE_URL}/Master/GetMonths`); // ✅ corrected endpoint
        const data = await res.json();
        setMonths(data);
      } catch (err) {
        console.error("Failed to fetch months", err);
      }
    };
    loadMonths();
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
      title="Loan Request"
      fetchUrl={`${BASE_URL}/Loan/GetLoanRequests?assignerId=${assignerId}`}
      updateUrl={`${BASE_URL}/Loan/AddUpdateLoanApplication`}
      mapItem={async (item) => ({
        id: item.applicationId.toString(),
        name: item.employeeName,
        Requested: item.applicationDate,
        subtitle: `Requested -${formatDate(item.applicationDate)}`,
        status: item.status,
        avatar: item.employeeImage
          ? `data:image/jpeg;base64,${item.employeeImage}` // use API base64 image
          : "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.employeeName),
        ...item
      })}
      buildDetailsFields={(item) => [
        { label: "Application No", value: item.applicationNo || "-" },
        { label: "Applied On", value: item.applicationDate || "-" },
        { label: "Loan Type", value: item.loanTypeName },
        { label: "Loan Amount", value: `₹${item.loanAmount}` },
        { label: "Contact Number", value: item.contactNumber || "-" },
        { label: "Reason", value: item.reason || "-" },
        { label: "Status", value: item.status },
        { label: "Approved By", value: item.approvedBy || "-" },

      ]}
      buildPayload={(item, newStatus) => {
  const applicationDate = item.applicationDate ? new Date(item.applicationDate) : new Date();

  // Determine YearId
  let yearId = item.yearId ?? applicationDate.getFullYear();
  const yearMatch = years.find((y) => y.yearLabel === yearId.toString());
  yearId = yearMatch?.yearId ?? yearId;

  // Determine MonthId
  let monthId = item.monthId ?? applicationDate.getMonth() + 1;

  // Determine if disbursed and date
  const isDisbursed = item.isDisbursed ?? false;
  const disbursementDate = isDisbursed
    ? item.disbursementDate ?? new Date().toISOString().split("T")[0]
    : null;

  return {
    companyId: Number(decoded?.CompanyId ?? item.companyId ?? 0),
    yearId: Number(yearId),
    monthId: Number(monthId),
    applicationId: Number(item.applicationId),
    applicationNo: item.applicationNo ?? "",
    applicationDate: item.applicationDate ?? new Date().toISOString().split("T")[0],
    employeeId: Number(item.employeeId),
    loanTypeId: Number(item.loanTypeId ?? 1),
    loanAmount: Number(item.loanAmount ?? 20000),   // provide default
    reason: item.reason ?? "medical",               // provide default
    status: newStatus,
    isDisbursed: Boolean(isDisbursed),
    disbursementDate: disbursementDate,
    reference: item.reference ?? "",
    emiamount: Number(item.emiAmount ?? 1000),
    emistartDate: item.emiStartDate ?? new Date().toISOString().split("T")[0],
    loanBalanceAmount: Number(item.loanBalanceAmount ?? item.loanAmount ?? 20000),
    isDeleted: Boolean(item.isDeleted ?? false),
    isActive: Boolean(item.isActive ?? true),
    updateLoginId: Number(decoded?.assignerId),

  };
}}



    />
  );
}
