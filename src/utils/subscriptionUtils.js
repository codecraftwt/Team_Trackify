/**
 * Utility functions for checking subscription status
 */

/**
 * Check if user subscription is active
 * @param {Object} subscriptionStatus - Subscription status object from API
 * @returns {boolean} - True if subscription is expired
 */
export const isSubscriptionExpired = (subscriptionStatus) => {
  if (!subscriptionStatus) {
    return false; // If no subscription status, assume active
  }
  return subscriptionStatus.isExpired === true;
};

/**
 * Check if user can access a specific feature based on subscription status
 * @param {Object} subscriptionStatus - Subscription status object from API
 * @param {string} feature - Feature name to check
 * @returns {boolean} - True if feature is accessible
 */
export const canAccessFeature = (subscriptionStatus, feature) => {
  // If subscription is not expired, all features are accessible
  if (!isSubscriptionExpired(subscriptionStatus)) {
    return true;
  }

  // Features that are always accessible even with expired subscription
  const allowedFeatures = [
    'login',
    'logout',
    'purchase_plan',
    'manage_plans',
  ];

  return allowedFeatures.includes(feature);
};

/**
 * Get subscription warning message
 * @param {Object} subscriptionStatus - Subscription status object from API
 * @returns {string} - Warning message
 */
// export const getSubscriptionMessage = (subscriptionStatus) => {
//   if (!subscriptionStatus) {
//     return '';
//   }
//   return subscriptionStatus.message || 'Your plan has expired. Please renew to continue.';
// };

// utils/subscriptionUtils.js

export const getSubscriptionMessage = (subscriptionStatus) => {
  // Check if subscription is expired
  if (!subscriptionStatus?.isExpired) {
    return null;
  }

  // Check if user never had a plan (no payment ID)
  const hasNeverPurchasedPlan = !subscriptionStatus?.currentPaymentId;
  
  if (hasNeverPurchasedPlan) {
    return 'Please buy a plan to check our services';
  }

  // User had a plan but it expired
  return 'Your plan has expired. Please renew to continue.';
};

// Optional: Helper function to determine banner style or type
export const getBannerType = (subscriptionStatus) => {
  if (!subscriptionStatus?.isExpired) {
    return null;
  }

  const hasNeverPurchasedPlan = !subscriptionStatus?.currentPaymentId;
  
  if (hasNeverPurchasedPlan) {
    return 'no-plan'; // First time user
  }
  
  return 'expired'; // Plan expired
};

/**
 * Check if subscription is active for admin users
 * @param {Object} subscriptionStatus - Subscription status object from API
 * @param {string} userRole - User role
 * @returns {boolean} - True if user can access admin features
 */
export const canAccessAdminFeatures = (subscriptionStatus, userRole) => {
  // Only apply to admin users (role_id 1)
  if (userRole !== 'Admin') {
    return true;
  }

  // Check if subscription is expired
  return !isSubscriptionExpired(subscriptionStatus);
};
