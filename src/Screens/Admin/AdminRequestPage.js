import { useEffect, useState } from "react"
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Buffer } from "buffer"
import FancyAlert from "../FancyAlert"
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';


const { width } = Dimensions.get("window")

const decodeJWT = (token) => {
  try {
    const payload = token.split(".")[1]
    return JSON.parse(Buffer.from(payload, "base64").toString("utf-8"))
  } catch {
    return null
  }
}

const formatDateForAPI = (dateString) => {
  const date = new Date(dateString)
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1, // JavaScript months are 0-indexed
    day: date.getDate(),
  }
}

export default function AdminRequestPage({ navigation, title, fetchUrl, updateUrl, mapItem, buildDetailsFields, buildPayload, }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState("success");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const showAlert = (type, title, message) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const filteredRequests = requests.filter((item) => {
    const status = item.status?.toLowerCase()
    if (activeTab === "pending") return status === "pending"
    if (activeTab === "approved") return status === "approved"
    if (activeTab === "reject") return status === "rejected"
    return true
  })

  const fetchRequests = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true)

      const token = await AsyncStorage.getItem("authToken")
      const headers = {
        "Content-Type": "application/json",
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const res = await fetch(fetchUrl, {
        headers: {
          Authorization: token,
        },
      })
      console.log("getItem:", res)

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      console.log("get Response:", data)

      // Process items with mapItem function (handle async mapping)
      const mappedRequests = []
      for (const item of data) {
        const mappedItem = await mapItem(item)
        mappedRequests.push(mappedItem)
      }

      setRequests(mappedRequests)
    } catch (error) {
      console.error("Fetch error:", error)
      Alert.alert("Error", "Failed to fetch requests. Please try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleStatusChange = async (item, newStatus) => {
    try {
      const token = await AsyncStorage.getItem("authToken")
      if (!token) {
        Alert.alert("Error", "Authentication token not found")
        return
      }



      const payload = buildPayload(item, newStatus)
      console.log("Update payload:", payload)

      const res = await fetch(updateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("Update response status:", res)

      if (res.ok) {
        showAlert("success", "Success", `Status ${newStatus.toLowerCase()} successfully.`);
        fetchRequests(false);
      } else {
        Alert.alert('Error', `Failed to update leave request status.`);
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchRequests(false)
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const renderRequest = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Image
          source={{ uri: item.avatar }}
          style={styles.avatar}
        // Add default avatar
        />
        <View style={styles.details}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.name}</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("AdminRequestDetails", {
                  title,
                  fields: buildDetailsFields(item),
                  onAccept: () => handleStatusChange(item, "Approved"),
                  onReject: () => handleStatusChange(item, "Rejected"),
                })
              }
            >
              <Text style={styles.viewDetails}>View Details</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.requested}>{item.subtitle}</Text>
        </View>
      </View>

      {item.status?.toLowerCase() === "pending" && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => handleStatusChange(item, "Approved")}>
            <Text style={styles.acceptText}>✓ Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => handleStatusChange(item, "Rejected")}>
            <Text style={styles.rejectText}>✗ Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>

  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#438aff" />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {["pending", "approved", "reject"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[activeTab === tab ? styles.tabActive : styles.tab, styles.tabFlex]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={activeTab === tab ? styles.tabActiveText : styles.tabText}>{tab.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredRequests.length === 0 ? (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No {activeTab} requests available</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#438aff"]} />}
          showsVerticalScrollIndicator={false}
        />
      )}
      <FancyAlert
        visible={alertVisible}
        // onClose={() => setAlertVisible(false)}
        onClose={() => {
          setAlertVisible(false);
          navigation.goBack();   // ✅ Go back after closing alert
        }}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: width * 0.04,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#9ca3af",
    fontWeight: "500",
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 15,
    justifyContent: "space-between",
  },
  tabFlex: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 3,
  },
  tab: {
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
  },
  tabActive: {
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#FFC043",
  },
  tabText: {
    color: "#438aff",
    fontWeight: "600",
  },
  tabActiveText: {
    color: "#212529",
    fontWeight: "600",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 100,
  },
  noDataText: {
    fontSize: 16,
    color: "#777",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    // shadowColor: "#212529",
    // shadowOpacity: 0.05,
    // shadowRadius: 5,
    // shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: 50,
  },
  details: {
    flex: 1,
    marginLeft: 10,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    color: "#212529",
    fontWeight: "500",
    fontSize: Math.max(wp("3.8%"), 14),

  },
  requested: {
    color: "#c6303e",
    fontSize: width * 0.035,
    marginTop: 2,
  },
  viewDetails: {
    color: "#438aff",
    fontWeight: "500",
    fontSize: width * 0.031,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  acceptBtn: {
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#44c144",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  rejectBtn: {
    flex: 1,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#c6303e",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  acceptText: {
    color: "#44c144",
    fontWeight: "600",
  },
  rejectText: {
    color: "#c6303e",
    fontWeight: "600",
  },
})
