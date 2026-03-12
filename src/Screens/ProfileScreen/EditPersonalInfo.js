"use client"

import { useState, useEffect } from "react"
import { Alert, Modal, FlatList } from "react-native"
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native"
import { Picker } from "@react-native-picker/picker"
import DateTimePicker from "@react-native-community/datetimepicker"
import Ionicons from "react-native-vector-icons/Ionicons"
import Button from "../../Component/Button"
import { useNavigation } from "@react-navigation/core"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen"
import BASE_URL from "../../config/server"
import { useRoute } from "@react-navigation/native"
import { jwtDecode } from "jwt-decode"

const CustomCheckbox = ({ value, onValueChange, label }) => {
  return (
    <TouchableOpacity style={styles.checkboxContainer} onPress={() => onValueChange(!value)}>
      <View style={[styles.customCheckbox, value && styles.customCheckboxChecked]}>
        {value && <Ionicons name="checkmark" size={wp("4%")} color="#fff" />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

const EditPersonalInfo = () => {
  const route = useRoute()
  const { employeeId } = route.params || {}
  const [roles, setRoles] = useState([])
  const [locationIds, setLocationIds] = useState({
    currentCityId: 0,
    currentStateId: 0,
    currentCountryId: 0,
    permanentCityId: 0,
    permanentStateId: 0,
    permanentCountryId: 0,
  })

  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])

  const formatDateDDMMYY = (date) => {
    if (!date) return ""
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0") // months are 0-indexed
    const year = String(date.getFullYear()) // full year
    return `${day}/${month}/${year}`
  }

  const [permanentCountries, setPermanentCountries] = useState([])
  const [permanentStates, setPermanentStates] = useState([])
  const [permanentCities, setPermanentCities] = useState([])

  const [showCurrentCountryModal, setShowCurrentCountryModal] = useState(false)
  const [searchCurrentCountryInput, setSearchCurrentCountryInput] = useState("")
  const [showCurrentStateModal, setShowCurrentStateModal] = useState(false)
  const [searchCurrentStateInput, setSearchCurrentStateInput] = useState("")
  const [showCurrentCityModal, setShowCurrentCityModal] = useState(false)
  const [searchCurrentCityInput, setSearchCurrentCityInput] = useState("")

  const [showPermanentCountryModal, setShowPermanentCountryModal] = useState(false)
  const [searchPermanentCountryInput, setSearchPermanentCountryInput] = useState("")
  const [showPermanentStateModal, setShowPermanentStateModal] = useState(false)
  const [searchPermanentStateInput, setSearchPermanentStateInput] = useState("")
  const [showPermanentCityModal, setShowPermanentCityModal] = useState(false)
  const [searchPermanentCityInput, setSearchPermanentCityInput] = useState("")

  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false)

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const authToken = await AsyncStorage.getItem("authToken")
        const cleanToken = authToken?.replace("Bearer ", "") || ""

        const response = await fetch(`${BASE_URL}/Master/GetCountries`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${cleanToken}`,
            "Content-Type": "application/json",
          },
        })

        const result = await response.json()
        // console.log("[v0] Countries API:", result)
        setCountries(result)
        setPermanentCountries(result)

        if (!response.ok) {
          throw new Error(`Failed to fetch countries, status: ${response.status}`)
        }
      } catch (error) {
        console.error("[v0] Error fetching countries:", error)
      }
    }

    fetchCountries()
  }, [])

  const handleCountryChange = (countryId, countryName) => {
    setFormData((prev) => ({
      ...prev,
      currentCityId: 0,
      currentStateId: 0,
      currentCountryId: countryId,
      currentCountry: countryName, // Store country name
      currentCity: "", // Clear city name
      currentState: "", // Clear state name
    }))
    const country = countries.find((c) => c.countryId.toString() === countryId.toString())
    setStates(country ? country.states || [] : [])
    setCities([])
  }

  const handleStateChange = (stateId, stateName) => {
    setFormData((prev) => ({
      ...prev,
      currentCityId: 0,
      currentStateId: stateId,
      currentState: stateName, // Store state name
      currentCity: "", // Clear city name
    }))
    const state = states.find((s) => s.stateId.toString() === stateId.toString())
    setCities(state ? state.cities || [] : [])
  }

  const handleCityChange = (cityId, cityName) => {
    setFormData((prev) => ({
      ...prev,
      currentCityId: cityId,
      currentCity: cityName, // Store city name
    }))
  }

  const handlePermanentCountryChange = (countryId, countryName) => {
    setFormData((prev) => ({
      ...prev,
      permanentCityId: 0,
      permanentStateId: 0,
      permanentCountryId: countryId,
      permanentCountry: countryName, // Store country name
      permanentCity: "", // Clear city name
      permanentState: "", // Clear state name
    }))
    const country = permanentCountries.find((c) => c.countryId.toString() === countryId.toString())
    setPermanentStates(country ? country.states || [] : [])
    setPermanentCities([])
  }

  const handlePermanentStateChange = (stateId, stateName) => {
    setFormData((prev) => ({
      ...prev,
      permanentCityId: 0,
      permanentStateId: stateId,
      permanentState: stateName, // Store state name
      permanentCity: "", // Clear city name
    }))
    const state = permanentStates.find((s) => s.stateId.toString() === stateId.toString())
    setPermanentCities(state ? state.cities || [] : [])
  }

  const handlePermanentCityChange = (cityId, cityName) => {
    setFormData((prev) => ({
      ...prev,
      permanentCityId: cityId,
      permanentCity: cityName, // Store city name
    }))
  }

  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    middleName: "",
    lastName: "",
    initials: "",
    mobileNumber: "",
    emergencyContact: "",
    currentAddress: "",
    currentCityId: 0,
    currentStateId: 0,
    currentCountryId: 0,
    currentPincode: "",
    permanentAddress: "",
    permanentCityId: 0,
    permanentStateId: 0,
    permanentCountryId: 0,
    permanentPincode: "",
    currentCity: "", // Added currentCity to formData
    currentDistrict: "",
    currentCountry: "", // Added currentCountry to formData
    currentState: "",
    permanentCity: "",
    permanentDistrict: "",
    permanentState: "",
    permanentCountry: "", // Added permanentCountry to formData
    gender: "",
    bloodGroup: "",
    maritalStatus: false,
    physicallyChallenged: false,
    roleID: "",
  })

  const [joiningDate, setJoiningDate] = useState(null)
  const [dob, setDob] = useState(null)
  const [showJoiningDate, setShowJoiningDate] = useState(false)
  const [showDob, setShowDob] = useState(false)
  const navigation = useNavigation()
  const [bloodGroups, setBloodGroups] = useState([])
  const [titles, setTitles] = useState([])

  useEffect(() => {
    const loadEmployeeData = async () => {
      try {
        const authToken = await AsyncStorage.getItem("authToken")
        const cleanToken = authToken?.replace("Bearer ", "") || ""

        const response = await fetch(`${BASE_URL}/Employee/GetEmployeeById?employeeId=${employeeId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${cleanToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch employee, status: ${response.status}`)
        }

        const result = await response.json()
        // console.log("[v0] Employee data:", result)

        const employee = result.employee || result

        const currentCountryName = countries.find((c) => c.countryId === employee.currentCountryId)?.name || ""
        const currentStateName =
          countries
            .find((c) => c.countryId === employee.currentCountryId)
            ?.states.find((s) => s.stateId === employee.currentStateId)?.name || ""
        const currentCityName =
          countries
            .find((c) => c.countryId === employee.currentCountryId)
            ?.states.find((s) => s.stateId === employee.currentStateId)
            ?.cities.find((ct) => ct.cityId === employee.currentCityId)?.name || ""

        const permanentCountryName =
          permanentCountries.find((c) => c.countryId === employee.permanentCountryId)?.name || ""
        const permanentStateName =
          permanentCountries
            .find((c) => c.countryId === employee.permanentCountryId)
            ?.states.find((s) => s.stateId === employee.permanentStateId)?.name || ""
        const permanentCityName =
          permanentCountries
            .find((c) => c.countryId === employee.permanentCountryId)
            ?.states.find((s) => s.stateId === employee.permanentStateId)
            ?.cities.find((ct) => ct.cityId === employee.permanentCityId)?.name || ""

        setFormData({
          title: employee.titleId?.toString() || "",
          firstName: employee.firstName || "",
          middleName: employee.middleName || "",
          lastName: employee.lastName || "",
          initials: employee.initials || "",
          mobileNumber: employee.mobileNo || "",
          email: employee.emailId || "",
          emergencyContact: employee.emergencyContactNo || "",
          currentAddress: employee.currentAddress || "",
          currentCityId: employee.currentCityId || 0,
          currentStateId: employee.currentStateId || 0,
          currentCountryId: employee.currentCountryId || 0,
          currentPincode: employee.currentPincode || "",
          permanentAddress: employee.permanentAddress || "",
          permanentCityId: employee.permanentCityId || 0,
          permanentStateId: employee.permanentStateId || 0,
          permanentCountryId: employee.permanentCountryId || 0,
          permanentPincode: employee.permanentPincode || "",
          currentCity: employee.currentCity || currentCityName, // Use fetched name
          currentDistrict: employee.currentDistrict || "",
          currentCountry: employee.currentCountry || currentCountryName, // Use fetched name
          currentState: employee.currentState || currentStateName, // Use fetched name
          permanentCity: employee.permanentCity || permanentCityName, // Use fetched name
          permanentDistrict: employee.permanentDistrict || "",
          permanentState: employee.permanentState || permanentStateName, // Use fetched name
          permanentCountry: employee.permanentCountry || permanentCountryName, // Use fetched name
          gender: employee.gender || "",
          bloodGroup: employee.bloodGroupId?.toString() || "",
          maritalStatus: employee.maritalStatus || false,
          physicallyChallenged: employee.physicallyChallenged || false,
          roleID: employee.roleID?.toString() || "",
        })

        setLocationIds({
          currentCityId: employee.currentCityId || 0,
          currentStateId: employee.currentStateId || 0,
          currentCountryId: employee.currentCountryId || 0,
          permanentCityId: employee.permanentCityId || 0,
          permanentStateId: employee.permanentStateId || 0,
          permanentCountryId: employee.permanentCountryId || 0,
        })

        if (employee.dob) {
          const dobDate = new Date(employee.dob)
          if (!isNaN(dobDate.getTime())) {
            setDob(dobDate)
          }
        }

        if (employee.currentCountryId) {
          const country = countries.find((c) => c.countryId === employee.currentCountryId)
          if (country) {
            setStates(country.states || [])
            if (employee.currentStateId) {
              const state = country.states.find((s) => s.stateId === employee.currentStateId)
              if (state) {
                setCities(state.cities || [])
              }
            }
          }
        }

        if (employee.permanentCountryId) {
          const country = permanentCountries.find((c) => c.countryId === employee.permanentCountryId)
          if (country) {
            setPermanentStates(country.states || [])
            if (employee.permanentStateId) {
              const state = country.states.find((s) => s.stateId === employee.permanentStateId)
              if (state) {
                setPermanentCities(state.cities || [])
              }
            }
          }
        }
      } catch (error) {
        console.error("[v0] Error loading employee data:", error)
        Alert.alert("Error", "Failed to load employee data")
      }
    }

    if (employeeId) {
      loadEmployeeData()
    }
  }, [employeeId, countries, permanentCountries])

  useEffect(() => {
    const fetchTitles = async () => {
      try {
        const authToken = await AsyncStorage.getItem("authToken")
        const cleanToken = authToken?.replace("Bearer ", "") || ""

        const response = await fetch(`${BASE_URL}/Master/GetTitles`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${cleanToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch titles, status: ${response.status}`)
        }

        const result = await response.json()
        setTitles(result)
      } catch (error) {
        console.error("[v0] Error fetching titles:", error)
      }
    }

    fetchTitles()
  }, [])

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const authToken = await AsyncStorage.getItem("authToken")
        const companyId = await AsyncStorage.getItem("companyId")
        const cleanToken = authToken?.replace("Bearer ", "") || ""
        const decoded = jwtDecode(cleanToken)
        const userId = await AsyncStorage.getItem("userId")

        if (!companyId) {
          console.warn("[v0] No companyId found in AsyncStorage")
          return
        }

        const response = await fetch(`${BASE_URL}/Master/GetRolesByCompanyId?companyId=${companyId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${cleanToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch roles, status: ${response.status}`)
        }

        const result = await response.json()
        setRoles(result)
      } catch (error) {
        console.error("[v0] Error fetching roles:", error)
      }
    }

    fetchRoles()
  }, [])

  useEffect(() => {
    const fetchBloodGroups = async () => {
      try {
        const authToken = await AsyncStorage.getItem("authToken")
        const cleanToken = authToken?.replace("Bearer ", "") || ""

        const response = await fetch(`${BASE_URL}/Master/GetBloodGroups`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${cleanToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch blood groups, status: ${response.status}`)
        }

        const result = await response.json()
        setBloodGroups(result)
      } catch (error) {
        console.error("[v0] Error fetching blood groups:", error)
      }
    }

    fetchBloodGroups()
  }, [])

  const handleSameAsCurrentAddress = (isChecked) => {
    setSameAsCurrentAddress(isChecked)
    if (isChecked) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        permanentAddress: prevFormData.currentAddress,
        permanentPincode: prevFormData.currentPincode,
        permanentCityId: prevFormData.currentCityId,
        permanentStateId: prevFormData.currentStateId,
        permanentCountryId: prevFormData.currentCountryId,
        permanentCity: prevFormData.currentCity,
        permanentDistrict: prevFormData.currentDistrict,
        permanentState: prevFormData.currentState,
        permanentCountry: prevFormData.currentCountry, // Copy country name
      }))

      const currentCountry = countries.find((c) => c.countryId === formData.currentCountryId)
      if (currentCountry) {
        setPermanentStates(currentCountry.states || [])
        const currentState = currentCountry.states.find((s) => s.stateId === formData.currentStateId)
        if (currentState) {
          setPermanentCities(currentState.cities || [])
        }
      }
    } else {
      setFormData((prevFormData) => ({
        ...prevFormData,
        permanentAddress: "",
        permanentPincode: "",
        permanentCityId: 0,
        permanentStateId: 0,
        permanentCountryId: 0,
        permanentCity: "",
        permanentDistrict: "",
        permanentState: "",
        permanentCountry: "", // Clear country name
      }))
      setPermanentStates([])
      setPermanentCities([])
    }
  }

  const handleSave = async () => {
    try {
      const authToken = await AsyncStorage.getItem("authToken")
      const cleanToken = authToken?.replace("Bearer ", "") || ""

      const getUserIdFromToken = () => {
        try {
          const decoded = jwtDecode(cleanToken)
          return Number.parseInt(decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]) || 0
        } catch (error) {
          console.error("[v0] Failed to decode token:", error)
          return 0
        }
      }

      const payload = {
        employeeId: Number.parseInt(employeeId) || 0,
        titleId: Number.parseInt(formData.title) || 0,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        initials: formData.initials,
        gender: formData.gender,
        dob: dob?.toISOString().split("T")[0],
        maritalStatus: formData.maritalStatus,
        bloodGroupId: Number.parseInt(formData.bloodGroup) || 0,
        physicallyChallenged: formData.physicallyChallenged,
        permanentAddress: formData.permanentAddress,
        permanentPincode: formData.permanentPincode,
        permanentCity: formData.permanentCity || "",
        permanentDistrict: formData.permanentDistrict || "",
        permanentState: formData.permanentState || "",
        permanentCountry: formData.permanentCountry || "", // Added permanentCountry to payload
        permanentCityId: Number.parseInt(formData.permanentCityId) || 0,
        permanentStateId: Number.parseInt(formData.permanentStateId) || 0,
        permanentCountryId: Number.parseInt(formData.permanentCountryId) || 0,
        currentAddress: formData.currentAddress,
        currentPincode: formData.currentPincode,
        currentCity: formData.currentCity || "",
        currentDistrict: formData.currentDistrict || "",
        currentState: formData.currentState || "",
        currentCountry: formData.currentCountry || "", // Added currentCountry to payload
        currentCityId: Number.parseInt(formData.currentCityId) || 0,
        currentStateId: Number.parseInt(formData.currentStateId) || 0,
        currentCountryId: Number.parseInt(formData.currentCountryId) || 0,
        emergencyContactNo: formData.emergencyContact,
        mobileNo: formData.mobileNumber,
        emailId: formData.email,
        roleId: Number.parseInt(formData.roleID) || 0,
        assigner: null,
        reportingTo: null,
        userId: getUserIdFromToken(),
        isDeleted: false,
        isActive: true,
      }

      // console.log("[v0] Payload:", JSON.stringify(payload, null, 2))

      const response = await fetch(`${BASE_URL}/Employee/AddUpdateEmployee`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const resultText = await response.text()
      // console.log("[v0] AddUpdateEmployee Response:", response.status, resultText)

      if (response.ok) {
        Alert.alert("Success", "Employee updated successfully", [{ text: "OK", onPress: () => navigation.goBack() }])
      } else {
        let errorMessage = `Failed to update\nStatus: ${response.status}`
        try {
          const errorData = JSON.parse(resultText)
          errorMessage += `\nError: ${errorData.message || errorData.title || resultText}`
        } catch {
          errorMessage += `\nResponse: ${resultText}`
        }
        Alert.alert("Error", errorMessage)
      }
    } catch (error) {
      console.error("[v0] Update error:", error)
      Alert.alert("Error", "Something went wrong while updating")
    }
  }

  // Filtered lists now use the modal search input states
  const filteredCurrentCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchCurrentCountryInput.toLowerCase()),
  )

  const filteredCurrentStates = states.filter((state) =>
    state.name.toLowerCase().includes(searchCurrentStateInput.toLowerCase()),
  )

  const filteredCurrentCities = cities.filter((city) =>
    city.name.toLowerCase().includes(searchCurrentCityInput.toLowerCase()),
  )

  const filteredPermanentCountries = permanentCountries.filter((country) =>
    country.name.toLowerCase().includes(searchPermanentCountryInput.toLowerCase()),
  )

  const filteredPermanentStates = permanentStates.filter((state) =>
    state.name.toLowerCase().includes(searchPermanentStateInput.toLowerCase()),
  )

  const filteredPermanentCities = permanentCities.filter((city) =>
    city.name.toLowerCase().includes(searchPermanentCityInput.toLowerCase()),
  )

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.subtitle}>
          Title <Text style={{ color: "red" }}>*</Text>
        </Text>
        <View style={styles.inputContainer}>
          <Picker
            selectedValue={formData.title}
            onValueChange={(itemValue) => setFormData({ ...formData, title: itemValue })}
            style={[styles.picker, { color: formData.title === "" ? "#9CA3AF" : "#212529" }]}
          >
            <Picker.Item label="Select Title" value="" color="#9CA3AF" />
            {titles.map((title) => (
              <Picker.Item key={title.titleId} label={title.title1} value={title.titleId.toString()} />
            ))}
          </Picker>
        </View>

        <Text style={styles.subtitle}>
          First Name <Text style={{ color: "red" }}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor="#d5d5d5"
          value={formData.firstName}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
        />

        <Text style={styles.subtitle}>
          Middle Name <Text style={{ color: "red" }}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Middle Name"
          placeholderTextColor="#d5d5d5"
          value={formData.middleName}
          onChangeText={(text) => setFormData({ ...formData, middleName: text })}
        />

        <Text style={styles.subtitle}>
          Last Name <Text style={{ color: "red" }}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor="#d5d5d5"
          value={formData.lastName}
          onChangeText={(text) => setFormData({ ...formData, lastName: text })}
        />

        <Text style={styles.subtitle}>
          Role <Text style={{ color: "red" }}>*</Text>
        </Text>
        <View style={styles.inputContainer}>
          <Picker
            selectedValue={formData.roleID}
            onValueChange={(itemValue) => setFormData({ ...formData, roleID: itemValue })}
            style={[styles.picker, { color: formData.roleID === "" ? "#9CA3AF" : "#212529" }]}
          >
            <Picker.Item label="Select Role" value="" />
            {roles.map((role) => (
              <Picker.Item key={role.roleId} label={role.role1} value={role.roleId.toString()} />
            ))}
          </Picker>
        </View>

        <Text style={styles.subtitle}>
          Initials <Text style={{ color: "red" }}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Initials"
          placeholderTextColor="#d5d5d5"
          value={formData.initials}
          onChangeText={(text) => setFormData({ ...formData, initials: text })}
        />

        <Text style={styles.subtitle}>Mobile number <Text style={{ color: "red" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Mobile Number"
          placeholderTextColor="#d5d5d5"
          keyboardType="numeric"
          value={formData.mobileNumber}
          onChangeText={(text) => setFormData({ ...formData, mobileNumber: text })}
        />

        <Text style={styles.section}>Personal Information</Text>

        <Text style={styles.subtitle}>Email ID <Text style={{ color: "red" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Email ID"
          placeholderTextColor="#d5d5d5"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
        />

        <View style={styles.rowfirst}>
          <View style={styles.halfInput}>
            <Text style={styles.subtitle}>
              Gender <Text style={{ color: "red" }}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Picker
                selectedValue={formData.gender}
                onValueChange={(itemValue) => setFormData({ ...formData, gender: itemValue })}
                style={[styles.picker, { color: formData.gender === "" ? "#d5d5d5" : "#000" }]}
              >
                <Picker.Item label="Select Gender" value="" />
                <Picker.Item label="Male" value="M" />
                <Picker.Item label="Female" value="F" />
              </Picker>
            </View>
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.subtitle}>Date of Birth <Text style={{ color: "red" }}>*</Text></Text>
            <TouchableOpacity onPress={() => setShowDob(true)} style={styles.datePicker}>
              <View style={styles.datePickerContent}>
                <Text style={{ flex: 1, color: dob ? "#000" : "#d5d5d5" }}>
                  {dob ? formatDateDDMMYY(dob) : "Select Date"}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#555" />
              </View>
            </TouchableOpacity>
            {showDob && (
              <DateTimePicker
                value={dob || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDob(false)
                  if (date) setDob(date)
                }}
              />
            )}
          </View>
        </View>

        <View style={styles.rowfirst}>
          <View style={styles.halfInput}>
            <Text style={styles.subtitle}>
              Blood Group <Text style={{ color: "red" }}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Picker
                selectedValue={formData.bloodGroup}
                onValueChange={(itemValue) => setFormData({ ...formData, bloodGroup: itemValue })}
                style={[styles.picker, { color: formData.bloodGroup === "" ? "#d5d5d5" : "#000" }]}
              >
                <Picker.Item label="Select Blood Group" value="" />
                {bloodGroups.map((bg) => (
                  <Picker.Item key={bg.bloodGroupId} label={bg.bloodGroup1} value={bg.bloodGroupId.toString()} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.halfInput}>
            <Text style={styles.subtitle}>
              Marital Status <Text style={{ color: "red" }}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Picker
                selectedValue={formData.maritalStatus ? "true" : "false"}
                onValueChange={(itemValue) => setFormData({ ...formData, maritalStatus: itemValue === "true" })}
                style={[styles.picker, { color: formData.maritalStatus === "" ? "#d5d5d5" : "#000" }]}
              >
                <Picker.Item label="Select Marital Status" value="" />
                <Picker.Item label="Single" value="false" />
                <Picker.Item label="Married" value="true" />
              </Picker>
            </View>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Do you have any disability? <Text style={{ color: "red" }}>*</Text>
        </Text>
        <View style={styles.inputContainer}>
          <Picker
            selectedValue={formData.physicallyChallenged ? "true" : "false"}
            onValueChange={(itemValue) => setFormData({ ...formData, physicallyChallenged: itemValue === "true" })}
            style={[styles.picker, { color: "#000" }]}
          >
            <Picker.Item label="No" value="false" />
            <Picker.Item label="Yes" value="true" />
          </Picker>
        </View>

        <Text style={styles.subtitle}>Emergency Contact <Text style={{ color: "red" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Emergency Contact"
          placeholderTextColor="#d5d5d5"
          keyboardType="numeric"
          value={formData.emergencyContact}
          onChangeText={(text) => setFormData({ ...formData, emergencyContact: text })}
        />

        <Text style={styles.section}>Current Address</Text>

        <Text style={styles.subtitle}>Address<Text style={{ color: "red" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Address"
          placeholderTextColor="#d5d5d5"
          value={formData.currentAddress}
          onChangeText={(text) => setFormData({ ...formData, currentAddress: text })}
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.subtitle}>Country<Text style={{ color: "red" }}>*</Text></Text>
            {/* Replaced Picker with TouchableOpacity and Modal for searchable dropdown */}
            <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setShowCurrentCountryModal(true)}>
              <Text style={{ color: formData.currentCountryId ? "#212529" : "#9ca3af" }}>
                {formData.currentCountry || "Select Country"}
              </Text>
              <Ionicons name="chevron-down" size={wp("4%")} color="#9ca3af" />
            </TouchableOpacity>

            <Modal
              visible={showCurrentCountryModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowCurrentCountryModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Search Country"
                    placeholderTextColor="#d5d5d5"
                    value={searchCurrentCountryInput}
                    onChangeText={setSearchCurrentCountryInput}
                  />
                  <FlatList
                    data={filteredCurrentCountries}
                    keyExtractor={(item) => item.countryId.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => {
                          handleCountryChange(item.countryId.toString(), item.name)
                          setShowCurrentCountryModal(false)
                          setSearchCurrentCountryInput("")
                        }}
                      >
                        <Text style={styles.modalItemText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => {
                      setShowCurrentCountryModal(false)
                      setSearchCurrentCountryInput("")
                    }}
                  >
                    <Text style={styles.modalCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          <View style={styles.halfWidth}>
            <Text style={styles.subtitle}>State<Text style={{ color: "red" }}>*</Text></Text>
            {/* Replaced Picker with TouchableOpacity and Modal for searchable dropdown */}
            <TouchableOpacity
              style={[styles.dropdownTrigger, !formData.currentCountryId && styles.disabledDropdown]}
              onPress={() => formData.currentCountryId && setShowCurrentStateModal(true)}
              disabled={!formData.currentCountryId}
            >
              <Text style={{ color: formData.currentStateId ? "#212529" : "#9ca3af" }}>
                {formData.currentState || "Select State"}
              </Text>
              <Ionicons name="chevron-down" size={wp("4%")} color="#9ca3af" />
            </TouchableOpacity>

            <Modal
              visible={showCurrentStateModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowCurrentStateModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Search State"
                    placeholderTextColor="#d5d5d5"
                    value={searchCurrentStateInput}
                    onChangeText={setSearchCurrentStateInput}
                  />
                  <FlatList
                    data={filteredCurrentStates}
                    keyExtractor={(item) => item.stateId.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => {
                          handleStateChange(item.stateId.toString(), item.name)
                          setShowCurrentStateModal(false)
                          setSearchCurrentStateInput("")
                        }}
                      >
                        <Text style={styles.modalItemText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => {
                      setShowCurrentStateModal(false)
                      setSearchCurrentStateInput("")
                    }}
                  >
                    <Text style={styles.modalCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.subtitle}>City<Text style={{ color: "red" }}>*</Text></Text>
            {/* Replaced Picker with TouchableOpacity and Modal for searchable dropdown */}
            <TouchableOpacity
              style={[styles.dropdownTrigger, !formData.currentStateId && styles.disabledDropdown]}
              onPress={() => formData.currentStateId && setShowCurrentCityModal(true)}
              disabled={!formData.currentStateId}
            >
              <Text style={{ color: formData.currentCityId ? "#212529" : "#9ca3af" }}>
                {formData.currentCity || "Select City"}
              </Text>
              <Ionicons name="chevron-down" size={wp("4%")} color="#9ca3af" />
            </TouchableOpacity>

            <Modal
              visible={showCurrentCityModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowCurrentCityModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Search City"
                    placeholderTextColor="#d5d5d5"
                    value={searchCurrentCityInput}
                    onChangeText={setSearchCurrentCityInput}
                  />
                  <FlatList
                    data={filteredCurrentCities}
                    keyExtractor={(item) => item.cityId.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => {
                          handleCityChange(item.cityId.toString(), item.name)
                          setShowCurrentCityModal(false)
                          setSearchCurrentCityInput("")
                        }}
                      >
                        <Text style={styles.modalItemText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => {
                      setShowCurrentCityModal(false)
                      setSearchCurrentCityInput("")
                    }}
                  >
                    <Text style={styles.modalCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          <View style={styles.halfWidth}>
            <Text style={styles.subtitle}>Pincode<Text style={{ color: "red" }}>*</Text></Text>
            <TextInput
              style={styles.inputpincode}
              placeholder="Pincode"
              placeholderTextColor="#d5d5d5"
              keyboardType="numeric"
              value={formData.currentPincode}
              onChangeText={(text) => setFormData({ ...formData, currentPincode: text })}
            />
          </View>
        </View>

        <Text style={styles.section}>Permanent Address</Text>
        <CustomCheckbox
          value={sameAsCurrentAddress}
          onValueChange={handleSameAsCurrentAddress}
          label="Same as Current Address"
        />

        <Text style={styles.subtitle}>Address<Text style={{ color: "red" }}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Address"
          placeholderTextColor="#d5d5d5"
          value={formData.permanentAddress}
          onChangeText={(text) => setFormData({ ...formData, permanentAddress: text })}
          editable={!sameAsCurrentAddress}
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.subtitle}>Country<Text style={{ color: "red" }}>*</Text></Text>
            {/* Replaced Picker with TouchableOpacity and Modal for searchable dropdown */}
            <TouchableOpacity
              style={[styles.dropdownTrigger, sameAsCurrentAddress && styles.disabledDropdown]}
              onPress={() => !sameAsCurrentAddress && setShowPermanentCountryModal(true)}
              disabled={sameAsCurrentAddress}
            >
              <Text style={{ color: formData.permanentCountryId ? "#212529" : "#9ca3af" }}>
                {formData.permanentCountry || "Select Country"}
              </Text>
              <Ionicons name="chevron-down" size={wp("4%")} color="#9ca3af" />
            </TouchableOpacity>

            <Modal
              visible={showPermanentCountryModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowPermanentCountryModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Search Country"
                    placeholderTextColor="#d5d5d5"
                    value={searchPermanentCountryInput}
                    onChangeText={setSearchPermanentCountryInput}
                  />
                  <FlatList
                    data={filteredPermanentCountries}
                    keyExtractor={(item) => item.countryId.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => {
                          handlePermanentCountryChange(item.countryId.toString(), item.name)
                          setShowPermanentCountryModal(false)
                          setSearchPermanentCountryInput("")
                        }}
                      >
                        <Text style={styles.modalItemText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => {
                      setShowPermanentCountryModal(false)
                      setSearchPermanentCountryInput("")
                    }}
                  >
                    <Text style={styles.modalCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
          <View style={styles.halfWidth}>
            <Text style={styles.subtitle}>State<Text style={{ color: "red" }}>*</Text></Text>
            {/* Replaced Picker with TouchableOpacity and Modal for searchable dropdown */}
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                (!formData.permanentCountryId || sameAsCurrentAddress) && styles.disabledDropdown,
              ]}
              onPress={() => !sameAsCurrentAddress && formData.permanentCountryId && setShowPermanentStateModal(true)}
              disabled={!formData.permanentCountryId || sameAsCurrentAddress}
            >
              <Text style={{ color: formData.permanentStateId ? "#212529" : "#9ca3af" }}>
                {formData.permanentState || "Select State"}
              </Text>
              <Ionicons name="chevron-down" size={wp("4%")} color="#9ca3af" />
            </TouchableOpacity>

            <Modal
              visible={showPermanentStateModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowPermanentStateModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Search State"
                    placeholderTextColor="#d5d5d5"
                    value={searchPermanentStateInput}
                    onChangeText={setSearchPermanentStateInput}
                  />
                  <FlatList
                    data={filteredPermanentStates}
                    keyExtractor={(item) => item.stateId.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => {
                          handlePermanentStateChange(item.stateId.toString(), item.name)
                          setShowPermanentStateModal(false)
                          setSearchPermanentStateInput("")
                        }}
                      >
                        <Text style={styles.modalItemText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => {
                      setShowPermanentStateModal(false)
                      setSearchPermanentStateInput("")
                    }}
                  >
                    <Text style={styles.modalCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.subtitle}>City<Text style={{ color: "red" }}>*</Text></Text>
            {/* Replaced Picker with TouchableOpacity and Modal for searchable dropdown */}
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                (!formData.permanentStateId || sameAsCurrentAddress) && styles.disabledDropdown,
              ]}
              onPress={() => !sameAsCurrentAddress && formData.permanentStateId && setShowPermanentCityModal(true)}
              disabled={!formData.permanentStateId || sameAsCurrentAddress}
            >
              <Text style={{ color: formData.permanentCityId ? "#212529" : "#9ca3af" }}>
                {formData.permanentCity || "Select City"}
              </Text>
              <Ionicons name="chevron-down" size={wp("4%")} color="#9ca3af" />
            </TouchableOpacity>

            <Modal
              visible={showPermanentCityModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowPermanentCityModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Search City"
                    placeholderTextColor="#d5d5d5"
                    value={searchPermanentCityInput}
                    onChangeText={setSearchPermanentCityInput}
                  />
                  <FlatList
                    data={filteredPermanentCities}
                    keyExtractor={(item) => item.cityId.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => {
                          handlePermanentCityChange(item.cityId.toString(), item.name)
                          setShowPermanentCityModal(false)
                          setSearchPermanentCityInput("")
                        }}
                      >
                        <Text style={styles.modalItemText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => {
                      setShowPermanentCityModal(false)
                      setSearchPermanentCityInput("")
                    }}
                  >
                    <Text style={styles.modalCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
          <View style={styles.halfWidth}>
            <Text style={styles.subtitle}>Pincode<Text style={{ color: "red" }}>*</Text></Text>
            <TextInput
              style={styles.inputpincode}
              placeholder="Pincode"
              placeholderTextColor="#d5d5d5"
              keyboardType="numeric"
              value={formData.permanentPincode}
              onChangeText={(text) => setFormData({ ...formData, permanentPincode: text })}
              editable={!sameAsCurrentAddress}
            />
          </View>
        </View>

        <View style={{ marginTop: hp("-10%") }}>
          <Button title="Save" backgroundColor="#438aff" onPress={handleSave} />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: hp("15%"),
    backgroundColor: "#f8f9fa",
    padding: wp("2%"),
  },
  container: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: wp("4%"),
    paddingTop: hp("0.01%"),
  },
  section: {
    fontSize: wp("4.5%"),
    fontWeight: "bold",
    marginVertical: hp("1%"),
    color: "#000000",
    marginLeft: wp("1.5%"),
  },
  subtitle: {
    fontSize: wp("3.5%"),
    color: "#374151",
    fontWeight: "500",
    marginBottom: hp("0.8%"),
    marginLeft: wp("2%"),
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: wp("2%"),
    paddingVertical: hp("1.5%"),
    paddingHorizontal: wp("3.5%"),
    marginBottom: hp("1.5%"),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: wp("3.8%"),
    color: "#212529",
  },
  inputpincode: {
    backgroundColor: "#ffffff",
    borderRadius: wp("2%"),
    paddingVertical: hp("1.2%"),
    paddingHorizontal: wp("3.5%"),
    marginBottom: hp("1.5%"),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: wp("3.8%"),
    color: "#212529",
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: wp("2%"),
    marginBottom: hp("1.5%"),
    backgroundColor: "#ffffff",
    height: hp("6%"),
    justifyContent: "center",
    paddingHorizontal: wp("2.5%"),
  },
  picker: {
    height: hp("8%"),
    width: "100%",
    fontSize: wp("3.5%"),
    color: "#212529",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: wp("3%"),
    marginBottom: hp("1.5%"),
  },
  halfWidth: {
    flex: 1,
  },
  datePicker: {
    backgroundColor: "#ffffff",
    paddingVertical: hp("1.5%"),
    paddingHorizontal: wp("3%"),
    borderRadius: wp("2%"),
    marginBottom: hp("1.5%"),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  datePickerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowfirst: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: wp("3%"),
    marginBottom: hp("1.5%"),
  },
  halfInput: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp("1.5%"),
    marginLeft: wp("2%"),
  },
  checkboxLabel: {
    marginLeft: wp("2%"),
    fontSize: wp("3.8%"),
    color: "#374151",
  },
  customCheckbox: {
    width: wp("5%"),
    height: wp("5%"),
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: wp("1%"),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  customCheckboxChecked: {
    backgroundColor: "#438aff",
    borderColor: "#438aff",
  },
  // New styles for searchable dropdown modal
  dropdownTrigger: {
    backgroundColor: "#ffffff",
    borderRadius: wp("2%"),
    paddingVertical: hp("1.5%"),
    paddingHorizontal: wp("3.5%"),
    marginBottom: hp("1.5%"),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  disabledDropdown: {
    backgroundColor: "#ffffff",
    borderColor: "#d5d5d5",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: wp("3%"),
    padding: wp("4%"),
    width: wp("90%"),
    maxHeight: hp("70%"),
  },
  modalSearchInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: wp("2%"),
    paddingVertical: hp("1.5%"),
    paddingHorizontal: wp("3.5%"),
    marginBottom: hp("1.5%"),
    fontSize: wp("3.8%"),
    color: "#212529",
  },
  modalItem: {
    paddingVertical: hp("1.5%"),
    paddingHorizontal: wp("3.5%"),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalItemText: {
    fontSize: wp("3.8%"),
    color: "#212529",
  },
  modalCloseButton: {
    marginTop: hp("2%"),
    backgroundColor: "#438aff",
    borderRadius: wp("2%"),
    paddingVertical: hp("1.5%"),
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#fff",
    fontSize: wp("4%"),
    fontWeight: "bold",
  },
})

export default EditPersonalInfo
