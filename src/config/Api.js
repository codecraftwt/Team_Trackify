import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"

const Api = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_API_URL ||
    // "https://luckycrm-001-site1.ltempurl.com/",
    // "http://180.179.21.98:8082/",
    // "https://trackingapp-backend-6ny6.onrender.com",
    'http://10.0.2.2:5000',
  // 'https://trackingapp.instantwebsitedevelopment.com',

  headers: {
    "Content-Type": "application/json",
  },
})

export const setAuthToken = async (token) => {
  if (token) {
    Api.defaults.headers.common["Authorization"] = `Bearer ${token}`
    await AsyncStorage.setItem("token", token)
  } else {
    delete Api.defaults.headers.common["Authorization"]
    await AsyncStorage.removeItem("token")
  }
}

  // Initialize token from AsyncStorage
  ; (async () => {
    const token = await AsyncStorage.getItem("token")
    if (token) {
      setAuthToken(token)
    }
  })()

// Add a request interceptor (use authToken; app stores "Bearer <jwt>" there)
Api.interceptors.request.use(
  async (config) => {
    let token = await AsyncStorage.getItem("token")
    if (!token) token = await AsyncStorage.getItem("authToken")
    if (token) {
      config.headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

export const getRequest = (url, config = {}) => Api.get(url, config)
export const postRequest = (url, data, config = {}) => Api.post(url, data, config)
export const putRequest = (url, data, config = {}) => Api.put(url, data, config)
export const deleteRequest = (url, config = {}) => Api.delete(url, config)

export default Api