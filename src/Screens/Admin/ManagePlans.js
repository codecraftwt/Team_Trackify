// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   StyleSheet,
//   Text,
//   View,
//   FlatList,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
//   RefreshControl,
// } from 'react-native';
// import { useNavigation, useIsFocused } from '@react-navigation/native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { getAllPlans, getUserSubscriptionStatus, isAddOnPlan } from '../../services/PlansService';

// export default function ManagePlans() {
//   const navigation = useNavigation();
//   const isFocused = useIsFocused();

//   // State for plans data from API
//   const [plans, setPlans] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);

//   // Subscription status
//   const [subscriptionStatus, setSubscriptionStatus] = useState({
//     hasActivePlan: false,
//     hasExpiredPlan: false,
//     hasNoPlan: true,
//   });
//   const [loadingSubscription, setLoadingSubscription] = useState(true);
//   const [showAllPlans, setShowAllPlans] = useState(false);

//   // Fetch plans from API
//   const fetchPlans = useCallback(async (isRefresh = false) => {
//     try {
//       if (isRefresh) {
//         setRefreshing(true);
//       } else {
//         setLoading(true);
//       }
//       setError(null);

//       const response = await getAllPlans();

//       // Map API response to match the expected format
//       const mappedPlans = response.map((plan) => ({
//         id: plan._id,
//         name: plan.name,
//         description: plan.description,
//         minUsers: plan.minUsers,
//         maxUsers: plan.maxUsers,
//         price: plan.price,
//         duration: plan.duration,
//         status: plan.status,
//       }));

//       setPlans(mappedPlans);
//     } catch (err) {
//       setError(err.message || 'Failed to fetch plans');
//       console.error('Error fetching plans:', err);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   // Fetch subscription status
//   const fetchSubscriptionStatus = async () => {
//     try {
//       setLoadingSubscription(true);
//       const status = await getUserSubscriptionStatus();
//       // console.log('ManagePlans - Subscription status:', status);
//       setSubscriptionStatus(status);
//     } catch (error) {
//       console.error('Error fetching subscription status:', error);
//       // Default to no plan on error
//       setSubscriptionStatus({
//         hasActivePlan: false,
//         hasExpiredPlan: false,
//         hasNoPlan: true,
//       });
//     } finally {
//       setLoadingSubscription(false);
//     }
//   };

//   // Fetch plans on component mount
//   useEffect(() => {
//     fetchPlans();
//     fetchSubscriptionStatus();
//   }, [fetchPlans]);

//   // Refresh subscription status when screen is focused
//   useEffect(() => {
//     if (isFocused) {
//       fetchSubscriptionStatus();
//     }
//   }, [isFocused]);

//   // Handle pull-to-refresh
//   const onRefresh = useCallback(() => {
//     fetchPlans(true);
//   }, [fetchPlans]);

//   const renderItem = ({ item }) => {
//     const isAddOn = isAddOnPlan(item.name);

//     // Determine if this plan should be disabled
//     let isDisabled = false;
//     let disableReason = '';

//     if (!loadingSubscription) {
//       if (subscriptionStatus.hasActivePlan && !isAddOn) {
//         // Has active plan - can only buy add-ons, not base plans
//         isDisabled = true;
//         disableReason = 'Active Plan';
//       } else if (subscriptionStatus.hasNoPlan && isAddOn) {
//         // No plan - can only buy base plans, not add-ons
//         isDisabled = true;
//         disableReason = 'Needs Base Plan';
//       } else if (subscriptionStatus.hasExpiredPlan && isAddOn) {
//         // Expired plan - can only buy base plans, not add-ons
//         isDisabled = true;
//         disableReason = 'Renew First';
//       }
//     }

