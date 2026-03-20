import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icon2 from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../config/auth-context';
import { getAdminUsers, updateUser, deleteUser, registerUser } from '../../config/AdminService';
import { isSubscriptionExpired, getSubscriptionMessage } from '../../utils/subscriptionUtils';

const AdminHistory = ({ navigation, route }) => {
  const { subscriptionStatus: authSubscriptionStatus, userRole } = useAuth();
  // Get subscription status from route params (passed from login)
  const routeSubscriptionStatus = route?.params?.subscriptionStatus;
  // Use route params first, then fall back to auth context
  const subscriptionStatus = routeSubscriptionStatus || authSubscriptionStatus;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal states
  const [addUserModalVisible, setAddUserModalVisible] = useState(false);
  const [editUserModalVisible, setEditUserModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selected user for editing
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Add user form state
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    mobile_no: '',
    address: '',
    role_id: 0, // Default to User
  });

  // Check if subscription is expired
  const checkSubscription = async () => {
    // Try to get subscription status from multiple sources
    let currentSubscriptionStatus = subscriptionStatus;
    
    if (!currentSubscriptionStatus) {
      try {
        const storedStatus = await AsyncStorage.getItem('subscriptionStatus');
        if (storedStatus) {
          currentSubscriptionStatus = JSON.parse(storedStatus);
        }
      } catch (error) {
        console.error('Error loading subscription status:', error);
      }
    }
    
    if (userRole === 'Admin' && isSubscriptionExpired(currentSubscriptionStatus)) {
      Alert.alert(
        'Subscription Expired',
        getSubscriptionMessage(currentSubscriptionStatus) || 'Your plan has expired. Please renew to continue.',
        [
          {
            text: 'Go to Plans',
            onPress: () => navigation.navigate('ManagePlans'),
          },
          {
            text: 'Go to Dashboard',
            onPress: () => navigation.navigate('AdminDashboard'),
          },
        ],
        { cancelable: false }
      );
      return false;
    }
    return true;
  };

  // Check subscription on mount
  useEffect(() => {
    checkSubscription();
  }, [subscriptionStatus]);
  
  // Edit user form state
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    password: '',
    mobile_no: '',
    address: '',
    role_id: 0,
    isActive: true,
    status: 1,
  });
   
  const { userId } = useAuth();

  // Fetch users from API
  const fetchUsers = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      if (!userId) {
        setError('User ID not found. Please login again.');
        setIsLoading(false);
        return;
      }

      const response = await getAdminUsers(userId);

      if (response.success && response.data) {
        const usersList = response.data.users || [];
        setUsers(usersList);
        setFilteredUsers(usersList);
      } else {
        setError(response.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Something went wrong while fetching users');
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUsers(true);
  };

  // Handle add user - Open modal
  const handleAddUser = () => {
    // Check subscription before allowing add user
    if (userRole === 'Admin' && isSubscriptionExpired(subscriptionStatus)) {
      Alert.alert(
        'Subscription Expired',
        getSubscriptionMessage(subscriptionStatus) || 'Your plan has expired. Please renew to add new users.',
        [
          {
            text: 'Go to Plans',
            onPress: () => navigation.navigate('ManagePlans'),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    setNewUserData({
      name: '',
      email: '',
      password: '',
      mobile_no: '',
      address: '',
      role_id: 0,
    });
    setAddUserModalVisible(true);
  };

  // Handle add user submit
  const handleAddUserSubmit = async () => {
    // Validate required fields
    if (!newUserData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter user name');
      return;
    }
    if (!newUserData.email.trim()) {
      Alert.alert('Validation Error', 'Please enter email');
      return;
    }
    if (!newUserData.password.trim()) {
      Alert.alert('Validation Error', 'Please enter password');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await registerUser({
        ...newUserData,
        createdby: userId,
      });

      if (response.success) {
        Alert.alert('Success', 'User registered successfully');
        setAddUserModalVisible(false);
        fetchUsers(true); // Refresh the list
      } else {
        Alert.alert('Error', response.message || 'Failed to register user');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong while registering user');
      console.error('Error registering user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter users based on search and active tab
  useEffect(() => {
    let result = users;

    // Filter by tab
    if (activeTab === 'active') {
      result = result.filter(user => user.isActive === true);
    } else if (activeTab === 'inactive') {
      result = result.filter(user => user.isActive === false);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.mobile_no?.includes(query)
      );
    }

    setFilteredUsers(result);
  }, [searchQuery, activeTab, users]);

  // Handle edit user - Open edit modal with user data
  const handleEditUser = (user) => {
    // Check subscription before allowing edit user
    if (userRole === 'Admin' && isSubscriptionExpired(subscriptionStatus)) {
      Alert.alert(
        'Subscription Expired',
        getSubscriptionMessage(subscriptionStatus) || 'Your plan has expired. Please renew to edit users.',
        [
          {
            text: 'Go to Plans',
            onPress: () => navigation.navigate('ManagePlans'),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    setSelectedUser(user);
    setEditUserData({
      name: user.name || '',
      email: user.email || '',
      password: '', // Don't pre-fill password
      mobile_no: user.mobile_no || '',
      address: user.address || '',
      role_id: user.role_id || 0,
      isActive: user.isActive !== false,
      status: user.status || 1,
    });
    setEditUserModalVisible(true);
  };

  // Handle edit user submit
  const handleEditUserSubmit = async () => {
    // Validate required fields
    if (!editUserData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter user name');
      return;
    }
    if (!editUserData.email.trim()) {
      Alert.alert('Validation Error', 'Please enter email');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        name: editUserData.name,
        email: editUserData.email,
        mobile_no: editUserData.mobile_no,
        address: editUserData.address,
        role_id: editUserData.role_id,
        isActive: editUserData.isActive,
        status: editUserData.status,
      };

      // Only include password if it's provided
      if (editUserData.password.trim()) {
        updateData.password = editUserData.password;
      }

      const response = await updateUser(selectedUser.id, updateData);

      if (response.success) {
        Alert.alert('Success', 'User updated successfully');
        setEditUserModalVisible(false);
        fetchUsers(true); // Refresh the list
      } else {
        Alert.alert('Error', response.message || 'Failed to update user');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong while updating user');
      console.error('Error updating user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = (user) => {
    // Check subscription before allowing delete user
    if (userRole === 'Admin' && isSubscriptionExpired(subscriptionStatus)) {
      Alert.alert(
        'Subscription Expired',
        getSubscriptionMessage(subscriptionStatus) || 'Your plan has expired. Please renew to delete users.',
        [
          {
            text: 'Go to Plans',
            onPress: () => navigation.navigate('ManagePlans'),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteUser(user.id);
              
              if (response.success) {
                Alert.alert('Success', 'User deleted successfully');
                fetchUsers(true); // Refresh the list
              } else {
                Alert.alert('Error', response.message || 'Failed to delete user');
              }
            } catch (err) {
              Alert.alert('Error', 'Something went wrong while deleting user');
              console.error('Error deleting user:', err);
            }
          }
        }
      ]
    );
  };

  // Render user item
  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => {
        navigation.navigate('UserTrackingHistory', { 
          userId: item.id, 
          userName: item.name,
          adminId: userId
        });
      }}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatarPlaceholder}>
          <Icon2 name="person" size={30} color="#666" />
        </View>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleEditUser(item)}
        >
          <Icon2 name="create-outline" size={20} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteUser(item)}
        >
          <Icon2 name="trash-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="people-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>
        {error ? error : `No ${activeTab} users found`}
      </Text>
      {error && (
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => fetchUsers(true)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3088C7" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>Users under you</Text>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3088C7" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3088C7" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSubtitle}>Users under you</Text>
      </View>

      {/* Search Bar with Add User Icon on Right */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Icon name="search" size={24} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Users"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.addUserButton}
            onPress={handleAddUser}
          >
            <Icon2 name="person-add" size={24} color="#3088C7" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs - Only Active and Inactive */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inactive' && styles.activeTab]}
          onPress={() => setActiveTab('inactive')}
        >
          <Text style={[styles.tabText, activeTab === 'inactive' && styles.activeTabText]}>
            Inactive Users
          </Text>
        </TouchableOpacity>
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#3088C7']}
          />
        }
      />

      {/* Add User Modal */}
      <Modal
        visible={addUserModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddUserModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New User</Text>
              <TouchableOpacity onPress={() => setAddUserModalVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter name"
                  placeholderTextColor="#999"
                  value={newUserData.name}
                  onChangeText={(text) => setNewUserData({...newUserData, name: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email"
                  placeholderTextColor="#999"
                  value={newUserData.email}
                  onChangeText={(text) => setNewUserData({...newUserData, email: text})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor="#999"
                  value={newUserData.password}
                  onChangeText={(text) => setNewUserData({...newUserData, password: text})}
                  secureTextEntry
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter mobile number"
                  placeholderTextColor="#999"
                  value={newUserData.mobile_no}
                  onChangeText={(text) => setNewUserData({...newUserData, mobile_no: text})}
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter address"
                  placeholderTextColor="#999"
                  value={newUserData.address}
                  onChangeText={(text) => setNewUserData({...newUserData, address: text})}
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Role</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      newUserData.role_id === 0 && styles.roleButtonActive
                    ]}
                    onPress={() => setNewUserData({...newUserData, role_id: 0})}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      newUserData.role_id === 0 && styles.roleButtonTextActive
                    ]}>
                      User
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      newUserData.role_id === 1 && styles.roleButtonActive
                    ]}
                    onPress={() => setNewUserData({...newUserData, role_id: 1})}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      newUserData.role_id === 1 && styles.roleButtonTextActive
                    ]}>
                      Admin
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAddUserModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleAddUserSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Add User</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={editUserModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditUserModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit User</Text>
              <TouchableOpacity onPress={() => setEditUserModalVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter name"
                  placeholderTextColor="#999"
                  value={editUserData.name}
                  onChangeText={(text) => setEditUserData({...editUserData, name: text})}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email"
                  placeholderTextColor="#999"
                  value={editUserData.email}
                  onChangeText={(text) => setEditUserData({...editUserData, email: text})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password (leave blank to keep current)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#999"
                  value={editUserData.password}
                  onChangeText={(text) => setEditUserData({...editUserData, password: text})}
                  secureTextEntry
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter mobile number"
                  placeholderTextColor="#999"
                  value={editUserData.mobile_no}
                  onChangeText={(text) => setEditUserData({...editUserData, mobile_no: text})}
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter address"
                  placeholderTextColor="#999"
                  value={editUserData.address}
                  onChangeText={(text) => setEditUserData({...editUserData, address: text})}
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Role</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      editUserData.role_id === 0 && styles.roleButtonActive
                    ]}
                    onPress={() => setEditUserData({...editUserData, role_id: 0})}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      editUserData.role_id === 0 && styles.roleButtonTextActive
                    ]}>
                      User
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      editUserData.role_id === 1 && styles.roleButtonActive
                    ]}
                    onPress={() => setEditUserData({...editUserData, role_id: 1})}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      editUserData.role_id === 1 && styles.roleButtonTextActive
                    ]}>
                      Admin
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Status</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      editUserData.status === 1 && styles.roleButtonActive
                    ]}
                    onPress={() => setEditUserData({...editUserData, status: 1})}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      editUserData.status === 1 && styles.roleButtonTextActive
                    ]}>
                      Check-in
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      editUserData.status === 0 && styles.roleButtonActive
                    ]}
                    onPress={() => setEditUserData({...editUserData, status: 0})}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      editUserData.status === 0 && styles.roleButtonTextActive
                    ]}>
                      Check-out
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Active Status</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      editUserData.isActive === true && styles.roleButtonActive
                    ]}
                    onPress={() => setEditUserData({...editUserData, isActive: true})}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      editUserData.isActive === true && styles.roleButtonTextActive
                    ]}>
                      Active
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      editUserData.isActive === false && styles.roleButtonActive
                    ]}
                    onPress={() => setEditUserData({...editUserData, isActive: false})}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      editUserData.isActive === false && styles.roleButtonTextActive
                    ]}>
                      Inactive
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditUserModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleEditUserSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Update User</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#3088C7',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#333',
    padding: 0,
  },
  addUserButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3088C7',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#3088C7',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3088C7',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#3088C7',
    borderColor: '#3088C7',
  },
  roleButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#FFF',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3088C7',
    alignItems: 'center',
    marginLeft: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#A0C4E8',
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#FFF',
  },
});

export default AdminHistory;