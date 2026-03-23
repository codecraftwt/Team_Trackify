import AsyncStorage from "@react-native-async-storage/async-storage"
import BASE_URL from "../../config/server"


// Function to decode JWT token and extract claims
const decodeJWTToken = (token) => {
  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace("Bearer ", "")

    // Split the token and get the payload
    const base64Url = cleanToken.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )

    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error("Error decoding JWT token:", error)
    return null
  }
}

export const updateAttendanceDaily = async (isPunchIn, inTime = null, outTime = null) => {
  try {
    // Get authentication token
    const authToken = await AsyncStorage.getItem("authToken")
    const companyId = await AsyncStorage.getItem("companyId")
    const userId = await AsyncStorage.getItem("userId")

    if (!authToken) {
      throw new Error("Authentication token not found")
    }

    if (!companyId || !userId) {
      throw new Error("Company ID or User ID not found in storage")
    }

    // Decode token to get employee ID
    const tokenData = decodeJWTToken(authToken)
    const employeeId = tokenData?.EmployeeId || (await AsyncStorage.getItem("employeeId"))

    if (!employeeId) {
      throw new Error("Employee ID not found")
    }

    const currentDate = new Date()
    const requestBody = {
      companyId: Number.parseInt(companyId),
      attendancdDailyId: 0, // 0 for new entry
      employeeID: Number.parseInt(employeeId),
      workingDay: {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1, // JavaScript months are 0-indexed
        day: currentDate.getDate(),
      },
      inTime: isPunchIn ? inTime || currentDate.toISOString() : null,
      outTime: !isPunchIn ? outTime || currentDate.toISOString() : null,
      isDeleted: false,
      isActive: true,
    }

    // console.log("Attendance Request Body:", JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${BASE_URL}/Attendance/GetUpdateAttendanceDailyRequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken, // Use the full token with Bearer prefix
      },
      body: JSON.stringify(requestBody),
    })

    // console.log("API Response Status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API Error Response:", errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const data = await response.json()
    // console.log("API Success Response:", data)

    return {
      success: true,
      data: data,
      message: isPunchIn ? "Punched in successfully" : "Punched out successfully",
    }
  } catch (error) {
    console.error("Attendance API Error:", error)
    return {
      success: false,
      error: error.message,
      message: "Failed to update attendance",
    }
  }
}

// Function to get current attendance status
export const getCurrentAttendanceStatus = async () => {
  try {
    const authToken = await AsyncStorage.getItem("authToken")
    const companyId = await AsyncStorage.getItem("companyId")
    const userId = await AsyncStorage.getItem("userId")

    if (!authToken || !companyId || !userId) {
      return { success: false, error: "Missing required authentication data" }
    }

    // Decode token to get employee ID
    const tokenData = decodeJWTToken(authToken)
    const employeeId = tokenData?.EmployeeId

    if (!employeeId) {
      return { success: false, error: "Employee ID not found in token" }
    }

    // Get today's date
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1
    const day = today.getDate()

    // You might need to adjust this endpoint based on your actual API
    const response = await fetch(
      `${BASE_URL}/Attendance/GetAttendanceDaily?companyId=${companyId}&employeeId=${employeeId}&year=${year}&month=${month}&day=${day}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error("Get Attendance Status Error:", error)
    return { success: false, error: error.message }
  }
}

// Helper function to get user info from token
export const getUserInfoFromToken = async () => {
  try {
    const authToken = await AsyncStorage.getItem("authToken")
    if (!authToken) {
      return null
    }

    const tokenData = decodeJWTToken(authToken)
    return {
      name: tokenData?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
      email: tokenData?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"],
      userId: tokenData?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
      role: tokenData?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
      companyId: tokenData?.CompanyId,
      employeeId: tokenData?.EmployeeId,
    }
  } catch (error) {
    console.error("Error getting user info from token:", error)
    return null
  }
}
