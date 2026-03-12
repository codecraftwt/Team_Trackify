import { callAttendanceLogAPI } from "../../services/AttendanceService"

export const getIndianTime = () => {
  const now = new Date()
  
  // Calculate the time in UTC, then add the IST offset
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000 
  const offsetMs = 5.5 * 60 * 60 * 1000 
  
  return new Date(utcTime + offsetMs) 
}

// Format duration in ms to HH:mm:ss
export const formatDuration = (ms) => {
  if (!ms || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

// Format a Date (or null) as 12-hour hh:mm AM/PM
export const formatTo12Hour = (date) => {
  if (!date) return "--:--"
  const d = date instanceof Date ? date : new Date(date)
  let hours = d.getHours()
  const minutes = d.getMinutes()
  const ampm = hours >= 12 ? "PM" : "AM"
  hours = hours % 12
  hours = hours ? hours : 12 // 0 -> 12
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`
}

// Parse "HH:mm:ss" or "HH:mm:ss.ffffffff" to milliseconds
export const toMsFromHHMMSS = (t) => {
  if (!t || typeof t !== "string") return 0
  const [hms] = t.split(".")
  const parts = hms.split(":").map((n) => Number.parseInt(n || "0", 10))
  const [h = 0, m = 0, s = 0] = parts
  const ms = (h * 3600 + m * 60 + s) * 1000
  return isNaN(ms) ? 0 : ms
}

// Generic markAttendance for quick actions (if you still need it)
// action: "BreakIn" | "BreakOut" | "WorkOutStart" | "WorkOutEnd" | "ClockedIn" | "ClockedOut"
export const markAttendance = async (action, lat = null, long = null, address = null, reason = "") => {
  // const now = getIndianTime()
  const payload = {
    remark: action,
inTime: action === "ClockedIn" || action.endsWith("Start") ? new Date() : null,
    outTime: action === "ClockedOut" || action.endsWith("End") ? new Date() : null,
    lat,
    long,
    address,
    workOutReason: reason || "",
    imageFile: null,
  }
  return await callAttendanceLogAPI(payload)
}
