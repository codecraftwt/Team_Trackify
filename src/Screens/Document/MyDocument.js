import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

export default function MyDocument() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>

      {/* Cards */}
      <ScrollView contentContainerStyle={styles.list}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AadharDetails')}>
          <Text style={styles.cardText}>Aadhar Details</Text>
          <Icon name="chevron-forward" size={wp(5)} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PANDetails')}>
          <Text style={styles.cardText}>PAN Details</Text>
          <Icon name="chevron-forward" size={wp(5)} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('QualificationDetails')}>
          <Text style={styles.cardText}>Qualification Details</Text>
          <Icon name="chevron-forward" size={wp(5)} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ExperienceDetails')}>
          <Text style={styles.cardText}>Experience</Text>
          <Icon name="chevron-forward" size={wp(5)} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('DocumentScreen')}>
          <Text style={styles.cardText}>View Document</Text>
          <Icon name="chevron-forward" size={wp(5)} color="#000" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: wp(4),  // Responsive horizontal padding
    paddingTop: hp(3),        // Responsive top padding
  },
  list: {
    paddingBottom: hp(2),     // Responsive bottom padding for ScrollView
  },
  card: {
    backgroundColor: '#ffffff',
    padding: wp(4),           // Responsive padding inside the card
    marginBottom: hp(2),      // Responsive margin between cards
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardText: {
    fontSize: wp(4),        // Responsive font size
    fontWeight: '500',
    color: '#374151',
  },
});
