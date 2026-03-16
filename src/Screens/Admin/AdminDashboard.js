import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Static data for admin dashboard
const STATIC_DATA = {
  adminName: 'Admin User',
  adminEmail: 'admin@trackify.com',
  totalEmployees: 150,
  activeEmployees: 120,
  onLeave: 15,
  absent: 15,
  pendingRequests: 25,
  approvedRequests: 180,
  rejectedRequests: 35,
  todayAttendance: {
    present: 105,
    absent: 30,
    onLeave: 15,
  },
  monthlyStats: {
    totalWorkingDays: 22,
    totalPresent: 95,
    averageAttendance: '87%',
  },
  recentActivities: [
    { id: 1, type: 'leave', message: 'John Doe requested leave', time: '2 hours ago' },
    { id: 2, type: 'attendance', message: 'Marked attendance for all employees', time: '4 hours ago' },
    { id: 3, type: 'request', message: 'Loan request approved for Sarah', time: '5 hours ago' },
    { id: 4, type: 'leave', message: 'Mike Smith leave request rejected', time: '1 day ago' },
  ],
  departmentStats: [
    { name: 'Engineering', employees: 50, active: 45 },
    { name: 'Sales', employees: 40, active: 35 },
    { name: 'Marketing', employees: 30, active: 25 },
    { name: 'HR', employees: 15, active: 14 },
    { name: 'Finance', employees: 15, active: 14 },
  ],
};

const AdminDashboard = ({ navigation }) => {
  const renderStatCard = (title, value, icon, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIconContainer}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderActivityItem = (item) => {
    const getIcon = (type) => {
      switch (type) {
        case 'leave': return 'event-available';
        case 'attendance': return 'check-circle';
        case 'request': return 'request-page';
        default: return 'info';
      }
    };
    const getColor = (type) => {
      switch (type) {
        case 'leave': return '#FF9800';
        case 'attendance': return '#4CAF50';
        case 'request': return '#2196F3';
        default: return '#999';
      }
    };

    return (
      <View key={item.id} style={styles.activityItem}>
        <View style={[styles.activityIcon, { backgroundColor: getColor(item.type) + '20' }]}>
          <Icon name={getIcon(item.type)} size={20} color={getColor(item.type)} />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityMessage}>{item.message}</Text>
          <Text style={styles.activityTime}>{item.time}</Text>
        </View>
      </View>
    );
  };

  const renderDepartmentCard = (dept) => (
    <View key={dept.name} style={styles.departmentCard}>
      <View style={styles.departmentInfo}>
        <Text style={styles.departmentName}>{dept.name}</Text>
        <Text style={styles.departmentEmployees}>{dept.employees} employees</Text>
      </View>
      <View style={styles.departmentStats}>
        <Text style={styles.departmentActive}>{dept.active} active</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(dept.active / dept.employees) * 100}%` }
            ]} 
          />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3088C7" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.adminName}>{STATIC_DATA.adminName}</Text>
          </View>
          <View style={styles.profileContainer}>
            <View style={styles.profileCircle}>
              <Icon name="person" size={30} color="#3088C7" />
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Attendance Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Attendance</Text>
          <View style={styles.todayAttendanceContainer}>
            <View style={styles.attendanceItem}>
              <Text style={[styles.attendanceValue, { color: '#4CAF50' }]}>
                {STATIC_DATA.todayAttendance.present}
              </Text>
              <Text style={styles.attendanceLabel}>Present</Text>
            </View>
            <View style={styles.attendanceDivider} />
            <View style={styles.attendanceItem}>
              <Text style={[styles.attendanceValue, { color: '#F44336' }]}>
                {STATIC_DATA.todayAttendance.absent}
              </Text>
              <Text style={styles.attendanceLabel}>Absent</Text>
            </View>
            <View style={styles.attendanceDivider} />
            <View style={styles.attendanceItem}>
              <Text style={[styles.attendanceValue, { color: '#FF9800' }]}>
                {STATIC_DATA.todayAttendance.onLeave}
              </Text>
              <Text style={styles.attendanceLabel}>On Leave</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Total Employees', STATIC_DATA.totalEmployees, 'people', '#3088C7')}
            {renderStatCard('Active Today', STATIC_DATA.activeEmployees, 'how-to-reg', '#4CAF50')}
            {renderStatCard('On Leave', STATIC_DATA.onLeave, 'event-busy', '#FF9800')}
            {renderStatCard('Absent', STATIC_DATA.absent, 'person-add', '#F44336')}
          </View>
        </View>

        {/* Request Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requests Overview</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Pending', STATIC_DATA.pendingRequests, 'pending-actions', '#FF9800')}
            {renderStatCard('Approved', STATIC_DATA.approvedRequests, 'check-circle', '#4CAF50')}
            {renderStatCard('Rejected', STATIC_DATA.rejectedRequests, 'cancel', '#F44336')}
          </View>
        </View>

        {/* Monthly Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Statistics</Text>
          <View style={styles.monthlyCard}>
            <View style={styles.monthlyItem}>
              <Text style={styles.monthlyValue}>{STATIC_DATA.monthlyStats.totalWorkingDays}</Text>
              <Text style={styles.monthlyLabel}>Working Days</Text>
            </View>
            <View style={styles.monthlyDivider} />
            <View style={styles.monthlyItem}>
              <Text style={styles.monthlyValue}>{STATIC_DATA.monthlyStats.totalPresent}</Text>
              <Text style={styles.monthlyLabel}>Days Present</Text>
            </View>
            <View style={styles.monthlyDivider} />
            <View style={styles.monthlyItem}>
              <Text style={[styles.monthlyValue, { color: '#4CAF50' }]}>
                {STATIC_DATA.monthlyStats.averageAttendance}
              </Text>
              <Text style={styles.monthlyLabel}>Attendance</Text>
            </View>
          </View>
        </View>

        {/* Department Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Department Overview</Text>
          {STATIC_DATA.departmentStats.map(renderDepartmentCard)}
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <View style={styles.activitiesContainer}>
            {STATIC_DATA.recentActivities.map(renderActivityItem)}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminRequest')}
            >
              <Icon name="assignment" size={24} color="#3088C7" />
              <Text style={styles.actionText}>Requests</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminAttendenceshow')}
            >
              <Icon name="event-note" size={24} color="#3088C7" />
              <Text style={styles.actionText}>Attendance</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('EmployeeListScreen')}
            >
              <Icon name="people" size={24} color="#3088C7" />
              <Text style={styles.actionText}>Employees</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Faceenrolled')}
            >
              <Icon name="face" size={24} color="#3088C7" />
              <Text style={styles.actionText}>Face Scan</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  adminName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    marginTop: 4,
  },
  profileContainer: {
    alignItems: 'center',
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 15,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 12,
  },
  todayAttendanceContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  attendanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  attendanceValue: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  attendanceLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: 4,
  },
  attendanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  monthlyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  monthlyItem: {
    alignItems: 'center',
    flex: 1,
  },
  monthlyValue: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#3088C7',
  },
  monthlyLabel: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: 4,
  },
  monthlyDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  departmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  departmentInfo: {
    flex: 1,
  },
  departmentName: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  departmentEmployees: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: 2,
  },
  departmentStats: {
    alignItems: 'flex-end',
  },
  departmentActive: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#4CAF50',
    marginBottom: 6,
  },
  progressBar: {
    width: 80,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  activitiesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  activityTime: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    width: '23%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 30,
  },
});

export default AdminDashboard;
