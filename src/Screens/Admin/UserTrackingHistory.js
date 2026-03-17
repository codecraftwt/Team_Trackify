// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   StatusBar,
//   ActivityIndicator,
//   RefreshControl,
//   TouchableOpacity,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { Calendar } from 'react-native-calendars';
// import { getUserSessions, getUserSessionDates } from '../../config/AdminService';

// const UserTrackingHistory = ({ navigation, route }) => {
//   // Extract params: userId is the selected user's ID, adminId is the admin's ID
//   const { userId, adminId, userName } = route.params || {};

//   console.log('🔵 UserTrackingHistory - Route params:', route.params);
//   console.log('🔵 UserTrackingHistory - Selected User ID:', userId);
//   console.log('🔵 UserTrackingHistory - Admin ID:', adminId);

//   // Get today's date in YYYY-MM-DD format
//   const getTodayDate = () => {
//     const today = new Date();
//     return today.toISOString().split('T')[0];
//   };

//   const [trackingData, setTrackingData] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const [selectedDate, setSelectedDate] = useState(getTodayDate());
//   const [calendarVisible, setCalendarVisible] = useState(false);
//   const [markedDates, setMarkedDates] = useState({});
//   // Store all dates that have sessions (for dots on calendar)
//   const [datesWithSessions, setDatesWithSessions] = useState([]);

//   // Log when selectedDate changes
//   useEffect(() => {
//     console.log('📅 selectedDate state changed to:', selectedDate);
//   }, [selectedDate]);

//   // Log when trackingData changes
//   useEffect(() => {
//     console.log('📊 trackingData updated:', {
//       hasData: !!trackingData,
//       sessionCount: trackingData?.sessions?.length || 0,
//       userId: trackingData?.userId,
//       date: selectedDate,
//     });
//   }, [trackingData, selectedDate]);

//   // Fetch user sessions for selected date
//   // const fetchUserSessions = useCallback(async (showLoading = true, date = null) => {
//   //   try {
//   //     if (showLoading) {
//   //       console.log('⏳ Setting isLoading to true for date:', date);
//   //       setIsLoading(true);
//   //     }
//   //     setError(null);

//   //     if (!userId) {
//   //       console.error('❌ User ID not found');
//   //       setError('User ID not found.');
//   //       setIsLoading(false);
//   //       return;
//   //     }

//   //     // Use provided date or selectedDate (defaults to today)
//   //     const queryDate = date || selectedDate || getTodayDate();

//   //     console.log('🔍 Fetching sessions for date:', {
//   //       queryDate,
//   //       selectedDateState: selectedDate,
//   //       providedDate: date,
//   //       userId
//   //     });

//   //     const response = await getUserSessions(userId, queryDate);
//   //     console.log('📥 getUserSessions response:', {
//   //       success: response.success,
//   //       hasData: !!response.data,
//   //       sessionCount: response.data?.sessions?.length,
//   //       responseDate: queryDate
//   //     });

//   //     if (response.success && response.data) {
//   //       console.log('✅ Setting trackingData with sessions for date:', queryDate);
//   //       setTrackingData(response.data);
//   //     } else {
//   //       console.error('❌ Failed to fetch user sessions:', response.message);
//   //       setError(response.message || 'Failed to fetch user sessions');
//   //     }
//   //   } catch (err) {
//   //     console.error('🔥 Error fetching user sessions:', err);
//   //     setError('Something went wrong while fetching user sessions');
//   //   } finally {
//   //     console.log('⏳ Setting isLoading to false');
//   //     setIsLoading(false);
//   //     setIsRefreshing(false);
//   //   }
//   // }, [userId, selectedDate]);

//   // Fetch user sessions for selected date
// const fetchUserSessions = useCallback(async (showLoading = true, date = null) => {
//   try {
//     if (showLoading) {
//       console.log('⏳ Setting isLoading to true for date:', date);
//       setIsLoading(true);
//     }
//     setError(null);

//     if (!userId) {
//       console.error('❌ User ID not found');
//       setError('User ID not found.');
//       setIsLoading(false);
//       return;
//     }

//     // Use provided date or selectedDate (defaults to today)
//     const queryDate = date || selectedDate || getTodayDate();

//     console.log('🔍 Fetching sessions for date:', {
//       queryDate,
//       selectedDateState: selectedDate,
//       providedDate: date,
//       userId
//     });

//     const response = await getUserSessions(userId, queryDate);
//     console.log('📥 getUserSessions response:', {
//       success: response.success,
//       hasData: !!response.data,
//       sessionCount: response.data?.sessions?.length,
//       responseDate: queryDate
//     });

//     if (response.success && response.data) {
//       console.log('✅ Setting trackingData with sessions for date:', queryDate);
//       setTrackingData(response.data);
//     } else {
//       console.error('❌ Failed to fetch user sessions:', response.message);
//       setError(response.message || 'Failed to fetch user sessions');
//     }
//   } catch (err) {
//     console.error('🔥 Error fetching user sessions:', err);
//     setError('Something went wrong while fetching user sessions');
//   } finally {
//     console.log('⏳ Setting isLoading to false');
//     setIsLoading(false);
//     setIsRefreshing(false);
//   }
// }, [userId]); // Remove selectedDate from dependency array

