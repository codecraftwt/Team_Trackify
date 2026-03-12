import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert } from "react-native"
import { Picker } from "@react-native-picker/picker"
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen"
import AsyncStorage from "@react-native-async-storage/async-storage"
import BASE_URL from "../../config/server"
import { jwtDecode } from "jwt-decode"
import Geolocation from "@react-native-community/geolocation"
import DeviceInfo from "react-native-device-info"
import { NetworkInfo } from "react-native-network-info"
import axios from "axios"
import DateTimePicker from "@react-native-community/datetimepicker"


const AdminAttendenceshow = () => {
    const [employeeId, setEmployeeId] = useState("")
    const [mobileNo, setMobileNo] = useState("")
    const [name, setName] = useState("")
    const [department, setDepartment] = useState("")
    const [inTime, setInTime] = useState("")
    const [outTime, setOutTime] = useState("")
    const [workTime, setWorkTime] = useState("")
    const [status, setStatus] = useState("")
    const [statusOptions, setStatusOptions] = useState([])
    const [currentLocation, setCurrentLocation] = useState(null)
    const [showInPicker, setShowInPicker] = useState(false)
    const [showOutPicker, setShowOutPicker] = useState(false)
    const [employees, setEmployees] = useState([])
    const [workingDay, setWorkingDay] = useState(new Date())
    const [showDatePicker, setShowDatePicker] = useState(false)

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const token = await AsyncStorage.getItem("authToken")
                if (!token) {
                    console.warn("No token found in storage")
                    return
                }

                const res = await axios.get(`${BASE_URL}/Employee/GetEmployees`, {
                    headers: { Authorization: token }
                })

                const data = res.data
                const activeEmployees = data.filter(emp => emp.isActive && !emp.isDeleted)

                console.log("👥 Loaded Employees:")
                activeEmployees.forEach(emp => {
                    console.log(`ID: ${emp.employeeId}, Mobile: ${normalize(emp.mobileNo)} - ${emp.firstName}`)
                })

                setEmployees(activeEmployees)
            } catch (error) {
                console.error("Error fetching employees:", error)
            }
        }

        fetchEmployees()
    }, [])


    useEffect(() => {
        const fetchStatusOptions = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/Attendance/GetAllAttendenceMark`)
                if (response?.data) {
                    setStatusOptions(response.data.filter((item) => item.isActive && !item.isDeleted))
                }
            } catch (error) {
                console.error("Error fetching attendance status:", error)
            }
        }
        fetchStatusOptions()
        getCurrentLocation()
    }, [])

    const getCurrentLocation = () => {
        Geolocation.getCurrentPosition(
            (position) => {
                setCurrentLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                })
            },
            (error) => {
                console.error("Location Error:", error)
                setCurrentLocation({
                    latitude: 28.6139,
                    longitude: 77.209,
                })
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 60000,
            }
        )
    }

    const normalize = (num) => num?.replace(/\D/g, "").slice(-10)



    const formatTime12Hour = (date) => {
        let hours = date.getHours()
        const minutes = date.getMinutes()
        const ampm = hours >= 12 ? "PM" : "AM"
        hours = hours % 12
        hours = hours ? hours : 12
        const minutesStr = minutes < 10 ? `0${minutes}` : minutes
        return `${hours}:${minutesStr} ${ampm}`
    }

    const convertToIST = (date) => {
        const utc = date.getTime() + date.getTimezoneOffset() * 60000
        const istOffset = 5.5 * 60 * 60000
        return new Date(utc + istOffset)
    }

    const formatISTForBackend = (date) => {
        if (!date) return null
        const utc = date.getTime() + date.getTimezoneOffset() * 60000
        const istOffset = 5.5 * 60 * 60000
        const istDate = new Date(utc + istOffset)
        const pad = (n) => String(n).padStart(2, "0")
        return `${istDate.getFullYear()}-${pad(istDate.getMonth() + 1)}-${pad(istDate.getDate())}T${pad(istDate.getHours())}:${pad(istDate.getMinutes())}:${pad(istDate.getSeconds())}`
    }

    const parseTimeInput = (timeString, baseDate) => {
        if (!timeString) return null
        const [timePart, ampm] = timeString.split(" ")
        let [hours, minutes] = timePart.split(":").map(Number)

        if (ampm && ampm.toLowerCase() === "pm" && hours < 12) hours += 12
        if (ampm && ampm.toLowerCase() === "am" && hours === 12) hours = 0

        const newDate = new Date(baseDate)
        newDate.setHours(hours, minutes, 0, 0)
        return isNaN(newDate.getTime()) ? null : newDate
    }

    const reverseGeocode = async (latitude, longitude) => {
        try {
            return `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`
        } catch (error) {
            return `${latitude}, ${longitude}`
        }
    }

    const calculateWorkTime = (inTimeStr, outTimeStr) => {
        if (!inTimeStr || !outTimeStr) return ""

        const baseDate = new Date()

        const inDate = parseTimeInput(inTimeStr, baseDate)
        const outDate = parseTimeInput(outTimeStr, baseDate)

        if (!inDate || !outDate) return ""

        const diffMs = outDate - inDate

        if (diffMs <= 0) return ""  // Prevent negative or zero durations

        const hours = Math.floor(diffMs / (1000 * 60 * 60))
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} hrs`
    }

    useEffect(() => {
        if (inTime && outTime) {
            const calculated = calculateWorkTime(inTime, outTime)
            setWorkTime(calculated)
        } else {
            setWorkTime("")
        }
    }, [inTime, outTime])


    const getTicksFromWorkTime = (timeString) => {
        if (!timeString) return 0

        const [hoursStr, minutesStr] = timeString.split(":")
        const hours = parseInt(hoursStr)
        const minutes = parseInt(minutesStr)

        const totalMilliseconds = (hours * 60 + minutes) * 60 * 1000
        const ticks = totalMilliseconds * 10000

        return ticks
    }

    const convertWorkTimeToTimeSpan = (workTimeStr) => {
        if (!workTimeStr || typeof workTimeStr !== "string") return "00:00:00"

        const [timePart] = workTimeStr.split(" ")
        const [hoursStr, minutesStr] = timePart.split(":")
        const hours = parseInt(hoursStr, 10) || 0
        const minutes = parseInt(minutesStr, 10) || 0

        const pad = (n) => String(n).padStart(2, "0")
        return `${pad(hours)}:${pad(minutes)}:00`
    }



    const handleSubmit = async () => {
        // if (!employeeId || !mobileNo || !name || !department || !inTime || !outTime || !workTime || !status) {
        //     Alert.alert("Validation Error", "Please fill all fields")
        //     return
        // }

        try {
            const authToken = await AsyncStorage.getItem("authToken")
            const companyId = await AsyncStorage.getItem("companyId")
            const userId = await AsyncStorage.getItem("userId")
            const cleanToken = authToken?.replace("Bearer ", "") || ""
            const decoded = jwtDecode(cleanToken)
            const employeeIDFromToken = Number(decoded?.EmployeeId || userId)
            const currentISTDate = convertToIST(new Date())
            const macAddress = await DeviceInfo.getMacAddress()
            const ipAddress = await NetworkInfo.getIPAddress()

            if (!currentLocation) {
                await getCurrentLocation()
                await new Promise((resolve) => setTimeout(resolve, 1000))
            }
            const ticks = getTicksFromWorkTime(workTime)

            const finalLat = currentLocation?.latitude || null
            const finalLong = currentLocation?.longitude || null
            const finalAddress = finalLat && finalLong ? await reverseGeocode(finalLat, finalLong) : "Location not available"

            const parsedInTimeIST = parseTimeInput(inTime, currentISTDate)
            const parsedOutTimeIST = parseTimeInput(outTime, currentISTDate)

            const requestBody = {
                companyId: Number(companyId),
                attendancdDailyId: 0,
                employeeID: employeeIDFromToken,
                workingDay: workingDay.toISOString().split("T")[0],
                inTime: parsedInTimeIST ? formatISTForBackend(parsedInTimeIST) : null,
                outTime: parsedOutTimeIST ? formatISTForBackend(parsedOutTimeIST) : null,
                remark: status,
                clockTime: formatISTForBackend(currentISTDate),
                lat: finalLat,
                long: finalLong,
                address: finalAddress,
                workingHrs: convertWorkTimeToTimeSpan(workTime),
                macAddress: macAddress,
                ipAddress: ipAddress,
                attendanceStatus: status,
                isDeleted: false,
                isActive: true,
            }

            const response = await fetch(`${BASE_URL}/Attendance/AddUpdateAttendanceDaily`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${cleanToken}`,
                },
                body: JSON.stringify(requestBody),
            })
            console.log("Response Status:", response.status)
            console.log('attendence res:', response);

            if (response.ok) {
                const responseText = await response.text()
                Alert.alert("Success", "Attendance submitted successfully!")

                // 🔄 Clear form fields
                setMobileNo("")
                setEmployeeId("")
                setName("")
                setDepartment("")
                setInTime("")
                setOutTime("")
                setWorkTime("")
                setWorkingDay("")
                setStatus("")
            }
            else {
                const errorText = await response.text()
                Alert.alert("Error", `Submission failed:\n${response.status} - ${response.statusText}\n${errorText}`)
            }
        } catch (error) {
            Alert.alert("Error", `Failed to submit attendance: ${error.message}`)
        }
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.row}>
                <View style={styles.formGroupHalf}>
                    <Text style={styles.label}>Mobile No:</Text>
                    <TextInput
                        style={styles.input}
                        value={mobileNo}
                        onChangeText={(text) => {
                            setMobileNo(text)

                            const input = normalize(text)
                            const employee = employees.find(emp =>
                                normalize(emp.mobileNo) === input
                            )

                            console.log("🔍 Matching:", input)
                            if (employee) {
                                console.log("✅ Match found:", employee)
                                setEmployeeId(employee.employeeId.toString())
                                setName(`${employee.firstName} ${employee.middleName ?? ""} ${employee.lastName}`.trim())
                                setDepartment(employee.departmentName || "")
                            } else {
                                console.warn("❌ No match found")
                                setEmployeeId("")
                                setName("")
                                setDepartment("")
                            }
                        }}

                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.formGroupHalf}>
                    <Text style={styles.label}>Employee ID:</Text>
                    <TextInput
                        style={styles.input}
                        value={employeeId}
                        onChangeText={setEmployeeId}

                        keyboardType="numeric"
                    />
                </View>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Name:</Text>
                <TextInput style={styles.input} value={name} editable={false} />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Working Day:</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
                    <Text style={{ color: workingDay ? "#000" : "#999" }}>
                        {workingDay.toDateString()}
                    </Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={workingDay}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(Platform.OS === "ios")
                            if (selectedDate) {
                                setWorkingDay(selectedDate)
                            }
                        }}
                    />
                )}
            </View>

            <View style={styles.row}>
                <View style={styles.formGroupHalf}>
                    <Text style={styles.label}>In Time:</Text>
                    <TouchableOpacity onPress={() => setShowInPicker(true)} style={styles.input}>
                        <Text style={{ color: inTime ? "#212529" : "#9ca3af" }}>{inTime || "Select In Time"}</Text>
                    </TouchableOpacity>
                    {showInPicker && (
                        <DateTimePicker
                            value={new Date()}
                            mode="time"
                            is24Hour={false}
                            display="default"
                            onChange={(event, selectedDate) => {
                                if (Platform.OS !== "ios") setShowInPicker(false)
                                if (selectedDate) {
                                    const formattedInTime = formatTime12Hour(selectedDate)
                                    setInTime(formattedInTime)
                                    // ❌ No manual call to setWorkTime or calculateWorkTime here!
                                }
                            }}

                        />
                    )}
                </View>

                <View style={styles.formGroupHalf}>
                    <Text style={styles.label}>Out Time:</Text>
                    <TouchableOpacity onPress={() => setShowOutPicker(true)} style={styles.input}>
                        <Text style={{ color: outTime ? "#000" : "#999" }}>{outTime || "Select Out Time"}</Text>
                    </TouchableOpacity>
                    {showOutPicker && (
                        <DateTimePicker
                            value={new Date()}
                            mode="time"
                            is24Hour={false}
                            display="default"
                            onChange={(event, selectedDate) => {
                                if (Platform.OS !== "ios") setShowOutPicker(false)
                                if (selectedDate) {
                                    const formattedInTime = formatTime12Hour(selectedDate)
                                    setOutTime(formattedInTime)
                                    // ❌ No manual call to setWorkTime or calculateWorkTime here!
                                }
                            }}

                        />
                    )}
                </View>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Work Time:</Text>
                <TextInput
                    style={styles.input}
                    value={workTime}
                    editable={false}
                //    placeholder=" 08:00 hrs"
                />

            </View>

           <View style={styles.formGroup}>
    <Text style={styles.label}>Attendance Status:</Text>
    <View style={styles.pickerWrapper}>
        <Picker
            selectedValue={status}
            onValueChange={setStatus}
            style={[
                styles.picker,
                { color: status ? "#212529" : "#9ca3af" }, // <-- dynamic color
            ]}
            dropdownIconColor="#374151"
        >
            <Picker.Item label="Select status" value="" color="#9ca3af" />
            {statusOptions.map((option) => (
                <Picker.Item
                    key={option.id}
                    label={`${option.attendanceMarks} - ${option.attendanceType}`}
                    value={option.attendanceMarks.trim()}
                    color="#212529"
                />
            ))}
        </Picker>
    </View>
</View>


            <TouchableOpacity onPress={handleSubmit} style={styles.button}>
                <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#f8f9fa",
        flexGrow: 1,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 15,
    },
    formGroup: {
        marginBottom: 15,
    },
    formGroupHalf: {
        flex: 1,
    },
    label: {
        fontSize: Math.max(wp("3.8%"), 14),
        fontWeight: "600",
        marginBottom: 6,
        color: "#374151",
    },
    input: {
        backgroundColor: "#ffffff",
        borderRadius: wp("2%"),
        paddingVertical: hp("1.3%"),
        paddingHorizontal: wp("3.5%"),
        marginBottom: hp("0.3%"),
        borderWidth: 1,
        borderColor: "#E5E7EB",

        fontSize: Math.max(wp("3.8%"), 14),
        color: "#212529",
    },
    pickerWrapper: {
        backgroundColor: "#f5f6fa",
        borderRadius: 6,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        justifyContent: "center",

    },
    picker: {
        height: Platform.OS === "ios" ? 150 : 50,
        width: "100%",
        backgroundColor: "#ffffff",
        color: "#212529",
        fontSize: Math.max(wp("3.8%"), 14),
    },
    button: {
        marginTop: 15,
        backgroundColor: "#007bff",
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
})

export default AdminAttendenceshow
