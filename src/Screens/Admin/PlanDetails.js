import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { 
  getPlanById, 
  createOrder, 
  verifyPayment, 
  RAZORPAY_KEY,
  getUserSubscriptionStatus,
  isAddOnPlan,
  getPurchaseEligibility
} from '../../services/PlansService';
import RazorpayCheckout from 'react-native-razorpay';
// Dynamic import for Razorpay to handle potential loading issues
// let RazorpayCheckout;
// try {
//   const Razorpay = require('react-native-razorpay');
//   console.log('Razorpay module loaded:', Razorpay);
//   RazorpayCheckout = Razorpay.default || Razorpay;
//   console.log('RazorpayCheckout initialized:', RazorpayCheckout);
// } catch (e) {
//   console.warn('Razorpay package not available:', e);
// }

export default function PlanDetails({ route, navigation }) {
  const { planId } = route.params; // Get planId from navigation params
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  
  // Subscription status state
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    hasActivePlan: false,
    hasExpiredPlan: false,
    hasNoPlan: true,
    currentPaymentId: null,
  });
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  
  // Check if buy button should be disabled
  const isAddOn = plan ? isAddOnPlan(plan.name) : false;
  const eligibility = getPurchaseEligibility(subscriptionStatus, plan?.name || '');
  const isBuyDisabled = !eligibility.canBuy || purchasing || !razorpayReady;

  useEffect(() => {
    fetchPlanDetails();
    fetchSubscriptionStatus();
    
    // Verify Razorpay is available after component mounts
    const timer = setTimeout(() => {
      if (RazorpayCheckout && typeof RazorpayCheckout.open === 'function') {
        setRazorpayReady(true);
        // console.log('Razorpay is ready');
      } else {
        console.warn('Razorpay not available:', {
          RazorpayCheckout,
          hasOpen: RazorpayCheckout?.open !== undefined
        });
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Fetch subscription status
  const fetchSubscriptionStatus = async () => {
    try {
      setLoadingSubscription(true);
      const status = await getUserSubscriptionStatus();
      // console.log('Subscription status fetched:', status);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      // Set default status on error (allow purchase)
      setSubscriptionStatus({
        hasActivePlan: false,
        hasExpiredPlan: false,
        hasNoPlan: true,
        currentPaymentId: null,
      });
    } finally {
      setLoadingSubscription(false);
    }
  };

  // Handle Buy Plan payment
  const handleBuyPlan = async () => {
    if (!plan) return;
    
    // Check if Razorpay is available and has the open method
    if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
      Alert.alert(
        'Error',
        'Payment system is not available. Please restart the app or reinstall the package.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      setPurchasing(true);
      
      // console.log('Creating order for plan:', planId);
      
      // Step 1: Create order from backend
      const orderResponse = await createOrder(planId);
      
      // console.log('Order response:', orderResponse);
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create order');
      }
      
      const { orderId, amount, paymentId, description } = orderResponse.data;
      
      // Step 2: Open Razorpay Checkout
      const options = {
        description: description || `Purchase ${plan.name}`,
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: 'INR',
        key: RAZORPAY_KEY,
        amount: amount.toString(),
        order_id: orderId,
        name: 'Team Trackify',
        prefill: {
          email: '',
          contact: '',
          name: ''
        },
        theme: {
          color: '#4A90E2'
        }
      };
      
      // console.log('Opening Razorpay with options:', options);
      const razorpayResponse = await RazorpayCheckout.open(options);
      // console.log('Razorpay response:', razorpayResponse);
      
      // Step 3: Verify payment with backend
      const verifyResponse = await verifyPayment(
        razorpayResponse.razorpay_order_id,
        razorpayResponse.razorpay_payment_id,
        razorpayResponse.razorpay_signature,
        paymentId
      );
      
      if (verifyResponse.success) {
        Alert.alert(
          'Payment Successful!',
          'Your plan has been purchased successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        throw new Error(verifyResponse.message || 'Payment verification failed');
      }
      
    } catch (err) {
      console.error('Payment error:', err);
      
      let errorMessage = err.message || 'Something went wrong. Please try again.';
      
      // Provide more specific error messages for common issues
      if (err.message && err.message.includes('Cannot read property')) {
        errorMessage = 'Payment system is not properly initialized. Please reinstall the app.';
      }
      
      Alert.alert(
        'Payment Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setPurchasing(false);
    }
  };

  const fetchPlanDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPlanById(planId);
      
      // Map the response to match our display format
      const planData = {
        id: response._id,
        name: response.name,
        description: response.description,
        minUsers: response.minUsers,
        maxUsers: response.maxUsers,
        price: response.price,
        duration: response.duration,
        status: response.status,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      };
      
      setPlan(planData);
    } catch (err) {
      setError(err.message || 'Failed to fetch plan details');
      Alert.alert('Error', err.message || 'Failed to fetch plan details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading || loadingSubscription) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={60} color="#E74C3C" />
          <Text style={styles.errorText}>{error || 'Plan not found'}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchPlanDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan Details</Text>
        {/* <TouchableOpacity 
          onPress={() => navigation.navigate('ManagePlans')}
          style={styles.editButton}>
          <Icon name="edit" size={24} color="#4A90E2" />
        </TouchableOpacity> */}
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}>
        
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: plan.status === 'active' ? '#E8F5E9' : '#FFEBEE' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: plan.status === 'active' ? '#2E7D32' : '#C62828' }
            ]}>
              {plan.status?.toUpperCase() || 'ACTIVE'}
            </Text>
          </View>
        </View>

        {/* Plan Name Card */}
        <View style={styles.nameCard}>
          <Icon name={isAddOn ? "add-circle" : "star"} size={30} color={isAddOn ? "#F57C00" : "#4A90E2"} />
          <Text style={styles.planName}>{plan.name}</Text>
          {isAddOn && (
            <View style={styles.addOnBadge}>
              <Text style={styles.addOnBadgeText}>ADD-ON</Text>
            </View>
          )}
        </View>

        {/* Description Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="description" size={22} color="#4A90E2" />
            <Text style={styles.sectionTitle}>Description</Text>
          </View>
          <Text style={styles.descriptionText}>{plan.description}</Text>
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          {/* Price Card */}
          <View style={styles.detailCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
              <Icon name="attach-money" size={24} color="#2E7D32" />
            </View>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={[styles.detailValue, styles.priceValue]}>
              ₹{plan.price.toLocaleString()}
            </Text>
          </View>

          {/* Duration Card */}
          <View style={styles.detailCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="schedule" size={24} color="#1976D2" />
            </View>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{plan.duration}</Text>
          </View>

          {/* Min Users Card */}
          <View style={styles.detailCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
              <Icon name="person-add" size={24} color="#F57C00" />
            </View>
            <Text style={styles.detailLabel}>Min Users</Text>
            <Text style={styles.detailValue}>{plan.minUsers}</Text>
          </View>

          {/* Max Users Card */}
          <View style={styles.detailCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#F3E5F5' }]}>
              <Icon name="group" size={24} color="#7B1FA2" />
            </View>
            <Text style={styles.detailLabel}>Max Users</Text>
            <Text style={styles.detailValue}>{plan.maxUsers}</Text>
          </View>
        </View>

        {/* User Range Summary */}
        <View style={styles.summaryCard}>
          <Icon name="group-work" size={24} color="#4A90E2" />
          <Text style={styles.summaryText}>
            Supports {plan.minUsers} - {plan.maxUsers} users
          </Text>
        </View>

        {/* Additional Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="event" size={18} color="#666" />
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>{formatDate(plan.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="update" size={18} color="#666" />
            <Text style={styles.infoLabel}>Last Updated:</Text>
            <Text style={styles.infoValue}>{formatDate(plan.updatedAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="vpn-key" size={18} color="#666" />
            <Text style={styles.infoLabel}>Plan ID:</Text>
            <Text style={[styles.infoValue, styles.planId]}>{plan.id}</Text>
          </View>
        </View>

        {/* Buy Plan Button */}
        <TouchableOpacity
          style={[styles.buyButton, isBuyDisabled && styles.buyButtonDisabled]}
          onPress={handleBuyPlan}
          disabled={isBuyDisabled}
          activeOpacity={0.8}
        >
          {purchasing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : !razorpayReady ? (
            <>
              <Icon name="error-outline" size={22} color="#fff" />
              <Text style={styles.buyButtonText}>Payment Unavailable</Text>
            </>
          ) : !eligibility.canBuy ? (
            <>
              <Icon name="lock" size={22} color="#fff" />
              <Text style={styles.buyButtonText}>
                {eligibility.disableReason || 'Cannot Purchase'}
              </Text>
            </>
          ) : (
            <>
              <Icon name="shopping-cart" size={22} color="#fff" />
              <Text style={styles.buyButtonText}>
                {isAddOn ? 'Buy Add-on' : 'Buy Plan'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        {/* Subscription Status Info */}
        {loadingSubscription ? null : (
          <View style={styles.subscriptionInfoContainer}>
            {subscriptionStatus.hasActivePlan && (
              <View style={styles.subscriptionInfo}>
                <Icon name="check-circle" size={16} color="#27AE60" />
                <Text style={styles.subscriptionInfoText}>
                  You have an active plan. You can purchase add-ons.
                </Text>
              </View>
            )}
            {subscriptionStatus.hasExpiredPlan && (
              <View style={styles.subscriptionInfo}>
                <Icon name="warning" size={16} color="#F57C00" />
                <Text style={styles.subscriptionInfoText}>
                  Your plan has expired. Please renew to continue.
                </Text>
              </View>
            )}
            {subscriptionStatus.hasNoPlan && isAddOn && (
              <View style={styles.subscriptionInfo}>
                <Icon name="info" size={16} color="#1976D2" />
                <Text style={styles.subscriptionInfoText}>
                  You need a base plan before purchasing add-ons.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: '#fff',
  borderBottomWidth: 1,
  borderBottomColor: '#f0f0f0',
  position: 'relative',
},

headerTitle: {
  position: 'absolute',
  left: 0,
  right: 0,
  textAlign: 'center',
  fontSize: 20,
  fontFamily: 'Poppins-SemiBold',
  color: '#333',
},
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Rubik-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Rubik-Regular',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Rubik-Medium',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
    letterSpacing: 0.5,
  },
  nameCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planName: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  addOnBadge: {
    backgroundColor: '#F57C00',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  addOnBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginLeft: 8,
  },
  descriptionText: {
    fontSize: 16,
    fontFamily: 'Rubik-Regular',
    color: '#666',
    lineHeight: 24,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  priceValue: {
    color: '#27AE60',
  },
  summaryCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    fontFamily: 'Rubik-Medium',
    color: '#1976D2',
    marginLeft: 12,
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    color: '#666',
    marginLeft: 8,
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    color: '#333',
    flex: 1,
  },
  planId: {
    fontSize: 12,
    color: '#999',
  },
  // New styles for buy button
  buyButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 10,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 10,
  },
  // Subscription info styles
  subscriptionInfoContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  subscriptionInfoText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#666',
    fontFamily: 'Rubik-Regular',
    flex: 1,
  },
});