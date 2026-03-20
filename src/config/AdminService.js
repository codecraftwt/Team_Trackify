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

/**
 * Get user stats for admin dashboard
 * @param {string} adminId - The admin's ID
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export const getUserStats = async (adminId) => {
  try {
    console.log("Admin ID for user stats =====>", adminId);

    // Get the auth token
    const token = await AsyncStorage.getItem('authToken');
    console.log("Auth Token from dashboard =====>", token ? "Token exists" : "No token found");
    
    if (!token) {
      console.error("No authentication token found");
      return {
        success: false,
        data: null,
        message: 'Authentication token not found'
      };
    }

    // Log token preview for debugging (first 20 chars)
    console.log("Token preview:", token.substring(0, 20) + "...");

    // Ensure token is properly formatted (remove any quotes if present)
    const cleanToken = token.replace(/['"]+/g, '');
    
    const response = await fetch(`${BASE_URL}/api/Tracking/admin/${adminId}/users/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': cleanToken.startsWith('Bearer ') ? cleanToken : `Bearer ${cleanToken}`,
      },
    });

    console.log("User Stats API Status =====>", response.status);
    console.log("Response Headers:", JSON.stringify(response.headers));

    // Check if response status is 401 (Unauthorized)
    if (response.status === 401) {
      console.error("Unauthorized access - Token might be invalid or expired");
      
      // Clear invalid token
      await AsyncStorage.removeItem('authToken');
      
      return {
        success: false,
        data: null,
        message: 'Session expired. Please login again.',
        unauthorized: true
      };
    }

    const text = await response.text();
    console.log("User Stats Raw API Response =====>", text);

    if (!text) {
      return {
        success: false,
        data: null,
        message: 'Empty response from server'
      };
    }

    const result = JSON.parse(text);

    console.log("User Stats Parsed Result =====>", result);

    if (response.ok) {
      console.log("User Stats Data =====>", result);

      return {
        success: true,
        data: result,
        message: result.message || 'User stats fetched successfully'
      };
    } else {
      // console.log("User Stats API Error Message =====>", result.message);

      return {
        success: false,
        data: null,
        message: result.message || 'Failed to fetch user stats',
        status: response.status
      };
    }

  } catch (error) {
    console.error('AdminService Error fetching user stats =====>', error);

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
  getUserStats,
  updateUser,
  deleteUser,
  registerUser,
};

/**
 * Update an existing user
 * @param {string} userId - The user's ID to update
 * @param {Object} userData - User data to update
 * @param {string} userData.name - User name
 * @param {string} userData.email - User email
 * @param {string} userData.password - Password (optional)
 * @param {number} userData.role_id - Role ID (1 = Admin, 0 = User)
 * @param {string} userData.mobile_no - Mobile number
 * @param {string} userData.address - Address
 * @param {number} userData.status - Status (1 = check-in, 0 = checkout)
 * @param {boolean} userData.isActive - Activate/deactivate user
 * @param {boolean} userData.removeAvtar - Remove avatar
 * @param {object} userData.avtar - Image file
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export const updateUser = async (userId, userData) => {
  try {
    console.log("Updating user ID =====>", userId);
    console.log("User data =====>", userData);

    // Get the auth token
    const token = await AsyncStorage.getItem('authToken');

    if (!token) {
      return {
        success: false,
        data: null,
        message: 'Authentication token not found'
      };
    }

    // Create FormData for multipart/form-data
    const formData = new FormData();

    // Append all provided fields
    if (userData.name) formData.append('name', userData.name);
    if (userData.email) formData.append('email', userData.email);
    if (userData.password) formData.append('password', userData.password);
    if (userData.role_id !== undefined && userData.role_id !== null) formData.append('role_id', String(userData.role_id));
    if (userData.mobile_no) formData.append('mobile_no', userData.mobile_no);
    if (userData.address) formData.append('address', userData.address);
    if (userData.status !== undefined && userData.status !== null) formData.append('status', String(userData.status));
    if (userData.isActive !== undefined && userData.isActive !== null) formData.append('isActive', String(userData.isActive));
    if (userData.removeAvtar) formData.append('removeAvtar', String(userData.removeAvtar));
    
    // Append avatar if provided
    if (userData.avtar) {
      // Backend multer field name might be `avatar` or `avtar` (typo).
      // Append both so req.file is populated regardless.
      formData.append('avatar', userData.avtar);
      formData.append('avtar', userData.avtar);
    }

    // Ensure token is properly formatted
    const cleanToken = token.replace(/['"]+/g, '');

    const response = await fetch(`${BASE_URL}/api/users/updateuser/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': cleanToken.startsWith('Bearer ') ? cleanToken : `Bearer ${cleanToken}`,
      },
      body: formData,
    });

    console.log("Update User API Status =====>", response.status);

    const text = await response.text();
    console.log("Update User Raw API Response =====>", text);

    if (!text) {
      return {
        success: false,
        data: null,
        message: 'Empty response from server'
      };
    }

    const result = JSON.parse(text);

    console.log("Update User Parsed Result =====>", result);

    if (response.ok && result.user) {
      return {
        success: true,
        data: result.user,
        message: result.message || 'User updated successfully'
      };
    } else {
      return {
        success: false,
        data: null,
        message: result.message || 'Failed to update user',
        status: response.status
      };
    }

  } catch (error) {
    console.error('AdminService Error updating user =====>', error);

    return {
      success: false,
      data: null,
      message: error.message || 'Something went wrong'
    };
  }
};

/**
 * Delete a user (soft delete)
 * @param {string} userId - The user's ID to delete
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export const deleteUser = async (userId) => {
  try {
    console.log("Deleting user ID =====>", userId);

    // Get the auth token
    const token = await AsyncStorage.getItem('authToken');

    if (!token) {
      return {
        success: false,
        data: null,
        message: 'Authentication token not found'
      };
    }

    // Ensure token is properly formatted
    const cleanToken = token.replace(/['"]+/g, '');

    const response = await fetch(`${BASE_URL}/api/users/deleteuser/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': cleanToken.startsWith('Bearer ') ? cleanToken : `Bearer ${cleanToken}`,
      },
    });

    console.log("Delete User API Status =====>", response.status);

    const text = await response.text();
    console.log("Delete User Raw API Response =====>", text);

    if (!text) {
      return {
        success: false,
        data: null,
        message: 'Empty response from server'
      };
    }

    const result = JSON.parse(text);

    console.log("Delete User Parsed Result =====>", result);

    if (response.ok && result.user) {
      return {
        success: true,
        data: result.user,
        message: result.message || 'User deleted successfully'
      };
    } else {
      return {
        success: false,
        data: null,
        message: result.message || 'Failed to delete user',
        status: response.status
      };
    }

  } catch (error) {
    console.error('AdminService Error deleting user =====>', error);

    return {
      success: false,
      data: null,
      message: error.message || 'Something went wrong'
    };
  }
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User name (required)
 * @param {string} userData.email - User email (required)
 * @param {string} userData.password - Password (required)
 * @param {string} userData.mobile_no - Mobile number
 * @param {string} userData.address - Address
 * @param {number} userData.role_id - Role ID (1 = Admin, 0 = User) (required)
 * @param {string} userData.createdby - Required if creating user under admin
 * @param {object} userData.avtar - Profile image file
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export const registerUser = async (userData) => {
  try {
    const avatarMeta = userData?.avtar
      ? {
          uri: userData.avtar.uri,
          type: userData.avtar.type || 'image/jpeg',
          fileName: userData.avtar.fileName || userData.avtar.name,
        }
      : null;

    console.log("Registering new user with data =====>", {
      ...userData,
      password: userData?.password ? '***MASKED***' : undefined,
      avtar: avatarMeta,
    });

    // Create FormData for multipart/form-data
    const formData = new FormData();

    // Append required fields
    formData.append('name', userData.name);
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    formData.append('role_id', String(userData.role_id));

    // NOTE: Logging full FormData can be noisy / non-serializable in RN.
    console.log("RegisterUser FormData avatar meta =====>", avatarMeta);
    

    // Append optional fields
    if (userData.mobile_no) formData.append('mobile_no', userData.mobile_no);
    if (userData.address) formData.append('address', userData.address);
    if (userData.createdby) formData.append('createdby', userData.createdby);
    
    // Append avatar if provided
    if (userData.avtar) {
      formData.append('avtar', userData.avtar);
    }

    const response = await fetch(`${BASE_URL}/api/users/register`, {
      method: 'POST',
      body: formData,
    });

    console.log("Register User API Status =====>", response.status);

    const text = await response.text();
    console.log("Register User Raw API Response =====>", text);

    if (!text) {
      return {
        success: false,
        data: null,
        message: 'Empty response from server'
      };
    }

    const result = JSON.parse(text);

    console.log("Register User Parsed Result =====>", result);

    if (response.ok && result.user) {
      return {
        success: true,
        data: result.user,
        message: result.message || 'User registered successfully'
      };
    } else {
      return {
        success: false,
        data: null,
        message: result.message || 'Failed to register user',
        status: response.status
      };
    }

  } catch (error) {
    console.error('AdminService Error registering user =====>', error);

    return {
      success: false,
      data: null,
      message: error.message || 'Something went wrong'
    };
  }
};

/**
 * Get user details by ID with subscription status
 * @param {string} userId - The user's ID
 * @returns {Promise<{success: boolean, data: any, message: string, planExpired?: boolean}>}
 */
