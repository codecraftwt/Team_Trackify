package com.whc_tracking

import android.app.PictureInPictureParams
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.os.Build
import android.util.Rational
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
  @Volatile private var trackingPipEnabled: Boolean = false

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "WHC_Tracking"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onUserLeaveHint() {
    super.onUserLeaveHint()
    if (trackingPipEnabled) {
      enterTrackingPictureInPicture()
    }
  }

  override fun onPictureInPictureModeChanged(
    isInPictureInPictureMode: Boolean,
    newConfig: Configuration,
  ) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
    Log.d(TAG, "PiP mode changed: $isInPictureInPictureMode")
  }

  fun setTrackingPipEnabled(enabled: Boolean) {
    trackingPipEnabled = enabled
  }

  fun enterTrackingPictureInPicture(): Boolean {
    if (!isPipSupported() || isInPictureInPictureMode || !trackingPipEnabled) {
      return false
    }

    return try {
      val params =
        PictureInPictureParams.Builder()
          .setAspectRatio(Rational(16, 9))
          .build()
      enterPictureInPictureMode(params)
    } catch (error: Exception) {
      Log.w(TAG, "Unable to enter PiP", error)
      false
    }
  }

  private fun isPipSupported(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return false
    }
    return packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)
  }

  companion object {
    private const val TAG = "MainActivityPiP"
  }     
}
