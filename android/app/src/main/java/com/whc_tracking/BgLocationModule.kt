package com.whc_tracking

import android.content.Intent
import android.location.LocationManager
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.UiThreadUtil
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import org.json.JSONObject

class BgLocationModule(private val context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {

  override fun getName(): String = "BgLocationModule"

  @ReactMethod
  fun startService(promise: Promise) {
    try {
      val intent =
        Intent(context, BgLocationService::class.java).apply {
          action = BgLocationService.ACTION_START
        }
      ContextCompat.startForegroundService(context, intent)
      Log.d(TAG, "startService called from JS")
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("BG_SERVICE_START_FAILED", error)
    }
  }

  @ReactMethod
  fun stopService(promise: Promise) {
    try {
      val intent =
        Intent(context, BgLocationService::class.java).apply {
          action = BgLocationService.ACTION_STOP
        }
      context.startService(intent)
      Log.d(TAG, "stopService called from JS")
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("BG_SERVICE_STOP_FAILED", error)
    }
  }

  @ReactMethod
  fun getBufferedPoints(promise: Promise) {
    try {
      val stored = BgLocationStorage.getPoints(context)
      val array: WritableArray = Arguments.createArray()
      for (index in 0 until stored.length()) {
        val item = stored.optJSONObject(index) ?: JSONObject()
        val map = Arguments.createMap().apply {
          putString("id", item.optString("id"))
          putDouble("latitude", item.optDouble("latitude", 0.0))
          putDouble("longitude", item.optDouble("longitude", 0.0))
          if (item.has("accuracy") && !item.isNull("accuracy")) {
            putDouble("accuracy", item.optDouble("accuracy", 0.0))
          } else {
            putNull("accuracy")
          }
          putDouble("timestamp", item.optDouble("timestamp", 0.0))
          putString("source", item.optString("source"))
        }
        array.pushMap(map)
      }
      promise.resolve(array)
    } catch (error: Exception) {
      promise.reject("BG_POINTS_READ_FAILED", error)
    }
  }

  @ReactMethod
  fun clearBufferedPoints(promise: Promise) {
    try {
      BgLocationStorage.clearPoints(context)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("BG_POINTS_CLEAR_FAILED", error)
    }
  }

  @ReactMethod
  fun isLocationEnabled(promise: Promise) {
    try {
      val locationManager = context.getSystemService(LocationManager::class.java)
      if (locationManager == null) {
        promise.resolve(false)
        return
      }

      val enabled =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
          locationManager.isLocationEnabled
        } else {
          @Suppress("DEPRECATION")
          locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
            locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
        }
      promise.resolve(enabled)
    } catch (error: Exception) {
      promise.reject("BG_LOCATION_ENABLED_CHECK_FAILED", error)
    }
  }

  @ReactMethod
  fun setTrackingPipEnabled(enabled: Boolean, promise: Promise) {
    UiThreadUtil.runOnUiThread {
      try {
        val activity = reactApplicationContext.currentActivity as? MainActivity
        if (activity == null) {
          promise.resolve(false)
          return@runOnUiThread
        }
        activity.setTrackingPipEnabled(enabled)
        promise.resolve(true)
      } catch (error: Exception) {
        promise.reject("BG_PIP_STATE_FAILED", error)
      }
    }
  }

  @ReactMethod
  fun enterTrackingPip(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      try {
        val activity = reactApplicationContext.currentActivity as? MainActivity
        if (activity == null) {
          promise.resolve(false)
          return@runOnUiThread
        }
        promise.resolve(activity.enterTrackingPictureInPicture())
      } catch (error: Exception) {
        promise.reject("BG_PIP_ENTER_FAILED", error)
      }
    }
  }

  companion object {
    private const val TAG = "BGTRACK_NATIVE"
  }
}

