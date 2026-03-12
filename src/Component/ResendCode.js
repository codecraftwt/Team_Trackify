import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';


const ResendCode = ({ onResend }) => {
  const [timer, setTimer] = useState(30);
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prevTime => prevTime - 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setIsDisabled(false);
    }
  }, [timer]);

  const handleResend = () => {
    setTimer(30);
    setIsDisabled(true);
    onResend();
  };

  return (
    <TouchableOpacity onPress={handleResend} disabled={isDisabled}>
      <Text style={[styles.resendText, isDisabled && styles.disabledText]}>
        {isDisabled ? `Resend Code (${timer}s)` : 'Resend Code'}
      </Text>
    </TouchableOpacity>
  );
};

export default ResendCode;

const styles = StyleSheet.create({
  resendText: {
    fontSize: wp('4%'), // Responsive font size
    color: '#007BFF',
    marginTop: hp('2%'),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledText: {
    color: '#888',
  },
});