export const getUserById = async (userId) => {
  try {
    console.log("Get User by ID =====>", userId);

    // Get the auth token
    const token = await AsyncStorage.getItem('authToken');

    if (!token) {
      return {
        success: false,
        data: null,
        message: 'Authentication token not found'
      };
    }

    // Ensure token is properly formatted (remove any quotes if present)
    const cleanToken = token.replace(/['"]+/g, '');

    const response = await fetch(`${BASE_URL}/api/users/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': cleanToken.startsWith('Bearer ') ? cleanToken : `Bearer ${cleanToken}`,
      },
    });

    console.log("Get User API Status =====>", response.status);

    // Check if response status is 401 (Unauthorized)
    if (response.status === 401) {
      console.error("Unauthorized access - Token might be invalid or expired");
      
      // Clear invalid token
      await AsyncStorage.removeItem('authToken');
      
      return {
        success: false,
        data: null,
        message: 'Session expired. Please login again.',
        unauthorized: true
      };
    }

    const text = await response.text();
    console.log("Get User Raw API Response =====>", text);

    if (!text) {
      return {
        success: false,
        data: null,
        message: 'Empty response from server'
      };
    }

    const result = JSON.parse(text);

    console.log("Get User Parsed Result =====>", result);

    // Check if user exists (status 1 means success, status 404 means not found)
    if (response.status === 200 && result.status === 1) {
      console.log("User Data =====>", result.user);
      console.log("Plan Expired Status =====>", result.planExpired);

      return {
        success: true,
        data: result.user,
        planExpired: result.planExpired,
        message: result.message || 'User fetched successfully'
      };
    } else if (response.status === 404) {
      return {
        success: false,
        data: null,
        message: result.message || 'User not found',
        status: 404
      };
    } else {
      console.log("API Error Message =====>", result.message);

      return {
        success: false,
        data: null,
        message: result.message || 'Failed to fetch user',
        status: response.status
      };
    }

  } catch (error) {
    console.error('Error fetching user by ID =====>', error);

    return {
      success: false,
      data: null,
      message: error.message || 'Something went wrong'
    };
  }
};

/**
 * Get last 5 users who recently tracked their session for an admin
 * @param {string} adminId - The admin's ID
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export const getLastFiveTrackedUsers = async (adminId) => {
  try {
    console.log("Get Last Five Tracked Users for Admin =====>", adminId);

    // Get the auth token
    const token = await AsyncStorage.getItem('authToken');

    if (!token) {
      return {
        success: false,
        data: null,
        message: 'Authentication token not found'
      };
    }

    // Ensure token is properly formatted (remove any quotes if present)
    const cleanToken = token.replace(/['"]+/g, '');

    const response = await fetch(`${BASE_URL}/api/tracks/last-five-tracked-users/${adminId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': cleanToken.startsWith('Bearer ') ? cleanToken : `Bearer ${cleanToken}`,
      },
    });

    console.log("Get Last Five Tracked Users API Status =====>", response.status);

    // Check if response status is 401 (Unauthorized)
    if (response.status === 401) {
      console.error("Unauthorized access - Token might be invalid or expired");
      
      // Clear invalid token
      await AsyncStorage.removeItem('authToken');
      
      return {
        success: false,
        data: null,
        message: 'Session expired. Please login again.',
        unauthorized: true
      };
    }

    const text = await response.text();
    console.log("Get Last Five Tracked Users Raw API Response =====>", text);

    if (!text) {
      return {
        success: false,
        data: null,
        message: 'Empty response from server'
      };
    }

    const result = JSON.parse(text);

    console.log("Get Last Five Tracked Users Parsed Result =====>", result);

    // Check if response is successful (status 200)
    if (response.status === 200) {
      console.log("Last Five Tracked Users Data =====>", result.users);

      return {
        success: true,
        data: result.users || [],
        message: result.message || 'Last five tracked users fetched successfully'
      };
    } else {
      console.log("API Error Message =====>", result.message);

      return {
        success: false,
        data: null,
        message: result.message || 'Failed to fetch last five tracked users',
        status: response.status
      };
    }

  } catch (error) {
    console.error('Error fetching last five tracked users =====>', error);

    return {
      success: false,
      data: null,
      message: error.message || 'Something went wrong'
    };
  }
};

/**
 * Get current locations of all active users under an admin
 * @param {string} adminId - The admin ID
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export const getActiveUsersCurrentLocations = async adminId => {
  try {
    // console.log("Admin ID for current locations =====>", adminId);

    // Get token
    const token = await AsyncStorage.getItem('authToken');

    if (!token) {
      return {
        success: false,
        data: null,
        message: 'Authentication token not found',
      };
    }

    const cleanToken = token.replace(/['"]+/g, '');

    const response = await fetch(
      `${BASE_URL}/api/Tracking/admin/${adminId}/users/current-locations`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: cleanToken.startsWith('Bearer ')
            ? cleanToken
            : `Bearer ${cleanToken}`,
        },
      },
    ); // console.log("Current Locations API Status =====>", response.status);

    const text = await response.text(); // console.log("Current Locations Raw Response =====>", text);
    if (!text) {
      return {
        success: false,
        data: null,
        message: 'Empty response from server',
      };
    }

    const result = JSON.parse(text); // console.log("Parsed Current Locations =====>", result);
    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
        message:
          result.message || 'Active users locations fetched successfully',
      };
    } else {
      return {
        success: false,
        data: null,
        message: result.message || 'Failed to fetch active user locations',
      };
    }
  } catch (error) {
    console.error(
      'AdminService Error fetching current locations =====>',
      error,
    );

    return {
      success: false,
      data: null,
      message: error.message || 'Something went wrong',
    };
  }
};