import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Static data for admin reports
const STATIC_REPORT_DATA = {
  overview: {
    totalEmployees: 150,
    activeEmployees: 120,
    totalDepartments: 5,
    averageAttendance: '87%',
  },
  attendanceReport: {
    present: 105,
    absent: 30,
    onLeave: 15,
    late: 12,
    halfDay: 8,
  },
  departmentWiseAttendance: [
    { name: 'Engineering', present: 45, absent: 5, percentage: 90 },
    { name: 'Sales', present: 32, absent: 8, percentage: 80 },
    { name: 'Marketing', present: 22, absent: 3, percentage: 88 },
    { name: 'HR', present: 14, absent: 1, percentage: 93 },
    { name: 'Finance', present: 12, absent: 3, percentage: 80 },
  ],
  leaveReport: [
    { type: 'Sick Leave', taken: 12, remaining: 8, total: 20 },
    { type: 'Casual Leave', taken: 10, remaining: 10, total: 20 },
    { type: 'Earned Leave', taken: 5, remaining: 15, total: 20 },
    { type: ' maternity Leave', taken: 0, remaining: 90, total: 90 },
    { type: 'Paternity Leave', taken: 0, remaining: 7, total: 7 },
  ],
  monthlyPerformance: [
    { month: 'Jan', performance: 85, target: 90 },
    { month: 'Feb', performance: 88, target: 90 },
    { month: 'Mar', performance: 92, target: 90 },
  ],
  pendingTasks: [
    { id: 1, task: 'Leave approvals', count: 8, priority: 'high', icon: 'event-available', color: '#FF9800' },
    { id: 2, task: 'Loan requests', count: 5, priority: 'medium', icon: 'account-balance', color: '#2196F3' },
    { id: 3, task: 'Expense claims', count: 12, priority: 'high', icon: 'receipt', color: '#E91E63' },
    { id: 4, task: 'Shift changes', count: 3, priority: 'low', icon: 'schedule', color: '#9C27B0' },
  ],
};

