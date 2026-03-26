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
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../../Component/CustomHeader';
import { getAdminAllTracks } from '../../config/AdminService';
import { useAuth } from '../../config/auth-context';
import { isSubscriptionExpired, getSubscriptionMessage } from '../../utils/subscriptionUtils';

const AdminReport = ({ navigation, route }) => {
  const { subscriptionStatus: authSubscriptionStatus, userRole } = useAuth();
  // Get subscription status from route params (passed from login)
  const routeSubscriptionStatus = route?.params?.subscriptionStatus;
  // Use route params first, then fall back to auth context
  const subscriptionStatus = routeSubscriptionStatus || authSubscriptionStatus;
  
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

  // Check if subscription is expired and show alert
  useEffect(() => {
    const checkSubscription = async () => {
      // Try to get subscription status from multiple sources
      let currentSubscriptionStatus = subscriptionStatus;
      
      if (!currentSubscriptionStatus) {
        try {
          const storedStatus = await AsyncStorage.getItem('subscriptionStatus');
          if (storedStatus) {
            currentSubscriptionStatus = JSON.parse(storedStatus);
          }
        } catch (err) {
          console.error('Error loading subscription status:', err);
        }
      }
      
      if (userRole === 'Admin' && isSubscriptionExpired(currentSubscriptionStatus)) {
        Alert.alert(
          'Subscription Required',
          getSubscriptionMessage(currentSubscriptionStatus) || 'Your plan has expired. Please renew to continue.',
          [
            {
              text: 'Go to Plans',
              onPress: () => navigation.navigate('ManagePlans'),
            },
            {
              text: 'Go to Dashboard',
              onPress: () => navigation.navigate('AdminDashboard'),
            },
          ],
          { cancelable: false }
        );
      }
    };
    
    checkSubscription();
  }, [subscriptionStatus]);

  // Get adminId from AsyncStorage on component mount
  useEffect(() => {
    const getAdminId = async () => {
      try {
        // For admin, the userId in AsyncStorage is the admin's ID
        const id = await AsyncStorage.getItem('userId');
        if (id) {
          setAdminId(id);
        } else {
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
    if (fromDate && toDate && adminId) {
      const start = new Date(fromDate);
      const end = new Date(toDate);

      if (start <= end) {
        setLoading(true);
        setError(null);
        const result = await getAdminAllTracks(adminId, fromDate, toDate);
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

  const handleViewDateDetails = (item) => {
    navigation.navigate('AdminDateUsers', {
      date: item.date,
      users: item.users || [],
      totalSessions: item.totalSessions,
      totalLocations: item.totalLocations,
      uniqueUsersCount: item.uniqueUsersCount,
    });
  };

  const renderTrackedUserCard = (item) => (
    <View key={item.date} style={styles.trackedUserCard}>
      <View style={styles.rowContainer}>

        {/* Icon */}
        <View style={styles.iconWrapper}>
          <Icon name="people" size={20} color="#3088C7" />
        </View>

        {/* Content + Button Row */}
        <View style={styles.rightSection}>

          {/* View 1 */}
          <View style={styles.contentContainer}>
            <Text style={styles.trackedUserDate}>
              {formatDisplayDate(item.date)}
            </Text>

            <Text style={styles.trackedUserCount}>
              {item.uniqueUsersCount} users tracked
            </Text>
          </View>

          {/* View Button */}
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewDateDetails(item)}
          >
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
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
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentContainer: {
    marginLeft: 10,
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
  resultsTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 15,
  },
  trackedUserCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  trackedUserDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  trackedUserCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between', // pushes button to right
    alignItems: 'center',
    marginLeft: 12,
  },
  contentContainer: {
    flexDirection: 'column',
  },
  viewButton: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#3088C7',
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
  },
  iconWrapper: {
    backgroundColor: '#E8F0FE',
    padding: 9,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AdminReport;