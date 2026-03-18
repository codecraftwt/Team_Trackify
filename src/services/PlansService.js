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