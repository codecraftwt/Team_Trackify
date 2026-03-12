import { useEffect, useState } from "react"
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from "react-native"
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Buffer } from "buffer"
import BASE_URL from "../../config/server"
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen"

global.Buffer = global.Buffer || Buffer

const decodeJWT = (token) => {
  try {
    const payload = token.split(".")[1]
    return JSON.parse(Buffer.from(payload, "base64").toString("utf8"))
  } catch (e) {
    console.error("JWT decode error:", e)
    return null
  }
}

const DocumentScreen = () => {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem("authToken")
      if (!token) throw new Error("Auth token not found")
      const decoded = decodeJWT(token)
      const empId = decoded?.EmployeeId
      const response = await fetch(`${BASE_URL}/Employee/GetEmployeeDocumentByEmployeeID?employeeId=${empId}`, {
        headers: {
          Authorization: token,
        },
      })
      const text = await response.text()
      if (response.status === 404) {
        console.log("No documents found for employee")
        setDocuments([])
        return
      }

      if (!response.ok) throw new Error(`Error: ${response.status}`)

      const data = JSON.parse(text)
      const filtered = data.filter((doc) => doc.isActive && !doc.isDeleted)
      setDocuments(filtered)
    } catch (error) {
      console.error("Fetch Document Error:", error)
      Alert.alert("Error", error.message || "Failed to load documents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>Document </Text>
        <Text style={styles.value}>{item.document}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Note</Text>
        <Text style={styles.value}>{item.note || "-"}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Submit Date</Text>
        <Text style={styles.value}>{new Date(item.submitDate).toLocaleDateString()}</Text>
      </View>

      {/* <TouchableOpacity style={styles.downloadButton}>
        <Icon name="file-download" size={wp('5%')} color="#fff" />
        <Text style={styles.downloadText}>Download</Text>
      </TouchableOpacity> */}
    </View>
  )

  return (
    <View style={styles.container}>
      {/* <Text style={styles.sectionTitle}>My Documents</Text> */}
      {loading ? (
        <ActivityIndicator size="large" color="#0189c7" style={{ marginTop: hp("2%") }} />
      ) : (
        !loading && documents.length === 0 ? (
          <View style={{ marginTop: hp("5%"), alignItems: "center" }}>
            <Text style={{ fontSize: wp("4%"), color: "#212529" }}>
              No documents added
            </Text>
          </View>
        ) : (
          <FlatList
            data={documents}
            keyExtractor={(item) => item.employeeDocumentId.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: hp("2%") }}
             showsVerticalScrollIndicator={false}
          />
        )

      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: wp("4%"),
  },
  sectionTitle: {
    fontSize: wp("4.2%"),
    fontWeight: "bold",
    marginVertical: hp("1%"),
    color: "#000",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: wp("2%"),
    padding: wp("3%"),
 
    borderWidth: 1,
 borderColor: "#E5E7EB",
    marginBottom: hp("1%"),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: hp("1%"),
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  label: {
    flex: 1,
    fontSize: wp("3.5%"),
    fontWeight: "400",
    color: "#374151",
  },
  value: {
    flex: 1,
    fontSize: wp("3.5%"),
    fontWeight: "500",
    color: "#212529",
    textAlign: "right",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0189c7",
    padding: wp("2.5%"),
    borderRadius: wp("1.5%"),
    marginTop: hp("1.5%"),
    alignSelf: "flex-start",
  },
  downloadText: {
    color: "#fff",
    marginLeft: wp("2%"),
    fontWeight: "600",
    fontSize: wp("3.5%"),
  },
})

export default DocumentScreen
