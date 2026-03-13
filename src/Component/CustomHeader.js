import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Icon2 from 'react-native-vector-icons/EvilIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const CustomHeader = ({
  navigation,
  title,
  showBackButton = false,
  showCrossButton = false,
  showLogo = false,
  showDatePicker = false,
  logoSource,
  onBackPress,
  onCrossPress,
  onDatePress,
  date,
  userData,
  showHistoryLog = false,
  onHistoryLogPress,
  titleColor = '#ffffff',
  iconColor = '#ffffff',
  textAlign = 'center',
  marginStart,
  showPlusButton,
  onPlusPress,
  titleStyle,
}) => {
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const handleCrossPress = () => {
    if (onCrossPress) {
      onCrossPress();
    } else {
      navigation.goBack();
    }
  };

  const handlePlusPress = () => {
    if (onPlusPress) {
      onPlusPress();
    }
  };

  const renderLeftElement = () => {
    if (showBackButton) {
      return (
        <TouchableOpacity onPress={handleBackPress} style={styles.leftButton}>
          <Icon
            name="arrow-back-ios"
            size={24}
            color={iconColor}
          />
        </TouchableOpacity>
      );
    } else if (showLogo && logoSource) {
      return (
        <Image source={logoSource} style={styles.logo} resizeMode="contain" />
      );
    }
    return <View style={styles.placeholder} />;
  };

  const renderRightElement = () => {
    if (showDatePicker) {
      return (
        <TouchableOpacity
          onPress={onDatePress}
          style={styles.rightButton}>
          <Icon2 name="calendar" size={35} color={iconColor} />
          <Text style={[styles.dateText, {color: titleColor}]}>{date}</Text>
        </TouchableOpacity>
      );
    } else if (showHistoryLog) {
      return (
        <TouchableOpacity
          onPress={onHistoryLogPress}
          style={styles.rightButton}>
          <Icon name="work-history" size={26} color={iconColor} />
          <Text style={[styles.historyLogText, {color: titleColor}]}>
            History Log
          </Text>
        </TouchableOpacity>
      );
    } else if (showCrossButton) {
      return (
        <TouchableOpacity onPress={handleCrossPress} style={styles.rightButton}>
          <Icon
            name="close"
            size={28}
            color={iconColor}
          />
        </TouchableOpacity>
      );
    } else if (showPlusButton) {
      return (
        <TouchableOpacity onPress={handlePlusPress} style={styles.rightButton}>
          <Icon
            name="add"
            size={28}
            color={iconColor}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.placeholder} />;
  };

  const renderTitle = () => {
    const titleText = title || userData?.name || '';
    if (!titleText) return null;
    
    return (
      <Text
        style={[
          styles.title,
          {color: titleColor},
          titleStyle,
        ]}
        numberOfLines={1}
        ellipsizeMode="tail">
        {titleText}
      </Text>
    );
  };

  return (
    <View
      style={[
        styles.header,
        {
          paddingVertical: showLogo ? hp(2.8) : hp(4.4),
        },
      ]}>
      {renderLeftElement()}
      <View style={styles.titleContainer}>
        {renderTitle()}
      </View>
      {renderRightElement()}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: hp(2),
    borderBottomLeftRadius: hp(2.5),
    borderBottomRightRadius: hp(2.5),
    backgroundColor: '#3088C7', 
  },
  leftButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: wp(10),
  },
  rightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    justifyContent: 'center',
    minWidth: wp(10),
  },
  placeholder: {
    minWidth: wp(10),
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(2),
  },
  title: {
    fontSize: wp(4.5),
    fontWeight: '600',
    textAlign: 'center',
  },
  logo: {
    width: hp(5.5),
    height: hp(5.5),
    borderRadius: hp(10),
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: hp(1.8),
    marginTop: hp(0.5),
  },
  historyLogContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyLogText: {
    fontSize: hp(1.8),
    marginLeft: 4,
  },
});

export default CustomHeader;