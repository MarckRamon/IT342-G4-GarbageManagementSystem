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
import com.example.GarbageMS.databinding.ActivityHomeBinding
import com.example.GarbageMS.models.Reminder
import com.example.GarbageMS.models.Schedule
import com.example.GarbageMS.services.ReminderService
import com.example.GarbageMS.services.ScheduleService
import com.example.GarbageMS.utils.ApiService
import com.example.GarbageMS.utils.DateConverter
import com.example.GarbageMS.utils.NotificationTestUtil
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
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

class HomeActivity : BaseActivity() {
    private lateinit var binding: ActivityHomeBinding
    private val apiService = ApiService.create()
    private val scheduleService = ScheduleService.getInstance()
    private val reminderService = ReminderService.getInstance()
    private val TAG = "HomeActivity"
    private var currentReminder: Reminder? = null

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

        // Set context for services
        scheduleService.setContext(applicationContext)

        // Ensure FCM token is available
        refreshFCMToken()

        // Setup UI components
        setupUI()
        setupListeners()
        setupBottomNavigation()
        
        // Check if we need to display a specific reminder
        handleShowReminderIntent()
        
        // Load user's closest pickup schedule
        loadNextPickupInfo()
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
            // Check if we have a current reminder
            if (currentReminder != null && currentReminder?.reminderId?.isNotEmpty() == true) {
                // Show confirmation dialog
                AlertDialog.Builder(this)
                    .setTitle("Delete Reminder")
                    .setMessage("Are you sure you want to delete this reminder?")
                    .setPositiveButton("Yes") { dialog, _ ->
                        deleteReminder(currentReminder?.reminderId ?: "")
                        dialog.dismiss()
                    }
                    .setNegativeButton("No") { dialog, _ ->
                        dialog.dismiss()
                    }
                    .show()
            } else {
                // Just hide the card if we don't have a reminder to delete
                binding.nextPickupCard.visibility = View.GONE
                Log.d(TAG, "Closing pickup info card (not a reminder)")
                Toast.makeText(
                    this,
                    "Pickup information hidden",
                    Toast.LENGTH_SHORT
                ).show()
            }
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
                R.id.navigation_history -> {
                    val intent = Intent(this, HistoryActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
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
    
    // Load the next upcoming garbage pickup
    private fun loadNextPickup() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val result = scheduleService.getAllSchedules()
                
                withContext(Dispatchers.Main) {
                    if (result.isSuccess) {
                        val schedules = if (result.getOrNull() != null) {
                            result.getOrNull()!!
                        } else {
                            emptyList()
                        }
                        
                        // Find the next pending schedule
                        val nextSchedule = findNextPendingSchedule(schedules)
                        
                        // Only show reminder if we have a valid schedule
                        if (nextSchedule != null) {
                            showPickupReminder(nextSchedule)
                        } else {
                            // No pending schedule found
                            Log.d(TAG, "No pending schedules found")
                            binding.nextPickupCard.visibility = View.GONE
                        }
                    } else {
                        Log.e(TAG, "Failed to load schedules: ${result.exceptionOrNull()?.message}")
                        binding.nextPickupCard.visibility = View.GONE
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading schedules: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    binding.nextPickupCard.visibility = View.GONE
                }
            }
        }
    }
    
    // Find the next pending schedule (nearest future date)
    private fun findNextPendingSchedule(schedules: List<Schedule>): Schedule? {
        val today = LocalDate.now()
        var nextSchedule: Schedule? = null
        var nextDate: LocalDate? = null

        for (schedule in schedules) {
            // Skip if not PENDING
            if (schedule.status.uppercase() != "PENDING") {
                continue
            }

            // Skip if date is invalid
            val dateObj = DateConverter.stringToLocalDate(schedule.pickupDate) ?: continue

            // Skip if date is in the past
            if (!dateObj.isAfter(today.minusDays(1))) {
                continue
            }

            // Update next schedule if this one is earlier
            if (nextDate == null || dateObj.isBefore(nextDate)) {
                nextDate = dateObj
                nextSchedule = schedule
            }
        }

        return nextSchedule
    }
    
