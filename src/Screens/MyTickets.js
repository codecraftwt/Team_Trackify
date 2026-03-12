import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator, // 👈 Added for loading state
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import BASE_URL from "../config/server"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { SafeAreaView } from "react-native-safe-area-context"
// Helper function to format dates and times
const formatDateTime = (dateString, format = 'date') => {
  if (!dateString || dateString.startsWith('0001')) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date)) return null;

    if (format === 'date') {
      // Example: 'Feb 12 - Feb 13, 2025' or 'Mar 1, 2025'
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } else if (format === 'time') {
      // Example: 'Feb 11, 7:29 pm'
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }) + ', ' + date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  } catch (e) {
    console.error("Date formatting error:", e);
    return null;
  }
};


const MyTickets = () => {
  // NOTE: Changed default status to uppercase for tab consistency, 
  // but keeping it lowercase 'Pending' in fetch for safety if API is case-sensitive
  const [selectedTab, setSelectedTab] = useState('PENDING'); 
  const [tickedata, setTicketData] = useState([]); // Renamed from setSelectedticketdata for clarity
  const [isLoading, setIsLoading] = useState(true);
  
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

  const fetchticketData = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken")
      if (!token) {
        setIsLoading(false);
        return;
      }

      const cleanToken = token.replace("Bearer ", "")
      const decoded = decodeJWT(cleanToken)
      const employeeId = decoded?.EmployeeId
      if (!employeeId) {
        setIsLoading(false);
        return;
      }

      // API status parameter should match the tab key (PENDING -> Pending)
      const apiStatus = selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1).toLowerCase();

      const response = await fetch(`${BASE_URL}/Payroll/GetMyTickets?employeeId=${employeeId}&status=${apiStatus}`, {
        headers: { Authorization: `Bearer ${cleanToken}` },
      })

      if (!response.ok) throw new Error("Ticket fetch failed")
      
      const data = await response.json()
      console.log("ticket data", data);

      setTicketData(data); // 👈 Set the API response data to state

    } catch (err) {
      console.error("Ticket Fetch Error:", err)
      setTicketData([]); // Clear data on error
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
  }

  useEffect(() => {
    fetchticketData();
  }, [selectedTab]); // 👈 Run on mount AND whenever the tab changes


  // --- Data Transformer Function ---
  const transformTicketData = (apiData) => {
    return apiData.map(item => {
      // Determine date range text
      let dateRangeText = formatDateTime(item.fromDate, 'date');
      if (item.toDate && !item.toDate.startsWith('0001') && item.toDate !== item.fromDate) {
        dateRangeText += ' - ' + formatDateTime(item.toDate, 'date');
      }

      // Format amount
      const formattedAmount = item.amount ? 
        (Number(item.amount) / 1000).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ',000' // Simple mock formatting for amount
        : null;

      return {
        // Map API properties to UI properties
        title: item.type,
        dateRange: dateRangeText,
        time: formatDateTime(item.requestedOn, 'time'),
        // approver: item.assignedTo || 'N/A',
        approver: item.assignedTo || null,
        amount: formattedAmount,
        requestNote: item.shiftName, // Using shiftName for requestNote/subtitle if present
        // You may need to add other fields like 'remark' if your UI needs them
      };
    });
  };
  // ---------------------------------


  // NOTE: Remove the old hardcoded 'ticketData' object or modify it to ONLY be a fallback
  // if you want to keep it. For now, we'll rely only on 'tickedata' state.

  // The data to render in the ScrollView is now the transformed tickedata
  const ticketsToRender = transformTicketData(tickedata); 
  
  // Update the tab change handler to ensure API call runs with correct status
  const handleTabChange = (tab) => {
      setSelectedTab(tab);
  };

 
  return (
   <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              selectedTab === tab && {
                backgroundColor:
                  tab === 'PENDING'
                    ? '#f9a825'
                    : tab === 'APPROVED'
                    ? '#34A853'
                    : '#C6303E',
              },
            ]}
            onPress={() => handleTabChange(tab)} // Use handleTabChange
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && { color: '#fff', fontWeight: 'bold' },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tickets */}
      // ...
      {/* Tickets */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {isLoading ? (
            <ActivityIndicator size="large" color="#f9a825" style={{ marginTop: 50 }} />
        ) : ticketsToRender.length === 0 ? (
            <Text style={styles.noDataText}>No {selectedTab.toLowerCase()} tickets found.</Text>
        ) : (
            ticketsToRender.map((item, index) => (
                <View key={index} style={styles.ticketCard}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.ticketTitle}>{item.title}</Text>
                        <Text style={styles.ticketTime}>{item.time}</Text>
                    </View>

                    {/* 1. Date Range (Always renders if available) */}
                    {item.dateRange && (
                        // This text element will take up a full line
                        <Text style={styles.ticketSubtitle}>{item.dateRange}</Text>
                    )}

                    {/* 2. Shift Note (Only for Shift Request, rendered on a NEW line) */}
                    {item.title.toLowerCase().includes('shift request') && item.requestNote && (
                        // This text element renders after the previous one, thus on a new line
                        <Text style={styles.requestNoteBlock}> {/* 👈 Using a new style for block layout */}
                            Shift ::{' '}
                            <Text style={styles.highlightRed}>{item.requestNote}</Text>
                        </Text>
                    )}

                    {/* 3. Amount */}
                    {item.amount && (
                        <Text style={styles.ticketAmount}>
                            Requested Amount:-{' '}
                            <Text
                                style={[
                                    styles.highlightRed,
                                    selectedTab === 'REJECT' && { color: '#C6303E' },
                                ]}
                            >
                                {item.amount}
                            </Text>
                        </Text>
                    )}

                    {/* 4. Status and Approver */}
                    {/* <Text
                        style={[
                            styles.statusText,
                            selectedTab === 'PENDING' && { color: '#999' },
                            selectedTab === 'APPROVED' && { color: '#34A853' },
                            selectedTab === 'REJECT' && { color: '#C6303E' },
                        ]}
                    >
                        {selectedTab === 'PENDING'
                            ? 'Pending Approval'
                            : selectedTab === 'APPROVED'
                            ? 'Approved by'
                            : 'Rejected by'}
                    </Text> */}
                    {/* <Text style={styles.approverText}>{item.approver}</Text> */}
                    {item.approver && <Text style={styles.approverText}>Assigned To {item.approver}</Text>}

                    {/* 5. Cancel Button */}
                    {/* {selectedTab === 'PENDING' && (
                        <TouchableOpacity style={styles.cancelBtn}>
                            <Text style={styles.cancelBtnText}>CANCEL</Text>
                        </TouchableOpacity>
                    )} */}
                </View>
            ))
        )}
      </ScrollView>

    </SafeAreaView>
  );
};
 
