import messaging from "@react-native-firebase/messaging"
import notifee, { AndroidImportance, EventType } from "@notifee/react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform, AppState, Alert, PermissionsAndroid } from "react-native"

const CHANNEL_ID = "high_priority_channel"

class NotificationManager {
  constructor() {
    this.foregroundListener = null
    this.isInitialized = false
    this.isLoggedIn = false
    this.currentUserId = null // Track current user
    this.appState = AppState.currentState
    this.processedNotifications = new Set()
    this.bannerCallback = null
  }

  setBannerCallback(callback) {
    this.bannerCallback = callback
  }

//   async initialize() {
//     if (this.isInitialized) return

//     console.log("🔔 Initializing NotificationManager...")

//     await this.requestPermission()
//     this.setupNotificationChannel()
//     this.setupBackgroundHandler()
//     this.handleInitialNotification()
//     this.setupAppStateListener()
//     this.setupForegroundEventHandler()

//     this.isInitialized = true
//     console.log("✅ NotificationManager initialized")
//   }

async initialize() {
    if (this.isInitialized) return

    console.log("🔔 Initializing NotificationManager...")

    const permissionStatus = await this.requestPermission()
    if (permissionStatus) {
      this.setupNotificationChannel()
      this.setupBackgroundHandler()
      this.handleInitialNotification()
      this.setupAppStateListener()
      this.setupForegroundEventHandler()
    } else {
      console.warn("❌ Notification permissions were denied. Core notification features will be disabled.")
    }

    this.isInitialized = true
    console.log("✅ NotificationManager initialized")
    return permissionStatus
  }

//   async requestPermission() {
//     if (Platform.OS === "android") {
//       if (Platform.Version >= 33) {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
//         )
//         console.log("Android permission status:", granted)
//       }
//     }

//     const settings = await notifee.requestPermission()
//     console.log("Notifee permission settings:", settings)
//   }

async requestPermission() {
    try {
      if (Platform.OS === "android") {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          )
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log("Android permission denied.")
            return false
          }
        }
      }

      const settings = await notifee.requestPermission()
      console.log("Notifee permission settings:", settings)
      return settings.authorizationStatus === 1 // 1 means authorized on iOS
    } catch (error) {
      console.error("Error requesting notification permissions:", error)
      return false
    }
  }

  setupAppStateListener() {
    AppState.addEventListener("change", (nextAppState) => {
      console.log("📱 App state changed from", this.appState, "to", nextAppState)
      this.appState = nextAppState

      if (nextAppState === "active") {
        this.processedNotifications.clear()
      }
    })
  }

  async startNotifications(userId) {
    console.log("🔔 Starting notifications for user:", userId)

    if (this.currentUserId && this.currentUserId !== userId) {
      console.log("🔄 Different user logging in, stopping previous user notifications:", this.currentUserId)
      await this.stopNotifications(this.currentUserId)
    }

    this.isLoggedIn = true
    this.currentUserId = userId

    this.startForegroundListener()
    await this.registerDeviceToken(userId)
  }

  async stopNotifications(userId = null) {
    const userToStop = userId || this.currentUserId
    console.log("🔕 Stopping notifications for user:", userToStop)

    this.isLoggedIn = false
    this.currentUserId = null

    this.stopForegroundListener()

    if (userToStop) {
      await this.unregisterDeviceToken(userToStop)
    }

    // Clear all local notifications
    await notifee.cancelAllNotifications()
    this.processedNotifications.clear()

    // Clear pending notifications from storage
    try {
      await AsyncStorage.removeItem("pendingNotifications")
      console.log("✅ Cleared pending notifications from storage")
    } catch (error) {
      console.error("❌ Error clearing pending notifications:", error)
    }
  }

  setupNotificationChannel() {
    notifee.createChannel({
      id: CHANNEL_ID,
      name: "High Priority Notifications",
      description: "Channel for urgent CRM messages and alerts",
      importance: AndroidImportance.HIGH,
      sound: "default",
      vibrate: true,
      largeIcon: "notification_icon",
      smallIcon: "notification_icon",
    })
    console.log(`Channel '${CHANNEL_ID}' created`)
  }

  startForegroundListener() {
    if (this.foregroundListener) {
      console.log("🔄 Stopping existing foreground listener before starting new one")
      this.stopForegroundListener()
    }

    console.log("🔔 Starting foreground message listener")

    this.foregroundListener = messaging().onMessage(async (remoteMessage) => {
      console.log("📱 FCM Message Received (Foreground):", remoteMessage)

      if (!this.isLoggedIn || !this.currentUserId) {
        console.log("🔕 User not logged in or no current user, ignoring foreground notification")
        return
      }

      const notificationId = `${remoteMessage.messageId || Date.now()}-${remoteMessage.notification?.title || ""}`

      if (this.processedNotifications.has(notificationId)) {
        console.log("🔄 Duplicate notification detected, skipping:", notificationId)
        return
      }

      this.processedNotifications.add(notificationId)

      const title = remoteMessage.notification?.title || "Notification"
      const body = remoteMessage.notification?.body || "New message"
      const data = remoteMessage.data || {}

      console.log("🔔 Processing foreground notification for user:", this.currentUserId, { title, body, data })

      this.showBanner(title, body, data)
      this.showLocalNotification(title, body, data)
    })
  }

  showBanner(title, message, data) {
    console.log("🔔 showBanner called with:", { title, message, data })

    if (this.bannerCallback) {
      console.log("📱 Showing notification banner:", { title, message })
      this.bannerCallback({
        visible: true,
        title,
        message,
        onPress: () => {
          console.log("Banner pressed")
          this.handleNotificationNavigation(data)
        },
        onDismiss: () => {
          console.log("Banner dismissed")
        },
      })
    } else {
      console.warn("Banner callback not set, falling back to alert")
      Alert.alert(title, message)
    }
  }

  stopForegroundListener() {
    if (this.foregroundListener) {
      console.log("🔕 Stopping foreground message listener")
      this.foregroundListener()
      this.foregroundListener = null
    }
  }

  setupForegroundEventHandler() {
    return notifee.onForegroundEvent(({ type, detail }) => {
      console.log("Notifee Foreground Event:", type, detail)
      switch (type) {
        case EventType.DISMISSED:
          console.log("User dismissed notification", detail.notification)
          break
        case EventType.PRESS:
          console.log("User pressed notification", detail.notification)
          this.handleNotificationNavigation(detail.notification.data)
          break
      }
    })
  }

  setupBackgroundHandler() {
    // Notifee's onBackgroundEvent handles both background and quit states
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      const { notification } = detail
      console.log("📱 Notifee Background Event:", type, notification)

      if (type === EventType.PRESS && notification) {
        console.log("User pressed notification from background/quit state")
        // Handle navigation here if the app is opened
        this.handleNotificationNavigation(notification.data)
      }
    })

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("📱 FCM Background message received:", remoteMessage)
      await this.storeNotificationForLater(remoteMessage)
    })
  }

  async storeNotificationForLater(remoteMessage) {
    try {
      const existingNotifications = await AsyncStorage.getItem("pendingNotifications")
      const notifications = existingNotifications ? JSON.parse(existingNotifications) : []

      notifications.push({
        ...remoteMessage,
        receivedAt: new Date().toISOString(),
      })

      const recentNotifications = notifications.slice(-10)
      await AsyncStorage.setItem("pendingNotifications", JSON.stringify(recentNotifications))
    } catch (error) {
      console.error("Error storing notification:", error)
    }
  }

  handleInitialNotification() {
    notifee.getInitialNotification().then((initialNotification) => {
      if (initialNotification) {
        console.log("App opened from notification (killed state):", initialNotification.notification)
        setTimeout(() => {
          this.handleNotificationNavigation(initialNotification.notification.data)
        }, 2000)
      }
    })
  }

  async showLocalNotification(title, message, data = {}) {
    console.log("📱 Showing local notification with Notifee")
    await notifee.displayNotification({
      title,
      body: message,
      data: data,
      android: {
        channelId: CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        smallIcon: "notification_icon",
        largeIcon: "notification_icon",
        pressAction: {
          id: "default",
        },
      },
      ios: {
        sound: "default",
      },
    })
  }

