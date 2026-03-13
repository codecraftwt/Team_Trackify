import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import SettingItem from '../Component/SettingItem';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useAuth } from '../config/auth-context';

const { width } = Dimensions.get("window");

const Settings = () => {
  const navigation = useNavigation();
  const { userId, userRole, companyId, userProfile } = useAuth();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ✅ Profile Section (only content in More tab) */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {userRole ? userRole.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {userProfile?.name || userRole || 'Employee'}
            </Text>
            <Text style={styles.profileMeta}>
              {userProfile?.email || 'No email'}
            </Text>
            <Text
              style={styles.profileLink}
              onPress={() => navigation.navigate('Profile')}
            >
              View full profile
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    alignItems: 'center',
  },

  menuRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: hp(1.5),
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: "#f8f9fa",
  },

  sectionTitle: {
     fontSize: Math.max(wp("4.3%"), 14),
    fontWeight: '600',
    color: "#000000",
    marginTop: hp(1),
    marginBottom: hp(1),
    width: '100%',
    textAlign: 'left',
    maxWidth: 600,
    alignSelf: 'center',
     marginLeft: wp('3%'),
  },
  profileCard: {
    width: '100%',
    maxWidth: 600,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: hp(2),
  },
  profileAvatar: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    backgroundColor: '#438AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  profileAvatarText: {
    color: '#ffffff',
    fontSize: wp(6),
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: Math.max(wp('4.5%'), 16),
    fontWeight: '700',
    color: '#111827',
  },
  profileMeta: {
    marginTop: 4,
    fontSize: Math.max(wp('3.3%'), 12),
    color: '#6B7280',
  },
  profileLink: {
    marginTop: 6,
    fontSize: Math.max(wp('3.5%'), 13),
    color: '#2563EB',
    fontWeight: '600',
  },
});

export default Settings;