//   // Fetch all dates where user has sessions
//   // const fetchAllUserSessionDates = useCallback(async () => {
//   //   try {
//   //     if (!userId) {
//   //       console.error('❌ Cannot fetch session dates: userId missing');
//   //       return;
//   //     }

//   //     console.log('🔍 Fetching all session dates for user:', userId);

//   //     const response = await getUserSessionDates(userId);
//   //     console.log('📥 getUserSessionDates response:', {
//   //       success: response.success,
//   //       dates: response.data?.dates,
//   //       userId: response.data?.userId,
//   //       userName: response.data?.userName
//   //     });

//   //     if (response.success && response.data) {
//   //       console.log('✅ Setting datesWithSessions:', response.data.dates);
//   //       setDatesWithSessions(response.data.dates || []);
//   //     } else {
//   //       console.error('❌ Failed to fetch session dates:', response.message);
//   //     }
//   //   } catch (error) {
//   //     console.error('🔥 Error fetching session dates:', error);
//   //   }
//   // }, [userId]);
//   // Fetch all dates where user has sessions
// const fetchAllUserSessionDates = useCallback(async () => {
//   try {
//     if (!userId) {
//       console.error('❌ Cannot fetch session dates: userId missing');
//       return;
//     }

//     console.log('🔍 Fetching all session dates for user:', userId);

//     const response = await getUserSessionDates(userId);
//     console.log('📥 getUserSessionDates response:', {
//       success: response.success,
//       dates: response.data?.dates,
//       userId: response.data?.userId,
//       userName: response.data?.userName
//     });

//     if (response.success && response.data) {
//       console.log('✅ Setting datesWithSessions:', response.data.dates);
//       setDatesWithSessions(response.data.dates || []);
//     } else {
//       console.error('❌ Failed to fetch session dates:', response.message);
//     }
//   } catch (error) {
//     console.error('🔥 Error fetching session dates:', error);
//   }
// }, [userId]); // Only depend on userId

//   // Update marked dates when datesWithSessions or selectedDate changes
//   useEffect(() => {
//     console.log('🎯 Updating marked dates with:', {
//       datesWithSessions,
//       selectedDate,
//       datesCount: datesWithSessions.length
//     });

//     const marks = {};

//     // Mark all dates that have sessions with dots
//     datesWithSessions.forEach(date => {
//       marks[date] = {
//         dots: [
//           {
//             key: 'tracking',
//             color: '#3088C7',
//             selectedDotColor: '#FFF',
//           }
//         ],
//         marked: true,
//       };
//     });

//     // Add selected date marking (highlight in blue)
//     if (selectedDate) {
//       marks[selectedDate] = {
//         ...marks[selectedDate],
//         selected: true,
//         selectedColor: '#3088C7',
//       };
//     }

//     // Mark today's date with a green dot
//     const today = getTodayDate();
//     if (marks[today]) {
//       marks[today] = {
//         ...marks[today],
//         today: true,
//         dots: [
//           ...(marks[today].dots || []),
//           {
//             key: 'today',
//             color: '#4CAF50',
//             selectedDotColor: '#FFF',
//           }
//         ],
//       };
//     } else {
//       marks[today] = {
//         today: true,
//         dots: [
//           {
//             key: 'today',
//             color: '#4CAF50',
//             selectedDotColor: '#FFF',
//           }
//         ],
//       };
//     }

//     console.log('✅ Final markedDates:', marks);
//     setMarkedDates(marks);
//   }, [datesWithSessions, selectedDate]);

//   // Initial fetch - get today's sessions and all dates with sessions
//   // useEffect(() => {
//   //   const today = getTodayDate();
//   //   console.log('🚀 Initial load - setting selectedDate to today:', today);
//   //   setSelectedDate(today);

//   //   // Fetch both data in parallel
//   //   const loadInitialData = async () => {
//   //     console.log('⏳ Starting initial data load');
//   //     setIsLoading(true);
//   //     try {
//   //       console.log('📡 Fetching initial data for date:', today);
//   //       await Promise.all([
//   //         fetchUserSessions(false, today),
//   //         fetchAllUserSessionDates()
//   //       ]);
//   //       console.log('✅ Initial data load complete');
//   //     } catch (error) {
//   //       console.error('🔥 Error loading initial data:', error);
//   //     } finally {
//   //       console.log('⏳ Setting isLoading to false after initial load');
//   //       setIsLoading(false);
//   //     }
//   //   };

//   //   loadInitialData();

//   //   // Set header title
//   //   if (userName) {
//   //     console.log('📝 Setting header title:', `${userName}'s Tracking`);
//   //     navigation.setOptions({ title: `${userName}'s Tracking` });
//   //   }
//   // }, [fetchUserSessions, fetchAllUserSessionDates, navigation, userName]);
//   // Initial fetch - get today's sessions and all dates with sessions
// useEffect(() => {
//   const today = getTodayDate();
//   console.log('🚀 Initial load - setting selectedDate to today:', today);
//   setSelectedDate(today);

