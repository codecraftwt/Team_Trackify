import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Replace with your actual import path
import BASE_URL from "../../config/server"; 

// --- Utility Function for JWT Decoding (Same as in SalarySlip) ---
// const decodeJWT = (token) => {
//     try {
//         const base64Url = token.split(".")[1]
//         const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
//         const jsonPayload = decodeURIComponent(
//             atob(base64)
//                 .split("")
//                 .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
//                 .join(""),
//         )
//         return JSON.parse(jsonPayload)
//     } catch (error) {
//         console.error("JWT Decode Error:", error)
//         return null
//     }
// }

const EmployeeListScreen = ({ route }) => {
    // Retrieve the status passed from the FaceEnrolled component
    const { enrollmentStatus } = route.params; 

    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // --- API Fetch Function ---
    const fetchEmployees = useCallback(async (status) => {
        // Set loading state based on whether it's an initial load or a refresh
        if (status === 'refresh') {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        
        try {
            const token = await AsyncStorage.getItem("authToken");
            if (!token) throw new Error("Authentication token not found.");

            const cleanToken = token.replace("Bearer ", "");
            // Optional: Decode JWT to get employee details if needed for the API call
            // const decoded = decodeJWT(cleanToken);

            // Construct the URL with the status filter
            // Adjust the API endpoint and query parameter name as per your backend
            const apiUrl = `${BASE_URL}/Employees/GetByEnrollmentStatus?status=${status}`; 
            console.log("apiUrl",apiUrl);
            
            const response = await fetch(apiUrl, {
                headers: { 
                    Authorization: `Bearer ${cleanToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                // const errorText = await response.text();
                // throw new Error(`Failed to fetch data: ${response.status} - ${errorText}`);
                // Read the response as text, as it's likely an error message (HTML/Text)
    const errorText = await response.text();
    console.error(`HTTP Error Status ${response.status} for ${status}:`, errorText.substring(0, 150) + '...');
    
    // Throw a specific error for debugging
    throw new Error(`Server returned HTTP ${response.status}. Expected JSON, but got: ${errorText.substring(0, 50)}...`);
            }
            
            const data = await response.json();
            
            // Assuming the API returns an array of employee objects
            setEmployees(data); 

        } catch (error) {
            console.error("Employee Fetch Error:", error);
            Alert.alert("Error", `Could not load employee data. ${error.message}`);
            setEmployees([]);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // --- Effects ---
    
    // 1. Initial Data Fetch based on the passed status
    useEffect(() => {
        if (enrollmentStatus) {
            // Map the display label to the API key if necessary (e.g., 'Processing' -> 'PENDING')
            // For simplicity, we use the display label directly here.
            fetchEmployees(enrollmentStatus);
        }
    }, [enrollmentStatus, fetchEmployees]); // Dependency array includes the status and fetch function

    // 2. Refresh handler
    const handleRefresh = () => {
        fetchEmployees(enrollmentStatus, 'refresh');
    };

    // --- Render Items and Components ---
    
    const renderEmployeeItem = ({ item }) => (
        <View style={styles.employeeItem}>
            {/* Replace 'name', 'code', and 'enrollmentDate' with your actual employee object keys */}
            <Text style={styles.nameText}>{item.name || "Employee Name"}</Text>
            <Text style={styles.detailText}>Code: {item.code || "N/A"}</Text>
            <Text style={styles.detailText}>Enrolled: {item.enrollmentDate || "N/A"}</Text>
        </View>
    );

    // --- Render ---

    if (isLoading && !isRefreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading {enrollmentStatus} employees...</Text>
            </View>
        );
    }
    
    return (
        <View style={styles.container}>
            <Text style={styles.header}>
                Employee List - {enrollmentStatus} ({employees.length})
            </Text>

            {employees.length === 0 && !isLoading ? (
                <Text style={styles.noDataText}>No employees found with status: {enrollmentStatus}.</Text>
            ) : (
                <FlatList
                    data={employees}
                    keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                    renderItem={renderEmployeeItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            colors={['#007AFF']}
                        />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        textAlign: 'center',
        color: '#333',
    },
    listContent: {
        padding: 10,
    },
    employeeItem: {
        backgroundColor: '#fff',
        padding: 15,
        marginVertical: 6,
        borderRadius: 8,
        borderLeftWidth: 5,
        borderLeftColor: '#007AFF', // Highlight color
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    nameText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        color: '#222',
    },
    detailText: {
        fontSize: 14,
        color: '#666',
    },
    noDataText: {
        textAlign: 'center',
        marginTop: 30,
        fontSize: 16,
        color: '#888',
    }
});

export default EmployeeListScreen;