import React from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomHeader from '../../Component/CustomHeader';

const formatDisplayDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const month = date.toLocaleString('default', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

const AdminDateUsers = ({ route, navigation }) => {
  const {
    date,
    users = [],
    totalSessions,
    totalLocations,
    uniqueUsersCount,
  } = route.params || {};

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => {
        navigation.navigate('AdminUserSessions', {
          userId: item.userId,
          userName: item.name,
          date,
        });
      }}
    >
      <View style={styles.userAvatar}>
        <Icon name="person" size={24} color="#FFFFFF" />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userStatsRow}>
          <View style={styles.userStat}>
            <Icon name="access-time" size={14} color="#666" />
            <Text style={styles.userStatText}>{item.sessionCount} sessions</Text>
          </View>
          <View style={styles.userStat}>
            <Icon name="location-on" size={14} color="#666" />
            <Text style={styles.userStatText}>{item.locationCount} locations</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3088C7" />
      <CustomHeader
        navigation={navigation}
          showBackButton={true}
        title={formatDisplayDate(date)}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.summaryBox}>
        <View style={styles.summaryItem}>
          <Icon name="people" size={20} color="#3088C7" />
          <Text style={styles.summaryValue}>{uniqueUsersCount}</Text>
          <Text style={styles.summaryLabel}>Users</Text>
        </View>
        <View style={styles.summaryItem}>
          <Icon name="access-time" size={20} color="#3088C7" />
          <Text style={styles.summaryValue}>{totalSessions}</Text>
          <Text style={styles.summaryLabel}>Sessions</Text>
        </View>
        <View style={styles.summaryItem}>
          <Icon name="location-on" size={20} color="#3088C7" />
          <Text style={styles.summaryValue}>{totalLocations}</Text>
          <Text style={styles.summaryLabel}>Locations</Text>
        </View>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.listContent}
        renderItem={renderUserItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="info" size={40} color="#999" />
            <Text style={styles.emptyText}>
              No users tracked on this date.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: {
    marginTop: 4,
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3088C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  userStatsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  userStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  userStatText: {
    marginLeft: 4,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    textAlign: 'center',
  },
});

export default AdminDateUsers;