    // Show pickup reminder in the violet card
    private fun showPickupReminder(schedule: Schedule) {
        try {
            // This is just showing schedule info, not a reminder
            currentReminder = null
            
            val localDate = DateConverter.stringToLocalDate(schedule.pickupDate)
            // Make sure we have a valid date
            if (localDate == null) {
                Log.e(TAG, "Invalid date format for schedule: ${schedule.scheduleId}")
                return
            }
            
            val formattedDate = DateConverter.localDateToDisplayString(localDate)
            
            // Show the next pickup card with updated info
            binding.nextPickupCard.visibility = View.VISIBLE
            
            // Reset any reminder-specific UI elements
            binding.nextPickupMessage.visibility = View.GONE
            binding.nextPickupLocation.visibility = View.GONE
            
            // Set the title for a schedule (not a reminder)
            binding.nextPickupTitle.text = "Next Garbage Pickup"
            
            // Format the display text to include date and time
            val timeDisplay = schedule.pickupTime
            val locationName = getLocationDisplayName(schedule.locationId)
            
            // Update the pickup time text
            binding.nextPickupTimeText.text = "$formattedDate at $timeDisplay"
            
            // Set location if available
            if (locationName.isNotEmpty()) {
                binding.nextPickupLocation.text = "Location: $locationName"
                binding.nextPickupLocation.visibility = View.VISIBLE
            }
            
            Log.d(TAG, "Showing pickup info for: $formattedDate at $timeDisplay")
        } catch (e: Exception) {
            Log.e(TAG, "Error showing pickup reminder: ${e.message}", e)
        }
    }
    
    // Helper method to get a user-friendly location name
    private fun getLocationDisplayName(locationId: String): String {
        if (locationId.contains("location-id-from-pickup-locations")) {
            return "Community Pickup Location"
        }

        if (locationId.isEmpty()) {
            return "No location specified"
        }

        // Try to extract a meaningful name from the locationId if it follows a pattern
        val parts = locationId.split("-")
        if (parts.size > 1) {
            // Get all parts after the first one
            val nameParts = parts.subList(1, parts.size)

            // Capitalize each word
            val capitalizedParts = nameParts.map { word ->
                val firstChar = word.firstOrNull() ?: return@map ""
                val restOfWord = if (word.length > 1) word.substring(1) else ""

                if (firstChar.isLowerCase()) {
                    firstChar.uppercase() + restOfWord
                } else {
                    firstChar.toString() + restOfWord
                }
            }

            // Join them with spaces
            return capitalizedParts.joinToString(" ")
        }

        // Fallback to the original ID
        return locationId
    }
    
