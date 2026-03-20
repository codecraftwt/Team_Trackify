import Api from '../config/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Razorpay Key
// export const RAZORPAY_KEY = 'rzp_test_SN1JoYwhNqRjPV';
export const RAZORPAY_KEY = "rzp_live_0fMe7hBqXJktWH"

/**
 * Get admin ID from AsyncStorage
 */
const getAdminId = async () => {
  try {
    // Try different storage keys used in the app
    const userId = await AsyncStorage.getItem('userId');
    if (userId) {
      return userId;
    }
    
    const userProfile = await AsyncStorage.getItem('userProfile');
    if (userProfile) {
      const user = JSON.parse(userProfile);
      return user._id || user.id || user.userId;
    }
    
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user._id || user.id || user.userId;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting admin ID:', error);
    return null;
  }
};

/**
 * Fetch all plans from the API
 * @returns {Promise<Array>} - Array of plan objects
 */
export const getAllPlans = async () => {
  try {
    const response = await Api.get('/api/plans/all');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to fetch plans');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Something went wrong. Please try again.');
    }
  }
};
/**
 * Get a single plan by ID
 * @param {string} planId - Plan ID
 * @returns {Promise<object>} - Plan object
 */
export const getPlanById = async (planId) => {
  try {
    const response = await Api.get(`/api/plans/${planId}`);
    console.log("plan details data ====>",response.data)
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to fetch plan');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Something went wrong. Please try again.');
    }
  }
};

/**
 * Get Payment History
 * @param {string} adminId - Admin ID
 * @returns {Promise<Array>} - Array of payment objects
 */
export const getPaymentHistory = async (adminId) => {
  try {
    const response = await Api.get(`/api/payments/history/${adminId}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to fetch payment history');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Something went wrong. Please try again.');
    }
  }
};

/**
 * Create Order (Main Plan)
 * @param {string} planId - Plan ID
 * @returns {Promise<object>} - Order data with razorpay_order_id
 */
// export const createOrder = async (planId) => {
//   try {
//     const adminId = await getAdminId();
//     console.log('Admin ID:', adminId);
//     if (!adminId) {
//       throw new Error('Admin ID not found. Please login again.');
//     }
    
//     const response = await Api.post('/api/payments/create-order', {
//       adminId,
//       planId,
//     });
    
//     console.log('Create order response:', response.data);
//     return response.data;
//   } catch (error) {
//     console.error('Create order error:', error);
//     if (error.response) {
//       throw new Error(error.response.data?.message || 'Failed to create order');
//     } else if (error.request) {
//       throw new Error('Network error. Please check your connection.');
//     } else {
//       throw new Error('Something went wrong. Please try again.');
//     }
//   }
// };
// services/PlansService.js
export const createOrder = async (planId, couponCode = null) => {
  try {
    const adminId = await getAdminId();
    console.log('Admin ID from storage:', adminId);
    
    if (!adminId) {
      throw new Error('Admin ID not found. Please login again.');
    }
    
    // Get auth token explicitly
    let token = await AsyncStorage.getItem('token');
    if (!token) {
      token = await AsyncStorage.getItem('authToken');
    }
    console.log('Auth token found:', !!token);
    
    // Log the exact admin ID being sent
    console.log('Sending request with:', { adminId, planId, couponCode });
    
    const response = await Api.post('/api/payments/create-order', {
      adminId,
      planId,
      couponCode,
    }, {
      headers: token ? { 
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` 
      } : {}
    });
    
    console.log('Create order response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Create order error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to create order');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection. Ensure backend server is running.');
    } else {
      throw new Error('Something went wrong. Please try again.');
    }
  }
};
/**
 * Verify Payment (Main Plan)
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string} razorpaySignature - Razorpay signature
 * @param {string} paymentId - Internal payment record ID
 * @returns {Promise<object>} - Verification response
 */
// In PlansService.js
export const verifyPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId) => {
  try {
    console.log('=== verifyPayment called with:', {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: razorpaySignature ? 'present' : 'missing',
      paymentId
    });
    
    const response = await Api.post('/api/payments/verify-payment', {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentId,
    });
    
    console.log('=== verifyPayment response:', response.data);
    return response.data;
  } catch (error) {
    console.error('=== verifyPayment error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
    
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to verify payment');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Something went wrong. Please try again.');
    }
  }
};

/**
 * Create Add-On Order
 * @param {string} addOnPlanId - Add-On Plan ID
 * @param {string} paymentId - Existing active payment ID
 * @returns {Promise<object>} - Add-on order data
 */
