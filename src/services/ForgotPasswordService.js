import Api from '../config/Api';

/**
 * Send OTP to user's email for password reset
 * @param {string} email - User's email address
 * @returns {Promise<object>}
 */
export const sendForgotPasswordOtp = async (email) => {
  try {
    const response = await Api.post('/api/users/forgot-password', {
      email: email.trim().toLowerCase(),
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to send OTP');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Something went wrong. Please try again.');
    }
  }
};

/**
 * Verify OTP sent to user's email
 * @param {string} email - User's email address
 * @param {string} otp - OTP received by user
 * @returns {Promise<object>} - Contains status, message, and optional resetToken
 */
export const verifyOtp = async (email, otp) => {
  try {
    const response = await Api.post('/api/users/verify-otp', {
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to verify OTP');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Something went wrong. Please try again.');
    }
  }
};

/**
 * Reset password using email, OTP and new password
 * @param {string} email - User's email address
 * @param {string} otp - OTP received by user
 * @param {string} newPassword - New password to set
 * @returns {Promise<object>}
 */
export const resetPassword = async (email, otp, newPassword) => {
  try {
    const response = await Api.post('/api/users/forgot-password-reset', {
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
      newPassword: newPassword,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to reset password');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Something went wrong. Please try again.');
    }
  }
};
