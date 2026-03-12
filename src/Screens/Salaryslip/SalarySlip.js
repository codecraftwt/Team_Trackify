import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage"

// Replace this with your actual BASE_URL import
import BASE_URL from "../../config/server" 

const SalarySlip = ({ navigation }) => { // Assume navigation prop is passed
  const [getmonthdata, setMonthData] = useState([]);
  const [getyeardata, setYearData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedYearId, setSelectedYearId] = useState(null);
  const [selectedMonthId, setSelectedMonthId] = useState(null);

  const [filteredMonths, setFilteredMonths] = useState([]);


  const decodeJWT = (token) => {
    try {
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error("JWT Decode Error:", error)
      return null
    }
  }

  const fetchmonthtData = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken")
      if (!token) return;

      const cleanToken = token.replace("Bearer ", "")

      const response = await fetch(`${BASE_URL}/Master/GetMonths`, {
        headers: { Authorization: `Bearer ${cleanToken}` },
      })

      if (!response.ok) throw new Error("Month data fetch failed")
      const data = await response.json()
      setMonthData(data);
    } catch (err) {
      console.error("Month Data Fetch Error:", err)
      setMonthData([]);
    }
  }

  const fetchYearData = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken")
      if (!token) return;

      const cleanToken = token.replace("Bearer ", "")

      const response = await fetch(`${BASE_URL}/Master/GetYears`, {
        headers: { Authorization: `Bearer ${cleanToken}` },
      })

      if (!response.ok) throw new Error("Year data fetch failed")
      const data = await response.json()
      setYearData(data);
    } catch (err) {
      console.error("Year Data Fetch Error:", err)
      setYearData([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchmonthtData(), fetchYearData()]);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (getyeardata.length > 0 && !selectedYearId) {
      const defaultYearId = getyeardata[0].yearId;
      setSelectedYearId(defaultYearId);
    }
  }, [getyeardata, selectedYearId]);


  useEffect(() => {
    if (selectedYearId) {
      const monthsForYear = getmonthdata.filter(
        month => month.yearId === selectedYearId
      );
      setFilteredMonths(monthsForYear);

      if (monthsForYear.length > 0) {
        setSelectedMonthId(monthsForYear[0].monthId);
      } else {
        setSelectedMonthId(null);
      }
    } else {
      setFilteredMonths([]);
      setSelectedMonthId(null);
    }
  }, [selectedYearId, getmonthdata]);


  const handleYearChange = (itemValue) => {
    setSelectedYearId(itemValue);
  };

  const handleMonthChange = (itemValue) => {
    setSelectedMonthId(itemValue);
  };

  const handlePreview = () => {
    if (!selectedYearId || !selectedMonthId) {
      Alert.alert("Selection Required", "Please select both a year and a month.");
      return;
    }

    navigation.navigate("SalarySlipScreen", {
      yearId: selectedYearId,
      monthId: selectedMonthId,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select Salary Slip Period</Text>
      
      {/* Year Picker */}
      <View style={styles.pickerContainer}>
        {/* The label is positioned absolutely */}
        <Text style={styles.pickerLabelFloat}>Select Year:</Text> 
        <Picker
          selectedValue={selectedYearId}
          onValueChange={handleYearChange}
          style={styles.picker}
        >
          {getyeardata.map((year) => (
            <Picker.Item 
              label={year.yearLabel.toString()} 
              value={year.yearId} 
              key={year.yearId} 
            />
          ))}
        </Picker>
      </View>

      {/* Month Picker */}
      <View style={styles.pickerContainer}>
        {/* The label is positioned absolutely */}
        <Text style={styles.pickerLabelFloat}>Select Month:</Text>
        <Picker
          selectedValue={selectedMonthId}
          onValueChange={handleMonthChange}
          style={styles.picker}
          enabled={filteredMonths.length > 0} 
        >
          {filteredMonths.length > 0 ? (
            filteredMonths.map((month) => (
              <Picker.Item 
                label={month.month1} 
                value={month.monthId} 
                key={month.monthId} 
              />
            ))
          ) : (
             <Picker.Item label="No Months Available" value={null} />
          )}
        </Picker>
      </View>

      {/* Preview Button */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={handlePreview}
        disabled={!selectedYearId || !selectedMonthId}
      >
        <Text style={styles.buttonText}>Preview Salary Slip</Text>
      </TouchableOpacity>
    </View>
  )
}

export default SalarySlip

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  // The outer container must have position: 'relative' for the absolute label
  pickerContainer: {
    marginBottom: 25, /* Increased margin to account for the label */
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    position: 'relative', // IMPORTANT for absolute positioning of the label
    paddingHorizontal: 5, // Reduced horizontal padding for better Picker display
    paddingTop: 10, // Added padding to push the Picker content down slightly
  },
  // This is the new floating label style
  pickerLabelFloat: {
    position: 'absolute',
    left: 10, // Adjust position from left
    top: -10, // Move 10 pixels up outside the border
    fontSize: 12, // Smaller font size
    color: '#555',
    backgroundColor: '#fff', // White background to cover the border
    paddingHorizontal: 5, // Small padding to make the cutout look clean
    zIndex: 10, // Ensure it's above the border
  },
  // Original pickerLabel style is removed as it's replaced by pickerLabelFloat
  picker: {
    height: 60, // Reduced height to look better with the new container padding
    width: '100%',
  },
  button: {
    backgroundColor: '#438AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})