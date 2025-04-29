package com.example.GarbageMS

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.ImageButton
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.example.GarbageMS.databinding.ActivitySettingsBinding
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import com.example.GarbageMS.BuildConfig
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import okhttp3.OkHttpClient
import okhttp3.Request

class SettingsActivity : BaseActivity() {
    private lateinit var binding: ActivitySettingsBinding
    private val TAG = "SettingsActivity"
    
    // Track the state of notifications
    private var inAppNotificationsEnabled = true
    private var pushNotificationsEnabled = true

    // Request notification permission launcher
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            // Permission granted, enable FCM
            enableFCM()
        } else {
            // Permission denied, update UI accordingly
            pushNotificationsEnabled = false
            updatePushToggleUI()
            Toast.makeText(this, "Notification permission denied", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Set up back button
        findViewById<ImageButton>(R.id.backButton).setOnClickListener {
            finish()
        }

        // Initialize notification states from SessionManager
        inAppNotificationsEnabled = sessionManager.isInAppNotificationsEnabled()
        pushNotificationsEnabled = sessionManager.isPushNotificationsEnabled()

        // Initialize toggle UI
        updateInAppToggleUI()
        updatePushToggleUI()

        // Set up click listeners for toggle containers
        setupToggleListeners()
        
        // Display app version
        try {
            val packageInfo = packageManager.getPackageInfo(packageName, 0)
            binding.appVersionValue.text = packageInfo.versionName
        } catch (e: Exception) {
            binding.appVersionValue.text = "Unknown"
            Log.e(TAG, "Error getting app version", e)
        }
        
        // Set up save button
        binding.saveButton.setOnClickListener {
            saveNotificationPreferences()
        }

        // Check notification permission
        checkNotificationPermission()
    }

    private fun setupToggleListeners() {
        // In-app notifications toggle
        binding.inAppSwitchContainer.setOnClickListener {
            // Toggle the state
            inAppNotificationsEnabled = !inAppNotificationsEnabled
            updateInAppToggleUI()
            Log.d(TAG, "In-app notifications toggled: $inAppNotificationsEnabled")
        }

        // Push notifications toggle
        binding.pushSwitchContainer.setOnClickListener {
            if (!pushNotificationsEnabled) {
                // If notifications are disabled, request permission
                checkNotificationPermission()
            } else {
                // Toggle the state
                pushNotificationsEnabled = !pushNotificationsEnabled
                updatePushToggleUI()
                if (!pushNotificationsEnabled) {
                    // Disable FCM
                    disableFCM()
                } else {
                    // Enable FCM
                    enableFCM()
                }
                Log.d(TAG, "Push notifications toggled: $pushNotificationsEnabled")
            }
        }
    }

    private fun updateInAppToggleUI() {
        binding.inAppOnLabel.isSelected = inAppNotificationsEnabled
        binding.inAppOffLabel.isSelected = !inAppNotificationsEnabled
        binding.inAppSwitch.isChecked = inAppNotificationsEnabled
    }

    private fun updatePushToggleUI() {
        binding.pushOnLabel.isSelected = pushNotificationsEnabled
        binding.pushOffLabel.isSelected = !pushNotificationsEnabled
        binding.pushSwitch.isChecked = pushNotificationsEnabled
    }

    private fun checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            when {
                ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED -> {
                    // Permission already granted, enable FCM
                    enableFCM()
                }
                shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS) -> {
                    // Show rationale if needed
                    Toast.makeText(
                        this,
                        "Notification permission is required for push notifications",
                        Toast.LENGTH_LONG
                    ).show()
                    requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
                else -> {
                    // Request permission
                    requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }
        } else {
            // For Android < 13, notification permission is granted by default
            enableFCM()
        }
    }

    private fun enableFCM() {
        Log.d(TAG, "Enabling FCM")
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val token = task.result
                Log.d(TAG, "FCM Token: $token")
                sessionManager.setFCMToken(token)
                
                // Force token refresh to ensure it's up to date
                FirebaseMessaging.getInstance().isAutoInitEnabled = true
                
                // Test if the token is being sent correctly
                logTokenToServer(token)
                
                pushNotificationsEnabled = true
                updatePushToggleUI()
            } else {
                Log.e(TAG, "Failed to get FCM token", task.exception)
                pushNotificationsEnabled = false
                updatePushToggleUI()
            }
        }
    }

    private fun disableFCM() {
        FirebaseMessaging.getInstance().deleteToken().addOnCompleteListener { task ->
            if (task.isSuccessful) {
                Log.d(TAG, "FCM token deleted")
                sessionManager.setFCMToken("")
            } else {
                Log.e(TAG, "Failed to delete FCM token", task.exception)
            }
        }
    }
    
    private fun logTokenToServer(token: String) {
        Log.d(TAG, "FCM Token to send to server: $token")
        
        // Get user ID
        val userId = sessionManager.getUserId()
        if (userId.isNullOrEmpty()) {
            Log.w(TAG, "Cannot update FCM token: user ID is null or empty")
            return
        }
        
        // Get auth token
        val authToken = sessionManager.getToken()
        if (authToken.isNullOrEmpty()) {
            Log.w(TAG, "Cannot update FCM token: auth token is null or empty")
            return
        }
        
        // Use coroutines to make the API call
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Create a client for the HTTP request
                val client = OkHttpClient.Builder().build()
                
                // Create the request body with the token
                val jsonBody = JSONObject()
                jsonBody.put("fcmToken", token)
                
                val requestBody = jsonBody.toString().toRequestBody("application/json".toMediaType())
                
                // Get the API base URL
                val apiBaseUrl = if (BuildConfig.DEBUG) {
                    BuildConfig.DEBUG_API_URL
                } else {
                    BuildConfig.RELEASE_API_URL
                }
                
                // Build the request
                val request = Request.Builder()
                    .url("$apiBaseUrl/api/users/$userId/fcm-token")
                    .put(requestBody)
                    .header("Authorization", "Bearer $authToken")
                    .header("Content-Type", "application/json")
                    .build()
                
                // Execute the request
                val response = client.newCall(request).execute()
                
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        Log.d(TAG, "FCM token successfully updated on server")
                        Toast.makeText(this@SettingsActivity, 
                            "Push notifications enabled", Toast.LENGTH_SHORT).show()
                    } else {
                        val errorBody = response.body?.string() ?: "No error body"
                        Log.e(TAG, "Failed to update FCM token: ${response.code} - $errorBody")
                        Toast.makeText(this@SettingsActivity, 
                            "Failed to enable push notifications", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error updating FCM token: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@SettingsActivity, 
                        "Error enabling push notifications", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
    
    private fun saveNotificationPreferences() {
        // Save notification preferences to persistent storage
        sessionManager.setInAppNotificationsEnabled(inAppNotificationsEnabled)
        sessionManager.setPushNotificationsEnabled(pushNotificationsEnabled)
        
        Toast.makeText(this, "Settings saved", Toast.LENGTH_SHORT).show()
        finish() // Return to previous screen
    }
} 