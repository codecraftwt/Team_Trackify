package com.whc_tracking

import android.content.Context
import android.location.Location
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale

object BgLocationStorage {
  private const val PREFS_NAME = "bgtrack_native_location"
  private const val KEY_POINTS = "points"
  private const val MAX_POINTS = 5000

  private fun getPrefs(context: Context) =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  @Synchronized
  fun getPoints(context: Context): JSONArray {
    val raw = getPrefs(context).getString(KEY_POINTS, "[]") ?: "[]"
    return try {
      JSONArray(raw)
    } catch (_: Exception) {
      JSONArray()
    }
  }

  @Synchronized
  fun clearPoints(context: Context) {
    getPrefs(context).edit().putString(KEY_POINTS, "[]").apply()
  }

  @Synchronized
  fun appendLocation(context: Context, location: Location, source: String) {
    val timestamp = if (location.time > 0) location.time else System.currentTimeMillis()
    val latitude = location.latitude
    val longitude = location.longitude
    val accuracy = if (location.hasAccuracy()) location.accuracy.toDouble() else JSONObject.NULL
    val id =
      "$timestamp-${String.format(Locale.US, "%.6f", latitude)}-" +
        "${String.format(Locale.US, "%.6f", longitude)}-${location.elapsedRealtimeNanos}"

    val point = JSONObject().apply {
      put("id", id)
      put("latitude", latitude)
      put("longitude", longitude)
      put("accuracy", accuracy)
      put("timestamp", timestamp)
      put("source", source)
    }

    val current = getPoints(context)
    val next = JSONArray()
    next.put(point)

    for (i in 0 until current.length()) {
      if (next.length() >= MAX_POINTS) {
        break
      }
      val existing = current.optJSONObject(i) ?: continue
      if (existing.optString("id") == id) {
        continue
      }
      next.put(existing)
    }

    getPrefs(context).edit().putString(KEY_POINTS, next.toString()).apply()
  }

}