//   // Fetch both data in parallel
//   const loadInitialData = async () => {
//     console.log('⏳ Starting initial data load');
//     setIsLoading(true);
//     try {
//       console.log('📡 Fetching initial data for date:', today);
//       await Promise.all([
//         fetchUserSessions(false, today),
//         fetchAllUserSessionDates()
//       ]);
//       console.log('✅ Initial data load complete');
//     } catch (error) {
//       console.error('🔥 Error loading initial data:', error);
//     } finally {
//       console.log('⏳ Setting isLoading to false after initial load');
//       setIsLoading(false);
//     }
//   };

//   loadInitialData();

//   // Set header title
//   if (userName) {
//     console.log('📝 Setting header title:', `${userName}'s Tracking`);
//     navigation.setOptions({ title: `${userName}'s Tracking` });
//   }

//   // eslint-disable-next-line react-hooks/exhaustive-deps
// }, []); // Empty dependency array - this should only run once on mount

//   // Handle refresh
//   const handleRefresh = () => {
//     console.log('🔄 Manual refresh triggered for date:', selectedDate);
//     setIsRefreshing(true);
//     Promise.all([
//       fetchUserSessions(true, selectedDate),
//       fetchAllUserSessionDates()
//     ]).finally(() => {
//       console.log('✅ Manual refresh complete');
//       setIsRefreshing(false);
//     });
//   };

//   // Format duration from seconds to HH:MM:SS
//   const formatDuration = (seconds) => {
//     if (!seconds) return '0m';
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     const secs = seconds % 60;

//     if (hours > 0) {
//       return `${hours}h ${minutes}m`;
//     } else if (minutes > 0) {
//       return `${minutes}m ${secs}s`;
//     }
//     return `${secs}s`;
//   };

//   // Format distance
//   const formatDistance = (distance) => {
//     if (!distance) return '0 km';
//     return `${distance.toFixed(2)} km`;
//   };

//   // Format date
//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-GB', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric',
//     });
//   };

//   // Format time
//   const formatTime = (dateString) => {
//     if (!dateString) return 'N/A';
//     const date = new Date(dateString);
//     return date.toLocaleTimeString('en-GB', {
//       hour: '2-digit',
//       minute: '2-digit',
//       hour12: false,
//     });
//   };

//   // Get session count for current selected date
//   const getSessionCountForDate = () => {
//     return (trackingData?.sessions || []).length;
//   };

//   // Handle day press in calendar
//   const onDayPress = (day) => {
//     console.log('📅 Calendar day pressed:', {
//       dateString: day.dateString,
//       previousSelectedDate: selectedDate
//     });

//     // Update selected date state
//     setSelectedDate(day.dateString);
//     setCalendarVisible(false);

//     // Fetch sessions for selected date
//     console.log('🔍 Triggering fetch for new date:', day.dateString);
//     fetchUserSessions(true, day.dateString);
//   };

//   // Render stats card based on current sessions
//   const renderStatsCard = () => {
//     const sessions = trackingData?.sessions || [];

//     // Calculate stats from sessions
//     const totalSessions = sessions.length;
//     const totalDistance = sessions.reduce((sum, s) => sum + (s.totalDistance || 0), 0);
//     const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
//     const averageDistance = totalSessions > 0 ? totalDistance / totalSessions : 0;

//     return (
//       <View style={styles.statsCardContainer}>
//         <View style={styles.statsRow}>
//           <View style={styles.statItem}>
//             <Icon name="access-time" size={24} color="#3088C7" />
//             <Text style={styles.statValue}>{totalSessions}</Text>
//             <Text style={styles.statLabel}>Sessions</Text>
//           </View>
//           <View style={styles.statItem}>
//             <Icon name="straighten" size={24} color="#3088C7" />
//             <Text style={styles.statValue}>{formatDistance(totalDistance)}</Text>
//             <Text style={styles.statLabel}>Distance</Text>
//           </View>
//           <View style={styles.statItem}>
//             <Icon name="timer" size={24} color="#3088C7" />
//             <Text style={styles.statValue}>{formatDuration(totalDuration)}</Text>
//             <Text style={styles.statLabel}>Duration</Text>
//           </View>
//         </View>
//         <View style={styles.statsRow}>
//           <View style={styles.statItem}>
//             <Icon name="speed" size={24} color="#3088C7" />
//             <Text style={styles.statValue}>{formatDistance(averageDistance)}</Text>
//             <Text style={styles.statLabel}>Avg Distance</Text>
//           </View>
//         </View>
//       </View>
//     );
//   };

//   // Render user info card
//   const renderUserInfoCard = () => {
//     if (!trackingData?.user) return null;
//     const { user } = trackingData;

