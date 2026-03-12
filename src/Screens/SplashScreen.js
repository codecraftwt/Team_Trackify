import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import SplashMessage from '../../src/Component/SplashMessage';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const SplashScreen = ({ navigation }) => {
// useEffect(() => {
//   const timer = setTimeout(() => {
//    navigation.replace('Auth', {
//   screen: 'LoginScreen', // nested screen inside AuthStack
// });
//   }, 1000);
//   return () => clearTimeout(timer);
// }, []);


  return (
    <View style={styles.container}>
      <SplashMessage message="Welcome to HRMS" />
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
