import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  getPlanById,
  createOrder,
  verifyPayment,
  createAddonOrder,
  verifyAddonPayment,
  RAZORPAY_KEY,
  getUserSubscriptionStatus,
  isAddOnPlan,
  getPurchaseEligibility,
  getUserCustomPlan,
  checkCustomPlanPurchaseEligibility,
  getAllCoupons,
  getCouponById,
  validateCouponsForPlan,
  validateCoupon
} from '../../services/PlansService';
import RazorpayCheckout from 'react-native-razorpay';
import CustomHeader from '../../Component/CustomHeader';

export default function PlanDetails({ route, navigation }) {
  const { planId, isCustomPlan = false, customPlanData = null } = route.params;
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

  // Custom plan purchase tracking
  const [hasPurchasedCustomPlan, setHasPurchasedCustomPlan] = useState(false);
  const [checkingCustomPlanPurchase, setCheckingCustomPlanPurchase] = useState(false);

  // Coupon state
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [showCoupons, setShowCoupons] = useState(false);
  const [validatedCoupon, setValidatedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [finalAmount, setFinalAmount] = useState(null);

  // Check if buy button should be disabled
  const isAddOn = plan ? isAddOnPlan(plan.name) : false;
  const eligibility = getPurchaseEligibility(subscriptionStatus, plan?.name || '');

  // For custom plans, check if already purchased
  const isCustomPlanAlreadyPurchased = isCustomPlan && hasPurchasedCustomPlan;
  const isBuyDisabled = isCustomPlanAlreadyPurchased || !eligibility.canBuy || purchasing || !razorpayReady;

  useEffect(() => {
    if (isCustomPlan && customPlanData) {
      // If it's a custom plan and data is passed directly
      setPlan(customPlanData);
      setLoading(false);
      checkIfCustomPlanPurchased();
    } else {
      // Regular plan - fetch from API
      fetchPlanDetails();
    }

    fetchSubscriptionStatus();
    // Don't fetch coupons yet - wait for plan to be loaded

    // Verify Razorpay availability
    const timer = setTimeout(() => {
      if (RazorpayCheckout && typeof RazorpayCheckout.open === 'function') {
        setRazorpayReady(true);
      } else {
        console.warn('Razorpay not available');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Fetch coupons after plan is loaded
  useEffect(() => {
    if (plan) {
      fetchCoupons();
    }
  }, [plan]);

  // Check if custom plan has been purchased already
  const checkIfCustomPlanPurchased = async () => {
    try {
      setCheckingCustomPlanPurchase(true);
      // You need to implement this function in your PlansService
      const result = await checkCustomPlanPurchaseEligibility();
      setHasPurchasedCustomPlan(result.hasPurchased);

      if (result.hasPurchased) {
        // Show alert that custom plan can only be purchased once
        Alert.alert(
          'Already Purchased',
          'You can only purchase a custom plan once. This plan is already in your active subscriptions.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error checking custom plan purchase:', error);
      setHasPurchasedCustomPlan(false);
    } finally {
      setCheckingCustomPlanPurchase(false);
    }
  };

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
        currentPaymentId: null,
      });
    } finally {
      setLoadingSubscription(false);
    }
  };

  // Fetch all active coupons and filter by plan price
  const fetchCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const response = await getAllCoupons({ status: 'active', limit: 50 });
      if (response.success && response.data) {
        console.log('Plan price:', plan?.price);
        console.log('All fetched coupons:', response.data);
        // Filter coupons based on plan price and minAmount requirement
        const validCoupons = validateCouponsForPlan(response.data, plan?.price || 0);
        console.log('Valid coupons after filtering:', validCoupons);
        setCoupons(validCoupons);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Get coupon details by ID
  const handleSelectCoupon = async (couponId) => {
    try {
      const response = await getCouponById(couponId);
      if (response.success && response.data) {
        setSelectedCoupon(response.data);
        setCouponCode(response.data.code);
        setShowCoupons(false);
      }
    } catch (error) {
      console.error('Error fetching coupon details:', error);
      Alert.alert('Error', 'Failed to fetch coupon details');
    }
  };

  // Clear selected coupon
  const handleClearCoupon = () => {
    setSelectedCoupon(null);
    setCouponCode('');
    setValidatedCoupon(null);
    setFinalAmount(null);
  };

  // Handle applying a coupon from the list
  const handleApplyCoupon = async (coupon) => {
    try {
      setValidatingCoupon(true);
      console.log('Applying coupon:', coupon.code, 'for amount:', plan.price);
      
      const response = await validateCoupon(coupon.code, plan.price);
      
      if (response.success && response.data) {
        setValidatedCoupon(response.data);
        setFinalAmount(response.data.finalAmount);
        setSelectedCoupon(coupon);
        setCouponCode(coupon.code);
        setShowCoupons(false);
        
        Alert.alert(
          'Coupon Applied!',
          `Discount: ₹${response.data.discountAmount}\nFinal Amount: ₹${response.data.finalAmount}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      Alert.alert(
        'Coupon Validation Failed',
        error.message || 'This coupon cannot be applied. Please try another coupon.'
      );
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleBuyPlan = async () => {
    if (!plan) return;

    // Prevent multiple purchases of custom plan
    if (isCustomPlan && hasPurchasedCustomPlan) {
      Alert.alert(
        'Already Purchased',
        'You can only purchase a custom plan once.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
      Alert.alert(
        'Error',
        'Payment system is not available. Please restart the app.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setPurchasing(true);

      // Create order - use createOrder for base plans and custom plans
      // Use createAddonOrder for add-on plans
      let orderResponse;
      let useAddonPayment = false;

      if (isAddOn) {
        // Add-on plan - use createAddonOrder
        if (!subscriptionStatus.currentPaymentId) {
          throw new Error('No active base plan found. Please purchase a base plan first.');
        }
        orderResponse = await createAddonOrder(planId, subscriptionStatus.currentPaymentId);
        useAddonPayment = true;
      } else {
        // Base plan or custom plan - use createOrder with coupon code
        orderResponse = await createOrder(planId, couponCode || null);
      }

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create order');
      }

      const { orderId, amount, paymentId, description } = orderResponse.data;

      // Use finalAmount if coupon is validated, otherwise use original amount
      const amountToPay = finalAmount ? finalAmount.toString() : amount.toString();
      
      console.log('Order amount:', amount, 'Final amount to pay:', amountToPay);

      // Open Razorpay Checkout
      const options = {
        description: validatedCoupon 
          ? `${description || `Purchase ${plan.name}`} - Coupon: ${validatedCoupon.code} (Saved ₹${validatedCoupon.discountAmount})`
          : description || `Purchase ${plan.name}`,
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: 'INR',
        key: RAZORPAY_KEY,
        amount: amountToPay, // Use discounted amount
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

      const razorpayResponse = await RazorpayCheckout.open(options);

      // Verify payment - use appropriate verification based on plan type
      let verifyResponse;
      if (useAddonPayment) {
        verifyResponse = await verifyAddonPayment(
          razorpayResponse.razorpay_order_id,
          razorpayResponse.razorpay_payment_id,
          razorpayResponse.razorpay_signature,
          paymentId
        );
      } else {
        verifyResponse = await verifyPayment(
          razorpayResponse.razorpay_order_id,
          razorpayResponse.razorpay_payment_id,
          razorpayResponse.razorpay_signature,
          paymentId
        );
      }

      if (verifyResponse.success) {
        // If it's a custom plan, mark it as purchased locally
        if (isCustomPlan) {
          setHasPurchasedCustomPlan(true);
        }

        Alert.alert(
          'Payment Successful!',
          `You saved ₹${validatedCoupon?.discountAmount || 0} with coupon ${validatedCoupon?.code || 'N/A'}!\nYour plan has been purchased successfully.`,
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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading || loadingSubscription || checkingCustomPlanPurchase) {
    return (
      <View style={styles.container}>
        {/* <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan Details</Text>
          <View style={styles.placeholder} />
        </View> */}
        <CustomHeader
          title="Plan Details"
          navigation={navigation}
          showBackButton={true}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error || !plan) {
    return (
      <View style={styles.container}>
        {/* <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan Details</Text>
          <View style={styles.placeholder} />
        </View> */}
        <CustomHeader
          title="Plan Details"
          navigation={navigation}
          showBackButton={true}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={60} color="#E74C3C" />
          <Text style={styles.errorText}>{error || 'Plan not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchPlanDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity
          // onPress={() => navigation.goBack()}
           onPress={() => navigation.navigate('ManagePlans')}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan Details</Text>
        <View style={styles.placeholder} />
      </View> */}
      <CustomHeader
        title="Plan Details"
        navigation={navigation}
        showBackButton={true}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}>

        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: isCustomPlan ? '#F3E5F5' : (plan.status === 'active' ? '#E8F5E9' : '#FFEBEE') }
          ]}>
            <Text style={[
              styles.statusText,
              { color: isCustomPlan ? '#9C27B0' : (plan.status === 'active' ? '#2E7D32' : '#C62828') }
            ]}>
              {isCustomPlan ? 'CUSTOM PLAN' : (plan.status?.toUpperCase() || 'ACTIVE')}
            </Text>
          </View>
        </View>

        {/* Plan Name Card */}
        <View style={[styles.nameCard, isCustomPlan && styles.customPlanNameCard]}>
          <Icon name={isCustomPlan ? "build" : (isAddOn ? "add-circle" : "star")}
            size={30}
            color={isCustomPlan ? "#9C27B0" : (isAddOn ? "#F57C00" : "#4A90E2")} />
          <Text style={[styles.planName, isCustomPlan && styles.customPlanNameText]}>
            {plan.name}
          </Text>
          {isAddOn && !isCustomPlan && (
            <View style={styles.addOnBadge}>
              <Text style={styles.addOnBadgeText}>ADD-ON</Text>
            </View>
          )}
          {isCustomPlan && (
            <View style={[styles.customPlanBadge, { backgroundColor: '#E1BEE7' }]}>
              <Icon name="star" size={12} color="#9C27B0" />
              <Text style={styles.customPlanBadgeText}>CUSTOM PLAN</Text>
            </View>
          )}
        </View>

        {/* Description Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="description" size={22} color={isCustomPlan ? "#9C27B0" : "#4A90E2"} />
            <Text style={styles.sectionTitle}>Description</Text>
          </View>
          <Text style={styles.descriptionText}>
            {plan.description || `Custom plan with ${plan.minUsers}-${plan.maxUsers} users for ${plan.durationValue} ${plan.durationUnit}`}
          </Text>
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
              ₹{plan.price?.toLocaleString() || 'N/A'}
            </Text>
          </View>

          {/* Duration Card */}
          <View style={styles.detailCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="schedule" size={24} color="#1976D2" />
            </View>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>
              {plan.duration || `${plan.durationValue} ${plan.durationUnit}`}
            </Text>
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
        <View style={[styles.summaryCard, isCustomPlan && styles.customPlanSummaryCard]}>
          <Icon name="group-work" size={24} color={isCustomPlan ? "#9C27B0" : "#4A90E2"} />
          <Text style={[styles.summaryText, isCustomPlan && styles.customPlanSummaryText]}>
            Supports {plan.minUsers} - {plan.maxUsers} users
          </Text>
        </View>

        {/* Additional Info */}
        <View style={styles.infoCard}>
          {(plan.createdAt || plan.updatedAt) && (
            <>
              {plan.createdAt && (
                <View style={styles.infoRow}>
                  <Icon name="event" size={18} color="#666" />
                  <Text style={styles.infoLabel}>Created:</Text>
                  <Text style={styles.infoValue}>{formatDate(plan.createdAt)}</Text>
                </View>
              )}
              {plan.updatedAt && (
                <View style={styles.infoRow}>
                  <Icon name="update" size={18} color="#666" />
                  <Text style={styles.infoLabel}>Last Updated:</Text>
                  <Text style={styles.infoValue}>{formatDate(plan.updatedAt)}</Text>
                </View>
              )}
            </>
          )}
          <View style={styles.infoRow}>
            <Icon name="vpn-key" size={18} color="#666" />
            <Text style={styles.infoLabel}>Plan ID:</Text>
            <Text style={[styles.infoValue, styles.planId]}>{plan.id || plan._id}</Text>
          </View>
        </View>

        {/* Coupon Section */}
        {!isAddOn && (
          <View style={styles.couponSection}>
            <View style={styles.sectionHeader}>
              <Icon name="local-offer" size={22} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Apply Coupon</Text>
              {coupons.length > 0 && validatedCoupon ? (
                <View style={[styles.couponCountBadge, styles.appliedCouponBadge]}>
                  <Icon name="check-circle" size={12} color="#fff" />
                  <Text style={styles.couponCountText}> Applied</Text>
                </View>
              ) : coupons.length > 0 ? (
                <View style={styles.couponCountBadge}>
                  <Text style={styles.couponCountText}>{coupons.length} Available</Text>
                </View>
              ) : null}
            </View>
            
            {selectedCoupon ? (
              <View style={styles.selectedCouponCard}>
                <View style={styles.selectedCouponInfo}>
                  <View style={styles.couponCodeBadge}>
                    <Text style={styles.couponCodeText}>{selectedCoupon.code}</Text>
                  </View>
                  <Text style={styles.couponDescription}>{selectedCoupon.description}</Text>
                  {validatedCoupon && (
                    <View style={styles.discountDetailsContainer}>
                      <Text style={styles.discountDetailText}>
                        Discount: ₹{validatedCoupon.discountAmount}
                      </Text>
                      <Text style={styles.finalAmountText}>
                        Final Amount: ₹{validatedCoupon.finalAmount}
                      </Text>
                      <Text style={styles.originalAmountText}>
                        Original: ₹{validatedCoupon.originalAmount}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.removeCouponButton}
                  onPress={handleClearCoupon}
                >
                  <Icon name="close" size={20} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.couponSelectorButton}
                onPress={() => setShowCoupons(!showCoupons)}
              >
                <Icon name="local-offer" size={20} color="#4A90E2" />
                <Text style={styles.couponSelectorText}>
                  {showCoupons ? 'Hide Coupons' : 'View Available Coupons'}
                </Text>
                <Icon 
                  name={showCoupons ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
                  size={20} 
                  color="#4A90E2" 
                />
              </TouchableOpacity>
            )}

            {showCoupons && !selectedCoupon && (
              <View style={styles.couponsList}>
                {loadingCoupons ? (
                  <View style={styles.loadingCouponsContainer}>
                    <ActivityIndicator size="small" color="#4A90E2" />
                    <Text style={styles.loadingCouponsText}>Loading coupons...</Text>
                  </View>
                ) : coupons.length === 0 ? (
                  <View style={styles.noCouponsContainer}>
                    <Icon name="info-outline" size={24} color="#999" />
                    <Text style={styles.noCouponsText}>No coupons available</Text>
                  </View>
                ) : (
                  coupons.map((coupon) => (
                    <TouchableOpacity
                      key={coupon._id}
                      style={[styles.couponCard, validatingCoupon && styles.couponCardDisabled]}
                      onPress={() => handleApplyCoupon(coupon)}
                      disabled={validatingCoupon}
                    >
                      <View style={styles.couponCardLeft}>
                        <View style={styles.couponCodeBadge}>
                          <Text style={styles.couponCodeText}>{coupon.code}</Text>
                        </View>
                        <Text style={styles.couponDescription} numberOfLines={1}>
                          {coupon.description}
                        </Text>
                        <Text style={styles.couponDiscount}>
                          {coupon.discountType === 'percentage' 
                            ? `${coupon.discountValue}% OFF` 
                            : `₹${coupon.discountValue} OFF`}
                        </Text>
                        <Text style={styles.minAmountText}>
                          Min. purchase: ₹{coupon.minAmount}
                        </Text>
                      </View>
                      <View style={styles.couponCardRight}>
                        {validatingCoupon ? (
                          <ActivityIndicator size="small" color="#4A90E2" />
                        ) : (
                          <>
                            <View style={styles.applyButton}>
                              <Text style={styles.applyButtonText}>Apply</Text>
                            </View>
                            <Icon name="chevron-right" size={20} color="#4A90E2" />
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {/* Buy Plan Button */}
        <TouchableOpacity
          style={[
            styles.buyButton,
            isCustomPlan && styles.customPlanBuyButton,
            isBuyDisabled && styles.buyButtonDisabled
          ]}
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
          ) : isCustomPlanAlreadyPurchased ? (
            <>
              <Icon name="check-circle" size={22} color="#fff" />
              <Text style={styles.buyButtonText}>Already Purchased</Text>
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
                {isCustomPlan ? 'Buy Custom Plan' : (isAddOn ? 'Buy Add-on' : 'Buy Plan')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Subscription Status Info */}
        {loadingSubscription ? null : (
          <View style={styles.subscriptionInfoContainer}>
            {isCustomPlanAlreadyPurchased && (
              <View style={styles.subscriptionInfo}>
                <Icon name="check-circle" size={16} color="#27AE60" />
                <Text style={styles.subscriptionInfoText}>
                  You have already purchased this custom plan. You can only purchase it once.
                </Text>
              </View>
            )}
            {subscriptionStatus.hasActivePlan && !isCustomPlanAlreadyPurchased && (
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
            {subscriptionStatus.hasNoPlan && isAddOn && !isCustomPlan && (
              <View style={styles.subscriptionInfo}>
                <Icon name="info" size={16} color="#1976D2" />
                <Text style={styles.subscriptionInfoText}>
                  You need a base plan before purchasing add-ons.
                </Text>
              </View>
            )}
            {isCustomPlan && !hasPurchasedCustomPlan && subscriptionStatus.hasNoPlan && (
              <View style={styles.subscriptionInfo}>
                <Icon name="info" size={16} color="#9C27B0" />
                <Text style={styles.subscriptionInfoText}>
                  You can purchase this custom plan as your base plan.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Add these styles to your existing styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  // backButton: {
  //   padding: 8,
  //   borderRadius: 8,
  //   backgroundColor: '#f8f8f8',
  // },
  // header: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   justifyContent: 'flex-start',
  //   paddingHorizontal: 16,
  //   paddingVertical: 12,
  //   backgroundColor: '#fff',
  //   borderBottomWidth: 1,
  //   borderBottomColor: '#f0f0f0',
  //   position: 'relative',
  // },
  // headerTitle: {
  //   position: 'absolute',
  //   left: 0,
  //   right: 0,
  //   textAlign: 'center',
  //   fontSize: 20,
  //   fontFamily: 'Poppins-SemiBold',
  //   color: '#333',
  // },
  // placeholder: {
  //   width: 40,
  // },
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
  couponCountBadge: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  couponCountText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Rubik-Medium',
  },
  appliedCouponBadge: {
    backgroundColor: '#27AE60',
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountDetailsContainer: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  discountDetailText: {
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    color: '#27AE60',
    marginBottom: 4,
  },
  finalAmountText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#27AE60',
    marginBottom: 2,
  },
  originalAmountText: {
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    color: '#999',
    textDecorationLine: 'line-through',
  },
  minAmountText: {
    fontSize: 11,
    fontFamily: 'Rubik-Regular',
    color: '#666',
    marginTop: 4,
  },
  applyButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
  },
  couponCardDisabled: {
    opacity: 0.5,
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
  customPlanNameCard: {
    backgroundColor: '#F3E5F5',
  },
  customPlanNameText: {
    color: '#9C27B0',
  },
  customPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E1BEE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  customPlanBadgeText: {
    color: '#9C27B0',
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  customPlanSummaryCard: {
    backgroundColor: '#F3E5F5',
  },
  customPlanSummaryText: {
    color: '#9C27B0',
  },
  customPlanBuyButton: {
    backgroundColor: '#9C27B0',
    shadowColor: '#9C27B0',
  },
  buyButtonDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
  },
  couponSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  couponSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  couponSelectorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    color: '#4A90E2',
  },
  selectedCouponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#27AE60',
  },
  selectedCouponInfo: {
    flex: 1,
  },
  removeCouponButton: {
    padding: 4,
  },
  couponsList: {
    marginTop: 12,
  },
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  couponCardLeft: {
    flex: 1,
    marginRight: 8,
  },
  couponCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponCodeBadge: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  couponCodeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Rubik-Bold',
  },
  couponDescription: {
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    color: '#666',
    marginBottom: 2,
  },
  couponDiscount: {
    fontSize: 14,
    fontFamily: 'Rubik-Bold',
    color: '#27AE60',
  },
  loadingCouponsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingCouponsText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    color: '#666',
  },
  noCouponsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  noCouponsText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    color: '#999',
  },
});