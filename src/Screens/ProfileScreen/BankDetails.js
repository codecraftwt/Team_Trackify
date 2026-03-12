import { useNavigation } from '@react-navigation/core';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import BASE_URL from '../../config/server';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';

global.Buffer = global.Buffer || Buffer;

const decodeJWT = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    return decoded;
  } catch (e) {
    console.log("JWT decode error", e);
    return null;
  }
};

const BankDetails = ({ route }) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [employeeId, setEmployeeId] = useState(null);
  const [authToken, setAuthToken] = useState('');

  useEffect(() => {
    const fetchBankDetails = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) throw new Error("Auth token not found");
        setAuthToken(token);
        const decoded = decodeJWT(token);
        console.log("Decoded Token:", decoded);
        const empId = decoded?.EmployeeId;
        if (!empId) throw new Error("Invalid Employee ID from token");
        setEmployeeId(empId);

        const response = await fetch(`${BASE_URL}/Employee/GetEmployeeBanksByEmployeeId?employeeId=${empId}`, {
          headers: { Authorization: token },
        });
        console.log("get bank response:", response);

        const text = await response.text();
        if (response.status === 404) {
          console.log("No bank details found for employee");
          setBankAccounts([]);
          return;
        }

        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const data = JSON.parse(text);

        if (Array.isArray(data)) {
          const formatted = data.map((item, index) => ({
            employeeBankId: item.employeeBankId,
            bankName: item.bankName,
            accountHolder: item.accountName,
            accountNumber: item.accountNo,
            ifscCode: item.ifsccode,
            // branch: item.branch || '',
            upiId: item.upiid,
            isPrimary: index === 0,
            createLoginId: item.createLoginId,        // ✅ Add this
            createDate: item.createDate,
          }));
          setBankAccounts(formatted);
        } else {
          setBankAccounts([]);
        }

      } catch (error) {
        Alert.alert("API Error", error.message || "Unexpected error.");
        console.error("Fetch bank error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isFocused) {
      fetchBankDetails();
    }
  }, [isFocused, route.params?.newBank]);

  const saveBankDetails = async (bank, isUpdate = false) => {
    try {
      const token = authToken;
      const decoded = decodeJWT(token);

      const payload = {
        companyId: decoded?.CompanyId, // Required
        employeeBankId: isUpdate ? bank.employeeBankId : 0,
        employeeId: employeeId,
        bankName: bank.bankName,
        accountNo: bank.accountNumber,
        ifsccode: bank.ifscCode,
        accountName: bank.accountHolder,
        upiid: bank.upiId || "",
        isDeleted: false,
        isActive: true,
        createLoginId: decoded?.LoginId, // Required
        createDate: new Date().toISOString(), // Required
        updateLoginId: isUpdate ? decoded?.LoginId : null,
        updateDate: isUpdate ? new Date().toISOString() : null,
      };

      console.log('Saving bank details with payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${BASE_URL}/Employee/AddUpdateEmployeeBank`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log("post bank response:", response);

      const text = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', text);

      let parsed = {};
      if (text) {
        try {
          parsed = JSON.parse(text);
          console.log('Parsed response:', parsed);
        } catch (e) {
          console.warn('Failed to parse response JSON:', e.message);
        }
      }

      if (!response.ok || parsed?.success === false) {
        const message = parsed?.message || `Save failed (HTTP ${response.status})`;
        throw new Error(message);
      }
      Alert.alert("Success", isUpdate ? "Bank details updated" : "Bank added successfully");
    } catch (err) {
      console.error("Save Bank Error:", err);
      Alert.alert("Save Error", err.message || "Something went wrong.");
      throw err;
    }
  };


  const handleSetAsPrimary = (index) => {
    setBankAccounts((prevAccounts) => {
      const updatedAccounts = prevAccounts.map((bank, i) => ({
        ...bank,
        isPrimary: i === index,
      }));
      const primaryAccount = updatedAccounts[index];
      const otherAccounts = updatedAccounts.filter((_, i) => i !== index);
      return [primaryAccount, ...otherAccounts];
    });
  };

  const handleDeleteAccount = async (index) => {
    const account = bankAccounts[index];

    if (account.isPrimary) {
      Alert.alert("Cannot Delete", "Primary account cannot be deleted. Set another account as primary first.");
      return;
    }

    Alert.alert("Delete Account", "Are you sure you want to delete this bank account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = authToken;
            const decoded = decodeJWT(token);

            const payload = {
              companyId: decoded?.CompanyId,
              employeeBankId: account.employeeBankId,
              employeeId: employeeId,
              bankName: account.bankName,
              accountNo: account.accountNumber,
              ifsccode: account.ifscCode,
              accountName: account.accountHolder,
              upiid: account.upiId || "",
              isDeleted: true,
              isActive: false,
              updateLoginId: decoded?.LoginId,
              updateDate: new Date().toISOString(),
              createLoginId: account.createLoginId || decoded?.LoginId, // ✅ fallback to current user
              createDate: account.createDate || new Date().toISOString(), // ✅ fallback to now
            };


            const response = await fetch(`${BASE_URL}/Employee/AddUpdateEmployeeBank`, {
              method: 'POST',
              headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });

            const text = await response.text();
            const data = JSON.parse(text);

            if (!response.ok || data?.success === false) {
              throw new Error(data?.message || `Delete failed (HTTP ${response.status})`);
            }

            Alert.alert("Success", "Bank account deleted successfully");
            setBankAccounts((prev) => prev.filter((_, i) => i !== index));
          } catch (error) {
            console.error("Delete Bank Error:", error);
            Alert.alert("Error", error.message || "Failed to delete bank account.");
          }
        },
      },
    ]);
  };





  const handleEditBank = (bank) => {
    navigation.navigate({
      name: 'EditBankDetails',
      params: {
        bankData: bank,
        onBankUpdated: async (updatedBank) => {
          await saveBankDetails(updatedBank, true);
          // fetchBankDetails(); // force refetch to sync
        }
      },
      key: bank.employeeBankId.toString(), // forces re-render if same screen opened with different bank
    });

  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#438aff" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!loading && bankAccounts.length === 0 && (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#9ca3af' }}>No bank details added.</Text>
          <TouchableOpacity
            style={[styles.addBankButton1, { marginTop: 15 }]}
            onPress={() =>
              navigation.navigate('AddBankDetails', {
                onBankAdded: async (newBank) => {
                  await saveBankDetails(newBank);
                  // refresh data after add
                  setTimeout(() => isFocused && fetchBankDetails(), 500);
                },
              })
            }
          >
            <Text style={styles.addBankButtonText}>Add Bank</Text>
          </TouchableOpacity>
        </View>
      )}


      {bankAccounts.map((bank, index) => (
        <View key={index} style={styles.bankCard}>
          <View style={styles.cardHeader}>
            <View style={styles.primaryContainer}>
              <Text style={styles.bankTypeText}>
                {bank.isPrimary ? 'Primary' : 'Secondary'}
              </Text>
              {bank.isPrimary ? (
                <>
                  <Text style={styles.activeText}> Active</Text>
                  <View style={styles.addBankRow}>
                    <TouchableOpacity
                      style={styles.addBankButton}
                      onPress={() =>
                        navigation.navigate('AddBankDetails', {
                          onBankAdded: async (newBank) => {
                            await saveBankDetails(newBank);
                            // setBankAccounts((prev) => [...prev, newBank]);
                            fetchBankDetails();
                          },
                        })
                      }
                    >
                      <Text style={styles.addBankButtonText}>Add Bank</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleEditBank(bank)} style={styles.editIcon}>
                      <Icon name="edit" size={24} color="#007bff" />
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  onPress={() => handleSetAsPrimary(index)}
                  style={styles.setPrimaryButton}
                >
                  <Text style={styles.setPrimaryButtonText}>Set as Primary</Text>
                </TouchableOpacity>
              )}
            </View>

            {!bank.isPrimary && (
              <View style={styles.iconRow}>
                <TouchableOpacity
                  onPress={() => handleDeleteAccount(index)}
                  style={styles.iconButton}
                >
                  <Icon name="delete" size={22} color="#d11a2a" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleEditBank(bank)}
                  style={styles.iconButton}
                >
                  <Icon name="edit" size={22} color="#007bff" />
                </TouchableOpacity>

              </View>
            )}

          </View>

          <Text style={styles.label}>Bank Name</Text>
          <TextInput style={styles.input} value={bank.bankName} editable={false} />

          <Text style={styles.label}>Account Holder Name</Text>
          <TextInput style={styles.input} value={bank.accountHolder} editable={false} />

          <Text style={styles.label}>Account Number</Text>
          <TextInput style={styles.input} value={bank.accountNumber} editable={false} />

          <Text style={styles.label}>IFSC</Text>
          <TextInput style={styles.input} value={bank.ifscCode} editable={false} />

          
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: wp('5%'),
    backgroundColor: '#f8f9fa',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  primaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeText: {
    fontSize: wp('3.5%'),
    color: 'green',
    marginLeft: wp('2%'),
  },
  bankTypeText: {
    fontSize: wp('4.2%'),
    fontWeight: '600',
    color: '#438aff',
    marginBottom: hp('0.5%'),
  },
  label: {
    fontSize: wp('3.5%'),
    color: '#374151',
    fontWeight: '500',
    marginTop: hp('1%'),
    marginLeft: wp("2%"),

  },
  input: {
    height: hp('5.5%'),
    borderRadius: wp('2%'),
    backgroundColor: '#ffffff',
    paddingHorizontal: wp('3%'),
    fontSize: wp('3.5%'),
    color: '#212529',
    marginTop: hp('0.8%'),
    borderWidth: 0.2,
    fontWeight: '500',
  },
  addBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: wp('6%'),
    marginTop: hp('1%'),
    // backgroundColor: '#ffffff',

  },
  editIcon: {
    marginLeft: wp('3%'),
  },
   addBankButton1: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    backgroundColor: '#438aff',
    borderRadius: wp('2.5%'),
    // marginLeft: wp('20%'),
  },
  addBankButton: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    backgroundColor: '#438aff',
    borderRadius: wp('2.5%'),
    marginLeft: wp('20%'),
  },
  addBankButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: wp('3.5%'),
  },
  bankCard: {
    // paddingBottom: hp('1.5%'),
    // marginBottom: hp('1.5%'),
    // backgroundColor: '#ffffff',

    //  padding: hp('2%'),
  marginBottom: hp('2%'),
  // backgroundColor: '#ffffff',
  borderRadius: wp('2%'),

  },
  setPrimaryButton: {
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    borderRadius: wp('2%'),
    marginLeft: wp('2%'),
    borderWidth: 1,
    borderColor: '#438aff',
  },
  setPrimaryButtonText: {
    color: '#438aff',
    fontSize: wp('3.5%'),
    fontWeight: '500',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: wp('2%'),
  },
  iconButton: {
    padding: wp('1.5%'),
    marginHorizontal: wp('1%'),
  },
  deleteButton: {
    marginLeft: wp('2%'),
    padding: wp('1.5%'),
  },
});

export default BankDetails;