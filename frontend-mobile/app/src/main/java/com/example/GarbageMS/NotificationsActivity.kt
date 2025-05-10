package com.example.GarbageMS

import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.GarbageMS.adapters.NotificationAdapter
import com.example.GarbageMS.databinding.ActivityNotificationsBinding
import com.example.GarbageMS.models.Notification
import com.example.GarbageMS.models.NotificationType
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.util.Date

class NotificationsActivity : BaseActivity() {
    private lateinit var binding: ActivityNotificationsBinding
    private lateinit var adapter: NotificationAdapter
    private val TAG = "NotificationsActivity"
    private val db = FirebaseFirestore.getInstance()

    // Store the switch as a class member to access it from different methods
    private var notificationsSwitch: androidx.appcompat.widget.SwitchCompat? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityNotificationsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        // sessionManager is already initialized in BaseActivity

        // Hide the support action bar
        supportActionBar?.hide()

        // Check if we should show settings instead of notifications
        val showSettings = intent.getBooleanExtra("SHOW_SETTINGS", false)

        if (showSettings) {
            // Show settings UI
            setupSettingsUI()
        } else {
            // Set up recycler view for notifications
        setupRecyclerView()

        // Load notifications
        loadNotifications()

        // Set up mark all as read button
        binding.markAllReadFab.setOnClickListener {
            markAllNotificationsAsRead()
            }
        }

