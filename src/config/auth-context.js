import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isPunchedIn, setIsPunchedIn] = useState(false)
  const [punchInTime, setPunchInTime] = useState(null)
  const [punchOutTime, setPunchOutTime] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [userId, setUserId] = useState(null)
  const [companyId, setCompanyId] = useState(null)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    loadPersistedAuthState()
  }, [])

  const loadPersistedAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken")
      const storedUserId = await AsyncStorage.getItem("userId")
      const storedCompanyId = await AsyncStorage.getItem("companyId")
      const storedUserRole = await AsyncStorage.getItem("userRole")
      const storedUserProfile = await AsyncStorage.getItem("userProfile")

      if (token && storedUserId && storedCompanyId && storedUserRole) {
        setIsAuthenticated(true)
        setUserId(storedUserId)
        setCompanyId(storedCompanyId)
        setUserRole(storedUserRole)
        if (storedUserProfile) {
          try {
            setUserProfile(JSON.parse(storedUserProfile))
          } catch {
            setUserProfile(null)
          }
        }
      }

      // ✅ Load Punch Data
      const storedDate = await AsyncStorage.getItem("punchInDate")
      const today = new Date().toISOString().split("T")[0]

      if (storedDate === today) {
        const inTime = await AsyncStorage.getItem("punchInTime")
        const outTime = await AsyncStorage.getItem("punchOutTime")

        if (inTime && !outTime) {
          setIsPunchedIn(true)
          setPunchInTime(inTime)
          setPunchOutTime(null)
        } else if (outTime) {
          setIsPunchedIn(false)
          setPunchOutTime(outTime)
        }
      } else {
        // New day → reset automatically
        setIsPunchedIn(false)
        setPunchInTime(null)
        setPunchOutTime(null)
        await AsyncStorage.multiRemove(["punchInDate", "punchInTime", "punchOutTime"])
      }
    } catch (error) {
      console.error("AuthContext: Error loading persisted auth state:", error)
    } finally {
      setIsLoading(false)
    }
  }


  const clearAuthData = async () => {
    console.log('AuthContext: Clearing auth data...');
    try {
      await AsyncStorage.multiRemove(["authToken", "userId", "companyId", "userRole",
        "isBreakActive","breakStartTime","lastBreakType","isWorkActive","workStartTime","activeWorkReason",
        "userProfile"
      ])
      setIsAuthenticated(false)
      setUserId(null)
      setCompanyId(null)
      setUserRole(null)
      setUserProfile(null)

    } catch (error) {
      console.error("AuthContext: Error clearing auth data:", error)
    }
  }

  const setAuthData = async (token, userId, companyId, role, userData = null) => {
    console.log('AuthContext: Setting auth data programmatically...');
    await AsyncStorage.setItem('authToken', `Bearer ${token}`);
    await AsyncStorage.setItem('userId', userId.toString());
    await AsyncStorage.setItem('companyId', companyId.toString());
    await AsyncStorage.setItem('userRole', role);
    setIsAuthenticated(true);
    setUserId(userId.toString());
    setCompanyId(companyId.toString());
    setUserRole(role);
    if (userData) {
      setUserProfile(userData);
      await AsyncStorage.setItem('userProfile', JSON.stringify(userData));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userRole,
        userId,
        companyId,
        userProfile,
        isPunchedIn,
        punchInTime,
        punchOutTime,
        setIsAuthenticated,
        setIsPunchedIn,
        setPunchInTime,
        setPunchOutTime,
        clearAuthData,
        setAuthData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
