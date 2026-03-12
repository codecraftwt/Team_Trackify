import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Dimensions, Platform
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Button from '../Component/Button';
import * as Progress from 'react-native-progress';
import ModalComponent from '../Component/ModalComponent';
import DateTimePicker from '@react-native-community/datetimepicker';
import MonthPicker from 'react-native-month-year-picker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AsyncStorage from "@react-native-async-storage/async-storage"
import BASE_URL from "../config/server"
import { jwtDecode } from "jwt-decode"
const screenWidth = Dimensions.get('window').width;

const AttendanceSummary = () => {
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isStartPickerVisible, setStartPickerVisible] = useState(false);
    const [isEndPickerVisible, setEndPickerVisible] = useState(false);

    const maxDays = 31;

    const handleViewPay = () => {
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
    };

  const handleMonthIconPress = () => {
  if (!showMonthYearPicker) {
    setShowMonthYearPicker(true);
  }
};


   const onValueChange = (event, newDate) => {
  if (Platform.OS === 'android') {
    setShowMonthYearPicker(false); // Always hide picker first

    if (event === 'dateSetAction' && newDate) {
      setSelectedDate(newDate);
    }
  } else {
    // On iOS, picker stays open and value changes live
    setSelectedDate(newDate);
  }
};

    const handleWeeklyCalendarPress = () => {
        setStartPickerVisible(true);
    };

    const getFormattedMonthYear = (date) => {
        const options = { month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    return (
        <>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 130 }}>
                {/* Monthly Summary */}
                <View style={styles.card}>
                    <View style={styles.headerRow}>
                        <Text style={styles.cardTitle}>Monthly Summary</Text>
                        <View style={styles.iconRow}>
                            <Text style={styles.monthText}>{getFormattedMonthYear(selectedDate)}</Text>
                            <Ionicons
                                name="calendar-outline"
                                size={20}
                                color="#555"
                                style={styles.icon}
                                onPress={handleMonthIconPress}
                            />
                        </View>
                    </View>

                    <View style={styles.summaryRow}>
                        {renderItem('22', 'Present', '#44c144', maxDays)}
                        {renderItem('03', 'Absent', '#F44336', maxDays)}
                        {renderItem('05', 'Late', '#FF9800', maxDays)}
                    </View>
                    <View style={styles.summaryRow}>
                        {renderItem('02', 'Holiday', '#E91E63', maxDays)}
                        {renderItem('00', 'Overtime', '#9E9E9E', maxDays)}
                        {renderItem('03', 'Leave', '#3F51B5', maxDays)}
                    </View>
                </View>

                {/* Button */}
                <View style={styles.buttonContainer}>
                    <Button
                        title="View My Monthly Pay"
                        backgroundColor="#438AFF"
                        onPress={handleViewPay}
                        style={{ paddingVertical: 10, paddingHorizontal: 70, padding: 8 }}
                    />
                </View>
            </ScrollView>

            {/* Monthly Pay Modal */}
            <ModalComponent
                isVisible={isModalVisible}
                onClose={handleCloseModal}
                title={null}
                content={
                    <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
                        You will receive the total{'\n'}
                        salary for this month.{'\n'}
                        {'\n'}
                        <Text style={{ fontSize: 30, fontWeight: 'bold' }}>13,309 /-</Text>
                    </Text>
                }
                buttonBackgroundColor="transparent"
            />

            {/* Month-Year Picker */}
            {showMonthYearPicker && (
                <MonthPicker
                    onChange={onValueChange}
                    value={selectedDate}
                    minimumDate={new Date(2020, 0)}
                    maximumDate={new Date(2030, 11)}
                    locale="en"
                />
            )}

            {/* Start Date Picker Modal */}
            {isStartPickerVisible && (
                <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display="calendar"
                    onChange={(event, date) => {
                        if (event.type === 'set' && date) {
                            setStartDate(date);
                            setStartPickerVisible(false);
                            setTimeout(() => setEndPickerVisible(true), 300);
                        } else {
                            setStartPickerVisible(false);
                        }
                    }}
                />
            )}

            {/* End Date Picker Modal */}
            {isEndPickerVisible && (
                <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    display="calendar"
                    onChange={(event, date) => {
                        if (event.type === 'set' && date) {
                            setEndDate(date);
                        }
                        setEndPickerVisible(false);
                    }}
                />
            )}
        </>
    );
};

const renderItem = (value, label, color, max) => {
    const progress = parseInt(value) / max;
    return (
        <View style={styles.item}>
            <Progress.Circle
                size={60}
                progress={progress}
                thickness={5}
                showsText
                formatText={() => value}
                color={color}
                borderWidth={0}
                unfilledColor="#f0f0f0"
                textStyle={{ fontWeight: 'bold', color: '#000' }}
            />
            <Text style={styles.itemLabel}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: wp('4%'),
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: wp('2.5%'),
        padding: wp('4%'),
        marginVertical: hp('1%'),
        elevation: 5,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: hp('1.5%'),
        backgroundColor: '#f0f0f0',
        paddingVertical: hp('2.2%'),
        paddingHorizontal: wp('4%'),
        borderTopLeftRadius: wp('2.5%'),
        borderTopRightRadius: wp('2.5%'),
        marginTop: -hp('1.2%'),
    },
    cardTitle: {
        fontSize: wp('4.2%'),
        fontWeight: 'bold',
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    monthText: {
        fontSize: wp('3.5%'),
        color: '#666',
        marginRight: wp('2%'),
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: hp('2%'),
    },
    item: {
        alignItems: 'center',
        width: '30%',
    },
    itemLabel: {
        fontSize: wp('3%'),
        color: '#555',
        marginTop: hp('0.8%'),
    },
    buttonContainer: {
        marginTop: -hp('10%'),
        alignItems: 'center',
    },
});

export default AttendanceSummary;