//     return (
//       <View style={styles.userInfoCard}>
//         <View style={styles.userInfoHeader}>
//           <View style={styles.userAvatar}>
//             <Text style={styles.userAvatarText}>
//               {user.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) : '?'}
//             </Text>
//           </View>
//           <View style={styles.userDetails}>
//             <Text style={styles.userName}>{user.name || 'N/A'}</Text>
//             <Text style={styles.userEmail}>{user.email || 'N/A'}</Text>
//             <View style={styles.userContact}>
//               <Icon name="phone" size={14} color="#666" />
//               <Text style={styles.userContactText}>{user.mobile_no || 'N/A'}</Text>
//             </View>
//           </View>
//         </View>
//       </View>
//     );
//   };

//   // Render session item
//   const renderSessionItem = ({ item, index }) => (
//     <TouchableOpacity 
//       style={styles.sessionItem}
//       onPress={() => {
//         console.log('👉 Session item pressed:', {
//           sessionId: item.sessionId,
//           date: item.startTime
//         });
//         navigation.navigate('SessionDetailMap', { 
//           userId: userId,
//           sessionId: item.sessionId,
//           sessionDate: item.startTime,
//         });
//       }}
//     >
//       <View style={styles.sessionHeader}>
//         <View style={styles.sessionDateContainer}>
//           <Icon name="event" size={16} color="#3088C7" />
//           <Text style={styles.sessionDate}>{formatDate(item.startTime)}</Text>
//         </View>
//         <View style={styles.sessionIdContainer}>
//           <Text style={styles.sessionId}>#{index + 1}</Text>
//         </View>
//       </View>
//       <View style={styles.sessionDetails}>
//         <View style={styles.sessionTimeRow}>
//           <View style={styles.sessionTimeItem}>
//             <Icon name="play-arrow" size={16} color="#4CAF50" />
//             <Text style={styles.sessionTimeLabel}>Start:</Text>
//             <Text style={styles.sessionTime}>{formatTime(item.startTime)}</Text>
//           </View>
//           <View style={styles.sessionTimeItem}>
//             <Icon name="stop" size={16} color="#F44336" />
//             <Text style={styles.sessionTimeLabel}>End:</Text>
//             <Text style={styles.sessionTime}>{formatTime(item.endTime)}</Text>
//           </View>
//         </View>
//         <View style={styles.sessionStatsRow}>
//           <View style={styles.sessionStatItem}>
//             <Icon name="timer" size={14} color="#666" />
//             <Text style={styles.sessionStatLabel}>Duration:</Text>
//             <Text style={styles.sessionStatValue}>
//               {formatDuration(item.duration)}
//             </Text>
//           </View>
//           <View style={styles.sessionStatItem}>
//             <Icon name="straighten" size={14} color="#666" />
//             <Text style={styles.sessionStatLabel}>Distance:</Text>
//             <Text style={styles.sessionStatValue}>
//               {formatDistance(item.totalDistance)}
//             </Text>
//           </View>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );

//   // Render empty sessions
//   const renderEmptySessions = () => (
//     <View style={styles.emptySessions}>
//       <Icon name="location-off" size={48} color="#ccc" />
//       <Text style={styles.emptySessionsText}>No tracking sessions found for this date</Text>
//     </View>
//   );

//   // Render enhanced calendar with dots
//   const renderCalendarWithDots = () => {
//     const sessionCount = getSessionCountForDate();

//     return (
//       <View style={styles.calendarSection}>
//         <View style={styles.calendarHeader}>
//           <View style={styles.calendarTitleContainer}>
//             <Icon name="calendar-month" size={20} color="#3088C7" />
//             <Text style={styles.sectionTitle}>Select Date</Text>
//           </View>
//           <TouchableOpacity 
//             onPress={() => {
//               console.log('👆 Calendar toggle pressed, current state:', !calendarVisible);
//               setCalendarVisible(!calendarVisible);
//             }}
//             style={styles.toggleCalendarButton}
//           >
//             <Icon 
//               name={calendarVisible ? "expand-less" : "expand-more"} 
//               size={24} 
//               color="#3088C7" 
//             />
//           </TouchableOpacity>
//         </View>

//         {calendarVisible && (
//           <View style={styles.calendarContainer}>
//             <Calendar
//               onDayPress={onDayPress}
//               markedDates={markedDates}
//               markingType={'multi-dot'}
//               theme={{
//                 backgroundColor: '#FFFFFF',
//                 calendarBackground: '#FFFFFF',
//                 textSectionTitleColor: '#3088C7',
//                 selectedDayBackgroundColor: '#3088C7',
//                 selectedDayTextColor: '#FFFFFF',
//                 todayTextColor: '#3088C7',
//                 dayTextColor: '#2d4150',
//                 textDisabledColor: '#d9e1e8',
//                 dotColor: '#3088C7',
//                 selectedDotColor: '#FFFFFF',
//                 arrowColor: '#3088C7',
//                 monthTextColor: '#3088C7',
//                 textDayFontFamily: 'Poppins-Regular',
//                 textMonthFontFamily: 'Poppins-Bold',
//                 textDayHeaderFontFamily: 'Poppins-Medium',
//                 textDayFontSize: 14,
//                 textMonthFontSize: 16,
//                 textDayHeaderFontSize: 12,
//               }}
//               style={styles.calendar}
//               renderArrow={(direction) => (
//                 <Icon 
//                   name={`chevron-${direction}`} 
//                   size={24} 
//                   color="#3088C7" 
//                 />
//               )}
//             />

