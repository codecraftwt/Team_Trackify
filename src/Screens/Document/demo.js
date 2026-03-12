import { useState } from "react"
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from "react-native"
import { launchCamera, launchImageLibrary } from "react-native-image-picker"

// Update API URL to point to your local Node.js server
const API_URL = "http://192.168.0.179:3000"

export default function App() {
  const [capturedImage, setCapturedImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState("compare") // 'add' or 'compare'
  const [userName, setUserName] = useState("")
  const [result, setResult] = useState(null)

  const openCamera = () => {
    const options = {
      mediaType: "photo",
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    }

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log("User cancelled camera")
      } else if (response.errorCode) {
        console.log("Camera Error: ", response.errorMessage)
        Alert.alert("Error", `Camera Error: ${response.errorMessage}`)
      } else {
        // Use the image from the response
        const source = { uri: response.assets[0].uri }
        setCapturedImage(source.uri)
        setResult(null)
      }
    })
  }

  const openGallery = () => {
    const options = {
      mediaType: "photo",
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    }

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker")
      } else if (response.errorCode) {
        console.log("ImagePicker Error: ", response.errorMessage)
        Alert.alert("Error", `ImagePicker Error: ${response.errorMessage}`)
      } else {
        // Use the image from the response
        const source = { uri: response.assets[0].uri }
        setCapturedImage(source.uri)
        setResult(null)
      }
    })
  }

  // In your uploadImage function in app.js
const uploadImage = async () => {
  if (!capturedImage) {
    Alert.alert("Error", "Please select or capture an image first")
    return
  }

  setLoading(true)
  setResult(null)

  try {
    // Create form data
    const formData = new FormData()

    // Get file name from URI
    const uriParts = capturedImage.split("/")
    const fileName = uriParts[uriParts.length - 1]

    // Append the image to form data with key 'image' for our Node.js server
    formData.append("image", {
      uri: capturedImage,
      type: "image/jpeg",
      name: fileName || "face.jpg",
    })

    // If in add mode, append the name
    if (mode === "add") {
      if (!userName.trim()) {
        Alert.alert("Error", "Please enter a username")
        setLoading(false)
        return
      }
      formData.append("name", userName)
    }

    // Determine which endpoint to use based on our Node.js server
    const endpoint = mode === "add" ? "/save-face" : "/compare-face"
    
    console.log("Sending request to:", `${API_URL}${endpoint}`)

    // Send request to API
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    const responseData = await response.json()
    console.log("Response:", responseData)

    if (response.ok) {
      setResult(responseData)
      if (mode === "add") {
        Alert.alert("Success", responseData.message || "Face registered successfully")
      } else {
        // For compare mode
        if (responseData.match) {
          Alert.alert(
            "Match Found", 
            `Matched with: ${responseData.match}\nConfidence: ${responseData.confidence?.toFixed(2)}%`
          )
        } else if (responseData.possibleMatch) {
          // Low confidence match
          Alert.alert(
            "No Reliable Match", 
            `Possible match: ${responseData.possibleMatch}\nConfidence: ${responseData.confidence?.toFixed(2)}%\n\nThis confidence level is too low for a reliable match.`
          )
        } else {
          Alert.alert("No Match", responseData.message || "No matching face found")
        }
      }
    } else {
      Alert.alert("Error", responseData.message || "Something went wrong")
    }
  } catch (error) {
    console.log("Error uploading image:", error)
    Alert.alert("Error", "Failed to upload image. Check your network connection and make sure the server is running.")
  } finally {
    setLoading(false)
  }
}

  const resetImage = () => {
    setCapturedImage(null)
    setResult(null)
  }

  const toggleMode = () => {
    setMode(mode === "add" ? "compare" : "add")
    setResult(null)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Face Recognition Attendance</Text>
          <TouchableOpacity style={styles.modeButton} onPress={toggleMode}>
            <Text style={styles.modeButtonText}>Mode: {mode === "add" ? "Register Face" : "Mark Attendance"}</Text>
          </TouchableOpacity>
        </View>

        {capturedImage ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedImage }} style={styles.preview} resizeMode="cover" />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={resetImage}>
                <Text style={styles.buttonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.uploadButton]} onPress={uploadImage} disabled={loading}>
                <Text style={styles.buttonText}>{mode === "add" ? "Register" : "Verify"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.imagePickerContainer}>
            <Text style={styles.pickerTitle}>Select Image Source</Text>
            <View style={styles.pickerButtonRow}>
              <TouchableOpacity style={styles.pickerButton} onPress={openCamera}>
                <Text style={styles.pickerButtonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerButton} onPress={openGallery}>
                <Text style={styles.pickerButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {mode === "add" && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username:</Text>
            <TextInput
              style={styles.input}
              value={userName}
              onChangeText={setUserName}
              placeholder="Enter username"
              autoCapitalize="none"
            />
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}

     {result && (
  <View style={styles.resultContainer}>
    <Text style={styles.resultTitle}>Result:</Text>
    {mode === "compare" ? (
      <View style={[
        styles.matchResult, 
        { backgroundColor: result.match ? "#E8F5E9" : result.possibleMatch ? "#FFF8E1" : "#FFEBEE" }
      ]}>
        <Text style={[
          styles.matchText, 
          { 
            color: result.match ? "#2E7D32" : 
                  result.possibleMatch ? "#F57C00" : "#C62828" 
          }
        ]}>
          {result.match ? `Matched: ${result.match}` : 
           result.possibleMatch ? `Possible match: ${result.possibleMatch}` : 
           result.message}
        </Text>
        {(result.match || result.possibleMatch) && result.confidence && (
          <Text style={[
            styles.confidenceText,
            { 
              color: result.confidence > 90 ? "#2E7D32" : 
                    result.confidence > 70 ? "#F57C00" : "#C62828",
              fontWeight: "bold"
            }
          ]}>
            Confidence: {result.confidence.toFixed(2)}%
            {result.confidence < 70 && " (Too low for reliable match)"}
          </Text>
        )}
      </View>
    ) : (
      <Text style={styles.resultText}>
        {result.message || "Face registered successfully"}
      </Text>
    )}
  </View>
)}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  modeButton: {
    backgroundColor: "#673AB7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  imagePickerContainer: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  pickerButtonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  pickerButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  pickerButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  previewContainer: {
    width: "100%",
    height: 400,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#e0e0e0",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  buttonRow: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    backgroundColor: "#FF5722",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  uploadButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 20,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  resultContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  resultText: {
    fontSize: 16,
    color: "#666",
  },
  matchResult: {
    padding: 12,
    borderRadius: 8,
  },
  matchText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
})