export const createAddonOrder = async (addOnPlanId, paymentId) => {
  try {
    const adminId = await getAdminId();
    if (!adminId) {
      throw new Error('Admin ID not found. Please login again.');
    }
    
    const response = await Api.post('/api/payments/create-addon-order', {
      adminId,
      addOnPlanId,
      paymentId,
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to create addon order');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Something went wrong. Please try again.');
    }
  }
};

/**
 * Verify Add-On Payment
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string} razorpaySignature - Razorpay signature
 * @param {string} paymentId - Add-on payment record ID
 * @returns {Promise<object>} - Verification response
 */
export const verifyAddonPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId) => {
  try {
    const response = await Api.post('/api/payments/verify-addon-payment', {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentId,
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to verify addon payment');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Something went wrong. Please try again.');
    }
  }
};

/**
 * Get user subscription status
 * Returns information about the user's current plan and whether it's active/expired
 * @returns {Promise<object>} - Subscription status object
 */
export const getUserSubscriptionStatus = async () => {
  try {
    const adminId = await getAdminId();
    
    if (!adminId) {
      throw new Error('Admin ID not found. Please login again.');
    }
    
    // Get auth token
    let token = await AsyncStorage.getItem('token');
    if (!token) {
      token = await AsyncStorage.getItem('authToken');
    }
    
    const response = await Api.get(`/api/users/user/${adminId}`, {
      headers: token ? { 
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` 
      } : {}
    });
    
    console.log('User subscription status response:', response.data);
    
    // Parse the response to extract subscription info
    const userData = response.data.user;
    const planExpired = response.data.planExpired;
    
    // Check if user has a current payment
    const hasCurrentPayment = userData && userData.currentPaymentId && userData.currentPaymentId !== null;
    const currentPayment = userData?.currentPaymentId;
    
    // Determine subscription status
    const subscriptionStatus = {
      hasActivePlan: hasCurrentPayment && currentPayment?.isActive === true && planExpired === false,
      hasExpiredPlan: hasCurrentPayment && planExpired === true,
      hasNoPlan: !hasCurrentPayment,
      currentPaymentId: currentPayment?._id || null,
      currentPayment: currentPayment || null,
      planExpired: planExpired,
    };
    
    console.log('Subscription status:', subscriptionStatus);
    
    return subscriptionStatus;
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to fetch subscription status');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Something went wrong. Please try again.');
    }
  }
};

/**
 * Check if a plan is an Add-on plan
 * @param {string} planName - The name of the plan
 * @returns {boolean} - True if it's an Add-on plan
 */
export const isAddOnPlan = (planName) => {
  return planName && planName.toLowerCase().includes('add on');
};

/**
 * Check if a plan is a Regular/Base plan
 * @param {string} planName - The name of the plan
 * @returns {boolean} - True if it's a Regular plan
 */
export const isRegularPlan = (planName) => {
  if (!planName) return false;
  const planNameLower = planName.toLowerCase();
  return !planNameLower.includes('add on');
};

/**
 * Determine if a user can purchase a specific type of plan
 * @param {object} subscriptionStatus - User's current subscription status
 * @param {string} planName - The plan name to check
 * @returns {object} - Object with canBuyRegular and canBuyAddon flags
 */
export const getPurchaseEligibility = (subscriptionStatus, planName) => {
  const { hasActivePlan, hasExpiredPlan, hasNoPlan } = subscriptionStatus;
  const isAddOn = isAddOnPlan(planName);
  const isRegular = isRegularPlan(planName);
  
  let canBuyRegular = false;
  let canBuyAddon = false;
  let disableReason = '';
  
  if (hasNoPlan) {
    // No plan purchased: Can buy Regular, Cannot buy Add-on
    canBuyRegular = isRegular;
    canBuyAddon = false;
    disableReason = isAddOn ? 'You need a base plan to purchase add-ons' : '';
  } else if (hasActivePlan) {
    // Has active plan: Cannot buy Regular, Can buy Add-on
    canBuyRegular = false;
    canBuyAddon = isAddOn;
    disableReason = isRegular ? 'You already have an active plan' : '';
  } else if (hasExpiredPlan) {
    // Has expired plan: Can buy Regular, Cannot buy Add-on
    canBuyRegular = isRegular;
    canBuyAddon = false;
    disableReason = isAddOn ? 'Your base plan has expired. Please renew your plan first.' : '';
  }
  
  return {
    canBuyRegular,
    canBuyAddon,
    canBuy: canBuyRegular || canBuyAddon,
    disableReason,
  };
};