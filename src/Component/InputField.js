import React, { useRef } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const InputField = ({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  isOTP = false,
  secureTextEntry = false,
  onSubmitOTP
}) => {
  const inputRefs = useRef([]);

  return (
    <View style={[styles.container, isOTP && styles.otpContainer]}>
      {isOTP ? (
        <View style={styles.otpWrapper}>
          {value.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={styles.otpInput}
              keyboardType="numeric"
              maxLength={1}
              value={digit}
              secureTextEntry={secureTextEntry}
              onChangeText={(text) => {
                onChangeText(text, index);
                if (text && index < value.length - 1) {
                  inputRefs.current[index + 1]?.focus(); // Move to next input
                }
                if (index === value.length - 1 && text) {
                  onSubmitOTP && onSubmitOTP(); // Auto-submit when last digit is entered
                }
              }}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && index > 0 && !value[index]) {
                  inputRefs.current[index - 1]?.focus(); // Move back on delete
                }
              }}
            />
          ))}
        </View>
      ) : (
        <TextInput
          placeholder={label || 'Enter text'}
          placeholderTextColor="#D5D5D5"
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
        />
      )}
    </View>
  );
};

export default InputField;

const styles = StyleSheet.create({
  container: {
    marginBottom: hp('2.5%'),
    width: '100%',
  },
  input: {
    height: hp('6%'),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: wp('2%'),
    paddingHorizontal: wp('4%'),
    fontSize: wp('4%'),
    color: "#212529",
    backgroundColor: "#ffffff",
  },
  otpContainer: {
    alignItems: 'center',
    width: '100%',
  },
  otpWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp('1%'),
  },
  otpInput: {
    width: wp('12%'),
    height: wp('12%'),
    color: '#000',
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: wp('2%'),
    textAlign: 'center',
    fontSize: wp('5.5%'),
    backgroundColor: "#F5F6FA",
    marginHorizontal: wp('1%'),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    bottom: 50,
  },
});