const AdminReport = ({ navigation }) => {
  const renderStatCard = (title, value, subtitle, icon, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
    </View>
  );

  const renderDepartmentRow = (dept) => (
    <View key={dept.name} style={styles.departmentRow}>
      <View style={styles.departmentInfo}>
        <Text style={styles.departmentName}>{dept.name}</Text>
        <Text style={styles.departmentCount}>
          {dept.present} present / {dept.absent} absent
        </Text>
      </View>
      <View style={styles.percentageContainer}>
        <Text style={[
          styles.percentageText,
          { color: dept.percentage >= 85 ? '#4CAF50' : dept.percentage >= 70 ? '#FF9800' : '#F44336' }
        ]}>
          {dept.percentage}%
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${dept.percentage}%`,
                backgroundColor: dept.percentage >= 85 ? '#4CAF50' : dept.percentage >= 70 ? '#FF9800' : '#F44336'
              }
            ]} 
          />
        </View>
      </View>
    </View>
  );

  const renderLeaveRow = (leave) => (
    <View key={leave.type} style={styles.leaveRow}>
      <View style={styles.leaveInfo}>
        <Text style={styles.leaveType}>{leave.type}</Text>
        <Text style={styles.leaveTaken}>Taken: {leave.taken} days</Text>
      </View>
      <View style={styles.leaveProgress}>
        <View style={styles.leaveProgressBar}>
          <View 
            style={[
              styles.leaveProgressFill, 
              { width: `${(leave.taken / leave.total) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.leaveRemaining}>{leave.remaining} days left</Text>
      </View>
    </View>
  );

  const renderTaskCard = (task) => (
    <View key={task.id} style={styles.taskCard}>
      <View style={[styles.taskIconContainer, { backgroundColor: task.color + '20' }]}>
        <Icon name={task.icon} size={24} color={task.color} />
      </View>
      <View style={styles.taskContent}>
        <Text style={styles.taskName}>{task.task}</Text>
        <Text style={styles.taskCount}>{task.count} pending</Text>
      </View>
      <View style={[styles.priorityBadge, { 
        backgroundColor: task.priority === 'high' ? '#FFEBEE' : task.priority === 'medium' ? '#E3F2FD' : '#F3E5F5',
      }]}>
        <Text style={[styles.priorityText, { 
          color: task.priority === 'high' ? '#F44336' : task.priority === 'medium' ? '#2196F3' : '#9C27B0'
        }]}>
          {task.priority}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3088C7" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
        <Text style={styles.headerSubtitle}>Admin Overview</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Total Employees', STATIC_REPORT_DATA.overview.totalEmployees, 'Registered', 'people', '#3088C7')}
            {renderStatCard('Active Today', STATIC_REPORT_DATA.overview.activeEmployees, 'Working', 'how-to-reg', '#4CAF50')}
            {renderStatCard('Departments', STATIC_REPORT_DATA.overview.totalDepartments, 'Active', 'business', '#9C27B0')}
            {renderStatCard('Attendance', STATIC_REPORT_DATA.overview.averageAttendance, 'Average', 'trending-up', '#FF9800')}
          </View>
        </View>

        {/* Today's Attendance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Attendance</Text>
          <View style={styles.attendanceCard}>
            <View style={styles.attendanceGrid}>
              <View style={styles.attendanceItem}>
                <Text style={[styles.attendanceValue, { color: '#4CAF50' }]}>
                  {STATIC_REPORT_DATA.attendanceReport.present}
                </Text>
                <Text style={styles.attendanceLabel}>Present</Text>
              </View>
              <View style={styles.attendanceItem}>
                <Text style={[styles.attendanceValue, { color: '#F44336' }]}>
                  {STATIC_REPORT_DATA.attendanceReport.absent}
                </Text>
                <Text style={styles.attendanceLabel}>Absent</Text>
              </View>
              <View style={styles.attendanceItem}>
                <Text style={[styles.attendanceValue, { color: '#FF9800' }]}>
                  {STATIC_REPORT_DATA.attendanceReport.onLeave}
                </Text>
                <Text style={styles.attendanceLabel}>On Leave</Text>
              </View>
              <View style={styles.attendanceItem}>
                <Text style={[styles.attendanceValue, { color: '#9C27B0' }]}>
                  {STATIC_REPORT_DATA.attendanceReport.late}
                </Text>
                <Text style={styles.attendanceLabel}>Late</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Department Wise Attendance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Department Wise Attendance</Text>
          <View style={styles.card}>
            {STATIC_REPORT_DATA.departmentWiseAttendance.map(renderDepartmentRow)}
          </View>
        </View>

        {/* Leave Report */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leave Report</Text>
          <View style={styles.card}>
            {STATIC_REPORT_DATA.leaveReport.map(renderLeaveRow)}
          </View>
        </View>

        {/* Pending Tasks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Tasks</Text>
          <View style={styles.tasksContainer}>
            {STATIC_REPORT_DATA.pendingTasks.map(renderTaskCard)}
          </View>
        </View>

        {/* Monthly Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Performance</Text>
          <View style={styles.performanceCard}>
            {STATIC_REPORT_DATA.monthlyPerformance.map((item, index) => (
              <View key={index} style={styles.performanceItem}>
                <Text style={styles.performanceMonth}>{item.month}</Text>
                <View style={styles.performanceBarContainer}>
                  <View 
                    style={[
                      styles.performanceBar, 
                      { 
                        width: `${(item.performance / 100) * 100}%`,
                        backgroundColor: item.performance >= item.target ? '#4CAF50' : '#FF9800'
                      }
                    ]} 
                  />
                </View>
                <View style={styles.performanceStats}>
                  <Text style={styles.performanceValue}>{item.performance}%</Text>
                  <Text style={styles.performanceTarget}>Target: {item.target}%</Text>
                </View>
              </View>
            ))}
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
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  statSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  statIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  attendanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  attendanceItem: {
    alignItems: 'center',
  },
  attendanceValue: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
  },
  attendanceLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  departmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  departmentInfo: {
    flex: 1,
  },
  departmentName: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  departmentCount: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: 2,
  },
  percentageContainer: {
    alignItems: 'flex-end',
    width: 80,
  },
  percentageText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  progressBar: {
    width: 70,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  leaveRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  leaveInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leaveType: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  leaveTaken: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  leaveProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaveProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 12,
  },
  leaveProgressFill: {
    height: '100%',
    backgroundColor: '#3088C7',
    borderRadius: 4,
  },
  leaveRemaining: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#4CAF50',
    width: 80,
    textAlign: 'right',
  },
  tasksContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  taskIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskName: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  taskCount: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    textTransform: 'capitalize',
  },
  performanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  performanceItem: {
    marginBottom: 15,
  },
  performanceMonth: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 8,
  },
  performanceBarContainer: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginBottom: 6,
  },
  performanceBar: {
    height: '100%',
    borderRadius: 6,
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceValue: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  performanceTarget: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999',
  },
  bottomPadding: {
    height: 30,
  },
});

export default AdminReport;
