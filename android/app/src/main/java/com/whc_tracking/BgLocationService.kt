package com.whc_tracking

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource

class BgLocationService : Service() {
  private lateinit var fusedLocationClient: FusedLocationProviderClient
  private val handler = Handler(Looper.getMainLooper())

  private var lastPointAtMs: Long = 0L
  private var updatesRunning = false

  private val locationCallback =
    object : LocationCallback() {
      override fun onLocationResult(result: LocationResult) {
        val location = result.lastLocation ?: return
        lastPointAtMs = System.currentTimeMillis()
        BgLocationStorage.appendLocation(applicationContext, location, "native-watch")
        Log.d(TAG, "POINT_SAVED source=native-watch ts=${location.time} lat=${location.latitude} lng=${location.longitude}")
      }
    }

  private val heartbeatRunnable =
    object : Runnable {
      override fun run() {
        if (!updatesRunning) {
          return
        }
        val now = System.currentTimeMillis()
        if (lastPointAtMs == 0L || now - lastPointAtMs > STALE_AFTER_MS) {
          requestSingleFallbackFix()
        }
        handler.postDelayed(this, HEARTBEAT_INTERVAL_MS)
      }
    }

  override fun onCreate() {
    super.onCreate()
    fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
    ensureNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> {
        stopTracking()
        stopSelf()
      }
      else -> {
        startForeground(NOTIFICATION_ID, buildNotification())
        startTracking()
      }
    }
    return START_STICKY
  }

  private fun startTracking() {
    if (!hasLocationPermission()) {
      Log.w(TAG, "Missing location permission, stopping service")
      stopSelf()
      return
    }

    if (updatesRunning) {
      return
    }

    val request =
      LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, UPDATE_INTERVAL_MS)
        .setMinUpdateIntervalMillis(MIN_UPDATE_INTERVAL_MS)
        .setMaxUpdateDelayMillis(UPDATE_INTERVAL_MS * 2)
        .build()

    try {
      fusedLocationClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper())
      updatesRunning = true
      lastPointAtMs = 0L
      handler.removeCallbacks(heartbeatRunnable)
      handler.postDelayed(heartbeatRunnable, HEARTBEAT_INTERVAL_MS)
      Log.d(TAG, "Foreground location updates started")
    } catch (error: SecurityException) {
      Log.e(TAG, "Failed to request location updates (permission)", error)
      stopSelf()
    } catch (error: Exception) {
      Log.e(TAG, "Failed to request location updates (runtime)", error)
      stopSelf()
    }
  }

  private fun stopTracking() {
    handler.removeCallbacks(heartbeatRunnable)
    if (updatesRunning) {
      fusedLocationClient.removeLocationUpdates(locationCallback)
      updatesRunning = false
    }
    Log.d(TAG, "Foreground location updates stopped")
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION")
      stopForeground(true)
    }
  }

  private fun requestSingleFallbackFix() {
    if (!hasLocationPermission()) {
      return
    }
    try {
      val tokenSource = CancellationTokenSource()
      fusedLocationClient
        .getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, tokenSource.token)
        .addOnSuccessListener { location: android.location.Location? ->
          if (location == null) {
            Log.w(TAG, "Fallback fix returned null")
            return@addOnSuccessListener
          }
          lastPointAtMs = System.currentTimeMillis()
          BgLocationStorage.appendLocation(applicationContext, location, "native-fallback")
          Log.d(
            TAG,
            "POINT_SAVED source=native-fallback ts=${location.time} lat=${location.latitude} lng=${location.longitude}",
          )
        }
        .addOnFailureListener { error: Exception ->
          Log.e(TAG, "Fallback fix error", error)
        }
    } catch (error: Exception) {
      Log.e(TAG, "Fallback fix request failed", error)
    }
  }

  private fun hasLocationPermission(): Boolean {
    val fineGranted =
      ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) ==
        PackageManager.PERMISSION_GRANTED
    val coarseGranted =
      ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) ==
        PackageManager.PERMISSION_GRANTED

    // Require at least foreground location; background is best-effort so that
    // the service doesn't immediately stop and crash flows while the user is
    // still interacting with permission dialogs.
    val hasForeground = fineGranted || coarseGranted
    if (!hasForeground) {
      return false
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      val bgGranted =
        ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_BACKGROUND_LOCATION) ==
          PackageManager.PERMISSION_GRANTED
      if (!bgGranted) {
        Log.w(
          TAG,
          "Background location not granted; service will run only while app is in foreground",
        )
      }
    }

    return true
  }

  private fun ensureNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val manager = getSystemService(NotificationManager::class.java) ?: return
    val channel =
      NotificationChannel(
        CHANNEL_ID,
        "Background location tracking",
        NotificationManager.IMPORTANCE_DEFAULT,
      ).apply {
        description = "Tracks route in background"
        setSound(null, null)
        enableVibration(false)
      }
    manager.createNotificationChannel(channel)
  }

  private fun buildNotification(): Notification {
    val openAppIntent = (
      packageManager.getLaunchIntentForPackage(packageName)?.apply {
        flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
      }
      ?: Intent(this, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
      }
    )
    val pendingIntent =
      PendingIntent.getActivity(
        this,
        1,
        openAppIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle("Tracking location")
      .setContentText("Background route tracking is active")
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setPriority(NotificationCompat.PRIORITY_DEFAULT)
      .setContentIntent(pendingIntent)
      .build()
  }

  override fun onDestroy() {
    stopTracking()
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  companion object {
    private const val TAG = "BGTRACK_NATIVE"
    const val ACTION_START = "com.whc_tracking.action.START"
    const val ACTION_STOP = "com.whc_tracking.action.STOP"
    private const val CHANNEL_ID = "bgtrack-native-service"
    private const val NOTIFICATION_ID = 1101
    private const val UPDATE_INTERVAL_MS = 5000L
    private const val MIN_UPDATE_INTERVAL_MS = 2000L
    private const val HEARTBEAT_INTERVAL_MS = 15000L
    private const val STALE_AFTER_MS = 45000L
  }
}

