import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const Button = ({ title, onPress, backgroundColor,titleStyle, style, icon,  iconColor = "#fff"  }) => {
  return (
    <TouchableOpacity style={[styles.button, style, { backgroundColor }]} onPress={onPress}>
      <View style={styles.buttonContent}>
        {icon && <Icon name={icon} size={23} color={iconColor}style={styles.icon} />}
        <Text style={[styles.buttonText, titleStyle ] }>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default Button;


const styles = StyleSheet.create({
  button: {
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('3.5%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp('13%'),
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: wp('2%'),
  },
  buttonText: {
    fontSize: wp('4.8%'),
    color: '#fff',
    fontWeight: '500',
  },
});