//             {/* Calendar Legend */}
//             <View style={styles.calendarLegend}>
//               <View style={styles.legendItem}>
//                 <View style={[styles.legendDot, { backgroundColor: '#3088C7' }]} />
//                 <Text style={styles.legendText}>Has tracking data</Text>
//               </View>
//               <View style={styles.legendItem}>
//                 <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
//                 <Text style={styles.legendText}>Today</Text>
//               </View>
//               <View style={styles.legendItem}>
//                 <View style={[styles.legendDot, { backgroundColor: '#3088C7' }]} />
//                 <Text style={styles.legendText}>Selected date</Text>
//               </View>
//             </View>
//           </View>
//         )}

//         {/* Selected Date Info */}
//         {selectedDate && (
//           <View style={styles.selectedDateInfo}>
//             <View style={styles.selectedDateHeader}>
//               <Icon name="event" size={18} color="#3088C7" />
//               <Text style={styles.selectedDateText}>
//                 {formatDate(selectedDate)}
//               </Text>
//               <TouchableOpacity 
//                 onPress={() => {
//                   const today = getTodayDate();
//                   console.log('👆 Reset to today pressed, switching from', selectedDate, 'to', today);
//                   setSelectedDate(today);
//                   fetchUserSessions(true, today);
//                 }}
//                 style={styles.clearDateButton}
//               >
//                 <Icon name="close" size={16} color="#999" />
//               </TouchableOpacity>
//             </View>
//             <Text style={styles.selectedDateStats}>
//               {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'} on this day
//             </Text>
//           </View>
//         )}
//       </View>
//     );
//   };

//   // Loading state
//   if (isLoading && !trackingData) {
//     return (
//       <View style={styles.container}>
//         <StatusBar barStyle="light-content" backgroundColor="#3088C7" />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#3088C7" />
//           <Text style={styles.loadingText}>Loading tracking data...</Text>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#3088C7" />

//       {/* Error State */}
//       {error && (
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>{error}</Text>
//           <TouchableOpacity 
//             style={styles.retryButton}
//             onPress={() => {
//               console.log('👆 Retry pressed for date:', selectedDate);
//               setError(null);
//               handleRefresh();
//             }}
//           >
//             <Text style={styles.retryButtonText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       {/* Content */}
//       {!error && trackingData && (
//         <FlatList
//           data={trackingData.sessions || []}
//           renderItem={renderSessionItem}
//           keyExtractor={(item, index) => item.sessionId || index.toString()}
//           contentContainerStyle={styles.listContainer}
//           showsVerticalScrollIndicator={false}
//           ListHeaderComponent={
//             <>
//               {/* User Info Card */}
//               {renderUserInfoCard()}

//               {/* Stats Card */}
//               {renderStatsCard()}

//               {/* Calendar with Dots */}
//               {renderCalendarWithDots()}

