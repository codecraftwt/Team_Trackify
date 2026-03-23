import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/FontAwesome';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as TrackingService from '../../services/TrackingService';

const { width } = Dimensions.get('window');

const CalendarModal = ({ 
  visible, 
  onClose, 
  onDateSelect, 
  selectedDate,
  userId 
}) => {
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(false);
  const [trackingDates, setTrackingDates] = useState([]);

  useEffect(() => {
    if (visible && userId) {
      fetchTrackingDates();
    }
  }, [visible, userId]);

  const fetchTrackingDates = async () => {
    try {
      setLoading(true);
      const dates = await TrackingService.getUserTrackingDates(userId);
      // console.log('CalendarModal dates from API:', dates);
      setTrackingDates(dates);
      
      // Create marked dates object
      const marks = {};
      
      const today = new Date().toISOString().split('T')[0];

      // Dots require markingType 'multi-dot'
      dates.forEach((date) => {
        marks[date] = {
          dots: [{ key: 'tracking', color: '#f97316' }],
        };
      });

      // Highlight today (with dot if exists)
      marks[today] = {
        ...(marks[today] || {}),
        selected: true,
        selectedColor: '#2563eb',
        selectedTextColor: '#ffffff',
      };

      // Highlight the currently selected date (overrides)
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      marks[selectedDateStr] = {
        ...(marks[selectedDateStr] || {}),
        selected: true,
        selectedColor: '#2563eb',
        selectedTextColor: '#ffffff',
      };

      setMarkedDates(marks);
    } catch (error) {
      console.error('Failed to fetch tracking dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day) => {
    const selectedDate = new Date(day.dateString);
    onDateSelect(selectedDate);
    onClose();
  };

  const handleMonthChange = (month) => {
    // You can fetch dates for the new month here if needed
    console.log('Month changed:', month);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="times" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Loading calendar...</Text>
            </View>
          ) : (
            <>
              <Calendar
                current={selectedDate.toISOString().split('T')[0]}
                onDayPress={handleDayPress}
                onMonthChange={handleMonthChange}
                markedDates={markedDates}
                markingType={'multi-dot'}
                theme={{
                  backgroundColor: '#ffffff',
                  calendarBackground: '#ffffff',
                  textSectionTitleColor: '#b6c1cd',
                  selectedDayBackgroundColor: '#2563eb',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#2563eb',
                  dayTextColor: '#2d4150',
                  textDisabledColor: '#d9e1e8',
                  dotColor: '#f97316',
                  selectedDotColor: '#ffffff',
                  arrowColor: '#2563eb',
                  monthTextColor: '#2563eb',
                  indicatorColor: '#2563eb',
                  textDayFontWeight: '300',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '300',
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14,
                }}
                style={styles.calendar}
              />
              
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
                  <Text style={styles.legendText}>Has tracking data</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
                  <Text style={styles.legendText}>Today</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  closeButton: {
    padding: 5,
  },
  calendar: {
    borderRadius: 10,
    elevation: 2,
  },
  loadingContainer: {
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#4b5563',
  },
});

export default CalendarModal;