import React from 'react';
import { Text, StyleSheet } from 'react-native';

const Title = ({ text, isSubtitle }) => {
  return (
    <Text style={isSubtitle ? styles.subtitle : styles.title}>{text}</Text>
  );
};

export default Title;

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212529',
 textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#000',
    marginBottom: 25,
     textAlign: 'center',
  },
});
