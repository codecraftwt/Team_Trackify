import React, { useState, useEffect, useCallback, memo, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import BASE_URL from "../../config/server";
import { useFocusEffect } from "@react-navigation/native";

const ListItemComponent = ({ item }) => {
  const imageSource = { uri: "https://via.placeholder.com/50x50?text=👤" };

  return (
    <TouchableOpacity style={styles.listItem}>
      <Image source={imageSource} style={styles.dummyImage} resizeMode="cover" />
      <View style={styles.textContainer}>
        <Text style={styles.nameText}>{item.employeeName}</Text>
        <Text style={styles.idText}>ID: {item.employeeId}</Text>
      </View>
    </TouchableOpacity>
  );
};

const ListItem = memo(ListItemComponent);

const AdminTotalEmployees = ({ navigation }) => {
  const [totalEmployees, setTotalEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  const fetchTotalEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("Authentication token not found");

      const cleanToken = token.replace("Bearer ", "") || "";
      let employeeId;
      try {
        const decoded = jwtDecode(cleanToken);
        employeeId = decoded?.EmployeeId || "11134";
      } catch {
        employeeId = "11134";
      }

      const url = `${BASE_URL}/Payroll/GetAssignedEmployeesDetails?managerId=${employeeId}`;
      console.log("URL:", url);

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${cleanToken}` },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setTotalEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setTotalEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTotalEmployees();
      return () => {};
    }, [fetchTotalEmployees])
  );

  const filteredEmployees = useMemo(() => {
    if (!searchText.trim()) return totalEmployees;

    const lower = searchText.toLowerCase();
    return totalEmployees.filter(
      (e) =>
        e.employeeName?.toLowerCase().includes(lower) ||
        e.employeeId?.toString().includes(lower)
    );
  }, [searchText, totalEmployees]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="blue" />
        <Text style={styles.loadingText}>Loading employees...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔍 Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Employee Name or ID..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#888"
        />
      </View>

      {/* 📋 Employee List */}
      {filteredEmployees.length === 0 ? (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No employees found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEmployees}
          keyExtractor={(item) =>
            item.employeeId?.toString() || Math.random().toString()
          }
          renderItem={({ item }) => <ListItem item={item} />}
          contentContainerStyle={styles.listContainer}
          initialNumToRender={10}
          windowSize={21}
        />
      )}
    </View>
  );
};

export default AdminTotalEmployees;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  searchContainer: {
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  listContainer: {
    padding: 10,
    flexGrow: 1,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dummyImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: "#ddd",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  nameText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  idText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  noDataContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    color: "#999",
  },
});
