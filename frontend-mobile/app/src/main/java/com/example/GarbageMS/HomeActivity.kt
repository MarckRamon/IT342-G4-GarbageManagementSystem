package com.example.GarbageMS

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import com.example.GarbageMS.databinding.ActivityHomeBinding
import com.example.GarbageMS.models.Schedule
import com.example.GarbageMS.services.ScheduleService
import com.example.GarbageMS.utils.ApiService
import com.example.GarbageMS.utils.DateConverter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.LocalDate
import java.util.ArrayList

class HomeActivity : BaseActivity() {
    private lateinit var binding: ActivityHomeBinding
    private val apiService = ApiService.create()
    private val scheduleService = ScheduleService.getInstance()
    private val TAG = "HomeActivity"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // The authentication check is already done in BaseActivity
        // We only continue if the user is authenticated

        // Initialize services
        scheduleService.initialize(sessionManager)

        setupListeners()
        setupBottomNavigation() // Added call
        loadUserData()
        
        // Check if we need to show a specific reminder
        val scheduleId = intent.getStringExtra("SHOW_REMINDER_SCHEDULE_ID")
        if (scheduleId != null) {
            // If a specific schedule ID was passed, show that reminder
            loadSpecificReminder(scheduleId)
        } else {
            // Otherwise, load the next upcoming pickup as usual
            loadNextPickup()
        }
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
        
        // Handle close button click on the reminder card
        binding.closeReminderButton.setOnClickListener {
            binding.nextPickupCard.visibility = View.GONE
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
                            val firstName = profileResponse.firstName ?: "User"
                            val lastName = profileResponse.lastName ?: ""
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
                        val schedules = result.getOrNull() ?: emptyList()
                        
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
            val localDate = DateConverter.stringToLocalDate(schedule.pickupDate)
            // Make sure we have a valid date
            if (localDate == null) {
                Log.e(TAG, "Invalid date format for schedule: ${schedule.scheduleId}")
                return
            }
            
            val formattedDate = DateConverter.localDateToDisplayString(localDate)
            
            // Show the next pickup card with updated info
            binding.nextPickupCard.visibility = View.VISIBLE
            
            // Format the display text to include date and time
            val timeDisplay = schedule.pickupTime
            val locationName = getLocationDisplayName(schedule.locationId)
            
            // Update the pickup time text
            binding.nextPickupTimeText.text = "$formattedDate at $timeDisplay"
            
            Log.d(TAG, "Showing pickup reminder for: $formattedDate at $timeDisplay")
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

                // This is where the error is - this if statement needs an else branch
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
                val result = scheduleService.getAllSchedules()
                
                withContext(Dispatchers.Main) {
                    if (result.isSuccess) {
                        val schedules = result.getOrNull() ?: emptyList()
                        
                        // Find the specific schedule
                        val schedule = schedules.find { it.scheduleId == scheduleId }
                        
                        if (schedule != null) {
                            // Show this specific reminder
                            showPickupReminder(schedule)
                            Log.d(TAG, "Showing specific reminder for schedule ID: $scheduleId")
                        } else {
                            // If schedule not found, fall back to the next pickup
                            Log.d(TAG, "Schedule ID $scheduleId not found, falling back to next pickup")
                            loadNextPickup()
                        }
                    } else {
                        Log.e(TAG, "Failed to load schedules: ${result.exceptionOrNull()?.message}")
                        binding.nextPickupCard.visibility = View.GONE
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading specific reminder: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    binding.nextPickupCard.visibility = View.GONE
                }
            }
        }
    }
    
    override fun onResume() {
        super.onResume()
        // Refresh pickup reminder data when coming back to this screen
        loadNextPickup()
    }
}