    // Load and show a specific reminder based on schedule ID
    private fun loadSpecificReminder(scheduleId: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                Log.d(TAG, "Loading specific reminder for schedule ID: $scheduleId")
                
                // First check if there's already a reminder for this schedule
                val remindersResult = reminderService.getAllReminders()
                
                if (remindersResult.isSuccess) {
                    val reminders = remindersResult.getOrNull() ?: emptyList()
                    Log.d(TAG, "Found ${reminders.size} reminders in total")
                    
                    // Find a reminder associated with this schedule
                    val existingReminder = reminders.find { it.scheduleId == scheduleId }
                    
                    if (existingReminder != null) {
                        // If we found a reminder, show it
                        Log.d(TAG, "Found existing reminder with ID: ${existingReminder.reminderId} for schedule: $scheduleId")
                        withContext(Dispatchers.Main) {
                            showReminderInfo(existingReminder)
                        }
                    } else {
                        // No reminder found for this schedule - keep the card hidden
                        Log.d(TAG, "No reminder found for schedule ID: $scheduleId")
                        withContext(Dispatchers.Main) {
                            binding.nextPickupCard.visibility = View.GONE
                            Toast.makeText(
                                this@HomeActivity,
                                "No reminder found for this schedule. Please try setting a reminder again.",
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                    }
                } else {
                    // Failed to load reminders - keep the card hidden
                    val error = remindersResult.exceptionOrNull()?.message ?: "Unknown error"
                    Log.e(TAG, "Failed to load reminders: $error")
                    withContext(Dispatchers.Main) {
                        binding.nextPickupCard.visibility = View.GONE
                        Toast.makeText(
                            this@HomeActivity,
                            "Could not load reminders: $error",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }
            } catch (e: Exception) {
                // Error loading reminders - keep the card hidden
                Log.e(TAG, "Error loading specific reminder: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    binding.nextPickupCard.visibility = View.GONE
                    Toast.makeText(
                        this@HomeActivity,
                        "Error loading reminder: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
    
    // New method to load active reminders
    private fun loadActiveReminders() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val result = reminderService.getAllReminders()
                
                withContext(Dispatchers.Main) {
                    if (result.isSuccess) {
                        val reminders = if (result.getOrNull() != null) {
                            result.getOrNull()!!
                        } else {
                            emptyList()
                        }
                        
                        // Filter to only show active reminders (those in the future)
                        val activeReminders = reminders.filter { reminder ->
                            if (reminder.reminderDate != null) {
                                reminder.reminderDate.after(Date())
                            } else {
                                false
                            }
                        }
                        
                        // If we have active reminders, update the UI to show them
                        if (activeReminders.isNotEmpty()) {
                            Log.d(TAG, "Found ${activeReminders.size} active reminders")
                            
                            // Just get the first reminder for now - use a fallback Date() for null dates
                            val nextReminder = activeReminders.minByOrNull { reminder -> 
                                if (reminder.reminderDate != null) {
                                    reminder.reminderDate
                                } else {
                                    Date()
                                }
                            }
                            
                            if (nextReminder != null) {
                                showReminderInfo(nextReminder)
                            } else {
                                Log.d(TAG, "No next reminder found despite having active reminders")
                            }
                        } else {
                            Log.d(TAG, "No active reminders found")
                        }
                    } else {
                        Log.e(TAG, "Failed to load reminders: ${result.exceptionOrNull()?.message}")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading reminders: ${e.message}", e)
            }
        }
    }
    
    private fun showReminderInfo(reminder: Reminder) {
        try {
            // Store current reminder reference
            currentReminder = reminder
            
            // Format the reminder date for display
            val displayFormat = SimpleDateFormat("EEEE, MMMM d, yyyy 'at' h:mm a", Locale.getDefault())
            val dateStr = if (reminder.reminderDate != null) {
                displayFormat.format(reminder.reminderDate)
            } else {
                "Unknown date"
            }
            
            // Show the reminder in the UI
            binding.nextPickupCard.visibility = View.VISIBLE
            binding.nextPickupTitle.text = reminder.title
            binding.nextPickupTimeText.text = dateStr
            binding.nextPickupMessage.text = reminder.reminderMessage
            binding.nextPickupMessage.visibility = View.VISIBLE
            
            Log.d(TAG, "Showing reminder: ${reminder.title} at $dateStr")
            
            // If we have a scheduleId, try to load the related schedule
            if (reminder.scheduleId.isNotEmpty()) {
                loadScheduleForReminder(reminder.scheduleId)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error showing reminder: ${e.message}", e)
        }
    }
    
    private fun loadScheduleForReminder(scheduleId: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val result = scheduleService.getAllSchedules()
                
                withContext(Dispatchers.Main) {
                    if (result.isSuccess) {
                        val schedules = if (result.getOrNull() != null) {
                            result.getOrNull()!!
                        } else {
                            emptyList()
                        }
                        
                        // Find the specific schedule
                        val schedule = schedules.find { it.scheduleId == scheduleId }
                        
                        if (schedule != null) {
                            // Update UI with schedule details if needed
                            val locationName = getLocationDisplayName(schedule.locationId)
                            val locationText = "Location: $locationName"
                            binding.nextPickupLocation.text = locationText
                            binding.nextPickupLocation.visibility = View.VISIBLE
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading schedule for reminder: ${e.message}", e)
            }
        }
    }
    
    // Add new method to delete a reminder
    private fun deleteReminder(reminderId: String) {
        if (reminderId.isEmpty()) {
            Log.e(TAG, "Cannot delete reminder: reminderId is empty")
            return
        }
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val result = reminderService.deleteReminder(reminderId)
                
                withContext(Dispatchers.Main) {
                    if (result.isSuccess) {
                        // Hide the reminder card
                        binding.nextPickupCard.visibility = View.GONE
                        currentReminder = null
                        
                        Toast.makeText(
                            this@HomeActivity,
                            "Reminder deleted successfully",
                            Toast.LENGTH_SHORT
                        ).show()
                        
                        Log.d(TAG, "Successfully deleted reminder: $reminderId")
                    } else {
                        val error = result.exceptionOrNull()?.message ?: "Unknown error"
                        Log.e(TAG, "Failed to delete reminder: $error")
                        
                        Toast.makeText(
                            this@HomeActivity,
                            "Failed to delete reminder: $error",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error deleting reminder: ${e.message}", e)
                
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
    
    override fun onResume() {
        super.onResume()
        // Load active reminders when the activity resumes
        loadActiveReminders()
    }

    private fun handleShowReminderIntent() {
        // Initially hide the reminder card - it will only show when a valid reminder is found
        binding.nextPickupCard.visibility = View.GONE
        
        // Check if we need to show a specific reminder (only when coming from "Remind Me" button)
        val scheduleId = intent.getStringExtra("SHOW_REMINDER_SCHEDULE_ID")
        if (scheduleId != null) {
            // If a specific schedule ID was passed, try to show that reminder
            loadSpecificReminder(scheduleId)
        } else {
            // Load any active reminders
        loadActiveReminders()
        }
    }
    
    private fun loadNextPickupInfo() {
        loadUserData()
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
}
