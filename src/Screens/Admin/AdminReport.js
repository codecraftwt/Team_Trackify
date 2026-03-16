import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../../Component/CustomHeader';
import { getAdminAllTracks } from '../../config/AdminService';

const AdminReport = ({ navigation }) => {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromCalendar, setShowFromCalendar] = useState(false);
  const [showToCalendar, setShowToCalendar] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [error, setError] = useState(null);
  const [isLoadingAdminId, setIsLoadingAdminId] = useState(true);

  // Get adminId from AsyncStorage on component mount
  useEffect(() => {
    const getAdminId = async () => {
      try {
        // For admin, the userId in AsyncStorage is the admin's ID
        const id = await AsyncStorage.getItem('userId');
        if (id) {
          setAdminId(id);
          console.log('Admin ID retrieved:', id);
        } else {
          console.log('No admin ID found in AsyncStorage');
          setError('Admin ID not found. Please log in again.');
        }
      } catch (err) {
        console.error('Error getting adminId:', err);
        setError('Error retrieving admin ID');
      } finally {
        setIsLoadingAdminId(false);
      }
    };
    getAdminId();
  }, []);

  // Format date for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  // Handle from date selection
  const handleFromDateSelect = (date) => {
    setFromDate(date.dateString);
    setShowFromCalendar(false);
    
    // Update marked dates
    const newMarkedDates = {};
    if (date.dateString) {
      newMarkedDates[date.dateString] = {
        selected: true,
        selectedColor: '#3088C7',
        startingDay: true,
        color: '#3088C7',
      };
    }
    if (toDate) {
      newMarkedDates[toDate] = {
        ...newMarkedDates[toDate],
        selected: true,
        selectedColor: '#3088C7',
        endingDay: true,
        color: '#3088C7',
      };
      
      // Mark dates in between
      const start = new Date(date.dateString);
      const end = new Date(toDate);
      if (start <= end) {
        const currentDate = new Date(start);
        currentDate.setDate(currentDate.getDate() + 1);
        
        while (currentDate < end) {
          const dateStr = currentDate.toISOString().split('T')[0];
          newMarkedDates[dateStr] = {
            selected: true,
            color: '#3088C7',
            opacity: 0.3,
          };
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }
    setMarkedDates(newMarkedDates);
  };

  // Handle to date selection
  const handleToDateSelect = (date) => {
    setToDate(date.dateString);
    setShowToCalendar(false);
    
    // Update marked dates
    const newMarkedDates = {};
    if (fromDate) {
      newMarkedDates[fromDate] = {
        selected: true,
        selectedColor: '#3088C7',
        startingDay: true,
        color: '#3088C7',
      };
    }
    if (date.dateString) {
      newMarkedDates[date.dateString] = {
        selected: true,
        selectedColor: '#3088C7',
        endingDay: true,
        color: '#3088C7',
      };
    }
    
    // Mark dates in between
    if (fromDate && date.dateString) {
      const start = new Date(fromDate);
      const end = new Date(date.dateString);
      if (start <= end) {
        const currentDate = new Date(start);
        currentDate.setDate(currentDate.getDate() + 1);
        
        while (currentDate < end) {
          const dateStr = currentDate.toISOString().split('T')[0];
          newMarkedDates[dateStr] = {
            selected: true,
            color: '#3088C7',
            opacity: 0.3,
          };
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }
    setMarkedDates(newMarkedDates);
  };

  const handleApplyFilters = async () => {
    console.log('Apply button clicked - fromDate:', fromDate, 'toDate:', toDate, 'adminId:', adminId);
    
    if (fromDate && toDate && adminId) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      
      if (start <= end) {
        setLoading(true);
        setError(null);
        
        console.log('Calling API with adminId:', adminId, 'startDate:', fromDate, 'endDate:', toDate);
        
        const result = await getAdminAllTracks(adminId, fromDate, toDate);
        
        console.log('API result:', result);
        
        setLoading(false);
        
        if (result.success) {
          setFilteredData(result.data.dateWiseData || []);
          setSummary(result.data.summary || null);
          setShowResults(true);
        } else {
          setError(result.message || 'Failed to fetch data');
          setShowResults(true);
          setFilteredData([]);
        }
      } else {
        setError('Invalid date range');
        setShowResults(true);
      }
    } else {
      console.log('Missing required params - fromDate:', fromDate, 'toDate:', toDate, 'adminId:', adminId);
      if (!adminId) {
        setError('Admin ID not found. Please log in again.');
        setShowResults(true);
      }
    }
  };

  const handleClearFilter = () => {
    setFromDate(null);
    setToDate(null);
    setShowResults(false);
    setFilteredData([]);
    setMarkedDates({});
    setSummary(null);
    setError(null);
  };

  // Get current month for calendar
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  };

  const getCurrentMonthEnd = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    return `${year}-${month}-${lastDay}`;
  };

  const renderCalendarModal = (isFromCalendar) => (
    <Modal
      visible={isFromCalendar ? showFromCalendar : showToCalendar}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Select {isFromCalendar ? 'From' : 'To'} Date
          </Text>
          
          <Calendar
            current={getCurrentMonth()}
            minDate={getCurrentMonth()}
            maxDate={getCurrentMonthEnd()}
            onDayPress={isFromCalendar ? handleFromDateSelect : handleToDateSelect}
            markedDates={markedDates}
            markingType={'period'}
            theme={{
              selectedDayBackgroundColor: '#3088C7',
              todayTextColor: '#3088C7',
              arrowColor: '#3088C7',
              monthTextColor: '#333',
              textMonthFontFamily: 'Poppins-Bold',
              textDayFontFamily: 'Poppins-Regular',
              textDayHeaderFontFamily: 'Poppins-Medium',
            }}
          />
          
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              if (isFromCalendar) {
                setShowFromCalendar(false);
              } else {
                setShowToCalendar(false);
              }
            }}
          >
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderTrackedUserCard = (item) => (
    <View key={item.date} style={styles.trackedUserCard}>
      <View style={styles.trackedUserHeader}>
        <Text style={styles.trackedUserDate}>{formatDisplayDate(item.date)}</Text>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View &gt;</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.trackedUserContent}>
        <Icon name="people" size={20} color="#3088C7" />
        <Text style={styles.trackedUserCount}>{item.uniqueUsersCount} users tracked</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Icon name="access-time" size={16} color="#666" />
          <Text style={styles.statText}>{item.totalSessions} sessions</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="location-on" size={16} color="#666" />
          <Text style={styles.statText}>{item.totalLocations} locations</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3088C7" />
      
      {/* Header */}
      <CustomHeader title="Reports" />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Filter Section */}
        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Select Date</Text>
            <TouchableOpacity onPress={handleClearFilter}>
              <Text style={styles.clearFilterText}>Clear Filter</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateInputsContainer}>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowFromCalendar(true)}
            >
              <Text style={styles.dateLabel}>From</Text>
              <Text style={[styles.dateValue, !fromDate && styles.placeholderText]}>
                {fromDate ? formatDisplayDate(fromDate) : 'Select Date'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowToCalendar(true)}
            >
              <Text style={styles.dateLabel}>To</Text>
              <Text style={[styles.dateValue, !toDate && styles.placeholderText]}>
                {toDate ? formatDisplayDate(toDate) : 'Select Date'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[
              styles.applyButton,
              (!fromDate || !toDate || loading || isLoadingAdminId) && styles.applyButtonDisabled
            ]}
            onPress={handleApplyFilters}
            disabled={!fromDate || !toDate || loading || isLoadingAdminId}
          >
            <Text style={styles.applyButtonText}>
              {loading ? 'Loading...' : isLoadingAdminId ? 'Initializing...' : 'Apply Filters'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3088C7" />
            <Text style={styles.loadingText}>Loading report data...</Text>
          </View>
        )}

        {/* Error Message */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Icon name="error" size={40} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Summary Cards */}
        {showResults && summary && !loading && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryCardsContainer}>
              <View style={styles.summaryCard}>
                <Icon name="people" size={24} color="#3088C7" />
                <Text style={styles.summaryValue}>{summary.totalUniqueUsers}</Text>
                <Text style={styles.summaryLabel}>Unique Users</Text>
              </View>
              <View style={styles.summaryCard}>
                <Icon name="access-time" size={24} color="#3088C7" />
                <Text style={styles.summaryValue}>{summary.totalSessions}</Text>
                <Text style={styles.summaryLabel}>Sessions</Text>
              </View>
              <View style={styles.summaryCard}>
                <Icon name="location-on" size={24} color="#3088C7" />
                <Text style={styles.summaryValue}>{summary.totalLocations}</Text>
                <Text style={styles.summaryLabel}>Locations</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tracked Users Results */}
        {showResults && filteredData.length > 0 && !loading && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>Daily Breakdown</Text>
            {filteredData.map(renderTrackedUserCard)}
          </View>
        )}

        {/* Show message if no results */}
        {showResults && filteredData.length === 0 && !loading && !error && (
          <View style={styles.noResultsContainer}>
            <Icon name="info" size={40} color="#999" />
            <Text style={styles.noResultsText}>No tracked users found for selected date range</Text>
          </View>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Calendar Modals */}
      {renderCalendarModal(true)}
      {renderCalendarModal(false)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 15,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  clearFilterText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#3088C7',
  },
  dateInputsContainer: {
    marginBottom: 15,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  applyButton: {
    backgroundColor: '#3088C7',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  applyButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  resultsSection: {
    marginTop: 20,
  },
  trackedUserCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  trackedUserHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  trackedUserDate: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#3088C7',
  },
  trackedUserContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackedUserCount: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginLeft: 8,
  },
  noResultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 30,
    marginTop: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalCloseButton: {
    marginTop: 15,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modalCloseText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#3088C7',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 30,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 30,
    marginTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: 10,
  },
  errorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 30,
    marginTop: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 10,
  },
  summarySection: {
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: 4,
  },
  resultsTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginLeft: 4,
  },
});

export default AdminReport;