        // Set up back button
        binding.backButton.setOnClickListener {
            finish()
        }
    }

    // Refresh the notifications when the activity comes to the foreground
    override fun onResume() {
        super.onResume()
        // Only reload notifications if we're in notifications mode, not settings mode
        if (binding.settingsContainer.visibility != View.VISIBLE) {
            // Reload notifications to show the newly added ones
            loadNotifications()
        }
    }

    // Method for NotificationsListFragment to call
    fun showMarkAllReadButton(show: Boolean) {
        binding.markAllReadFab.visibility = if (show) View.VISIBLE else View.GONE
    }

    private fun setupRecyclerView() {
        adapter = NotificationAdapter(mutableListOf()) { notification ->
            // Mark notification as read when clicked
            if (!notification.isRead) {
                markNotificationAsRead(notification.id)
            }

            // Handle notification click based on type
            when (notification.type) {
                NotificationType.PICKUP -> {
                    // Navigate to schedule view
                    Toast.makeText(this, "Opening schedule for pickup details", Toast.LENGTH_SHORT).show()
                }
                NotificationType.REPORT -> {
                    // Navigate to reports view
                    Toast.makeText(this, "Opening report details", Toast.LENGTH_SHORT).show()
                }
                NotificationType.SCHEDULE_CHANGE -> {
                    // Navigate to schedule view
                    Toast.makeText(this, "Opening schedule for changes", Toast.LENGTH_SHORT).show()
                }
                NotificationType.REMINDER -> {
                    // Navigate to relevant view
                    Toast.makeText(this, "Opening reminder details", Toast.LENGTH_SHORT).show()
                }
                NotificationType.SYSTEM, NotificationType.GENERAL -> {
                    // Just show toast
                    Toast.makeText(this, notification.message, Toast.LENGTH_LONG).show()
                }
            }
        }

        binding.notificationsRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@NotificationsActivity)
            adapter = this@NotificationsActivity.adapter
        }
    }

    private fun loadNotifications() {
        // Show loading state
        binding.progressBar.visibility = View.VISIBLE
        binding.notificationsRecyclerView.visibility = View.GONE
        binding.emptyNotificationsText.visibility = View.GONE

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val userId = sessionManager.getUserId() ?: throw Exception("User ID not available")

                // Query notifications for this user
                val notificationsSnapshot = db.collection("notifications")
                    .whereEqualTo("userId", userId)
                    .orderBy("timestamp", Query.Direction.DESCENDING)
                    .get()
                    .await()

                val notifications = notificationsSnapshot.documents.mapNotNull { doc ->
                    try {
                        Notification(
                            id = doc.id,
                            title = doc.getString("title") ?: "",
                            message = doc.getString("message") ?: "",
                            timestamp = doc.getTimestamp("timestamp")?.toDate() ?: Date(),
                            isRead = doc.getBoolean("isRead") ?: false,
                            type = try {
                                NotificationType.valueOf(doc.getString("type") ?: "SYSTEM")
                            } catch (e: Exception) {
                                NotificationType.SYSTEM
                            },
                            userId = doc.getString("userId") ?: "",
                            referenceId = doc.getString("referenceId") ?: ""
                        )
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing notification", e)
                        null
                    }
                }

                withContext(Dispatchers.Main) {
                    // Update UI with notifications
                    if (notifications.isEmpty()) {
                        binding.emptyNotificationsText.visibility = View.VISIBLE
                        binding.notificationsRecyclerView.visibility = View.GONE
                        binding.emptyNotificationsText.text = "No notifications yet"
                    } else {
                        binding.notificationsRecyclerView.visibility = View.VISIBLE
                        binding.emptyNotificationsText.visibility = View.GONE
                        adapter.updateNotifications(notifications)
                    }
                    binding.progressBar.visibility = View.GONE

                    // Update badge count
                    updateNotificationBadgeCount()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading notifications: ${e.message}", e)
                Log.d(TAG, "userId: ${sessionManager.getUserId()}")

                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = View.GONE

                    // Only show error message if we're in notifications mode, not settings mode
                    if (binding.settingsContainer.visibility != View.VISIBLE) {
                        // Handle specific error types - update to remove Firestore-specific error messages
                        val errorMessage = when {
                            e.message?.contains("UNAVAILABLE") == true ->
                                "Service unavailable. Please check your internet connection."
                            e.message?.contains("UNAUTHENTICATED") == true ->
                                "Authentication error. Please log in again."
                            e.message?.contains("NULL_VALUE") == true ->
                                "Error with data format. Please try again later."
                            else -> "Error loading notifications. Please try again later."
                        }

                        // Only show toast in notifications mode
                        Toast.makeText(
                            this@NotificationsActivity,
                            errorMessage,
                            Toast.LENGTH_LONG
                        ).show()

                        binding.emptyNotificationsText.visibility = View.VISIBLE
                        binding.notificationsRecyclerView.visibility = View.GONE
                        binding.emptyNotificationsText.text = "Unable to load notifications.\nTry again later."
                    }
                }
            }
        }
    }

    private fun markNotificationAsRead(notificationId: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Update in Firestore
                db.collection("notifications")
                    .document(notificationId)
                    .update("isRead", true)
                    .await()

                // Update locally
                adapter.markAsRead(notificationId)

                // Update badge count
                updateNotificationBadgeCount()
            } catch (e: Exception) {
                Log.e(TAG, "Error marking notification as read", e)
            }
        }
    }

    private fun markAllNotificationsAsRead() {
        val userId = sessionManager.getUserId()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Get all unread notifications
                val unreadNotificationsSnapshot = db.collection("notifications")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("isRead", false)
                    .get()
                    .await()

                // Create a batch
                val batch = db.batch()

                // Add update operations to batch
                for (doc in unreadNotificationsSnapshot.documents) {
                    batch.update(doc.reference, "isRead", true)
                }

                // Commit batch
                batch.commit().await()

                withContext(Dispatchers.Main) {
                    // Update locally
                    adapter.markAllAsRead()
                    Toast.makeText(
                        this@NotificationsActivity,
                        "All notifications marked as read",
                        Toast.LENGTH_SHORT
                    ).show()

                    // Update badge count
                    updateNotificationBadgeCount()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error marking all notifications as read", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@NotificationsActivity,
                        "Error marking notifications as read",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }

    private fun updateNotificationBadgeCount() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val userId = sessionManager.getUserId()

                // Query unread notifications count
                val unreadCount = db.collection("notifications")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("isRead", false)
                    .get()
                    .await()
                    .size()

                // Update session manager with new count
                sessionManager.setUnreadNotificationCount(unreadCount)
            } catch (e: Exception) {
                Log.e(TAG, "Error updating notification badge count", e)
            }
        }
    }

    private fun setupSettingsUI() {
        // Hide notifications UI
        binding.notificationsRecyclerView.visibility = View.GONE
        binding.emptyNotificationsText.visibility = View.GONE
        binding.progressBar.visibility = View.GONE
        binding.markAllReadFab.visibility = View.GONE

        // Show settings UI
        binding.settingsContainer.visibility = View.VISIBLE

        // Update the title in the top bar now using the ID
        val titleTextView = findViewById<TextView>(R.id.titleText)
        titleTextView.text = "Settings"

        // Check if the notification API is working
        verifyNotificationEndpoint()

        // Initialize toggle switches with current settings
        setupToggleSwitches()

        // No additional buttons needed

        // Display app version
        displayAppVersion()
    }

    private fun verifyNotificationEndpoint() {
        val userId = sessionManager.getUserId()
        val token = sessionManager.getToken()

        if (token == null) {
            Log.e(TAG, "Authentication token is null, can't verify notification endpoint")
            return
        }

        // Check if the notification settings endpoint is accessible
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val apiService = com.example.GarbageMS.utils.ApiService.create()

                // Log the request details
                Log.d(TAG, "Verifying notification endpoint:")
                Log.d(TAG, "  - User ID: $userId")
                Log.d(TAG, "  - Auth Token: Bearer ${token.take(10)}...")
                Log.d(TAG, "  - API Base URL: ${com.example.GarbageMS.utils.ApiService.BASE_URL}")

                val response = apiService.getNotificationSettings(userId, "Bearer $token")

                if (response.isSuccessful) {
                    Log.d(TAG, "Notification settings API is accessible: OK")

                    // Check the response content
                    val responseBody = response.body()
                    if (responseBody != null && responseBody.containsKey("notificationsEnabled")) {
                        Log.d(TAG, "Notification settings response has notificationsEnabled field: ${responseBody["notificationsEnabled"]}")
                    } else {
                        Log.w(TAG, "Notification settings response does not have notificationsEnabled field")
                    }
                } else {
                    // Just log the error, don't show any toast
                    Log.e(TAG, "Notification settings API failed: ${response.code()} - ${response.message()}")
                    Log.e(TAG, "Error body: ${response.errorBody()?.string()}")
                }
            } catch (e: Exception) {
                // Just log the error, don't show any toast
                Log.e(TAG, "Error verifying notification endpoint", e)
            }
        }
    }

    private fun setupToggleSwitches() {
        // Initialize the switch reference
        notificationsSwitch = findViewById<androidx.appcompat.widget.SwitchCompat>(R.id.notificationsEnabledSwitch)

        // Get current notification setting from the user document
        sessionManager.getUserId().let { userId ->
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    // Get user settings from API using the dedicated notification settings endpoint
                    val apiService = com.example.GarbageMS.utils.ApiService.create()
                    val token = sessionManager.getToken()
                    if (token != null) {
                        // Log the request details
                        Log.d(TAG, "Making API request to get notification settings:")
                        Log.d(TAG, "  - User ID: $userId")
                        Log.d(TAG, "  - Auth Token: Bearer ${token.take(10)}...")

                        val response = apiService.getNotificationSettings(userId, "Bearer $token")

                        Log.d(TAG, "API response code: ${response.code()}")
                        if (!response.isSuccessful) {
                            Log.e(TAG, "Error body: ${response.errorBody()?.string()}")
                        }

                        if (response.isSuccessful && response.body() != null) {
                            // Get the current notification setting from the response
                            val settingsEnabled = try {
                                val responseBody = response.body()!!
                                // The response should contain a "notificationsEnabled" field
                                responseBody["notificationsEnabled"] ?: sessionManager.getNotificationsEnabled()
                            } catch (e: Exception) {
                                Log.e(TAG, "Error parsing notification setting from API response", e)
                                sessionManager.getNotificationsEnabled()
                            }

                            withContext(Dispatchers.Main) {
                                // Update the switch with the value without triggering the listener
                                notificationsSwitch?.setOnCheckedChangeListener(null)
                                notificationsSwitch?.isChecked = settingsEnabled
                                setupToggleSwitchListeners()
                            }
                        } else {
                            Log.e(TAG, "Error getting profile: ${response.code()}")
                            // Use default from SessionManager if API fails
                            withContext(Dispatchers.Main) {
                                notificationsSwitch?.setOnCheckedChangeListener(null)
                                notificationsSwitch?.isChecked = sessionManager.getNotificationsEnabled()
                                setupToggleSwitchListeners()
                            }
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error fetching notification settings from API", e)
                    // Use default from SessionManager if API fails - no need to show error toast
                    withContext(Dispatchers.Main) {
                        notificationsSwitch?.setOnCheckedChangeListener(null)
                        notificationsSwitch?.isChecked = sessionManager.getNotificationsEnabled()
                        setupToggleSwitchListeners()

                        // Hide progress bar if visible
                        binding.progressBar.visibility = View.GONE
                    }
                }
            }
        }
    }

    private fun updateNotificationSettingViaApi(enabled: Boolean) {
        val userId = sessionManager.getUserId()
        val token = sessionManager.getToken()

        if (token == null) {
            Toast.makeText(this, "Authentication error", Toast.LENGTH_SHORT).show()
            return
        }

        // Show progress indicator
        val progressBar = findViewById<android.widget.ProgressBar>(R.id.progressBar)
        progressBar?.visibility = View.VISIBLE

        // Disable the switch during API operation to prevent multiple rapid changes
        notificationsSwitch?.isEnabled = false

        Log.d(TAG, "Updating notification setting to: $enabled for user: $userId")

        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Set value in SessionManager first in case API fails but local value should be updated
                sessionManager.setNotificationsEnabled(enabled)

                // Use the ApiService interface
                val apiService = com.example.GarbageMS.utils.ApiService.create()

                // Make sure the key matches what the backend expects
                val notificationMap = mapOf("notificationsEnabled" to enabled)
                Log.d(TAG, "Sending notification update: $notificationMap")

                // Log the request details
                Log.d(TAG, "Making API request to update notification settings:")
                Log.d(TAG, "  - User ID: $userId")
                Log.d(TAG, "  - Auth Token: Bearer ${token.take(10)}...")
                Log.d(TAG, "  - Request Body: $notificationMap")

                // Try to update via the API
                val response = apiService.updateNotificationSetting(userId, "Bearer $token", notificationMap)

                Log.d(TAG, "API response code: ${response.code()}")
                if (!response.isSuccessful) {
                    Log.e(TAG, "Error body: ${response.errorBody()?.string()}")
                }

                withContext(Dispatchers.Main) {
                    progressBar?.visibility = View.GONE

                    if (response.isSuccessful) {
                        // Success
                        Log.d(TAG, "Notification setting updated successfully")

                        Toast.makeText(
                            this@NotificationsActivity,
                            "Notifications ${if (enabled) "enabled" else "disabled"}",
                            Toast.LENGTH_SHORT
                        ).show()
                    } else {
                        // Try to handle error
                        handleNotificationUpdateError(response, enabled)
                    }

                    // Re-enable the switch
                    notificationsSwitch?.isEnabled = true
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error updating notification setting", e)
                withContext(Dispatchers.Main) {
                    progressBar?.visibility = View.GONE

                    // Show error but keep the local toggle setting
                    Toast.makeText(
                        this@NotificationsActivity,
                        "Server error, but notification setting saved locally",
                        Toast.LENGTH_SHORT
                    ).show()

                    // Re-enable the switch - keep the user's choice locally even if API fails
                    notificationsSwitch?.isEnabled = true
                }
            }
        }
    }

    private suspend fun handleNotificationUpdateError(response: retrofit2.Response<Map<String, Any>>, enabled: Boolean) {
        // Try to get error body
        val errorBody = response.errorBody()?.string() ?: "Unknown error"
        Log.e(TAG, "API error: ${response.code()} - ${response.message()} - $errorBody")

        // Show error message but keep the local setting
        val errorMessage = when (response.code()) {
            401 -> "Authentication error, but setting saved locally"
            403 -> "Permission error, but setting saved locally"
            404 -> "Profile not found, but setting saved locally"
            else -> "Could not update server, but setting saved locally"
        }

        Toast.makeText(
            this@NotificationsActivity,
            errorMessage,
            Toast.LENGTH_SHORT
        ).show()
    }

    // Add a new method to setup toggle switch listeners
    private fun setupToggleSwitchListeners() {
        // Set change listener for the notifications switch
        notificationsSwitch?.setOnCheckedChangeListener { _, isChecked ->
            // Update in SessionManager
            sessionManager.setNotificationsEnabled(isChecked)

            // Update via API
            updateNotificationSettingViaApi(isChecked)
        }
    }

    // Settings buttons removed as requested

    private fun displayAppVersion() {
        try {
            val packageInfo = packageManager.getPackageInfo(packageName, 0)
            val versionName = packageInfo.versionName
            val appVersionText = findViewById<TextView>(R.id.appVersionText)
            appVersionText?.text = versionName
        } catch (e: Exception) {
            Log.e(TAG, "Error getting app version", e)
        }
    }
}