//     return (
//       <TouchableOpacity
//         style={[styles.card, isDisabled && styles.cardDisabled]}
//         activeOpacity={isDisabled ? 1 : 0.7}
//         onPress={() => {
//           if (isDisabled) {
//             Alert.alert(
//               'Plan Unavailable',
//               disableReason === 'Active Plan'
//                 ? 'You already have an active base plan. You can purchase add-ons.'
//                 : disableReason === 'Needs Base Plan'
//                   ? 'You need to purchase a base plan first before buying add-ons.'
//                   : 'Please renew your base plan first before purchasing add-ons.'
//             );
//           } else {
//             navigation.navigate('PlanDetails', { planId: item.id });
//           }
//         }}
//       >
//         <View style={[styles.cardAccent, isAddOn && { backgroundColor: '#F57C00' }, isDisabled && { backgroundColor: '#CCC' }]} />
//         <View style={styles.cardLeft}>
//           <View style={styles.cardHeaderRow}>
//             <Icon
//               name={isAddOn ? "add-circle" : "star"}
//               size={20}
//               color={isDisabled ? "#CCC" : isAddOn ? "#F57C00" : "#4A90E2"}
//               style={{ marginRight: 6 }}
//             />
//             <Text style={[styles.planName, isDisabled && styles.planNameDisabled]}>{item.name}</Text>
//             {isAddOn && (
//               <View style={styles.addOnBadge}>
//                 <Text style={styles.addOnBadgeText}>ADD-ON</Text>
//               </View>
//             )}
//             {isDisabled && (
//               <View style={styles.disabledBadge}>
//                 <Icon name="lock" size={12} color="#666" />
//                 <Text style={styles.disabledBadgeText}>{disableReason}</Text>
//               </View>
//             )}
//           </View>
//           <Text style={[styles.planDescription, isDisabled && styles.planDescriptionDisabled]} numberOfLines={2}>
//             {item.description}
//           </Text>
//           <View style={styles.planDetails}>
//             <View style={styles.detailItem}>
//               <Icon name="group" size={16} color={isDisabled ? "#CCC" : "#666"} />
//               <Text style={[styles.detailText, isDisabled && styles.detailTextDisabled]}>{item.minUsers}-{item.maxUsers} users</Text>
//             </View>
//             <View style={styles.detailItem}>
//               <Icon name="schedule" size={16} color={isDisabled ? "#CCC" : "#666"} />
//               <Text style={[styles.detailText, isDisabled && styles.detailTextDisabled]}>{item.duration}</Text>
//             </View>
//           </View>
//           <Text style={styles.planPrice}>
//             <Icon name="attach-money" size={18} color={isDisabled ? "#CCC" : "#27AE60"} />
//             <Text style={[styles.priceText, isDisabled && styles.priceTextDisabled]}> {item.price.toLocaleString()}₹</Text>
//           </Text>
//         </View>
//       </TouchableOpacity>
//     )
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           onPress={() => navigation.goBack()}
//           style={styles.backButton}>
//           <Icon name="arrow-back" size={24} color="#333" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Available Plans</Text>
//       </View>

//       {/* Stats Card */}
//       <TouchableOpacity
//         style={styles.statsCard}
//         activeOpacity={0.7}
//         onPress={() => navigation.navigate('Plans')}>
//         <View style={styles.statsCardContent}>
//           <View style={styles.statsIconWrapper}>
//             <Icon name="assessment" size={24} color="#F57C00" />
//           </View>
//           <View style={styles.statsInfo}>
//             <Text style={styles.statsTitle}>Total Plans</Text>
//             <Text style={styles.statsValue}>{plans.length}</Text>
//           </View>
//         </View>
//       </TouchableOpacity>

//       {/* Plans List Header */}
//       <View style={styles.listHeader}>
//         <Text style={styles.listTitle}>
//           Available Plans ({plans.length})
//         </Text>
//         {plans.length > 4 && (
//           <TouchableOpacity onPress={() => setShowAllPlans(!showAllPlans)}>
//             <View style={styles.seeAllContainer}>
//               <Text style={styles.seeAllText}>
//                 {showAllPlans ? 'Show Less' : 'See All'}
//               </Text>
//               <Icon
//                 name={showAllPlans ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
//                 size={20}
//                 color="#4A90E2"
//               />
//             </View>
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* Loading Indicator */}
//       {loading && (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#4A90E2" />
//           <Text style={styles.loadingText}>Loading plans...</Text>
//         </View>
//       )}

