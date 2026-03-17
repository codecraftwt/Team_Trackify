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
    // totalSessions,
    // totalLocations,
    // uniqueUsersCount,
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

        {/* Session badge */}
        <View style={styles.sessionBadge}>
          <Icon name="access-time" size={12} color="#E67E22" />
          <Text style={styles.sessionText}>
            {item.sessionCount} sessions
          </Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
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
    marginTop: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingVertical: 17
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
  userInfo: {
    flex: 1,
    position: 'relative',
  },
  sessionBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sessionText: {
    marginLeft: 4,
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: '#E67E22',
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

