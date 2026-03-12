import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const SplashMessage = ({ message }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

export default SplashMessage;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    marginTop: hp('5%'),
  },
  text: {
    fontSize: wp('6%'), // Responsive font size
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
});