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

/**
 * Get user sessions for a specific date
 * @param {string} userId - The user's ID
 * @param {string} date - Optional date in YYYY-MM-DD format
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export const getUserSessions = async (userId, date = null) => {
  try {

    console.log("User ID =====>", userId);
    console.log("Date =====>", date);

    // Get the auth token
    const token = await AsyncStorage.getItem('authToken');

    if (!token) {
      return {
        success: false,
        data: null,
        message: 'Authentication token not found'
      };
    }

    // Build URL with optional date parameter
    let url = `${BASE_URL}/api/Tracking/admin/users/${userId}/sessions`;
    if (date) {
      url += `?date=${date}`;
    }

    const response = await fetch(url, {
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

      console.log("User Sessions Data =====>", result.data);

      return {
        success: true,
        data: result.data,
        message: result.message || 'User sessions fetched successfully'
      };

    } else {
      console.log("API Error Message =====>", result.message);

      return {
        success: false,
        data: null,
        message: result.message || 'Failed to fetch user sessions'
      };
    }

  } catch (error) {
    console.error('AdminService Error fetching user sessions =====>', error);

    return {
      success: false,
      data: null,
      message: error.message || 'Something went wrong'
    };
  }
};

// Add this function to your AdminService.js

/**
 * Get all dates where a user has tracking sessions
 * @param {string} userId - The user's ID
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export const getUserSessionDates = async (userId) => {
  try {
    // Get the auth token
    const token = await AsyncStorage.getItem('authToken');

    if (!token) {
      return {
        success: false,
        data: null,
        message: 'Authentication token not found'
      };
    }

    const response = await fetch(`${BASE_URL}/api/Tracking/admin/users/${userId}/sessions/dates`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    });

    const text = await response.text();
    if (!text) {
      return {
        success: false,
        data: null,
        message: 'Empty response from server'
      };
    }

    const result = JSON.parse(text);

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
        message: result.message || 'User session dates fetched successfully'
      };
    } else {
      return {
        success: false,
        data: null,
        message: result.message || 'Failed to fetch user session dates'
      };
    }

  } catch (error) {
    console.error('AdminService Error fetching user session dates =====>', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Something went wrong'
    };
  }
};

/**
 * Get all tracking tracks for admin within a date range
 * @param {string} adminId - The admin ID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export const getAdminAllTracks = async (adminId, startDate, endDate) => {
  try {
    console.log("Admin ID =====>", adminId);
    console.log("Start Date =====>", startDate);
    console.log("End Date =====>", endDate);

    // Get the auth token
    const token = await AsyncStorage.getItem('authToken');

    if (!token) {
      return {
        success: false,
        data: null,
        message: 'Authentication token not found'
      };
    }

    const response = await fetch(`${BASE_URL}/api/Tracking/admin/${adminId}/all-tracks?startDate=${startDate}&endDate=${endDate}`, {
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

    if (response.ok) {
      console.log("Admin All Tracks Data =====>", result);

      return {
        success: true,
        data: result,
        message: result.message || 'Admin tracks fetched successfully'
      };
    } else {
      console.log("API Error Message =====>", result.message);

      return {
        success: false,
        data: null,
        message: result.message || 'Failed to fetch admin tracks'
      };
    }

  } catch (error) {
    console.error('AdminService Error fetching admin all tracks =====>', error);

    return {
      success: false,
      data: null,
      message: error.message || 'Something went wrong'
    };
  }
};

// Don't forget to export it
export default {
  getAdminUsers,
  getUserTrackingSummary,
  getSessionDetails,
  getUserSessions,
  getUserSessionDates,
  getAdminAllTracks,
};