//       {/* Error Message */}
//       {error && !loading && (
//         <View style={styles.errorContainer}>
//           <Icon name="error-outline" size={50} color="#E74C3C" />
//           <Text style={styles.errorText}>{error}</Text>
//           <TouchableOpacity
//             style={styles.retryButton}
//             onPress={() => fetchPlans()}>
//             <Text style={styles.retryButtonText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       {/* Plans List */}
//       {!loading && !error && (
//         <FlatList
//           data={showAllPlans ? plans : plans.slice(0, 4)}
//           keyExtractor={(item) => item.id}
//           renderItem={renderItem}
//           contentContainerStyle={styles.listContent}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               colors={['#4A90E2']}
//               tintColor="#4A90E2"
//             />
//           }
//           ListEmptyComponent={
//             <View style={styles.emptyContainer}>
//               <Icon name="inbox" size={60} color="#ccc" />
//               <Text style={styles.emptyText}>No plans available</Text>
//             </View>
//           }
//         />
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8F9FA',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   backButton: {
//     padding: 4,
//     width: 32,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontFamily: 'Poppins-SemiBold',
//     color: '#333',
//     textAlign: 'center',
//     flex: 1,
//   },
//   addButton: {
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: '#f8f8f8',
//   },
//   statsCard: {
//     margin: 16,
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   statsCardContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   statsIconWrapper: {
//     width: 50,
//     height: 50,
//     borderRadius: 12,
//     backgroundColor: '#FFF3E0',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 16,
//   },
//   statsInfo: {
//     flex: 1,
//   },
//   statsTitle: {
//     fontSize: 14,
//     color: '#666',
//     fontFamily: 'Rubik-Regular',
//   },
//   statsValue: {
//     fontSize: 28,
//     fontFamily: 'Poppins-Bold',
//     color: '#333',
//   },
//   listHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     marginBottom: 12,
//   },
//   listTitle: {
//     fontSize: 16,
//     fontFamily: 'Rubik-Medium',
//     color: '#333',
//   },
//   seeAllContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   seeAllText: {
//     fontSize: 14,
//     color: '#4A90E2',
//     fontFamily: 'Rubik-Medium',
//   },
//   listContent: {
//     paddingHorizontal: 16,
//     paddingBottom: 20,
//   },
//   card: {
//     flexDirection: 'row',
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//     position: 'relative',
//   },
//   cardAccent: {
//     position: 'absolute',
//     left: 0,
//     top: 16,
//     bottom: 16,
//     width: 4,
//     backgroundColor: '#4A90E2',
//     borderTopRightRadius: 4,
//     borderBottomRightRadius: 4,
//   },
//   cardLeft: {
//     flex: 1,
//     marginLeft: 12,
//   },
//   cardHeaderRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   planName: {
//     fontSize: 16,
//     fontFamily: 'Poppins-SemiBold',
//     color: '#333',
//     flex: 1,
//   },
//   addOnBadge: {
//     backgroundColor: '#F57C00',
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 8,
//     marginLeft: 8,
//   },
//   addOnBadgeText: {
//     color: '#fff',
//     fontSize: 10,
//     fontFamily: 'Poppins-Bold',
//     letterSpacing: 0.5,
//   },
//   // Disabled state styles
//   cardDisabled: {
//     opacity: 0.6,
//     backgroundColor: '#F5F5F5',
//   },
//   planNameDisabled: {
//     color: '#999',
//   },
//   planDescriptionDisabled: {
//     color: '#CCC',
//   },
//   detailTextDisabled: {
//     color: '#CCC',
//   },
//   priceTextDisabled: {
//     color: '#CCC',
//   },
//   disabledBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#EEE',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//     marginLeft: 8,
//   },
//   disabledBadgeText: {
//     color: '#666',
//     fontSize: 9,
//     fontFamily: 'Poppins-Medium',
//     marginLeft: 2,
//   },
//   planDescription: {
//     fontSize: 13,
//     color: '#666',
//     fontFamily: 'Rubik-Regular',
//     marginBottom: 8,
//   },
//   planDetails: {
//     flexDirection: 'row',
//     marginBottom: 8,
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginRight: 16,
//   },
//   detailText: {
//     fontSize: 12,
//     color: '#666',
//     fontFamily: 'Rubik-Regular',
//     marginLeft: 4,
//   },
//   planPrice: {
//     fontSize: 16,
//     fontFamily: 'Poppins-SemiBold',
//     color: '#27AE60',
//   },
//   priceText: {
//     fontSize: 14,
//     color: '#666',
//     fontFamily: 'Rubik-Regular',
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 40,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: '#999',
//     fontFamily: 'Rubik-Regular',
//     marginTop: 16,
//     marginBottom: 20,
//   },
//   // Loading styles
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 16,
//     color: '#666',
//     fontFamily: 'Rubik-Regular',
//   },
//   // Error styles
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 40,
//     paddingHorizontal: 20,
//   },
//   errorText: {
//     marginTop: 12,
//     fontSize: 16,
//     color: '#E74C3C',
//     fontFamily: 'Rubik-Regular',
//     textAlign: 'center',
//   },
//   retryButton: {
//     marginTop: 16,
//     backgroundColor: '#4A90E2',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 25,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontFamily: 'Rubik-Medium',
//   },
// });
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getAllPlans,
  getUserSubscriptionStatus,
  isAddOnPlan,
  getUserCustomPlan,
  createCustomPlan,
  updateCustomPlan,
  deleteCustomPlan,
} from '../../services/PlansService';