export default MyTickets;
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1.5%'),
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    // borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  tab: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    top: 10,
  },
  activeTab: {
    backgroundColor: '#f9a825',
  },
  tabText: {
    color: '#438aff',
   fontSize: Math.max(wp("3.8%"), 14),
    padding:8,
     fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '600',
    color: '#000',
  },
  scrollContainer: {
    paddingBottom: 10,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    padding: wp('5%'),
    borderRadius: wp('3%'),
    marginBottom: hp('1%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    // elevation:1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketTitle: {
     fontSize: Math.max(wp("4.3%"), 14),
    fontWeight: '#500',
    color: '#374151',
    marginTop: 2,
  },
  ticketTime: {
     fontSize: Math.max(wp("1%"), 14),
    color: '#9ca3af',
    marginTop: 3,
  },
  subtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  ticketSubtitle: {
   fontSize: Math.max(wp("1%"), 14),
    color: '#9ca3af',
    // flex: 1,
    marginTop: 5,
  },
  requestNote: {
   fontSize: Math.max(wp("1%"), 14),
    color: '#9ca3af',
    // flex: 1,
    // textAlign: 'right',
  },
  highlightRed: {
    color: '#f9a825',
    fontWeight: '500',
        fontSize: Math.max(wp("4.3%"), 14),

  },
  ticketAmount: {
     fontSize: Math.max(wp("4.3%"), 14),
    color: '#9ca3af',
    marginTop: 5,
  },
  statusText: {
    fontSize: Math.max(wp("3%"), 14),
    color: '#9ca3af',
    marginTop: 14,
  },
  approverText: {
     fontSize: Math.max(wp("4%"), 14),
    fontWeight: '500',
    color: '#000000',
    marginTop: 10,
  },
  cancelBtn: {
    // backgroundColor: '#dbdbe4',
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('6%'),
    borderRadius: wp('3.5%'),
    alignSelf: 'flex-end',
    marginTop: hp('-6%'),
  },
  cancelBtnText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: hp('1.7%'),
  },
   requestNoteBlock: {
    // Use the base ticketSubtitle styles for spacing consistency
    fontSize: Math.max(wp("3.5%"), 14),
    color: '#9ca3af',
    marginTop: 5, 
  },
});