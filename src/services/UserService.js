import AsyncStorage from "@react-native-async-storage/async-storage"
import BASE_URL from "../config/server"

/**
 * Update user profile. Avatar is optional.
 * @param {string} userId - User ID
 * @param {object} data - { name, email, mobile_no, address, isActive }
 * @param {string} [avatarUri] - Optional local file URI from image picker
 * @returns {Promise<object>}
 */
export const updateUser = async (userId, data, avatarUri = null) => {
  const token = await AsyncStorage.getItem("authToken")
  const cleanToken = token?.replace("Bearer ", "") || ""

  const payload = {
    name: data.name || "",
    email: data.email || "",
    mobile_no: data.mobile_no || "",
    address: data.address || "",
    isActive: data.isActive !== false,
  }

  let options

  if (avatarUri) {
    const formData = new FormData()
    formData.append("name", payload.name)
    formData.append("email", payload.email)
    formData.append("mobile_no", payload.mobile_no)
    formData.append("address", payload.address)
    formData.append("isActive", String(payload.isActive))

    const filename = avatarUri.split("/").pop() || "avatar.jpg"
    const match = /\.(\w+)$/.exec(filename)
    const type = match ? `image/${match[1]}` : "image/jpeg"
    formData.append("file", {
      uri: avatarUri,
      name: filename,
      type,
    })

    options = {
      method: "patch",
      headers: { Authorization: `Bearer ${cleanToken}` },
      body: formData,
    }
  } else {
    options = {
      method: "patch",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cleanToken}`,
      },
      body: JSON.stringify(payload),
    }
  }

  const response = await fetch(`${BASE_URL}/api/users/updateuser/${userId}`, options)
  const resultText = await response.text()

  if (!response.ok) {
    let errMsg = "Update failed"
    try {
      const err = resultText ? JSON.parse(resultText) : {}
      errMsg = err.message || err.error || resultText || errMsg
    } catch {
      errMsg = resultText || errMsg
    }
    throw new Error(errMsg)
  }

  try {
    return resultText ? JSON.parse(resultText) : {}
  } catch {
    return {}
  }
}