export default function ManagePlans() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  // State for plans data from API
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Subscription status
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    hasActivePlan: false,
    hasExpiredPlan: false,
    hasNoPlan: true,
  });
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [showAllPlans, setShowAllPlans] = useState(false);

  // Custom Plan States
  const [customPlan, setCustomPlan] = useState(null);
  const [loadingCustomPlan, setLoadingCustomPlan] = useState(false);
  const [showCustomPlanModal, setShowCustomPlanModal] = useState(false);
  const [isEditingCustomPlan, setIsEditingCustomPlan] = useState(false);
  const [customPlanForm, setCustomPlanForm] = useState({
    minUsers: '',
    maxUsers: '',
    durationValue: '',
    durationUnit: 'months',
  });
  const [savingCustomPlan, setSavingCustomPlan] = useState(false);
  const [deletingCustomPlan, setDeletingCustomPlan] = useState(false);

  // Fetch custom plan using the new API
  const fetchCustomPlan = async () => {
    try {
      setLoadingCustomPlan(true);
      const result = await getUserCustomPlan();
      console.log("Custom plan fetched:", result);
      
      // Handle different response formats
      let planData = null;
      
      if (result) {
        if (result.plan) {
          planData = result.plan;
        } else if (result._id || result.minUsers) {
          planData = result;
        }
      }
      
      if (planData) {
        setCustomPlan(planData);
        // Populate form for editing
        setCustomPlanForm({
          minUsers: planData.minUsers?.toString() || '',
          maxUsers: planData.maxUsers?.toString() || '',
          durationValue: planData.durationValue?.toString() || '',
          durationUnit: planData.durationUnit || 'months',
        });
      } else {
        setCustomPlan(null);
      }
    } catch (error) {
      console.error('Error fetching custom plan:', error);
      setCustomPlan(null);
    } finally {
      setLoadingCustomPlan(false);
    }
  };

  // Fetch all plans from API
  const fetchPlans = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await getAllPlans();

      // Map API response to match the expected format
      const mappedPlans = response.map((plan) => ({
        id: plan._id,
        name: plan.name,
        description: plan.description,
        minUsers: plan.minUsers,
        maxUsers: plan.maxUsers,
        price: plan.price,
        duration: plan.duration,
        status: plan.status,
      }));

      setPlans(mappedPlans);
    } catch (err) {
      setError(err.message || 'Failed to fetch plans');
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch subscription status
  const fetchSubscriptionStatus = async () => {
    try {
      setLoadingSubscription(true);
      const status = await getUserSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setSubscriptionStatus({
        hasActivePlan: false,
        hasExpiredPlan: false,
        hasNoPlan: true,
      });
    } finally {
      setLoadingSubscription(false);
    }
  };

  // Handle creating/updating custom plan
  const handleSaveCustomPlan = async () => {
    // Validate form
    const minUsers = parseInt(customPlanForm.minUsers);
    const maxUsers = parseInt(customPlanForm.maxUsers);
    const durationValue = parseInt(customPlanForm.durationValue);

    if (!minUsers || !maxUsers || !durationValue) {
      Alert.alert('Validation Error', 'Please fill all fields');
      return;
    }

    if (minUsers < 1 || maxUsers < 1) {
      Alert.alert('Validation Error', 'User counts must be at least 1');
      return;
    }

    if (minUsers > maxUsers) {
      Alert.alert('Validation Error', 'Minimum users cannot be greater than maximum users');
      return;
    }

    if (durationValue < 1) {
      Alert.alert('Validation Error', 'Duration must be at least 1');
      return;
    }

    const validUnits = ['day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years'];
    if (!validUnits.includes(customPlanForm.durationUnit)) {
      Alert.alert('Validation Error', 'Invalid duration unit');
      return;
    }

    try {
      setSavingCustomPlan(true);

      if (isEditingCustomPlan && customPlan) {
        // Update existing custom plan
        await updateCustomPlan(customPlan._id, {
          minUsers,
          maxUsers,
          durationValue,
          durationUnit: customPlanForm.durationUnit,
        });
        Alert.alert('Success', 'Custom plan updated successfully!');
      } else {
        // Create new custom plan
        await createCustomPlan({
          minUsers,
          maxUsers,
          durationValue,
          durationUnit: customPlanForm.durationUnit,
        });
        Alert.alert('Success', 'Custom plan created successfully!');
      }

      // Refresh custom plan data
      await fetchCustomPlan();
      setShowCustomPlanModal(false);
      setIsEditingCustomPlan(false);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save custom plan');
    } finally {
      setSavingCustomPlan(false);
    }
  };

  // Handle delete custom plan
  const handleDeleteCustomPlan = () => {
    Alert.alert(
      'Delete Custom Plan',
      'Are you sure you want to delete your custom plan? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingCustomPlan(true);
              await deleteCustomPlan(customPlan._id);
              Alert.alert('Success', 'Custom plan deleted successfully!');
              setCustomPlan(null);
              await fetchCustomPlan();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete custom plan');
            } finally {
              setDeletingCustomPlan(false);
            }
          }
        }
      ]
    );
  };

  // Fetch data on mount
  useEffect(() => {
    fetchPlans();
    fetchSubscriptionStatus();
    fetchCustomPlan();
  }, [fetchPlans]);

  // Refresh data when screen is focused
  useEffect(() => {
    if (isFocused) {
      fetchSubscriptionStatus();
      fetchCustomPlan();
    }
  }, [isFocused]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    fetchPlans(true);
    fetchSubscriptionStatus();
    fetchCustomPlan();
  }, [fetchPlans]);

  const renderRegularPlanItem = ({ item }) => {
    const isAddOn = isAddOnPlan(item.name);

    // Determine if this plan should be disabled
    let isDisabled = false;
    let disableReason = '';

    if (!loadingSubscription) {
      if (subscriptionStatus.hasActivePlan && !isAddOn) {
        isDisabled = true;
        disableReason = 'Active Plan';
      } else if (subscriptionStatus.hasNoPlan && isAddOn) {
        isDisabled = true;
        disableReason = 'Needs Base Plan';
      } else if (subscriptionStatus.hasExpiredPlan && isAddOn) {
        isDisabled = true;
        disableReason = 'Renew First';
      }
    }

    return (
      <TouchableOpacity
        style={[styles.card, isDisabled && styles.cardDisabled]}
        activeOpacity={isDisabled ? 1 : 0.7}
        onPress={() => {
          if (isDisabled) {
            Alert.alert(
              'Plan Unavailable',
              disableReason === 'Active Plan'
                ? 'You already have an active base plan. You can purchase add-ons.'
                : disableReason === 'Needs Base Plan'
                  ? 'You need to purchase a base plan first before buying add-ons.'
                  : 'Please renew your base plan first before purchasing add-ons.'
            );
          } else {
            navigation.navigate('PlanDetails', { 
              planId: item.id,
              isCustomPlan: false 
            });
          }
        }}
      >
        <View style={[styles.cardAccent, isAddOn && { backgroundColor: '#F57C00' }, isDisabled && { backgroundColor: '#CCC' }]} />
        <View style={styles.cardLeft}>
          <View style={styles.cardHeaderRow}>
            <Icon
              name={isAddOn ? "add-circle" : "star"}
              size={20}
              color={isDisabled ? "#CCC" : (isAddOn ? "#F57C00" : "#4A90E2")}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.planName, isDisabled && styles.planNameDisabled]}>{item.name}</Text>
            {isAddOn && (
              <View style={styles.addOnBadge}>
                <Text style={styles.addOnBadgeText}>ADD-ON</Text>
              </View>
            )}
            {isDisabled && (
              <View style={styles.disabledBadge}>
                <Icon name="lock" size={12} color="#666" />
                <Text style={styles.disabledBadgeText}>{disableReason}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.planDescription, isDisabled && styles.planDescriptionDisabled]} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.planDetails}>
            <View style={styles.detailItem}>
              <Icon name="group" size={16} color={isDisabled ? "#CCC" : "#666"} />
              <Text style={[styles.detailText, isDisabled && styles.detailTextDisabled]}>{item.minUsers}-{item.maxUsers} users</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="schedule" size={16} color={isDisabled ? "#CCC" : "#666"} />
              <Text style={[styles.detailText, isDisabled && styles.detailTextDisabled]}>{item.duration}</Text>
            </View>
          </View>
          <Text style={styles.planPrice}>
            <Icon name="attach-money" size={18} color={isDisabled ? "#CCC" : "#27AE60"} />
            <Text style={[styles.priceText, isDisabled && styles.priceTextDisabled]}> {item.price.toLocaleString()}₹</Text>
          </Text>
        </View>
      </TouchableOpacity>
    )
  };

  // Custom Plan Modal
  const renderCustomPlanModal = () => (
    <Modal
      visible={showCustomPlanModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCustomPlanModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditingCustomPlan ? 'Edit Custom Plan' : 'Create Custom Plan'}
            </Text>
            <TouchableOpacity onPress={() => setShowCustomPlanModal(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Minimum Users *</Text>
              <TextInput
                style={styles.formInput}
                value={customPlanForm.minUsers}
                onChangeText={(text) => setCustomPlanForm({ ...customPlanForm, minUsers: text })}
                keyboardType="numeric"
                placeholder="e.g., 5"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Maximum Users *</Text>
              <TextInput
                style={styles.formInput}
                value={customPlanForm.maxUsers}
                onChangeText={(text) => setCustomPlanForm({ ...customPlanForm, maxUsers: text })}
                keyboardType="numeric"
                placeholder="e.g., 10"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Duration Value *</Text>
              <TextInput
                style={styles.formInput}
                value={customPlanForm.durationValue}
                onChangeText={(text) => setCustomPlanForm({ ...customPlanForm, durationValue: text })}
                keyboardType="numeric"
                placeholder="e.g., 30"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Duration Unit *</Text>
              <View style={styles.unitSelector}>
                {['days', 'weeks', 'months', 'years'].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.unitButton,
                      customPlanForm.durationUnit === unit && styles.unitButtonActive
                    ]}
                    onPress={() => setCustomPlanForm({ ...customPlanForm, durationUnit: unit })}
                  >
                    <Text style={[
                      styles.unitButtonText,
                      customPlanForm.durationUnit === unit && styles.unitButtonTextActive
                    ]}>
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCustomPlanModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveCustomPlan}
                disabled={savingCustomPlan}
              >
                {savingCustomPlan ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isEditingCustomPlan ? 'Update' : 'Create'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Available Plans</Text>
        <TouchableOpacity
          style={styles.createCustomButton}
          onPress={() => {
            setIsEditingCustomPlan(false);
            setCustomPlanForm({
              minUsers: '',
              maxUsers: '',
              durationValue: '',
              durationUnit: 'months',
            });
            setShowCustomPlanModal(true);
          }}
        >
          <Icon name="add-circle" size={20} color="#9C27B0" />
          <Text style={styles.createCustomButtonText}>
            {customPlan ? 'Edit Custom Plan' : 'Create Custom Plan'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Plan Section - Display if exists */}
      {!loadingCustomPlan && (
        <>
          {customPlan ? (
            <View style={styles.customPlanSection}>
              <View style={styles.sectionHeader}>
                <Icon name="star" size={20} color="#9C27B0" />
                <Text style={styles.sectionTitle}>Your Custom Plan</Text>
              </View>
              
              <TouchableOpacity
                style={[styles.card, styles.customPlanCard]}
                activeOpacity={0.7}
                onPress={() => {
                  navigation.navigate('PlanDetails', { 
                    planId: customPlan._id,
                    isCustomPlan: true,
                    customPlanData: customPlan
                  });
                }}
              >
                <View style={[styles.cardAccent, { backgroundColor: '#9C27B0' }]} />
                <View style={styles.cardLeft}>
                  <View style={styles.cardHeaderRow}>
                    <Icon name="build" size={20} color="#9C27B0" style={{ marginRight: 6 }} />
                    <Text style={[styles.planName, styles.customPlanName]}>
                      {customPlan.name || 'Custom Plan'}
                    </Text>
                    <View style={styles.customPlanBadge}>
                      <Icon name="star" size={10} color="#9C27B0" />
                      <Text style={styles.customPlanBadgeText}>CUSTOM</Text>
                    </View>
                  </View>
                  <Text style={[styles.planDescription, styles.customPlanDescription]} numberOfLines={2}>
                    Custom plan: {customPlan.minUsers}-{customPlan.maxUsers} users for {customPlan.durationValue} {customPlan.durationUnit}
                  </Text>
                  <View style={styles.planDetails}>
                    <View style={styles.detailItem}>
                      <Icon name="group" size={16} color="#9C27B0" />
                      <Text style={styles.detailText}>{customPlan.minUsers}-{customPlan.maxUsers} users</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Icon name="schedule" size={16} color="#9C27B0" />
                      <Text style={styles.detailText}>{customPlan.durationValue} {customPlan.durationUnit}</Text>
                    </View>
                  </View>
                  <Text style={styles.planPrice}>
                    <Icon name="attach-money" size={18} color="#9C27B0" />
                    <Text style={[styles.priceText, styles.customPlanPrice]}> {customPlan.price?.toLocaleString()}₹</Text>
                  </Text>
                  <View style={styles.customPlanActions}>
                    <TouchableOpacity
                      style={styles.editCustomPlanButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        setIsEditingCustomPlan(true);
                        setShowCustomPlanModal(true);
                      }}>
                      <Icon name="edit" size={14} color="#9C27B0" />
                      <Text style={styles.editCustomPlanText}>Edit</Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity
                      style={styles.deleteCustomPlanButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomPlan();
                      }}
                      disabled={deletingCustomPlan}
                    >
                      {deletingCustomPlan ? (
                        <ActivityIndicator size="small" color="#E74C3C" />
                      ) : (
                        <>
                          <Icon name="delete" size={14} color="#E74C3C" />
                          <Text style={styles.deleteCustomPlanText}>Delete</Text>
                        </>
                      )}
                    </TouchableOpacity> */}
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.customPlanSection}>
              <View style={styles.sectionHeader}>
                <Icon name="info" size={20} color="#999" />
                <Text style={[styles.sectionTitle, { color: '#999' }]}>
                  No Custom Plan Yet
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.card, styles.createCustomPlanPrompt]}
                onPress={() => {
                  setIsEditingCustomPlan(false);
                  setCustomPlanForm({
                    minUsers: '',
                    maxUsers: '',
                    durationValue: '',
                    durationUnit: 'months',
                  });
                  setShowCustomPlanModal(true);
                }}>
                <View style={styles.createPromptContent}>
                  <Icon name="add-circle" size={24} color="#9C27B0" />
                  <Text style={styles.createPromptText}>Create your custom plan →</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {loadingCustomPlan && (
        <View style={styles.customPlanSection}>
          <ActivityIndicator size="small" color="#9C27B0" />
          <Text style={styles.loadingCustomPlanText}>Loading custom plan...</Text>
        </View>
      )}

      {/* Stats Card */}
      <TouchableOpacity
        style={styles.statsCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Plans')}>
        <View style={styles.statsCardContent}>
          <View style={styles.statsIconWrapper}>
            <Icon name="assessment" size={24} color="#F57C00" />
          </View>
          <View style={styles.statsInfo}>
            <Text style={styles.statsTitle}>Total Plans</Text>
            <Text style={styles.statsValue}>{plans.length}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Plans List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          Available Plans ({plans.length})
        </Text>
        {plans.length > 4 && (
          <TouchableOpacity onPress={() => setShowAllPlans(!showAllPlans)}>
            <View style={styles.seeAllContainer}>
              <Text style={styles.seeAllText}>
                {showAllPlans ? 'Show Less' : 'See All'}
              </Text>
              <Icon
                name={showAllPlans ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={20}
                color="#4A90E2"
              />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      )}

      {/* Error Message */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={50} color="#E74C3C" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchPlans()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Regular Plans List */}
      {!loading && !error && (
        <FlatList
          data={showAllPlans ? plans : plans.slice(0, 4)}
          keyExtractor={(item) => item.id}
          renderItem={renderRegularPlanItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4A90E2']}
              tintColor="#4A90E2"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No plans available</Text>
            </View>
          }
        />
      )}

      {/* Custom Plan Modal */}
      {renderCustomPlanModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
    width: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  createCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#9C27B0',
  },
  createCustomButtonText: {
    color: '#9C27B0',
    fontFamily: 'Rubik-Medium',
    fontSize: 12,
    marginLeft: 4,
  },
  customPlanSection: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#9C27B0',
    marginLeft: 8,
  },
  statsCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statsCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statsInfo: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Rubik-Regular',
  },
  statsValue: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontFamily: 'Rubik-Medium',
    color: '#333',
  },
  seeAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4A90E2',
    fontFamily: 'Rubik-Medium',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  customPlanCard: {
    backgroundColor: '#F3E5F5',
    borderWidth: 1,
    borderColor: '#E1BEE7',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 4,
    backgroundColor: '#4A90E2',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  cardLeft: {
    flex: 1,
    marginLeft: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  planName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    flex: 1,
  },
  customPlanName: {
    color: '#9C27B0',
  },
  addOnBadge: {
    backgroundColor: '#F57C00',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  addOnBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.5,
  },
  customPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E1BEE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  customPlanBadgeText: {
    color: '#9C27B0',
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  // Disabled state styles
  cardDisabled: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  planNameDisabled: {
    color: '#999',
  },
  planDescriptionDisabled: {
    color: '#CCC',
  },
  detailTextDisabled: {
    color: '#CCC',
  },
  priceTextDisabled: {
    color: '#CCC',
  },
  disabledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  disabledBadgeText: {
    color: '#666',
    fontSize: 9,
    fontFamily: 'Poppins-Medium',
    marginLeft: 2,
  },
  planDescription: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Rubik-Regular',
    marginBottom: 8,
  },
  customPlanDescription: {
    color: '#7B1FA2',
  },
  planDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Rubik-Regular',
    marginLeft: 4,
  },
  planPrice: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#27AE60',
  },
  customPlanPrice: {
    color: '#9C27B0',
  },
  priceText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Rubik-Regular',
  },
  customPlanActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 16,
  },
  editCustomPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editCustomPlanText: {
    fontSize: 12,
    color: '#9C27B0',
    fontFamily: 'Rubik-Medium',
    marginLeft: 4,
  },
  deleteCustomPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteCustomPlanText: {
    fontSize: 12,
    color: '#E74C3C',
    fontFamily: 'Rubik-Medium',
    marginLeft: 4,
  },
  createCustomPlanPrompt: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
  },
  createPromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPromptText: {
    fontSize: 14,
    color: '#9C27B0',
    fontFamily: 'Rubik-Medium',
    marginLeft: 8,
  },
  loadingCustomPlanText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Rubik-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontFamily: 'Rubik-Regular',
    marginTop: 16,
    marginBottom: 20,
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Rubik-Regular',
  },
  // Error styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#E74C3C',
    fontFamily: 'Rubik-Regular',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Rubik-Regular',
    backgroundColor: '#fff',
  },
  unitSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  unitButtonActive: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0',
  },
  unitButtonText: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    color: '#666',
  },
  unitButtonTextActive: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButton: {
    backgroundColor: '#9C27B0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Rubik-Medium',
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Rubik-Medium',
    color: '#fff',
  },
});