import React, { useEffect, useRef } from 'react';
import {
  Image,
  StatusBar,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  View,
} from 'react-native';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
// import { globalFonts } from '../theme';

const Splash = () => {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Animate logo and text on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  return (
    <TouchableWithoutFeedback>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3088C7" />
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
          ]}>
          <Image
            source={require('../assets/main_trackify_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Animated.Text
            style={[
              styles.title,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}>
            Team Trackify
          </Animated.Text>
          <Animated.Text
            style={[
              styles.subtitle,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}>
            Track Your Team, Track Your Success
          </Animated.Text>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3088C7',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    height: RFPercentage(16),
    width: RFPercentage(16),
    marginBottom: RFValue(24),
    borderRadius: RFPercentage(2.4),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  title: {
    fontSize: RFPercentage(4.2),
    // fontFamily: globalFonts.bold,
    color: 'white',
    textAlign: 'center',
    marginBottom: RFValue(10),
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: RFPercentage(2),
    // fontFamily: globalFonts.regular,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: RFValue(5),
  },
});