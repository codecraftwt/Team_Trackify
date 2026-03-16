import BASE_URL from './server';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get all users under a specific admin
 * @param {string} adminId - The admin's ID
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export const getAdminUsers = async (adminId) => {
  try {

    console.log("Admin ID =====>", adminId);

    // Get the auth token
    const token = await AsyncStorage.getItem('authToken');
    // console.log('Token =====>', token);

    if (!token) {
      return {
        success: false,
        data: null,
        message: 'Authentication token not found'
      };
    }

    const response = await fetch(`${BASE_URL}/api/Tracking/admin/${adminId}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    });

    // console.log("API Status =====>", response.status);

    const text = await response.text();
    // console.log("Raw API Response =====>", text);

    if (!text) {
      return {
        success: false,
        data: null,
        message: 'Empty response from server'
      };
    }

    const result = JSON.parse(text);

    // console.log("Parsed Result =====>", result);

    if (response.ok && result.success) {

      // console.log("Users Data =====>", result.data);

      // Log each user id and full object - result.data has {users: [], pagination: {}}
      if (result.data && result.data.users) {
        result.data.users.forEach((user, index) => {
          // console.log(`User ${index + 1} ID =====>`, user.id);
          // console.log(`User ${index + 1} Data =====>`, user);
        });
      }

      return {
        success: true,
        data: result.data,
        message: result.message || 'Users fetched successfully'
      };

    } else {
      // console.log("API Error Message =====>", result.message);

      return {
        success: false,
        data: null,
        message: result.message || 'Failed to fetch users'
      };
    }

  } catch (error) {
    console.error('AdminService Error fetching admin users =====>', error);

    return {
      success: false,
      data: null,
      message: error.message || 'Something went wrong'
    };
  }
};

/**
 * Get user tracking summary for admin
 * @param {string} adminId - The admin's ID
 * @param {string} userId - The user's ID
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export const getUserTrackingSummary = async (adminId, userId) => {
  try {

    console.log("Admin ID passed to api =====>", adminId);
    console.log("User ID passed to api =====>", userId);

    // Get the auth token
    const token = await AsyncStorage.getItem('authToken');
    console.log('Token =====>', token);

    if (!token) {
      return {
        success: false,
        data: null,
        message: 'Authentication token not found'
      };
    }

    const response = await fetch(`${BASE_URL}/api/Tracking/admin/${adminId}/users/${userId}/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    });

    console.log("API Status =====>", response.status);

    const text = await response.text();
    console.log("Raw API Response =====>", text);

    if (!text) {
      return {
        success: false,
        data: null,
        message: 'Empty response from server'
      };
    }

    const result = JSON.parse(text);

    console.log("Parsed Result =====>", result);

    if (response.ok && result.success) {

      console.log("User Tracking Summary Data =====>", result.data);

      return {
        success: true,
        data: result.data,
        message: result.message || 'User tracking summary fetched successfully'
      };

    } else {
      console.log("API Error Message =====>", result.message);

      return {
        success: false,
        data: null,
        message: result.message || 'Failed to fetch user tracking summary'
      };
    }

  } catch (error) {
    console.error('AdminService Error fetching user tracking summary =====>', error);

    return {
      success: false,
      data: null,
      message: error.message || 'Something went wrong'
    };
  }
};

/**
 * Get session details for a specific user's tracking session
 * @param {string} userId - The user's ID
 * @param {string} sessionId - The session's ID
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export const getSessionDetails = async (userId, sessionId) => {
  try {

    console.log("User ID =====>", userId);
    console.log("Session ID =====>", sessionId);

    // Get the auth token
    const token = await AsyncStorage.getItem('authToken');

    if (!token) {
      return {
        success: false,
        data: null,
        message: 'Authentication token not found'
      };
    }

    const response = await fetch(`${BASE_URL}/api/Tracking/admin/users/${userId}/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    });

    console.log("API Status =====>", response.status);

    const text = await response.text();
    console.log("Raw API Response =====>", text);

    if (!text) {
      return {
        success: false,
        data: null,
        message: 'Empty response from server'
      };
    }

    const result = JSON.parse(text);

    console.log("Parsed Result =====>", result);

    if (response.ok && result.success) {

      console.log("Session Details Data =====>", result.data);

      return {
        success: true,
        data: result.data,
        message: result.message || 'Session details fetched successfully'
      };

    } else {
      console.log("API Error Message =====>", result.message);

      return {
        success: false,
        data: null,
        message: result.message || 'Failed to fetch session details'
      };
    }

  } catch (error) {
    console.error('AdminService Error fetching session details =====>', error);

    return {
      success: false,
      data: null,
      message: error.message || 'Something went wrong'
    };
  }
};

export default {
  getAdminUsers,
  getUserTrackingSummary,
  getSessionDetails,
};