//   async getFCMToken() {
//     try {
//       let token = await AsyncStorage.getItem("fcmToken")

//       if (token) {
//         console.log("FCM Token found in AsyncStorage:", token)
//         return token
//       }

//       const isRegistered = messaging().isDeviceRegisteredForRemoteMessages
//       if (!isRegistered) {
//         await messaging().registerDeviceForRemoteMessages()
//       }

//       token = await messaging().getToken()

//       if (token) {
//         await AsyncStorage.setItem("fcmToken", token)
//         console.log("FCM Token obtained and saved:", token)
//         return token
//       }

//       return null
//     } catch (error) {
//       console.error("Error getting FCM Token:", error)
//       return null
//     }
//   }

// async getFCMToken() {
//     try {
//       // Check for existing token in AsyncStorage first
//       let token = await AsyncStorage.getItem("fcmToken")

//       if (token) {
//         console.log("FCM Token found in AsyncStorage:", token)
//         return token
//       }

//       // Check if the device has permission before trying to get a new token
//       const hasPermission = await messaging().hasPermission()
//       if (hasPermission === -1 || hasPermission === 0) {
//         console.log("FCM permission denied or not determined, cannot get token.")
//         return null
//       }

//       // If permission is granted, proceed to register and get the token
//       const isRegistered = messaging().isDeviceRegisteredForRemoteMessages
//       if (!isRegistered) {
//         await messaging().registerDeviceForRemoteMessages()
//       }

