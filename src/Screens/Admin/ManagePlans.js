import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllPlans, getUserSubscriptionStatus, isAddOnPlan } from '../../services/PlansService';

export default function ManagePlans() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  // State for plans data from API
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Subscription status
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    hasActivePlan: false,
    hasExpiredPlan: false,
    hasNoPlan: true,
  });
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [showAllPlans, setShowAllPlans] = useState(false);

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

  // Fetch subscription status
  const fetchSubscriptionStatus = async () => {
    try {
      setLoadingSubscription(true);
      const status = await getUserSubscriptionStatus();
      // console.log('ManagePlans - Subscription status:', status);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      // Default to no plan on error
      setSubscriptionStatus({
        hasActivePlan: false,
        hasExpiredPlan: false,
        hasNoPlan: true,
      });
    } finally {
      setLoadingSubscription(false);
    }
  };

  // Fetch plans on component mount
  useEffect(() => {
    fetchPlans();
    fetchSubscriptionStatus();
  }, [fetchPlans]);

  // Refresh subscription status when screen is focused
  useEffect(() => {
    if (isFocused) {
      fetchSubscriptionStatus();
    }
  }, [isFocused]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    fetchPlans(true);
  }, [fetchPlans]);

  const renderItem = ({ item }) => {
    const isAddOn = isAddOnPlan(item.name);

    // Determine if this plan should be disabled
    let isDisabled = false;
    let disableReason = '';

    if (!loadingSubscription) {
      if (subscriptionStatus.hasActivePlan && !isAddOn) {
        // Has active plan - can only buy add-ons, not base plans
        isDisabled = true;
        disableReason = 'Active Plan';
      } else if (subscriptionStatus.hasNoPlan && isAddOn) {
        // No plan - can only buy base plans, not add-ons
        isDisabled = true;
        disableReason = 'Needs Base Plan';
      } else if (subscriptionStatus.hasExpiredPlan && isAddOn) {
        // Expired plan - can only buy base plans, not add-ons
        isDisabled = true;
        disableReason = 'Renew First';
      }
    }

    return (
      <TouchableOpacity
        style={[styles.card, isDisabled && styles.cardDisabled]}
        activeOpacity={isDisabled ? 1 : 0.7}
        onPress={() => {
          if (isDisabled) {
            Alert.alert(
              'Plan Unavailable',
              disableReason === 'Active Plan'
                ? 'You already have an active base plan. You can purchase add-ons.'
                : disableReason === 'Needs Base Plan'
                  ? 'You need to purchase a base plan first before buying add-ons.'
                  : 'Please renew your base plan first before purchasing add-ons.'
            );
          } else {
            navigation.navigate('PlanDetails', { planId: item.id });
          }
        }}
      >
        <View style={[styles.cardAccent, isAddOn && { backgroundColor: '#F57C00' }, isDisabled && { backgroundColor: '#CCC' }]} />
        <View style={styles.cardLeft}>
          <View style={styles.cardHeaderRow}>
            <Icon
              name={isAddOn ? "add-circle" : "star"}
              size={20}
              color={isDisabled ? "#CCC" : isAddOn ? "#F57C00" : "#4A90E2"}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.planName, isDisabled && styles.planNameDisabled]}>{item.name}</Text>
            {isAddOn && (
              <View style={styles.addOnBadge}>
                <Text style={styles.addOnBadgeText}>ADD-ON</Text>
              </View>
            )}
            {isDisabled && (
              <View style={styles.disabledBadge}>
                <Icon name="lock" size={12} color="#666" />
                <Text style={styles.disabledBadgeText}>{disableReason}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.planDescription, isDisabled && styles.planDescriptionDisabled]} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.planDetails}>
            <View style={styles.detailItem}>
              <Icon name="group" size={16} color={isDisabled ? "#CCC" : "#666"} />
              <Text style={[styles.detailText, isDisabled && styles.detailTextDisabled]}>{item.minUsers}-{item.maxUsers} users</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="schedule" size={16} color={isDisabled ? "#CCC" : "#666"} />
              <Text style={[styles.detailText, isDisabled && styles.detailTextDisabled]}>{item.duration}</Text>
            </View>
          </View>
          <Text style={styles.planPrice}>
            <Icon name="attach-money" size={18} color={isDisabled ? "#CCC" : "#27AE60"} />
            <Text style={[styles.priceText, isDisabled && styles.priceTextDisabled]}> {item.price.toLocaleString()}₹</Text>
          </Text>
        </View>
      </TouchableOpacity>
    )
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Available Plans</Text>
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
            <Text style={styles.statsTitle}>Total Plans</Text>
            <Text style={styles.statsValue}>{plans.length}</Text>
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
            </View>
          }
        />
      )}
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
    padding: 4,
    width: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
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
    flex: 1,
  },
  addOnBadge: {
    backgroundColor: '#F57C00',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  addOnBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.5,
  },
  // Disabled state styles
  cardDisabled: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  planNameDisabled: {
    color: '#999',
  },
  planDescriptionDisabled: {
    color: '#CCC',
  },
  detailTextDisabled: {
    color: '#CCC',
  },
  priceTextDisabled: {
    color: '#CCC',
  },
  disabledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  disabledBadgeText: {
    color: '#666',
    fontSize: 9,
    fontFamily: 'Poppins-Medium',
    marginLeft: 2,
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