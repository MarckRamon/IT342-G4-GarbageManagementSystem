package com.example.GarbageMS

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.GarbageMS.adapters.TipAdapter
import com.example.GarbageMS.databinding.ActivityHomeBinding
import com.example.GarbageMS.models.Reminder
import com.example.GarbageMS.models.Schedule
import com.example.GarbageMS.models.Tip
import com.example.GarbageMS.services.ReminderService
import com.example.GarbageMS.services.ScheduleService
import com.example.GarbageMS.services.TipService
import com.example.GarbageMS.utils.ApiService
import com.example.GarbageMS.utils.DateConverter
import com.example.GarbageMS.utils.NotificationTestUtil
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.time.LocalDate
import java.util.ArrayList
import java.util.Date
import java.util.Locale
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.Timestamp

class HomeActivity : BaseActivity() {
    private lateinit var binding: ActivityHomeBinding
    private val apiService = ApiService.create()
    private val scheduleService = ScheduleService.getInstance()
    private val reminderService = ReminderService.getInstance()
    private val tipService = TipService.getInstance()
    private val TAG = "HomeActivity"
    private var currentReminder: Reminder? = null
    private lateinit var tipAdapter: TipAdapter
    private var tipsList: List<Tip> = emptyList()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // The authentication check is already done in BaseActivity
        // We only continue if the user is authenticated

        // Initialize services
        scheduleService.initialize(sessionManager)
        reminderService.initialize(sessionManager)
        reminderService.setContext(applicationContext)
        tipService.initialize(sessionManager)
        tipService.setContext(applicationContext)

        // Set context for services
        scheduleService.setContext(applicationContext)

        // Ensure FCM token is available
        refreshFCMToken()
        
        // Load user profile data
        loadUserData()

        // Setup UI components
        setupUI()
        setupTipsRecyclerView()
        setupListeners()
        setupBottomNavigation()
        
        // Check if we need to display a specific reminder
        handleShowReminderIntent()
        
        // Load user's closest pickup schedule
        loadNextPickupInfo()
        
