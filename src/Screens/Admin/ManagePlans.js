import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllPlans } from '../../services/PlansService';

export default function ManagePlans() {
  const navigation = useNavigation();
   
  // State for plans data from API
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch plans from API
  const fetchPlans = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await getAllPlans();
      
      // Map API response to match the expected format
      const mappedPlans = response.map((plan) => ({
        id: plan._id,
        name: plan.name,
        description: plan.description,
        minUsers: plan.minUsers,
        maxUsers: plan.maxUsers,
        price: plan.price,
        duration: plan.duration,
        status: plan.status,
      }));
      
      setPlans(mappedPlans);
    } catch (err) {
      setError(err.message || 'Failed to fetch plans');
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch plans on component mount
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    fetchPlans(true);
  }, [fetchPlans]);

  const durationOptions = [
    { label: '1 month', value: '1 month' },
    { label: '3 months', value: '3 months' },
    { label: '6 months', value: '6 months' },
    { label: '9 months', value: '9 months' },
    { label: '1 year', value: '1 year' },
  ];

  const planOptions = [
    { label: 'Standard Plan', value: 'Standard Plan' },
    { label: 'Premium Plan', value: 'Premium Plan' },
    { label: 'Enterprise Plan', value: 'Enterprise Plan' },
    { label: 'Custom Plan', value: 'Custom Plan' },
    { label: 'Add on Plan', value: 'Add on Plan' },
  ];

  const [editingPlan, setEditingPlan] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAddingNewPlan, setIsAddingNewPlan] = useState(false);
  const [showAllPlans, setShowAllPlans] = useState(false);

  // Dropdown states
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState(durationOptions);

  const [planOpen, setPlanOpen] = useState(false);
  const [planValue, setPlanValue] = useState(null);
  const [planItems, setPlanItems] = useState(planOptions);

  const handleAddNewPlan = () => {
    setEditingPlan({
      id: Date.now().toString(),
      name: '',
      description: '',
      minUsers: '',
      maxUsers: '',
      price: '',
      duration: '1 month',
    });
    setPlanValue(null);
    setValue('1 month');
    setIsAddingNewPlan(true);
    setIsEditModalVisible(true);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setPlanValue(plan.name);
    setValue(plan.duration);
    setIsAddingNewPlan(false);
    setIsEditModalVisible(true);
  };

  const handleSave = () => {
    const min = Number(editingPlan.minUsers);
    const max = Number(editingPlan.maxUsers);
    const price = Number(editingPlan.price);

    // Validation
    if (
      !editingPlan.name ||
      !editingPlan.description ||
      !editingPlan.minUsers ||
      !editingPlan.maxUsers ||
      !editingPlan.price ||
      !editingPlan.duration
    ) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (isNaN(min) || isNaN(max) || isNaN(price)) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    if (min >= max) {
      Alert.alert('Error', 'Max users must be greater than min users');
      return;
    }

    if (price <= 0) {
      Alert.alert('Error', 'Price must be greater than 0');
      return;
    }

    const updatedPlan = {
      ...editingPlan,
      minUsers: min,
      maxUsers: max,
      price: price,
    };

    if (isAddingNewPlan) {
      setPlans([...plans, updatedPlan]);
      Alert.alert('Success', 'Plan added successfully');
    } else {
      const updatedPlans = plans.map(plan => 
        plan.id === editingPlan.id ? updatedPlan : plan
      );
      setPlans(updatedPlans);
      Alert.alert('Success', 'Plan updated successfully');
    }

    setIsEditModalVisible(false);
    setIsAddingNewPlan(false);
    setEditingPlan(null);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Plan',
      'Are you sure you want to delete this plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => {
            const filteredPlans = plans.filter(plan => plan.id !== id);
            setPlans(filteredPlans);
            Alert.alert('Success', 'Plan deleted successfully');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('PlanDetails', { planId: item.id })}
    >
      <View style={styles.cardAccent} />
      <View style={styles.cardLeft}>
        <View style={styles.cardHeaderRow}>
          <Icon name="star" size={20} color="#4A90E2" style={{ marginRight: 6 }} />
          <Text style={styles.planName}>{item.name}</Text>
        </View>
        <Text style={styles.planDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.planDetails}>
          <View style={styles.detailItem}>
            <Icon name="group" size={16} color="#666" />
            <Text style={styles.detailText}>{item.minUsers}-{item.maxUsers} users</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="schedule" size={16} color="#666" />
            <Text style={styles.detailText}>{item.duration}</Text>
          </View>
        </View>
        <Text style={styles.planPrice}>
          <Icon name="attach-money" size={18} color="#27AE60" />
          <Text style={styles.priceText}> {item.price.toLocaleString()}₹</Text>
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => handleEdit(item)}
          style={[styles.actionButton, styles.editButton]}
          activeOpacity={0.7}>
          <Icon name="edit" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          style={[styles.actionButton, styles.deleteButton]}
          activeOpacity={0.7}>
          <Icon name="delete" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderModal = () => (
    <Modal
      visible={isEditModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setIsEditModalVisible(false);
        setIsAddingNewPlan(false);
        setEditingPlan(null);
      }}>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}>
          <View style={styles.modalContent}>
            <View style={styles.modalAccentBar} />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setIsEditModalVisible(false);
                setIsAddingNewPlan(false);
                setEditingPlan(null);
              }}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isAddingNewPlan ? 'Add New Plan' : 'Edit Plan'}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Plan Type</Text>
              <View style={styles.planTypeContainer}>
                {planOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.planTypeButton,
                      planValue === option.value && styles.planTypeButtonActive
                    ]}
                    onPress={() => {
                      setPlanValue(option.value);
                      setEditingPlan({ ...editingPlan, name: option.value });
                    }}>
                    <Text style={[
                      styles.planTypeText,
                      planValue === option.value && styles.planTypeTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editingPlan?.description}
                onChangeText={(text) =>
                  setEditingPlan({ ...editingPlan, description: text })
                }
                placeholder="Enter plan description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Min Users</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={editingPlan?.minUsers?.toString()}
                  onChangeText={(text) =>
                    setEditingPlan({ ...editingPlan, minUsers: text })
                  }
                  placeholder="Min"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Max Users</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={editingPlan?.maxUsers?.toString()}
                  onChangeText={(text) =>
                    setEditingPlan({ ...editingPlan, maxUsers: text })
                  }
                  placeholder="Max"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Price (₹)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={editingPlan?.price?.toString()}
                onChangeText={(text) =>
                  setEditingPlan({ ...editingPlan, price: text })
                }
                placeholder="Enter price"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Duration</Text>
              <View style={styles.durationContainer}>
                {durationOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.durationButton,
                      value === option.value && styles.durationButtonActive
                    ]}
                    onPress={() => {
                      setValue(option.value);
                      setEditingPlan({ ...editingPlan, duration: option.value });
                    }}>
                    <Text style={[
                      styles.durationText,
                      value === option.value && styles.durationTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsEditModalVisible(false);
                  setIsAddingNewPlan(false);
                  setEditingPlan(null);
                }}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}>
                <Text style={styles.buttonText}>
                  {isAddingNewPlan ? 'Add Plan' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Plans</Text>
        <TouchableOpacity 
          onPress={handleAddNewPlan}
          style={styles.addButton}>
          <Icon name="add" size={28} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Stats Card */}
      <TouchableOpacity 
        style={styles.statsCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Plans')}>
        <View style={styles.statsCardContent}>
          <View style={styles.statsIconWrapper}>
            <Icon name="assessment" size={24} color="#F57C00" />
          </View>
          <View style={styles.statsInfo}>
            <Text style={styles.statsTitle}>Active Plans</Text>
            <Text style={styles.statsValue}>{plans.length}</Text>
          </View>
          <View style={styles.statsAction}>
            <Text style={styles.statsActionText}>View All</Text>
            <Icon name="arrow-forward" size={16} color="#F57C00" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Plans List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          Available Plans ({plans.length})
        </Text>
        {plans.length > 4 && (
          <TouchableOpacity onPress={() => setShowAllPlans(!showAllPlans)}>
            <View style={styles.seeAllContainer}>
              <Text style={styles.seeAllText}>
                {showAllPlans ? 'Show Less' : 'See All'}
              </Text>
              <Icon
                name={showAllPlans ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={20}
                color="#4A90E2"
              />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      )}

      {/* Error Message */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={50} color="#E74C3C" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchPlans()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Plans List */}
      {!loading && !error && (
        <FlatList
          data={showAllPlans ? plans : plans.slice(0, 4)}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4A90E2']}
              tintColor="#4A90E2"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No plans available</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={handleAddNewPlan}>
                <Text style={styles.emptyButtonText}>Add Your First Plan</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {renderModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  statsCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statsCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statsInfo: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Rubik-Regular',
  },
  statsValue: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  statsAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statsActionText: {
    fontSize: 14,
    color: '#F57C00',
    fontFamily: 'Rubik-Medium',
    marginRight: 4,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontFamily: 'Rubik-Medium',
    color: '#333',
  },
  seeAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4A90E2',
    fontFamily: 'Rubik-Medium',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 4,
    backgroundColor: '#4A90E2',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  cardLeft: {
    flex: 1,
    marginLeft: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  planName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  planDescription: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Rubik-Regular',
    marginBottom: 8,
  },
  planDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Rubik-Regular',
    marginLeft: 4,
  },
  planPrice: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#27AE60',
  },
  priceText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Rubik-Regular',
  },
  actions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: '#4A90E2',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalAccentBar: {
    width: 60,
    height: 4,
    backgroundColor: '#4A90E2',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#F8F9FA',
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  planTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  planTypeButton: {
    flex: 1,
    minWidth: '45%',
    margin: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  planTypeButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  planTypeText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Rubik-Regular',
    textAlign: 'center',
  },
  planTypeTextActive: {
    color: '#fff',
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  durationButton: {
    flex: 1,
    minWidth: '30%',
    margin: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  durationButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  durationText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Rubik-Regular',
    textAlign: 'center',
  },
  durationTextActive: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#E74C3C',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Rubik-Medium',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontFamily: 'Rubik-Regular',
    marginTop: 16,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Rubik-Regular',
  },
  // Error styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#E74C3C',
    fontFamily: 'Rubik-Regular',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
  },
});