// services/AttendanceService.js
import AsyncStorage from "@react-native-async-storage/async-storage"
import DeviceInfo from "react-native-device-info"
import { NetworkInfo } from "react-native-network-info"
import BASE_URL from "../config/server"
import { jwtDecode } from "jwt-decode"
import { getIndianTime } from "../Screens/utils/AttendanceUtils"
// 🔧 Helper: Convert to IST and format for backend
// const convertToIST = (date) => {
//   const utc = date.getTime() + date.getTimezoneOffset() * 60000
//   const offset = 5.5 // IST offset
//   return new Date(utc + 3600000 * offset)
// }

// services/AttendanceService.js

const formatISTForBackend = (date) => {
  // CRITICAL FIX: The 'date' object is already correct IST time from getIndianTime().
  // We format it directly.
  const d = date 
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}



// ✅ Main API function
export const callAttendanceLogAPI = async ({
  inTime = null,
  outTime = null,
  remark = "ClockedIn",
  workingHrsValue = null,
  imageFile = null,
  lat = null,
  long = null,
  address = null,
  workOutReason = "",
}) => {
  try {
    console.log("AttendanceService Received Raw Params:", {
        inTimeReceived: inTime,
        outTimeReceived: outTime,
        remarkReceived: remark,
    });
    const authToken = await AsyncStorage.getItem("authToken")
    const companyId = await AsyncStorage.getItem("companyId")
    const userId = await AsyncStorage.getItem("userId")
    const cleanToken = authToken?.replace("Bearer ", "") || ""
    const decoded = jwtDecode(cleanToken)
    const employeeID = Number(decoded?.EmployeeId || userId)
    if (!authToken || !companyId || !userId) {
      console.error("Missing token or user/company info")
      return false
    }

  const currentDate = getIndianTime() // Use the IST-correct date object
const workingDayStr = currentDate.toISOString().split("T")[0] // Extract YYYY-MM-DD
    const inTimeStr = inTime ? formatISTForBackend(inTime) : ""
    const outTimeStr = outTime ? formatISTForBackend(outTime) : ""

    // ✅ FIX: Use the same IST time for clockTime as inTime or outTime
    let clockTimeStr = ""
    if (remark === "ClockedOut" && outTime) {
      clockTimeStr = outTimeStr
    } else if (inTime) {
      clockTimeStr = inTimeStr
    } else {
      clockTimeStr = formatISTForBackend(currentDate)
    }

    const ip = await NetworkInfo.getIPAddress()
    const mac = await DeviceInfo.getDeviceId()

    const formData = new FormData()
    formData.append("companyId", Number(companyId))
    formData.append("attendancdDailyId", 0)
    formData.append("employeeID", employeeID)
    formData.append("workingDay", workingDayStr)
    formData.append("inTime", inTimeStr)
    formData.append("outTime", outTimeStr)
    formData.append("remark", remark)
    formData.append("WorkOutReason", workOutReason)
    formData.append("clockTime", clockTimeStr) // ✅ now consistent with IST
    formData.append("lat", lat || "")
    formData.append("long", long || "")
    formData.append("address", address || "Location not available")
    formData.append("macAddress", mac || "")
    formData.append("ipAddress", ip || "")
    formData.append("isDeleted", false)
    formData.append("isActive", true)

    if (imageFile && imageFile.uri) {
      formData.append("clockInImage", {
        uri: imageFile.uri,
        type: imageFile.type || "image/jpeg",
        name: imageFile.name || "attendance.jpg",
      })
    }

    console.log("Submitting attendance FormData:", formData)

    const response = await fetch(`${BASE_URL}/Attendance/AddUpdateAttendanceDaily`, {
      method: "POST",
      headers: { Authorization: authToken },
      body: formData,
    })

    const text = await response.text()
    console.log("Raw AddUpdateAttendanceDaily Response:", response.status, text)

    if (response.ok) {
      try {
        const data = JSON.parse(text)
        console.log("Attendance success:", data)
        return true
      } catch {
        return true
      }
    } else {
      console.error("Attendance API Error:", text)
      return false
    }
  } catch (err) {
    console.error("Attendance API error:", err)
    return false
  }
}
