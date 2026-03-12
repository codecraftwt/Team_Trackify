import {
  StyleSheet,
  Text,
  View,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import React, { useState, useCallback, memo, useMemo } from "react";
import { TabView, TabBar } from "react-native-tab-view";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import BASE_URL from "../../config/server";

// --- Initial Data Structure for State ---
const initialEmployeeData = {
  rolled: [],
  unrolled: [],
  processing: [],
};

// --- List Item Component (Optimized with memo) ---
const ListItemComponent = ({ item, navigation }) => {
  const imageSource = { uri: "https://via.placeholder.com/50x50?text=👤" };

  return (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => {
        navigation.navigate("Faceregister", {
          employeeId: item.employeeId,
          employeeName: item.employeeName,
        });
      }}
    >
      <Image source={imageSource} style={styles.dummyImage} resizeMode="cover" />
      <View style={styles.textContainer}>
        <Text style={styles.nameText}>{item.employeeName}</Text>
        <Text style={styles.idText}>ID: {item.employeeId}</Text>
      </View>
    </TouchableOpacity>
  );
};

const ListItem = memo(ListItemComponent);

// --- Tab Scene Components (Optimized with FlatList) ---
const ListScreen = ({ data, category, navigation }) => {
  if (data.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No employees in {category}.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) =>
        item.employeeId?.toString() || Math.random().toString()
      }
      renderItem={({ item }) => <ListItem item={item} navigation={navigation} />}
      contentContainerStyle={styles.listContainer}
      initialNumToRender={10}
      windowSize={21}
    />
  );
};

const Faceenrolled = ({ navigation }) => {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState(initialEmployeeData);
  const [searchText, setSearchText] = useState("");

  const [routes] = useState([
    { key: "rolled", title: "Rolled" },
    { key: "unrolled", title: "Unrolled" },
    { key: "processing", title: "Processing" },
  ]);

 const fetchEmployeeDataAndReturn = async (status, key, tempEmployeeData) => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      console.warn("⚠️ No token found!");
      return;
    }

    const cleanToken = token.startsWith("Bearer ")
      ? token.replace("Bearer ", "")
      : token;

    const url = `${BASE_URL}/Employee/GetEmployeesByStatus?status=${status}`;
    console.log("🌐 Fetching URL:", url);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${cleanToken}` },
    });

    console.log("🔹 Response status for", status, ":", response.status);

    const text = await response.text();
    console.log("🔍 Raw response for", status, ":", text);

    try {
      const json = JSON.parse(text);
      const data = json.data || [];
      tempEmployeeData[key] = data;
    } catch (e) {
      console.error(`❌ ${status} response not JSON:`, text.slice(0, 200));
      tempEmployeeData[key] = [];
    }
  } catch (err) {
    console.error(`${status} Data Fetch Error:`, err);
    tempEmployeeData[key] = [];
  }
};



  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    let tempEmployeeData = {};

    await Promise.all([
      fetchEmployeeDataAndReturn("Enrolled", "rolled", tempEmployeeData),
      fetchEmployeeDataAndReturn("Nonenrolled", "unrolled", tempEmployeeData),
      fetchEmployeeDataAndReturn("Inprogress", "processing", tempEmployeeData),
    ]);

    setEmployeeData(tempEmployeeData);
    requestAnimationFrame(() => {
      setIsLoading(false);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
      return () => {};
    }, [loadAllData])
  );

  console.log("employeeData",employeeData);
  

  // --- 🔍 Search Filter Logic ---
  const filteredData = useMemo(() => {
    if (!searchText.trim()) return employeeData;

    const lowerText = searchText.toLowerCase();

    const filterFunc = (item) =>
      item.employeeName?.toLowerCase().includes(lowerText) ||
      item.employeeId?.toString().includes(lowerText);

    return {
      rolled: employeeData.rolled.filter(filterFunc),
      unrolled: employeeData.unrolled.filter(filterFunc),
      processing: employeeData.processing.filter(filterFunc),
    };
  }, [searchText, employeeData]);

  // --- Render Scene ---
  const renderScene = ({ route }) => {
    switch (route.key) {
      case "rolled":
        return (
          <ListScreen
            data={filteredData.rolled}
            category="Rolled"
            navigation={navigation}
          />
        );
      case "unrolled":
        return (
          <ListScreen
            data={filteredData.unrolled}
            category="Unrolled"
            navigation={navigation}
          />
        );
      case "processing":
        return (
          <ListScreen
            data={filteredData.processing}
            category="Processing"
            navigation={navigation}
          />
        );
      default:
        return null;
    }
  };

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      indicatorStyle={styles.indicatorStyle}
      style={styles.tabBar}
      labelStyle={styles.labelStyle}
      activeColor="blue"
      inactiveColor="black"
    />
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="blue" />
        <Text style={styles.loadingText}>Loading employee data...</Text>
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

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
      />
    </View>
  );
};

export default Faceenrolled;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  tabBar: {
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  indicatorStyle: {
    backgroundColor: "blue",
    height: 3,
  },
  labelStyle: {
    fontWeight: "bold",
    fontSize: 14,
    textTransform: "none",
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
    height: "100%",
  },
  noDataText: {
    fontSize: 16,
    color: "#999",
  },
});