//               {/* Sessions Header */}
//               <View style={styles.sessionsHeader}>
//                 <Text style={styles.sectionTitle}>
//                   {selectedDate ? `Sessions on ${formatDate(selectedDate)}` : 'Today\'s Sessions'}
//                 </Text>
//                 <View style={styles.sessionCount}>
//                   <Text style={styles.sessionCountText}>
//                     {(trackingData?.sessions || []).length} {(trackingData?.sessions || []).length === 1 ? 'session' : 'sessions'}
//                   </Text>
//                 </View>
//               </View>
//             </>
//           }
//           ListEmptyComponent={renderEmptySessions}
//           refreshControl={
//             <RefreshControl
//               refreshing={isRefreshing}
//               onRefresh={handleRefresh}
//               colors={['#3088C7']}
//             />
//           }
//         />
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   // ... (keep all existing styles the same)
//   container: {
//     flex: 1,
//     backgroundColor: '#F5F5F5',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//   },
//   errorContainer: {
//     padding: 20,
//     alignItems: 'center',
//     backgroundColor: '#FFEBEE',
//     margin: 20,
//     borderRadius: 10,
//   },
//   errorText: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: '#F44336',
//     textAlign: 'center',
//     marginBottom: 10,
//   },
//   retryButton: {
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     backgroundColor: '#3088C7',
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: '#FFF',
//     fontSize: 14,
//     fontFamily: 'Poppins-Medium',
//   },
//   listContainer: {
//     padding: 16,
//     flexGrow: 1,
//   },
//   userInfoCard: {
//     backgroundColor: '#FFF',
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 15,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   userInfoHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   userAvatar: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: '#3088C7',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 15,
//   },
//   userAvatarText: {
//     color: '#FFF',
//     fontSize: 20,
//     fontFamily: 'Poppins-Bold',
//   },
//   userDetails: {
//     flex: 1,
//   },
//   userName: {
//     fontSize: 18,
//     fontFamily: 'Poppins-Bold',
//     color: '#333',
//     marginBottom: 4,
//   },
//   userEmail: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//     marginBottom: 4,
//   },
//   userContact: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   userContactText: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//     marginLeft: 4,
//   },
//   statsCardContainer: {
//     backgroundColor: '#FFF',
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 15,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   statsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: 15,
//   },
//   statItem: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   statValue: {
//     fontSize: 16,
//     fontFamily: 'Poppins-Bold',
//     color: '#333',
//     marginTop: 5,
//   },
//   statLabel: {
//     fontSize: 11,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//     marginTop: 2,
//   },
//   calendarSection: {
//     backgroundColor: '#FFF',
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 15,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   calendarHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   calendarTitleContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   toggleCalendarButton: {
//     padding: 4,
//   },
//   calendarContainer: {
//     marginTop: 15,
//   },
//   calendar: {
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   calendarLegend: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginTop: 15,
//     paddingTop: 15,
//     borderTopWidth: 1,
//     borderTopColor: '#F0F0F0',
//   },
//   legendItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   legendDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     marginRight: 6,
//   },
//   legendText: {
//     fontSize: 11,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//   },
//   selectedDateInfo: {
//     marginTop: 15,
//     padding: 10,
//     backgroundColor: '#F0F8FF',
//     borderRadius: 8,
//   },
//   selectedDateHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   selectedDateText: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Medium',
//     color: '#333',
//     marginLeft: 8,
//     flex: 1,
//   },
//   clearDateButton: {
//     padding: 4,
//   },
//   selectedDateStats: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//     marginTop: 4,
//     marginLeft: 26,
//   },
//   sessionsHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontFamily: 'Poppins-Bold',
//     color: '#333',
//   },
//   sessionCount: {
//     backgroundColor: '#E3F2FD',
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   sessionCountText: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Medium',
//     color: '#3088C7',
//   },
//   sessionItem: {
//     backgroundColor: '#FFF',
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 10,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   sessionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 10,
//     paddingBottom: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEE',
//   },
//   sessionDateContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   sessionDate: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Bold',
//     color: '#333',
//     marginLeft: 6,
//   },
//   sessionIdContainer: {
//     backgroundColor: '#F5F5F5',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//   },
//   sessionId: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Medium',
//     color: '#666',
//   },
//   sessionDetails: {},
//   sessionTimeRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   sessionTimeItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   sessionTimeLabel: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//     marginLeft: 4,
//   },
//   sessionTime: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Medium',
//     color: '#333',
//     marginLeft: 4,
//   },
//   sessionStatsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   sessionStatItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   sessionStatLabel: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Regular',
//     color: '#666',
//     marginLeft: 4,
//   },
//   sessionStatValue: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Bold',
//     color: '#333',
//     marginLeft: 4,
//   },
//   emptySessions: {
//     alignItems: 'center',
//     paddingVertical: 40,
//     backgroundColor: '#FFF',
//     borderRadius: 12,
//   },
//   emptySessionsText: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: '#999',
//     marginTop: 10,
//   },
// });

// export default UserTrackingHistory;

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icon2 from 'react-native-vector-icons/FontAwesome';
import { Calendar } from 'react-native-calendars';
import { getUserSessions, getUserSessionDates } from '../../config/AdminService';
import CustomHeader from '../../Component/CustomHeader';

const UserTrackingHistory = ({ navigation, route }) => {
  // Extract params: userId is the selected user's ID, adminId is the admin's ID
  const { userId, adminId, userName } = route.params || {};

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  // Store all dates that have sessions (for dots on calendar)
  const [datesWithSessions, setDatesWithSessions] = useState([]);

  // Format date for display in header
  const formatHeaderDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Fetch user sessions for selected date
  const fetchUserSessions = useCallback(async (showLoading = true, date = null) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      if (!userId) {
        console.error('❌ User ID not found');
        setError('User ID not found.');
        setIsLoading(false);
        return;
      }

      // Use provided date or selectedDate (defaults to today)
      const queryDate = date || selectedDate || getTodayDate();

      const response = await getUserSessions(userId, queryDate);
      if (response.success && response.data) {
        setTrackingData(response.data);
      } else {
        console.error('❌ Failed to fetch user sessions:', response.message);
        setError(response.message || 'Failed to fetch user sessions');
      }
    } catch (err) {
      console.error('🔥 Error fetching user sessions:', err);
      setError('Something went wrong while fetching user sessions');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId, selectedDate]);

  // Fetch all dates where user has sessions
  const fetchAllUserSessionDates = useCallback(async () => {
    try {
      if (!userId) {
        console.error('❌ Cannot fetch session dates: userId missing');
        return;
      }

      const response = await getUserSessionDates(userId);

      if (response.success && response.data) {
        setDatesWithSessions(response.data.dates || []);
      } else {
        console.error('❌ Failed to fetch session dates:', response.message);
      }
    } catch (error) {
      console.error('🔥 Error fetching session dates:', error);
    }
  }, [userId]);

  // Update marked dates when datesWithSessions or selectedDate changes
  useEffect(() => {
    const marks = {};

    // Mark all dates that have sessions with dots
    datesWithSessions.forEach(date => {
      marks[date] = {
        dots: [
          {
            key: 'tracking',
            color: '#2563eb',
            selectedDotColor: '#FFF',
          }
        ],
        marked: true,
      };
    });

    // Add selected date marking (highlight in blue)
    if (selectedDate) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: '#ff9f1c',
        selectedTextColor: '#ffffff',
      };
    }

    // Mark today's date with a green dot
    const today = getTodayDate();
    if (marks[today]) {
      marks[today] = {
        ...marks[today],
        today: true,
        dots: [
          ...(marks[today].dots || []),
          {
            key: 'today',
            color: '#4CAF50',
            selectedDotColor: '#FFF',
          }
        ],
      };
    } else {
      marks[today] = {
        today: true,
        dots: [
          {
            key: 'today',
            color: '#4CAF50',
            selectedDotColor: '#FFF',
          }
        ],
      };
    }
    setMarkedDates(marks);
  }, [datesWithSessions, selectedDate]);

  // Initial fetch - get today's sessions and all dates with sessions
  useEffect(() => {
    const today = getTodayDate();
    setSelectedDate(today);

    // Fetch both data in parallel
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchUserSessions(false, today),
          fetchAllUserSessionDates()
        ]);
      } catch (error) {
        console.error('🔥 Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([
      fetchUserSessions(true, selectedDate),
      fetchAllUserSessionDates()
    ]).finally(() => {
      console.log('✅ Manual refresh complete');
      setIsRefreshing(false);
    });
  };

  // Format duration from seconds to HH:MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Format distance in km
  const formatDistanceKm = (val) => {
    if (val == null || val === undefined) return '0.00 km';
    const n = Number(val);
    const km = n > 500 ? n / 1000 : n;
    return `${km.toFixed(2)} km`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (iso) => {
    if (!iso) return '—';
    
    // If the string doesn't have 'Z' and no timezone offset, assume it's UTC
    let dateStr = iso;
    if (iso && !iso.endsWith('Z') && !iso.includes('+')) {
      dateStr = iso + 'Z'; // Append Z to treat as UTC
    }

    const d = new Date(dateStr);

    // Check if date is valid
    if (isNaN(d.getTime())) return '—';

    return d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get session count for current selected date
  const getSessionCountForDate = () => {
    return (trackingData?.sessions || []).length;
  };

  // Handle day press in calendar
  const onDayPress = (day) => {
    // Update selected date state
    setSelectedDate(day.dateString);
    setCalendarVisible(false);

    // Fetch sessions for selected date
    fetchUserSessions(true, day.dateString);
  };

  // Handle date press in header
  const handleDatePress = () => {
    setCalendarVisible(!calendarVisible);
  };

  // Render stats card based on current sessions
  const renderStatsCard = () => {
    // Get the displayedTotalDistance from pageStats if available
    const displayedDistance = trackingData?.pageStats?.displayedDistanceDisplay ||
      trackingData?.pageStats?.displayedTotalDistance ||
      0;

    // Format the distance if it's a number and not already formatted
    const distanceText = trackingData?.pageStats?.displayedDistanceDisplay ||
      (typeof displayedDistance === 'number' ? formatDistanceKm(displayedDistance) : displayedDistance);

    const totalSessions = trackingData?.pageStats?.displayedSessions ||
      (trackingData?.sessions || []).length;

    return (
      <View style={styles.summaryCard}>
        <Icon2 name="bicycle" size={34} color="#fff" />
        <Text style={styles.summaryDistance}>{distanceText}</Text>
        <Text style={styles.summaryLabel}>Total Traveled Distance</Text>
        <View style={styles.sessionCountBadge}>
          <Text style={styles.sessionCountText}>{totalSessions} Sessions</Text>
        </View>
      </View>
    );
  };

  // Render session item - REDESIGNED to match example code
  const renderSessionItem = ({ item, index }) => {
    const isActive = !item.endTime;
    const start = formatTime(item.startTime);
    const end = isActive ? 'Active' : formatTime(item.endTime);
    const distance = item.totalDistance ?? 0;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isActive ? styles.cardActive : styles.cardInactive,
        ]}
        onPress={() => {
          console.log('👉 Session item pressed:', {
            sessionId: item.sessionId,
            date: item.startTime
          });
          navigation.navigate('SessionDetailMap', {
            userId: userId,
            sessionId: item.sessionId,
            sessionDate: item.startTime,
          });
        }}
        activeOpacity={0.7}
      >
        {/* Top time strip */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderIconWrap}>
            <Icon2 name="clock-o" size={16} color="#2563eb" />
          </View>
          <Text style={styles.cardHeaderTime}>
            {start} - {end}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.cardDivider} />

        {/* Delivery stations */}
        <View style={styles.infoRow}>
          <View style={styles.roundIconBlue}>
            <Icon2 name="bicycle" size={16} color="#0f5fc5" />
          </View>
          <Text style={styles.infoText}>
            Delivery Stations: {item.deliveryStations ?? 0}
          </Text>
        </View>

        {/* Distance */}
        <View style={styles.infoRow}>
          <View style={styles.roundIconOrange}>
            <Icon2 name="road" size={16} color="#f97316" />
          </View>
          <Text style={styles.infoText}>
            Travelled Distance: {formatDistanceKm(distance)}
          </Text>
        </View>

        {/* View details button */}
        <View style={styles.detailsButton}>
          <Icon2 name="user" size={16} color="#2563eb" />
          <Text style={styles.detailsText}>View Details</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty sessions
  const renderEmptySessions = () => (
    <View style={styles.empty}>
      <Icon2 name="history" size={50} color="#d1d5db" />
      <Text style={styles.emptyText}>No tracking sessions</Text>
      <Text style={styles.emptySubtext}>
        for {formatHeaderDate(selectedDate)}
      </Text>
    </View>
  );

  // Render calendar popup
  const renderCalendarPopup = () => {
    if (!calendarVisible) return null;

    return (
      <View style={styles.modalContainer}>
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>Select Date</Text>
            <TouchableOpacity onPress={() => setCalendarVisible(false)} style={styles.closeButton}>
              <Icon2 name="times" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <Calendar
            onDayPress={onDayPress}
            markedDates={markedDates}
            markingType={'multi-dot'}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#b6c1cd',
              selectedDayBackgroundColor: '#ff9f1c',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#ff9f1c',
              dayTextColor: '#2d4150',
              textDisabledColor: '#d9e1e8',
              dotColor: '#2563eb',
              selectedDotColor: '#ffffff',
              arrowColor: '#2563eb',
              monthTextColor: '#2563eb',
              indicatorColor: '#2563eb',
              textDayFontWeight: '300',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '300',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            style={styles.calendar}
          />

          {/* Calendar Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
              <Text style={styles.legendText}>Has tracking data</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ff9f1c' }]} />
              <Text style={styles.legendText}>Today</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Loading state
  if (isLoading && !trackingData) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3088C7" />
        <CustomHeader
          navigation={navigation}
          showBackButton={true}
          title={userName || 'User Tracking'}
          titleColor="#ffffff"
          iconColor="#ffffff"
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading tracking data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3088C7" />

      {/* Custom Header with Back button, User Name, and Calendar */}
      <CustomHeader
        navigation={navigation}
        showBackButton={true}
        title={userName || 'User Tracking'}
        showDatePicker={true}
        onDatePress={handleDatePress}
        date={formatHeaderDate(selectedDate)}
        iconColor="#ffffff"
        titleColor="#ffffff"
      />
      
      {/* Calendar Popup */}
      {renderCalendarPopup()}
      
      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              console.log('👆 Retry pressed for date:', selectedDate);
              setError(null);
              handleRefresh();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {!error && trackingData && (
        <FlatList
          data={trackingData.sessions || []}
          renderItem={renderSessionItem}
          keyExtractor={(item, index) => item.sessionId || index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Stats Card */}
              {renderStatsCard()}
              
              {/* Sessions Header */}
              <View style={styles.sessionsHeader}>
                <Text style={styles.sectionTitle}>Session Details</Text>
              </View>
            </>
          }
          ListEmptyComponent={renderEmptySessions}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#2563eb']}
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
    backgroundColor: '#f4f6f8',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Poppins-Regular',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    margin: 20,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3088C7',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // Summary Card - Redesigned
  summaryCard: {
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: '#ff9f1c',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  summaryDistance: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
    fontFamily: 'Poppins-Bold',
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  sessionCountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sessionCountText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  
  // Session Card - Redesigned to match example
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 14,
    borderLeftWidth: 4,
    shadowColor: '#93c5fd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  cardInactive: {
    borderLeftColor: '#0f5fc5', // blue for completed sessions
  },
  cardActive: {
    borderLeftColor: '#22c55e', // green for active session
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
  },
  cardHeaderIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e5f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardHeaderTime: {
    fontSize: 15,
    fontWeight: '700',
    color: '#566000',
    fontFamily: 'Poppins-Bold',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 13,
    color: '#4b5563',
    fontFamily: 'Poppins-Regular',
  },
  roundIconBlue: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e0ecff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundIconOrange: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff3e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fbff',
    borderRadius: 20,
    paddingVertical: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#d0e0ff',
  },
  detailsText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    fontFamily: 'Poppins-Medium',
  },
  
  sessionsHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  
  // Empty State
  empty: {
    alignItems: 'center',
    marginTop: 40,
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Poppins-Medium',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#9ca3af',
    fontFamily: 'Poppins-Regular',
  },

  // Calendar Modal Styles - Redesigned
  modalContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  calendarContainer: {
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563eb',
    fontFamily: 'Poppins-Bold',
  },
  closeButton: {
    padding: 8,
  },
  calendar: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#4b5563',
    fontFamily: 'Poppins-Regular',
  },
});

export default UserTrackingHistory;