import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomHeader from '../../Component/CustomHeader';

// Static data for team tracking dashboard
const STATIC_DATA = {
  currentPlan: {
    amount: '₹2000',
    users: '2-14',
    type: 'Standard Plan',
    expires: '19 March 2026',
    duration: 'monthly',
    description: 'Standard Plan for 1 month create upto 10 users'
  },
  trackingOverview: {
    activeUsers: 9,
    inactiveUsers: 1,
    todayCheckedIn: 0,
    todayCheckedOut: 0,
    activePlans: 5,
    liveTrackingUsers: 0
  },
  recentActivities: []
};

const TeamTrackifyDashboard = ({ navigation }) => {
  const renderStatCard = (title, value, showDetails = true) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        {showDetails && (
          <TouchableOpacity>
            <Text style={styles.viewDetailsText}>View Details →</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const renderMetricCard = (label, value, status, icon) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        <View style={styles.metricStatus}>
          {icon === 'live' && <View style={styles.liveDot} />}
          {icon === 'completed' && <Icon name="check-circle" size={16} color="#4CAF50" />}
          <Text style={[
            styles.metricStatusText,
            icon === 'live' && styles.liveText,
            icon === 'completed' && styles.completedText
          ]}>
            {status}
          </Text>
        </View>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Team Trackify</Text>
      </View> */}

      {/* <CustomHeader navigation={navigation} /> */}
       <CustomHeader
          // navigation={navigation}
          title="Team Trackify"
        />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Plan Section */}
        <View style={styles.planSection}>
          <View style={styles.planHeader}>
            <Text style={styles.sectionTitle}>Current Plan</Text>
            <TouchableOpacity>
              <Text style={styles.changePlanText}>Change</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.planCard}>
            <View style={styles.planRow}>
              <Text style={styles.planLabel}>Amount:</Text>
              <Text style={styles.planValue}>{STATIC_DATA.currentPlan.amount}</Text>
            </View>
            <View style={styles.planRow}>
              <Text style={styles.planLabel}>Users:</Text>
              <Text style={styles.planValue}>{STATIC_DATA.currentPlan.users}</Text>
            </View>
            
            <View style={styles.planTypeContainer}>
              <Text style={styles.planType}>{STATIC_DATA.currentPlan.type}</Text>
            </View>
            
            <View style={styles.planExpiryRow}>
              <Icon name="access-time" size={16} color="#666" />
              <Text style={styles.planExpiryText}>
                Expires: {STATIC_DATA.currentPlan.expires}
              </Text>
              <Text style={styles.planDuration}> • {STATIC_DATA.currentPlan.duration}</Text>
            </View>
            
            <Text style={styles.planDescription}>
              {STATIC_DATA.currentPlan.description}
            </Text>
          </View>
        </View>

        {/* Tracking Overview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tracking Overview:</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statsLeft}>
              {renderStatCard('Active Users', STATIC_DATA.trackingOverview.activeUsers)}
              {renderStatCard('Inactive Users', STATIC_DATA.trackingOverview.inactiveUsers)}
            </View>
            
            <View style={styles.statsRight}>
              <View style={styles.checkedCard}>
                <Text style={styles.checkedTitle}>Today's Checked In</Text>
                <Text style={styles.checkedValue}>{STATIC_DATA.trackingOverview.todayCheckedIn}</Text>
              </View>
              <View style={styles.checkedCard}>
                <Text style={styles.checkedTitle}>Today's Checked Out</Text>
                <Text style={styles.checkedValue}>{STATIC_DATA.trackingOverview.todayCheckedOut}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Additional Metrics Section (from second image) */}
        <View style={styles.metricsSection}>
          <View style={styles.metricsRow}>
            {renderMetricCard('Today\'s Checked In', '0', 'Live Status ●', 'live')}
            {renderMetricCard('Today\'s Checked Out', '0', 'Completed ✔', 'completed')}
          </View>

          <View style={styles.actionCardsRow}>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionCardTitle}>Active Plans</Text>
              <Text style={styles.actionCardValue}>5</Text>
              <Text style={styles.actionCardLink}>Manage Plans →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionCardTitle}>Live Tracking Users</Text>
              <Text style={styles.actionCardValue}>0</Text>
              <Text style={styles.actionCardLink}>View on Map ▷</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
          </View>
          <View style={styles.recentEmptyState}>
            <Icon name="info-outline" size={24} color="#999" />
            <Text style={styles.recentEmptyText}>No recent activity</Text>
          </View>
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Icon name="home" size={24} color="#3088C7" />
            <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Icon name="people" size={24} color="#999" />
            <Text style={styles.navText}>Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Icon name="assessment" size={24} color="#999" />
            <Text style={styles.navText}>Reports</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Icon name="person" size={24} color="#999" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 10,
  },
  planSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  changePlanText: {
    color: '#3088C7',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  planCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  planValue: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#333',
  },
  planTypeContainer: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  planType: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#3088C7',
  },
  planExpiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planExpiryText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginLeft: 4,
  },
  planDuration: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  planDescription: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsLeft: {
    flex: 1,
    marginRight: 10,
  },
  statsRight: {
    flex: 1,
    marginLeft: 10,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  viewDetailsText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#3088C7',
  },
  statValue: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  checkedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  checkedTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: 8,
  },
  checkedValue: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  metricsSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginVertical: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 5,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  metricStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  metricStatusText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
  },
  liveText: {
    color: '#4CAF50',
  },
  completedText: {
    color: '#4CAF50',
  },
  metricValue: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  actionCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 5,
  },
  actionCardTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: 8,
  },
  actionCardValue: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 8,
  },
  actionCardLink: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#3088C7',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentEmptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recentEmptyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    marginTop: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 10,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    marginTop: 2,
  },
  navTextActive: {
    color: '#3088C7',
    fontFamily: 'Poppins-Medium',
  },
});

export default TeamTrackifyDashboard;