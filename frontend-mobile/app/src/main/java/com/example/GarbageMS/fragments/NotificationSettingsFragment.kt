package com.example.GarbageMS.fragments

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.widget.SwitchCompat
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import com.example.GarbageMS.BuildConfig
import com.example.GarbageMS.R
import com.example.GarbageMS.utils.ApiService
import com.example.GarbageMS.utils.SessionManager
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.tasks.await
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import com.google.firebase.firestore.FirebaseFirestore

class NotificationSettingsFragment : Fragment() {
    private lateinit var inAppSwitchContainer: LinearLayout
    private lateinit var pushSwitchContainer: LinearLayout
    private lateinit var inAppOnLabel: TextView
    private lateinit var inAppOffLabel: TextView
    private lateinit var pushOnLabel: TextView
    private lateinit var pushOffLabel: TextView
    private lateinit var inAppSwitch: SwitchCompat
    private lateinit var pushSwitch: SwitchCompat
    private lateinit var appVersionValue: TextView
    private lateinit var saveButton: Button

    private lateinit var sessionManager: SessionManager
    private val TAG = "NotifSettingsFragment"

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
            Toast.makeText(requireContext(), "Notification permission denied", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_notification_settings, container, false)

        // Initialize SessionManager
        sessionManager = SessionManager.getInstance(requireContext())

        // Initialize views
        inAppSwitchContainer = view.findViewById(R.id.inAppSwitchContainer)
        pushSwitchContainer = view.findViewById(R.id.pushSwitchContainer)
        inAppOnLabel = view.findViewById(R.id.inAppOnLabel)
        inAppOffLabel = view.findViewById(R.id.inAppOffLabel)
        pushOnLabel = view.findViewById(R.id.pushOnLabel)
        pushOffLabel = view.findViewById(R.id.pushOffLabel)
        inAppSwitch = view.findViewById(R.id.inAppSwitch)
        pushSwitch = view.findViewById(R.id.pushSwitch)
        appVersionValue = view.findViewById(R.id.appVersionValue)
        saveButton = view.findViewById(R.id.saveButton)

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
            val packageInfo = requireContext().packageManager.getPackageInfo(requireContext().packageName, 0)
            appVersionValue.text = packageInfo.versionName
        } catch (e: Exception) {
            appVersionValue.text = "Unknown"
            Log.e(TAG, "Error getting app version", e)
        }

        // Set up save button
        saveButton.setOnClickListener {
            saveNotificationPreferences()
        }

        // Check notification permission
        checkNotificationPermission()

        return view
    }

    private fun setupToggleListeners() {
        // In-app notifications toggle
        inAppSwitchContainer.setOnClickListener {
            // Toggle the state
            inAppNotificationsEnabled = !inAppNotificationsEnabled
            updateInAppToggleUI()
            Log.d(TAG, "In-app notifications toggled: $inAppNotificationsEnabled")
        }

        // Push notifications toggle
        pushSwitchContainer.setOnClickListener {
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
        inAppOnLabel.isSelected = inAppNotificationsEnabled
        inAppOffLabel.isSelected = !inAppNotificationsEnabled
        inAppSwitch.isChecked = inAppNotificationsEnabled
    }

    private fun updatePushToggleUI() {
        pushOnLabel.isSelected = pushNotificationsEnabled
        pushOffLabel.isSelected = !pushNotificationsEnabled
        pushSwitch.isChecked = pushNotificationsEnabled
    }

    private fun checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            when {
                ContextCompat.checkSelfPermission(
                    requireContext(),
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED -> {
                    // Permission already granted, enable FCM
                    enableFCM()
                }
                shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS) -> {
                    // Show rationale if needed
                    Toast.makeText(
                        requireContext(),
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

                // Get the API base URL directly from ApiService
                val apiBaseUrl = ApiService.Companion.BASE_URL

                // Build the request
                val request = Request.Builder()
                    .url("${apiBaseUrl}api/users/$userId/fcm-token")
                    .put(requestBody)
                    .header("Authorization", "Bearer $authToken")
                    .header("Content-Type", "application/json")
                    .build()

                // Execute the request
                val response = client.newCall(request).execute()

                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        Log.d(TAG, "FCM token successfully updated on server")
                        Toast.makeText(requireContext(),
                            "Push notifications enabled", Toast.LENGTH_SHORT).show()
                    } else {
                        val errorBody = response.body?.string() ?: "No error body"
                        Log.e(TAG, "Failed to update FCM token: ${response.code} - $errorBody")
                        Toast.makeText(requireContext(),
                            "Failed to enable push notifications", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error updating FCM token: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(requireContext(),
                        "Error enabling push notifications", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun saveNotificationPreferences() {
        // Calculate enabled state - true if either in-app or push is enabled
        val notificationsEnabled = inAppNotificationsEnabled || pushNotificationsEnabled

        // Save to SessionManager
        sessionManager.setNotificationsEnabled(notificationsEnabled)

        // Show progress indicator or disable button
        saveButton.isEnabled = false

        // Update using API
        val userId = sessionManager.getUserId()
        val token = sessionManager.getToken()

        if (token.isNullOrEmpty()) {
            Toast.makeText(requireContext(), "Authentication error", Toast.LENGTH_SHORT).show()
            saveButton.isEnabled = true
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Use the ApiService interface
                val apiService = com.example.GarbageMS.utils.ApiService.create()
                val notificationMap = mapOf("notificationsEnabled" to notificationsEnabled)
                // Log the request details
                Log.d(TAG, "Making API request to update notification settings:")
                Log.d(TAG, "  - User ID: $userId")
                Log.d(TAG, "  - Auth Token: Bearer ${token.take(10)}...")
                Log.d(TAG, "  - Request Body: $notificationMap")
                Log.d(TAG, "  - API Base URL: ${ApiService.BASE_URL}")

                val response = apiService.updateNotificationSetting(userId, "Bearer $token", notificationMap)

                Log.d(TAG, "API response code: ${response.code()}")
                if (!response.isSuccessful) {
                    Log.e(TAG, "Error body: ${response.errorBody()?.string()}")
                }

                withContext(Dispatchers.Main) {
                    saveButton.isEnabled = true

                    if (response.isSuccessful) {
                        // Success - show toast and return
                        Toast.makeText(
                            requireContext(),
                            "Settings saved successfully",
                            Toast.LENGTH_SHORT
                        ).show()
                    } else {
                        // Error - show error message
                        Log.e(TAG, "API error: ${response.code()} - ${response.message()}")
                        Toast.makeText(
                            requireContext(),
                            "Failed to update settings on server, but saved locally",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error updating notification setting", e)
                withContext(Dispatchers.Main) {
                    saveButton.isEnabled = true
                    Toast.makeText(
                        requireContext(),
                        "Network error, settings saved locally only",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
}