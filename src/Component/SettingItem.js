import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const SettingItem = ({ icon, title, iconColor = '#438aff', titleColor = '#374151', onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>  
      <FontAwesome5 name={icon} size={22} color={iconColor} />
      <Text style={[styles.title, { color:titleColor }]}>{title}</Text>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  container: {
    width: wp('28%'),
    height: hp('18%'),               
    aspectRatio: 1,                 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    marginBottom: hp('2%'),
    elevation: 0,
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
  },
  title: {
    marginTop: hp('1%'),
    fontSize: Math.max(wp("3.8%"), 14),
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default SettingItem;
