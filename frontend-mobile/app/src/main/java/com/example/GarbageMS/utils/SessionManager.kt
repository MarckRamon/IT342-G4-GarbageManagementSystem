package com.example.GarbageMS.utils

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.util.Log
import androidx.fragment.app.FragmentActivity
import com.example.GarbageMS.LoginActivity
import com.example.GarbageMS.ui.SessionTimeoutDialog
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class SessionManager private constructor(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    private val editor: SharedPreferences.Editor = prefs.edit()
    private val appContext: Context = context.applicationContext
    private var tokenExpiryTimer: Handler? = null
    private var weakActivity: Activity? = null
    private val TAG = "SessionManager"
    private var sessionTimeoutJob: Job? = null
    private var sessionTimeoutDialogShown = false
    private var currentActivity: Activity? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    
    companion object {
        private const val PREF_NAME = "EcoTrackSessionPrefs"
        private const val TOKEN_KEY = "user_token"
        private const val USER_ID_KEY = "user_id"
        private const val USER_TYPE_KEY = "user_type"
        private const val TOKEN_EXPIRY = "token_expiry"
        private const val KEY_LAST_ACTIVITY = "last_activity"
        private const val SESSION_TIMEOUT = 3600L // 5 seconds for testing
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_FCM_TOKEN = "fcm_token"
        private const val KEY_IN_APP_NOTIFICATIONS = "in_app_notifications_enabled"
        private const val KEY_PUSH_NOTIFICATIONS = "push_notifications_enabled"
        private const val KEY_UNREAD_NOTIFICATION_COUNT = "unread_notification_count"
        private const val KEY_LAST_NOTIFICATION_COUNT_UPDATE = "last_notification_count_update"
        private const val KEY_NOTIFICATIONS_ENABLED = "notifications_enabled"
        
        // Keep a single instance to avoid multiple timers
        @Volatile
        private var instance: SessionManager? = null
        
        fun getInstance(context: Context): SessionManager {
            return instance ?: synchronized(this) {
                instance ?: SessionManager(context).also { instance = it }
            }
        }
    }
    
    // Current activity tracking
    fun getCurrentActivity(): Activity? {
        return currentActivity
    }
    
    fun setCurrentActivity(activity: Activity?) {
        this.currentActivity = activity
        Log.d(TAG, "Current activity set to: ${activity?.javaClass?.simpleName}")
        if (activity != null && !sessionTimeoutDialogShown) {
            resetSessionTimeout()
        }
    }
    
    fun saveToken(token: String) {
        editor.putString(TOKEN_KEY, token)
        
        // Calculate and store expiry time (30 minutes from now)
        val expiryTime = System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(30)
        editor.putLong(TOKEN_EXPIRY, expiryTime)
        
        editor.apply()
        
        Log.d(TAG, "Token saved, expires in 30 minutes")
        startExpiryTimer()
        
        // Extract userId from token if possible
        try {
            val userId = extractUserIdFromToken(token)
            if (userId != null) {
                saveUserId(userId)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to extract userId from token", e)
        }
    }
    
    fun getToken(): String? {
        return prefs.getString(TOKEN_KEY, null)
    }
    
    fun saveUserId(userId: String) {
        editor.putString(USER_ID_KEY, userId)
        editor.apply()
        Log.d(TAG, "UserId saved: $userId")
    }
    
    fun getUserId(): String {
        return prefs.getString(USER_ID_KEY, "") ?: ""
    }
    
    fun saveUserType(userType: String) {
        editor.putString(USER_TYPE_KEY, userType)
        editor.apply()
        Log.d(TAG, "User type saved: $userType")
    }
    
    fun getUserType(): String? {
        return prefs.getString(USER_TYPE_KEY, null)
    }
    
    fun isLoggedIn(): Boolean {
        val token = getToken()
        if (token == null) {
            return false
        }
        
        // Do a basic format check on the JWT token
        val parts = token.split(".")
        return parts.size == 3
    }
    
    fun logout() {
        Log.d(TAG, "Logging out user")
        cancelSessionTimeout()
        
        // Store reminder data temporarily
        val reminderData = mutableMapOf<String, Any?>()
        reminderData["reminder_title"] = prefs.getString("reminder_title", null)
        reminderData["reminder_message"] = prefs.getString("reminder_message", null)
        reminderData["reminder_date"] = prefs.getString("reminder_date", null)
        reminderData["reminder_schedule_id"] = prefs.getString("reminder_schedule_id", null)
        
        // Clear all preferences
        editor.clear()
        editor.apply()
        
        // Restore reminder data
        reminderData.forEach { (key, value) ->
            if (value != null) {
                editor.putString(key, value as String)
            }
        }
        editor.apply()
        
        sessionTimeoutDialogShown = false
        stopExpiryTimer()
    }
    
    // Notification preferences
    fun setNotificationsEnabled(enabled: Boolean) {
        editor.putBoolean(KEY_NOTIFICATIONS_ENABLED, enabled)
        editor.apply()
    }
    
    fun getNotificationsEnabled(): Boolean {
        return prefs.getBoolean(KEY_NOTIFICATIONS_ENABLED, true)
    }
    
    fun saveFCMToken(token: String) {
        editor.putString(KEY_FCM_TOKEN, token)
        editor.apply()
        Log.d(TAG, "FCM token saved")
    }
    
    fun getFCMToken(): String? {
        return prefs.getString(KEY_FCM_TOKEN, null)
    }
    
    // Notification count methods
    fun setUnreadNotificationCount(count: Int) {
        editor.putInt(KEY_UNREAD_NOTIFICATION_COUNT, count)
        editor.putLong(KEY_LAST_NOTIFICATION_COUNT_UPDATE, System.currentTimeMillis())
        editor.apply()
        Log.d(TAG, "Updated unread notification count: $count")
    }
    
    fun getUnreadNotificationCount(): Int {
        return prefs.getInt(KEY_UNREAD_NOTIFICATION_COUNT, -1)
    }
    
    fun getLastNotificationCountUpdateTime(): Long {
        return prefs.getLong(KEY_LAST_NOTIFICATION_COUNT_UPDATE, 0)
    }
    
    fun incrementUnreadNotificationCount() {
        val currentCount = getUnreadNotificationCount()
        if (currentCount >= 0) {
            setUnreadNotificationCount(currentCount + 1)
        } else {
            setUnreadNotificationCount(1)
        }
    }
    
    // Session timeout handling
    private fun cancelSessionTimeout() {
        Log.d(TAG, "Canceling session timeout timer")
        sessionTimeoutJob?.cancel()
        sessionTimeoutJob = null
    }
    
    private fun resetSessionTimeout() {
        if (sessionTimeoutDialogShown) {
            Log.d(TAG, "Session timeout dialog already shown, not resetting timer")
            return
        }
        
        cancelSessionTimeout()
        startSessionTimeout()
    }
    
    private fun startSessionTimeout() {
        if (!isLoggedIn()) {
            Log.d(TAG, "Not starting timer - user not logged in")
            return
        }
        
        Log.d(TAG, "Starting session timeout timer for $SESSION_TIMEOUT seconds")
        sessionTimeoutJob = CoroutineScope(Dispatchers.Main).launch {
            delay(TimeUnit.SECONDS.toMillis(SESSION_TIMEOUT))
            Log.d(TAG, "Session timeout reached")
            
            if (sessionTimeoutDialogShown) {
                Log.d(TAG, "Dialog already shown, not showing again")
                return@launch
            }
            
            // We'll logout after showing the dialog
            sessionTimeoutDialogShown = true
            showSessionTimeoutDialog()
        }
    }
    
    private fun showSessionTimeoutDialog() {
        Log.d(TAG, "Attempting to show session timeout dialog")
        
        // Run on the main thread
        mainHandler.post {
            try {
                // Use the current activity if available
                val activity = currentActivity
                if (activity != null && !activity.isFinishing && activity is FragmentActivity) {
                    try {
                        val fm = activity.supportFragmentManager
                        if (!fm.isDestroyed) {
                            // Check if dialog is already showing
                            val existingDialog = fm.findFragmentByTag(SessionTimeoutDialog.TAG)
                            if (existingDialog == null) {
                                val dialog = SessionTimeoutDialog.newInstance()
                                dialog.isCancelable = false
                                dialog.show(fm, SessionTimeoutDialog.TAG)
                                Log.d(TAG, "Dialog shown successfully on ${activity.javaClass.simpleName}")
                            } else {
                                Log.d(TAG, "Dialog already exists, not showing again")
                            }
                        } else {
                            Log.e(TAG, "FragmentManager is destroyed")
                            // Don't logout here, let the dialog handle it
                            navigateToLogin(activity)
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error showing dialog", e)
                        logout()
                        navigateToLogin(activity)
                    }
                } else {
                    Log.e(TAG, "No valid activity to show dialog, activity=${activity?.javaClass?.simpleName}, finishing=${activity?.isFinishing}")
                    logout()
                    navigateToLoginWithContext()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception showing dialog", e)
                logout()
                navigateToLoginWithContext()
            }
        }
    }
    
    private fun navigateToLogin(activity: Activity) {
        try {
            Log.d(TAG, "Navigating to login screen")
            val intent = Intent(activity, LoginActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            activity.startActivity(intent)
            activity.finish()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to navigate to login", e)
            navigateToLoginWithContext()
        }
    }
    
    private fun navigateToLoginWithContext() {
        try {
            Log.d(TAG, "Navigating to login with application context")
            val intent = Intent(appContext, LoginActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            appContext.startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to navigate to login with context", e)
        }
    }

    fun updateLastActivity() {
        if (!isLoggedIn()) {
            return
        }
        
        if (!sessionTimeoutDialogShown) {
            Log.d(TAG, "Updating last activity timestamp")
            editor.putLong(KEY_LAST_ACTIVITY, System.currentTimeMillis())
            editor.apply()
            resetSessionTimeout()
        } else {
            Log.d(TAG, "Session timeout dialog is shown, not updating activity")
        }
    }
    
    private fun extractUserIdFromToken(token: String): String? {
        try {
            val parts = token.split(".")
            if (parts.size == 3) {
                val payload = parts[1]
                val decodedBytes = Base64.decode(payload, Base64.URL_SAFE)
                val decodedString = String(decodedBytes)
                Log.d(TAG, "Decoded JWT payload: $decodedString")
                val jsonObject = JSONObject(decodedString)
                return if (jsonObject.has("userId")) {
                    val userId = jsonObject.getString("userId")
                    Log.d(TAG, "Extracted userId from token: $userId")
                    userId
                } else {
                    Log.w(TAG, "No userId field found in token payload")
                    null
                }
            } else {
                Log.w(TAG, "Invalid JWT format, expected 3 parts but got ${parts.size}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error extracting userId from token", e)
        }
        return null
    }
    
    private fun startExpiryTimer() {
        // Stop any existing timer first
        stopExpiryTimer()
        
        val expiryTime = prefs.getLong(TOKEN_EXPIRY, 0)
        val currentTime = System.currentTimeMillis()
        
        if (expiryTime <= currentTime) {
            Log.d(TAG, "Token already expired, logging out")
            logout()
            return
        }
        
        // For testing, use 5 seconds timeout
        val delayMillis = SESSION_TIMEOUT * 1000
        
        // Create a new timer with delay
        tokenExpiryTimer = Handler(Looper.getMainLooper())
        tokenExpiryTimer?.postDelayed({
            Log.d(TAG, "Token expired, logging out")
            logout()
            showSessionExpiredDialog()
        }, delayMillis)
        
        Log.d(TAG, "Expiry timer started: ${delayMillis}ms")
    }
    
    private fun stopExpiryTimer() {
        tokenExpiryTimer?.removeCallbacksAndMessages(null)
        tokenExpiryTimer = null
        Log.d(TAG, "Expiry timer stopped")
    }
    
    private fun showSessionExpiredDialog() {
        try {
            Log.d(TAG, "Attempting to show session timeout dialog")
            val activity = currentActivity
            
            if (activity != null && !activity.isFinishing && activity is FragmentActivity) {
                Log.d(TAG, "Current activity available: ${activity.javaClass.simpleName}")
                
                // Create and show the dialog
                val dialog = SessionTimeoutDialog.newInstance()
                dialog.show(activity.supportFragmentManager, SessionTimeoutDialog.TAG)
                
                Log.d(TAG, "Session timeout dialog shown")
            } else {
                Log.d(TAG, "No valid activity to show dialog, redirecting to login")
                
                // If no activity is available or it's not a FragmentActivity, just start the login activity
                val intent = Intent(appContext, LoginActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                appContext.startActivity(intent)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error showing session expired dialog", e)
        }
    }

    /**
     * Extracts the role field from the JWT token
     * @param token The JWT token to extract the role from
     * @return The role string or null if not found
     */
    fun extractRoleFromToken(token: String): String? {
        try {
            val parts = token.split(".")
            if (parts.size == 3) {
                val payload = parts[1]
                val decodedBytes = Base64.decode(payload, Base64.URL_SAFE)
                val decodedString = String(decodedBytes)
                Log.d(TAG, "Decoded JWT payload: $decodedString")
                
                val jsonObject = JSONObject(decodedString)
                return if (jsonObject.has("role")) {
                    val role = jsonObject.getString("role")
                    Log.d(TAG, "Extracted role from token: $role")
                    role
                } else {
                    Log.w(TAG, "No role field found in token payload")
                    null
                }
            } else {
                Log.w(TAG, "Invalid JWT format, expected 3 parts but got ${parts.size}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error extracting role from token", e)
        }
        return null
    }

    /**
     * Extracts the email field from the JWT token
     * @param token The JWT token to extract the email from
     * @return The email string or null if not found
     */
    fun extractEmailFromToken(token: String): String? {
        try {
            val parts = token.split(".")
            if (parts.size == 3) {
                val payload = parts[1]
                val decodedBytes = Base64.decode(payload, Base64.URL_SAFE)
                val decodedString = String(decodedBytes)
                Log.d(TAG, "Decoded JWT payload: $decodedString")
                
                val jsonObject = JSONObject(decodedString)
                return if (jsonObject.has("email")) {
                    val email = jsonObject.getString("email")
                    Log.d(TAG, "Extracted email from token: $email")
                    email
                } else {
                    Log.w(TAG, "No email field found in token payload")
                    null
                }
            } else {
                Log.w(TAG, "Invalid JWT format, expected 3 parts but got ${parts.size}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error extracting email from token", e)
        }
        return null
    }

    /**
     * Gets the email of the current logged-in user from the token
     * @return The email string or null if not found or not logged in
     */
    fun getUserEmail(): String? {
        // First try to get from SharedPreferences
        val savedEmail = prefs.getString(KEY_USER_EMAIL, null)
        if (!savedEmail.isNullOrEmpty()) {
            return savedEmail
        }
        
        // If not in SharedPreferences, try to get from token
        val token = getToken() ?: return null
        return extractEmailFromToken(token)
    }

    /**
     * Verifies the token with the backend server
     * This should be used when online connectivity is available
     * Returns true if offline or if the token is valid
     * @return true if the token is valid or if offline, false if online and token is invalid
     */
    suspend fun verifyTokenWithBackend(): Boolean {
        val token = getToken() ?: return false
        
        try {
            val apiService = ApiService.create()
            val response = apiService.verifyToken("Bearer $token")
            return response.isSuccessful && response.body() == true
        } catch (e: Exception) {
            Log.e(TAG, "Error verifying token with backend: ${e.message}", e)
            if (e is java.net.UnknownHostException || 
                e is java.net.ConnectException || 
                e is java.net.SocketTimeoutException) {
                // Network error, we're likely offline - consider token valid
                Log.d(TAG, "Network error during token verification, assuming offline and valid")
                return true
            }
            return false
        }
    }

    fun saveUserEmail(email: String) {
        editor.putString(KEY_USER_EMAIL, email)
        editor.apply()
        Log.d(TAG, "User email saved")
    }

    fun clearSession() {
        editor.clear()
        editor.apply()
        Log.d(TAG, "Session cleared")
    }

    // For backward compatibility with existing code
    fun setFCMToken(token: String) {
        saveFCMToken(token)
    }
    
    fun isInAppNotificationsEnabled(): Boolean {
        return getNotificationsEnabled()
    }
    
    fun isPushNotificationsEnabled(): Boolean {
        return getNotificationsEnabled()
    }
} 