//       token = await messaging().getToken()

//       if (token) {
//         await AsyncStorage.setItem("fcmToken", token)
//         console.log("FCM Token obtained and saved:", token)
//         return token
//       }

//       return null
//     } catch (error) {
//       console.error("Error getting FCM Token:", error)
//       return null
//     }
//   }
// In NotificationManager.js
async getFCMToken() {
  try {
    let token = await AsyncStorage.getItem("fcmToken")
    if (token) {
      console.log("FCM Token found in AsyncStorage:", token)
      return token
    }

    // Ensure device registered (needed on iOS and newer Android)
    const isRegistered = messaging().isDeviceRegisteredForRemoteMessages
    if (!isRegistered) {
      await messaging().registerDeviceForRemoteMessages()
    }

    token = await messaging().getToken()
    if (token) {
      await AsyncStorage.setItem("fcmToken", token)
      console.log("FCM Token obtained and saved:", token)
      return token
    }
    return null
  } catch (error) {
    console.error("Error getting FCM Token:", error)
    return null
  }
}

 // NotificationManager.js
async registerDeviceToken(userId) {
  const fcmToken = await this.getFCMToken()

  if (!fcmToken || !userId) {
    console.warn("Cannot register device token: missing FCM token or userId")
    return false
  }

  // Build payload exactly once and log it
  const payload = {
    userId: userId,                   // verify: GUID vs int (match Postman)
    deviceToken: fcmToken,            // verify: correct key name
    deviceType: Platform.OS,          // if API expects "Android"/"iOS", consider capitalizing
    appVersion: "version3",           // verify exact value matches Postman
    isActive: true,
  }

  console.log("[v0] Register payload:", payload)

  try {
    const headers = {
      "Content-Type": "application/json",
      // If Postman uses a Bearer token, you MUST include it here:
      // ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    console.log("[v0] Register headers:", headers)

    const response = await fetch("http://180.179.21.98:8087/api/NotificationDevice", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    // Always read the body, success or not
    const rawText = await response.text()
    let body
    try {
      body = JSON.parse(rawText)
    } catch {
      body = rawText
    }

    console.log("[v0] Register status:", response.status)
    console.log("[v0] Register body:", body)

    if (response.ok) {
      console.log("✅ Device token registered successfully for user:", userId)
      return true
    } else {
      console.error("❌ Failed to register device token:", response.status, body)
      return false
    }
  } catch (error) {
    console.error("❌ Network error registering device token:", error)
    return false
  }
}

  async unregisterDeviceToken(userId) {
    const fcmToken = await AsyncStorage.getItem("fcmToken")

    if (!fcmToken || !userId) {
      console.warn("Cannot unregister device token: missing FCM token or userId")
      return
    }

    try {
      console.log("📝 Unregistering device token for user:", userId)
      const response = await fetch("http://180.179.21.98:8087/api/NotificationDevice", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          deviceToken: fcmToken,
          deviceType: Platform.OS,
          appVersion: "version3",
          
        }),
      })

      if (response.ok) {
        console.log("✅ Device token unregistered successfully for user:", userId)
      } else {
        const errorText = await response.text()
        console.error("❌ Failed to unregister device token:", response.status, errorText)
      }
    } catch (error) {
      console.error("❌ Network error unregistering device token:", error)
    }
  }

  handleNotificationNavigation(data) {
    console.log("🔗 Handling notification navigation with data:", data)

    if (data?.leadId) {
      console.log("Should navigate to lead:", data.leadId)
    }

    if (data?.screen) {
      console.log("Should navigate to screen:", data.screen)
    }
  }

  async getPendingNotifications() {
    try {
      const notifications = await AsyncStorage.getItem("pendingNotifications")
      return notifications ? JSON.parse(notifications) : []
    } catch (error) {
      console.error("Error getting pending notifications:", error)
      return []
    }
  }

  async clearPendingNotifications() {
    try {
      await AsyncStorage.removeItem("pendingNotifications")
    } catch (error) {
      console.error("Error clearing pending notifications:", error)
    }
  }

  testBanner() {
    console.log("🧪 Testing banner display...")
    this.showBanner("Test Notification", "This is a test message", {})
  }
}

export default new NotificationManager()