        // Load tips
        loadTips()
    }
    
    override fun onResume() {
        super.onResume()
        
        // Check for any updated data
        loadNextPickupInfo()
        loadTips()
    }
    
    private fun setupUI() {
        // Set welcome message
        val userEmail = sessionManager.getUserId() ?: "User"
        binding.tvWelcome.text = "Welcome, $userEmail!"
        
        // Add long-press handler for notification testing
        binding.tvWelcome.setOnLongClickListener {
            testPushNotifications()
            true
        }
    }
    
    private fun setupTipsRecyclerView() {
        // Initialize empty adapter
        tipAdapter = TipAdapter(emptyList())
        binding.tipsRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@HomeActivity)
            adapter = tipAdapter
        }
        
        // Setup refresh listener
        binding.tipsRefreshLayout.setOnRefreshListener {
            loadTips()
        }
    }
    
    private fun testPushNotifications() {
        // Show a dialog to confirm the notification test
        AlertDialog.Builder(this)
            .setTitle("Test Push Notifications")
            .setMessage("Do you want to run a diagnostic test for push notifications?")
            .setPositiveButton("Yes") { _, _ ->
                // Test notifications using our diagnostic function
                reminderService.logFCMTokenStatus(this)
                
                // Also try sending via FirebaseMessaging
                val fcmToken = sessionManager.getFCMToken()
                if (fcmToken != null) {
                    Toast.makeText(this, "Testing notifications...", Toast.LENGTH_SHORT).show()
                    reminderService.sendTestNotification(this)
                } else {
                    Toast.makeText(this, "FCM token not available", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("No", null)
            .show()
    }

    private fun showFCMToken() {
        val fcmToken = sessionManager.getFCMToken() ?: "Token not available"
        
        AlertDialog.Builder(this)
            .setTitle("FCM Token")
            .setMessage("Your FCM token is:\n\n$fcmToken\n\nWould you like to test notifications?")
            .setPositiveButton("Copy Token") { _, _ ->
                val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                val clip = ClipData.newPlainText("FCM Token", fcmToken)
                clipboard.setPrimaryClip(clip)
                Toast.makeText(this, "Token copied to clipboard", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Close", null)
            .setNeutralButton("Test Notifications") { _, _ ->
                testPushNotifications()
            }
            .show()
    }

    private fun setupListeners() {
        binding.btnProfile.setOnClickListener {
            // Navigate to profile page
            startActivity(Intent(this, ProfileActivity::class.java))
        }

        binding.btnNotifications.setOnClickListener {
            // Navigate to notifications page
            Toast.makeText(
                this,
                "Opening notifications",
                Toast.LENGTH_SHORT
            ).show()
            startActivity(Intent(this, NotificationsActivity::class.java))
        }

        binding.btnLogout.setOnClickListener {
            sessionManager.logout()
            navigateToLogin()
        }
        
        // Add a long press listener for testing notifications
        binding.btnNotifications.setOnLongClickListener {
            // Show a test notification
            NotificationTestUtil.showTestNotification(
                this,
                "Test Notification",
                "This is a test notification to verify if notifications are working"
            )
            Toast.makeText(this, "Test notification sent", Toast.LENGTH_SHORT).show()
            true
        }
        
        // Add a click listener on button to show FCM token
        binding.btnProfile.setOnLongClickListener {
            // Show FCM token dialog
            showFCMToken()
            true
        }
        
        // Handle close button click on the reminder card
        binding.closeReminderButton.setOnClickListener {
            // Always show a confirmation dialog
            AlertDialog.Builder(this)
                .setTitle(if (currentReminder != null) "Delete Reminder" else "Hide Pickup Info")
                .setMessage(if (currentReminder != null) 
                    "Are you sure you want to delete this reminder?" 
                    else "Are you sure you want to hide this pickup information?")
                .setPositiveButton("Yes") { dialog, _ ->
                    if (currentReminder != null && currentReminder?.reminderId?.isNotEmpty() == true) {
                        // Save reminder to notifications before deleting
                        addReminderToNotifications(currentReminder!!)
                        
                        // Delete the actual reminder
                        deleteReminder(currentReminder?.reminderId ?: "")
                        
                        // Give a short delay to ensure notification is saved
                        CoroutineScope(Dispatchers.Main).launch {
                            delay(300) // 300ms delay
                            // Navigate to notifications page after deletion
                            val intent = Intent(this@HomeActivity, NotificationsActivity::class.java)
                            startActivity(intent)
                        }
                    } else {
                        // Add pickup info to notifications 
                        addPickupInfoToNotifications()
                        
                        // Just hide the card if it's not a reminder
                        binding.nextPickupCard.visibility = View.GONE
                        Log.d(TAG, "Hiding pickup info card")
                        Toast.makeText(
                            this,
                            "Pickup information hidden. Check notifications for details.",
                            Toast.LENGTH_SHORT
                        ).show()
                        
                        // Give a short delay to ensure notification is saved
                        CoroutineScope(Dispatchers.Main).launch {
                            delay(300) // 300ms delay
                            // Navigate to notifications page
                            val intent = Intent(this@HomeActivity, NotificationsActivity::class.java)
                            startActivity(intent)
                        }
                    }
                    dialog.dismiss()
                }
                .setNegativeButton("No") { dialog, _ ->
                    dialog.dismiss()
                }
                .show()
        }
    }

    private fun setupBottomNavigation() {
        binding.bottomNavigation.selectedItemId = R.id.navigation_home // Highlight the home icon

        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.navigation_home -> {
                    // Already on this screen, do nothing
                    true // Consume the event
                }
                R.id.navigation_schedule -> {
                    val intent = Intent(this, ScheduleActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_REORDER_TO_FRONT // Bring existing ScheduleActivity to front
                    startActivity(intent)
                    true // Consume the event
                }
                R.id.navigation_map -> {
                    val intent = Intent(this, MapActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_REORDER_TO_FRONT // Bring existing MapActivity to front
                    startActivity(intent)
                    true // Consume the event
                }
                else -> false
            }
        }
    }

    private fun loadUserData() {
        val token = sessionManager.getToken()
        val userId = sessionManager.getUserId()
        
        if (token == null || userId == null) {
            Log.e(TAG, "Token or userId is null")
            Toast.makeText(this, "Session expired. Please login again.", Toast.LENGTH_LONG).show()
            sessionManager.logout()
            navigateToLogin()
            return
        }
        
        // Set a default welcome message even before API call completes
        binding.tvWelcome.text = "Welcome back!"
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = apiService.getProfile(userId, "Bearer $token")
                
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        val profileResponse = response.body()
                        if (profileResponse != null && profileResponse.success) {
                            val firstName = if (profileResponse.firstName != null) {
                                profileResponse.firstName
                            } else {
                                "User"
                            }
                            val lastName = if (profileResponse.lastName != null) {
                                profileResponse.lastName
                            } else {
                                ""
                            }
                            val name = if (lastName.isNotEmpty()) "$firstName $lastName" else firstName
                            binding.tvWelcome.text = "Welcome, $name!"
                            Log.d(TAG, "User profile loaded: $name")
                        }
                    } else {
                        val errorCode = response.code()
                        Log.e(TAG, "Failed to load user profile: ${response.code()} - ${response.message()}")
                        
                        // Only log out if we get a 401 Unauthorized
                        // For 404 Not Found, it might just be that the endpoint doesn't exist
                        if (errorCode == 401) {
                            withContext(Dispatchers.Main) {
                                Toast.makeText(this@HomeActivity, 
                                    "Your session has expired. Please login again.",
                                    Toast.LENGTH_LONG).show()
                                sessionManager.logout()
                                navigateToLogin()
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading user profile: ${e.message}", e)
                // Don't logout for network errors, just keep the default welcome message
            }
        }
    }
    
    private fun loadTips() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val tips = tipService.getAllTips()
                withContext(Dispatchers.Main) {
                    // Store the tips list
                    tipsList = tips
                    
                    // Update the adapter
                    tipAdapter.updateTips(tips)
                    
                    // Hide the refresh indicator if it's showing
                    binding.tipsRefreshLayout.isRefreshing = false
                    
                    // Show/hide the tips section based on data
                    if (tips.isEmpty()) {
                        binding.tipsSectionTitle.visibility = View.GONE
                    } else {
                        binding.tipsSectionTitle.visibility = View.VISIBLE
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading tips", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@HomeActivity,
                        "Error loading tips: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                    binding.tipsRefreshLayout.isRefreshing = false
                }
            }
        }
    }

    private fun handleShowReminderIntent() {
        val reminderId = intent.getStringExtra("reminderId")
        if (reminderId != null) {
            // Fetch and display the specific reminder (implement with your actual API)
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    // Get the reminder from the service - you'll need to implement this
                    // val reminder = reminderService.getReminder(reminderId)
                    
                    // For now, just show a message
                    withContext(Dispatchers.Main) {
                        Toast.makeText(
                            this@HomeActivity,
                            "Would show reminder ID: $reminderId",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error fetching specific reminder", e)
                }
            }
        }
    }
    
    private fun displayReminderCard(reminder: Reminder) {
        // Store the current reminder for possible later operations
        currentReminder = reminder
        
        // Set the reminder card content and make it visible
        binding.nextPickupCard.visibility = View.VISIBLE
        binding.nextPickupTitle.text = "Reminder: ${reminder.title}"
        
        // Format date if available, otherwise use the provided time
        val timeText = if (reminder.reminderDate != null) {
            SimpleDateFormat("MMM dd, yyyy 'at' h:mm a", Locale.getDefault()).format(reminder.reminderDate)
        } else {
            reminder.scheduledTime.ifEmpty { "Unknown time" }
        }
        binding.nextPickupTimeText.text = timeText
        
        // Show or hide additional fields based on availability
        val message = reminder.getDescriptionText()
        if (message.isNotEmpty()) {
            binding.nextPickupMessage.text = message
            binding.nextPickupMessage.visibility = View.VISIBLE
        } else {
            binding.nextPickupMessage.visibility = View.GONE
        }
        
        // Set the location if available
        if (reminder.location.isNotEmpty()) {
            binding.nextPickupLocation.text = "Location: ${reminder.location}"
            binding.nextPickupLocation.visibility = View.VISIBLE
        } else {
            binding.nextPickupLocation.visibility = View.GONE
        }
        
        // Ensure the reminder card is at the top of the screen
        binding.nextPickupCard.post {
            // Scroll to the top to ensure the reminder is visible
            binding.tipsRecyclerView.smoothScrollToPosition(0)
        }
    }
    
    private fun loadNextPickupInfo() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // First check if the user has any reminders set
                // For now, just show a schedule since we don't have the reminders API implemented
                loadNextSchedule()
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching reminders", e)
                
                withContext(Dispatchers.Main) {
                    // If there's an error with reminders, try to show the next schedule
                    loadNextSchedule()
                }
            }
        }
    }
    
    private fun loadNextSchedule() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Get all schedules from the service
                val result = scheduleService.getAllSchedules()
                val schedules = if (result.isSuccess) {
                    result.getOrNull() ?: emptyList()
                } else {
                    emptyList()
                }
                
                withContext(Dispatchers.Main) {
                    if (schedules.isNotEmpty()) {
                        // Sort schedules by date
                        val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                            .format(Date())
                        
                        // Find the next upcoming schedule (not in the past)
                        val upcomingSchedules = schedules.filter { 
                            schedule -> schedule.pickupDate >= today 
                        }
                        
                        // Sort the upcoming schedules by date
                        val sortedSchedules = upcomingSchedules.sortedBy { 
                            schedule -> schedule.pickupDate 
                        }
                        
                        if (sortedSchedules.isNotEmpty()) {
                            // Display the closest upcoming schedule
                            displayScheduleCard(sortedSchedules.first())
                        } else {
                            // No upcoming schedules
                            binding.nextPickupCard.visibility = View.GONE
                        }
                    } else {
                        // No schedules found
                        binding.nextPickupCard.visibility = View.GONE
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching schedules", e)
                
                withContext(Dispatchers.Main) {
                    // Hide the card if we can't fetch any data
                    binding.nextPickupCard.visibility = View.GONE
                }
            }
        }
    }
    
    private fun displayScheduleCard(schedule: Schedule) {
        // Store the current reminder as null since we're showing a schedule
        currentReminder = null
        
        // Set the schedule card content and make it visible
        binding.nextPickupCard.visibility = View.VISIBLE
        binding.nextPickupTitle.text = "Next Pickup"
        
        // Format the date
        try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val outputFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
            val date = inputFormat.parse(schedule.pickupDate)
            val timeText = date?.let { outputFormat.format(it) } ?: schedule.pickupDate
            binding.nextPickupTimeText.text = "$timeText at ${schedule.pickupTime}"
        } catch (e: Exception) {
            binding.nextPickupTimeText.text = "${schedule.pickupDate} at ${schedule.pickupTime}"
        }
        
        // Set a default message
        binding.nextPickupMessage.text = "Remember to prepare your waste for collection."
        binding.nextPickupMessage.visibility = View.VISIBLE
        
        // Set the location if available
        if (schedule.locationId.isNotEmpty()) {
            binding.nextPickupLocation.text = "Location: ${getLocationDisplayName(schedule.locationId)}"
            binding.nextPickupLocation.visibility = View.VISIBLE
        } else {
            binding.nextPickupLocation.visibility = View.GONE
        }
    }
    
    // Helper method to get a user-friendly location name
    private fun getLocationDisplayName(locationId: String): String {
        if (locationId.isEmpty()) {
            return "No location specified"
        }
        
        // Try to extract a meaningful name from the locationId if it follows a pattern
        val parts = locationId.split("-")
        if (parts.size > 1) {
            // Get all parts after the first one
            return parts.subList(1, parts.size).joinToString(" ")
        }
        
        return locationId
    }
    
    private fun deleteReminder(reminderId: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Simulate successful deletion for now
                val success = true // reminderService.deleteReminder(reminderId)
                
                withContext(Dispatchers.Main) {
                    if (success) {
                        // Clear the current reminder
                        currentReminder = null
                        
                        // Hide the reminder card
                        binding.nextPickupCard.visibility = View.GONE
                        
                        // Show a toast to confirm deletion
                        Toast.makeText(
                            this@HomeActivity,
                            "Reminder deleted successfully",
                            Toast.LENGTH_SHORT
                        ).show()
                        
                        // Load next pickup info again (schedules may still exist)
                        loadNextSchedule()
                    } else {
                        Toast.makeText(
                            this@HomeActivity,
                            "Failed to delete reminder",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error deleting reminder", e)
                
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@HomeActivity,
                        "Error deleting reminder: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }

    private fun refreshFCMToken() {
        // Check if FCM token is already available
        val currentToken = sessionManager.getFCMToken()
        if (currentToken.isNullOrEmpty()) {
            Log.d(TAG, "FCM token not found, requesting new token")
            // Token not available, request a new one
            FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    val token = task.result
                    Log.d(TAG, "New FCM token obtained: ${token.take(10)}...")
                    sessionManager.setFCMToken(token)
                    
                    // Send token to the server
                    updateTokenOnServer(token)
                } else {
                    Log.e(TAG, "Failed to get FCM token", task.exception)
                }
            }
        } else {
            Log.d(TAG, "FCM token available: ${currentToken.take(10)}...")
        }
    }
    
    private fun updateTokenOnServer(token: String) {
        val userId = sessionManager.getUserId()
        if (userId.isNullOrEmpty()) {
            Log.e(TAG, "User ID not available, cannot update FCM token on server")
            return
        }
        
        // Use coroutine to perform network operation
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Create request to update token on server
                // This is a simplified example, adjust based on your API
                val client = OkHttpClient.Builder().build()
                val jsonBody = JSONObject()
                jsonBody.put("fcmToken", token)
                jsonBody.put("userId", userId)
                
                val requestBody = jsonBody.toString()
                    .toRequestBody("application/json".toMediaType())
                
                val jwtToken = sessionManager.getToken()
                if (jwtToken.isNullOrEmpty()) {
                    Log.e(TAG, "JWT token not available, cannot update FCM token")
                    return@launch
                }
                
                // Build request
                val request = Request.Builder()
                    .url("${reminderService.getApiBaseUrl()}/api/users/${userId}/fcm-token")
                    .put(requestBody)
                    .header("Authorization", "Bearer $jwtToken")
                    .header("Content-Type", "application/json")
                    .build()
                
                // Execute request
                val response = client.newCall(request).execute()
                
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        Log.d(TAG, "FCM token updated on server successfully")
                    } else {
                        Log.e(TAG, "Failed to update FCM token on server: ${response.code}")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error updating FCM token on server: ${e.message}", e)
            }
        }
    }

    private fun addReminderToNotifications(reminder: Reminder) {
        val userId = sessionManager.getUserId() ?: return
        
        // Create a notification from the reminder
        val notification = hashMapOf(
            "title" to "Reminder: ${reminder.title}",
            "message" to reminder.reminderMessage,
            "timestamp" to Timestamp.now(),
            "isRead" to false,
            "type" to "REMINDER",
            "userId" to userId,
            "referenceId" to reminder.reminderId
        )
        
        // Add to Firestore
        val db = FirebaseFirestore.getInstance()
        try {
            db.collection("notifications")
                .add(notification)
                .addOnSuccessListener { documentReference ->
                    Log.d(TAG, "Reminder added to notifications with ID: ${documentReference.id}")
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Error adding reminder to notifications", e)
                    handleFirestoreError(e)
                }
        } catch (e: Exception) {
            Log.e(TAG, "Error adding reminder to notifications", e)
            handleFirestoreError(e)
        }
    }

    private fun addPickupInfoToNotifications() {
        val userId = sessionManager.getUserId() ?: return
        
        // Get current pickup information from the UI
        val title = binding.nextPickupTitle.text.toString()
        val time = binding.nextPickupTimeText.text.toString()
        val location = binding.nextPickupLocation.text.toString()
        
        // Create notification data
        val notification = hashMapOf(
            "title" to title,
            "message" to "Pickup scheduled for $time. $location",
            "timestamp" to Timestamp.now(),
            "isRead" to false,
            "type" to "PICKUP",
            "userId" to userId,
            "referenceId" to ""
        )
        
        // Add to Firestore
        val db = FirebaseFirestore.getInstance()
        try {
            db.collection("notifications")
                .add(notification)
                .addOnSuccessListener { documentReference ->
                    Log.d(TAG, "Pickup info added to notifications with ID: ${documentReference.id}")
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Error adding pickup info to notifications", e)
                    handleFirestoreError(e)
                }
        } catch (e: Exception) {
            Log.e(TAG, "Error adding pickup info to notifications", e)
            handleFirestoreError(e)
        }
    }
    
    private fun handleFirestoreError(e: Exception) {
        val errorMessage = when {
            e.message?.contains("PERMISSION_DENIED") == true -> 
                "Firestore permission denied. Need to update security rules."
            e.message?.contains("NULL_VALUE") == true ->
                "Error with data format. Please try again."
            e.message?.contains("UNAUTHENTICATED") == true ->
                "Authentication error. Please log in again."
            e.message?.contains("UNAVAILABLE") == true ->
                "Service unavailable. Check your internet connection."
            else -> "Database error: ${e.message}"
        }
        
        Toast.makeText(
            this@HomeActivity,
            errorMessage,
            Toast.LENGTH_LONG
        ).show()
    }
}
