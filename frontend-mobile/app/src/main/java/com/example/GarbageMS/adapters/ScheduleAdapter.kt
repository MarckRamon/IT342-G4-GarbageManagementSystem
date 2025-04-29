package com.example.GarbageMS.adapters

import android.content.Context
import android.content.Intent
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.cardview.widget.CardView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.example.GarbageMS.HistoryActivity
import com.example.GarbageMS.R
import com.example.GarbageMS.HomeActivity
import com.example.GarbageMS.models.Reminder
import com.example.GarbageMS.models.ReminderRequest
import com.example.GarbageMS.models.Schedule
import com.example.GarbageMS.models.ScheduleRequest
import com.example.GarbageMS.services.ReminderService
import com.example.GarbageMS.services.ScheduleService
import com.example.GarbageMS.utils.DateConverter
import com.example.GarbageMS.utils.SessionManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.time.LocalDate

class ScheduleAdapter : RecyclerView.Adapter<ScheduleAdapter.ScheduleViewHolder>() {

    private var scheduleList: List<Schedule> = emptyList()
    private var onItemClickListener: ((Schedule) -> Unit)? = null
    private var onRemindMeClickListener: ((Schedule) -> Unit)? = null
    private var onCompleteClickListener: ((Schedule) -> Unit)? = null
    private var onReportClickListener: ((Schedule) -> Unit)? = null
    private val reminderService = ReminderService.getInstance()
    private val scheduleService = ScheduleService.getInstance()
    private val TAG = "ScheduleAdapter"
    private var sessionManager: SessionManager? = null
    private var isServiceInitialized = false
    private var context: Context? = null

    fun updateSchedules(newScheduleList: List<Schedule>) {
        scheduleList = newScheduleList
        notifyDataSetChanged()
    }

    fun setOnItemClickListener(listener: (Schedule) -> Unit) {
        onItemClickListener = listener
    }
    
    fun setOnRemindMeClickListener(listener: (Schedule) -> Unit) {
        onRemindMeClickListener = listener
    }
    
    fun setOnCompleteClickListener(listener: (Schedule) -> Unit) {
        onCompleteClickListener = listener
    }
    
    fun setOnReportClickListener(listener: (Schedule) -> Unit) {
        onReportClickListener = listener
    }
    
    fun initialize(sessionManager: SessionManager, context: Context) {
        this.sessionManager = sessionManager
        this.context = context
        reminderService.initialize(sessionManager)
        reminderService.setContext(context)
        scheduleService.initialize(sessionManager)
        scheduleService.setContext(context)
        isServiceInitialized = true
        Log.d(TAG, "ScheduleAdapter initialized with SessionManager and Context")
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ScheduleViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_schedule, parent, false)
            
        // Initialize services if not already done
        if (!isServiceInitialized) {
            initializeServices(parent.context)
        }
        
        return ScheduleViewHolder(view)
    }
    
    private fun initializeServices(context: Context) {
        if (sessionManager == null) {
            sessionManager = SessionManager.getInstance(context)
            sessionManager?.let {
                reminderService.initialize(it)
                reminderService.setContext(context)
                scheduleService.initialize(it)
                Log.d(TAG, "Initialized ReminderService and ScheduleService with SessionManager")
                isServiceInitialized = true
            }
        }
    }

    override fun onBindViewHolder(holder: ScheduleViewHolder, position: Int) {
        holder.bind(scheduleList[position])
    }

    override fun getItemCount(): Int = scheduleList.size

    inner class ScheduleViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val cardView: CardView = itemView.findViewById(R.id.scheduleCard)
        private val locationText: TextView = itemView.findViewById(R.id.locationText)
        private val dateText: TextView = itemView.findViewById(R.id.dateText)
        private val timeText: TextView = itemView.findViewById(R.id.timeText)
        private val statusText: TextView = itemView.findViewById(R.id.statusText)
        private val btnRemindMe: Button = itemView.findViewById(R.id.btnRemindMe)
        private val btnReport: Button = itemView.findViewById(R.id.btnReport)
        private val btnComplete: Button = itemView.findViewById(R.id.btnComplete)

        fun bind(schedule: Schedule) {
            // Improve location display
            val locationDisplay = when {
                schedule.locationId.contains("location-id-from-pickup-locations") -> {
                    "Community Pickup Location" // Friendly name for standard pickup location
                }
                schedule.locationId.isEmpty() -> {
                    "No location specified"
                }
                else -> {
                    // Try to extract a meaningful name from the locationId if it follows a pattern
                    val parts = schedule.locationId.split("-")
                    if (parts.size > 1) {
                        // Capitalize each word for a nicer display
                        parts.subList(1, parts.size).joinToString(" ") { 
                            it.replaceFirstChar { char -> 
                                if (char.isLowerCase()) char.titlecase() else char.toString() 
                            }
                        }
                    } else {
                        schedule.locationId // Fallback to the original ID
                    }
                }
            }
            
            locationText.text = locationDisplay
            dateText.text = schedule.pickupDate
            timeText.text = schedule.pickupTime
            statusText.text = schedule.status
            
            // Debug - log schedule details
            Log.d(TAG, "Binding schedule: ${schedule.scheduleId}, " +
                    "location: ${schedule.locationId}, " +
                    "date: ${schedule.pickupDate}, " +
                    "time: ${schedule.pickupTime}, " +
                    "status: ${schedule.status}")
                    
            // Check if the schedule is past or today's date for Report button
            val scheduleDate = DateConverter.stringToLocalDate(schedule.pickupDate)
            val today = LocalDate.now()
            val isPastOrToday = scheduleDate != null && 
                              (scheduleDate.isBefore(today) || scheduleDate.isEqual(today))
            val isCompleted = schedule.status.equals("COMPLETED", ignoreCase = true)

            // Set color based on status
            when (schedule.status.uppercase()) {
                "PENDING" -> {
                    statusText.setTextColor(ContextCompat.getColor(itemView.context, R.color.orange))
                    // Show Remind Me button for PENDING schedules
                    btnRemindMe.visibility = View.VISIBLE
                    btnComplete.visibility = View.GONE // Always hide Complete button as only admins can complete
                    
                    // Show Report button for past or today's PENDING schedules
                    btnReport.visibility = if (isPastOrToday) View.VISIBLE else View.GONE
                }
                "COMPLETED" -> {
                    statusText.setTextColor(ContextCompat.getColor(itemView.context, R.color.secondary))
                    btnRemindMe.visibility = View.GONE
                    btnComplete.visibility = View.GONE
                    btnReport.visibility = View.GONE // Don't show report button for COMPLETED schedules
                }
                "CANCELLED" -> {
                    statusText.setTextColor(ContextCompat.getColor(itemView.context, R.color.error))
                    btnRemindMe.visibility = View.GONE
                    btnComplete.visibility = View.GONE
                    btnReport.visibility = View.GONE
                }
                else -> {
                    statusText.setTextColor(ContextCompat.getColor(itemView.context, R.color.text_secondary))
                    btnRemindMe.visibility = View.GONE
                    btnComplete.visibility = View.GONE
                    btnReport.visibility = View.GONE
                }
            }

            // Set click listener for the entire item
            itemView.setOnClickListener {
                onItemClickListener?.invoke(schedule)
            }
            
            // Set click listener for the Report button
            btnReport.setOnClickListener {
                onReportClickListener?.invoke(schedule)
            }
            
            // Set click listener for the Remind Me button
            btnRemindMe.setOnClickListener {
                // Notify the parent activity
                onRemindMeClickListener?.invoke(schedule)
                
                // Create a reminder through the Reminder API
                createReminderForSchedule(schedule)
                
                // Show immediate feedback
                Toast.makeText(
                    itemView.context,
                    "Setting reminder for pickup...",
                    Toast.LENGTH_SHORT
                ).show()
                
                // Navigate to Home screen with the schedule ID to show the reminder
                val intent = Intent(itemView.context, HomeActivity::class.java)
                intent.putExtra("SHOW_REMINDER_SCHEDULE_ID", schedule.scheduleId)
                intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
                itemView.context.startActivity(intent)
            }
        }
        
        private fun createReminderForSchedule(schedule: Schedule) {
            // Extract date and time from schedule
            val dateStr = schedule.pickupDate // Format: "yyyy-MM-dd"
            val timeStr = schedule.pickupTime // Format: "HH:mm" or "h:mm AM/PM"
            
            Log.d(TAG, "Creating reminder for schedule: ${schedule.scheduleId}, date: $dateStr, time: $timeStr")
            
            try {
                // Set context for the reminder service to enable notifications
                reminderService.setContext(itemView.context)
                
                // DEBUG MODE: Send an immediate test notification
                // Remove this in production or change to false
                val debugMode = false
                if (debugMode) {
                    Toast.makeText(
                        itemView.context,
                        "Testing notifications: Will try to connect to backend API...",
                        Toast.LENGTH_LONG
                    ).show()
                    
                    // Create a dialog to show the user we're testing notifications
                    AlertDialog.Builder(itemView.context)
                        .setTitle("Testing Notifications")
                        .setMessage("How would you like to test notifications?\n\n" +
                                "Regular: Use the normal app notification system\n" +
                                "Direct Postman: Test using the exact format from Postman")
                        .setPositiveButton("Regular") { dialog, _ ->
                            dialog.dismiss()
                            // Send the test notification after the user acknowledges
                            reminderService.sendTestNotification(itemView.context)
                        }
                        .setNegativeButton("Direct Postman") { dialog, _ ->
                            dialog.dismiss()
                            // Test using direct Postman-style connection
                            reminderService.testDirectPostmanConnection(itemView.context)
                        }
                        .setNeutralButton("Cancel", null)
                        .show()
                }
                
                // Parse date
                val localDate = DateConverter.stringToLocalDate(dateStr)
                if (localDate == null) {
                    Log.e(TAG, "Failed to parse date: $dateStr")
                    Toast.makeText(
                        itemView.context,
                        "Could not create reminder: Invalid date format",
                        Toast.LENGTH_SHORT
                    ).show()
                    return
                }
                
                // Parse time - handle both 12-hour and 24-hour formats
                var hour = 0
                var minute = 0
                
                try {
                    if (timeStr.contains(":")) {
                        val timeParts = timeStr.split(":")
                        
                        // Extract hour
                        hour = timeParts[0].trim().toInt()
                        
                        // Check for AM/PM format
                        val isPM = timeStr.contains("PM", ignoreCase = true)
                        if (isPM && hour < 12) hour += 12
                        if (!isPM && hour == 12) hour = 0
                        
                        // Extract minutes - remove AM/PM suffix if present
                        val minuteStr = timeParts[1].replace("AM", "").replace("PM", "").trim()
                        minute = minuteStr.toInt()
                    } else {
                        Log.e(TAG, "Invalid time format (missing colon): $timeStr")
                        Toast.makeText(
                            itemView.context,
                            "Could not create reminder: Invalid time format",
                            Toast.LENGTH_SHORT
                        ).show()
                        return
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing time: $timeStr - ${e.message}")
                    Toast.makeText(
                        itemView.context,
                        "Could not create reminder: Invalid time format",
                        Toast.LENGTH_SHORT
                    ).show()
                    return
                }
                
                Log.d(TAG, "Parsed time - Hour: $hour, Minute: $minute")
                
                // Create calendar for the reminder time
                val calendar = Calendar.getInstance()
                
                // For testing: set reminder to 15 seconds from now (TESTING ONLY)
                if (debugMode) {
                    // Current time + 15 seconds
                    calendar.add(Calendar.SECOND, 15)
                    Toast.makeText(
                        itemView.context,
                        "Debug mode: Reminder set for 15 seconds from now",
                        Toast.LENGTH_LONG
                    ).show()
                } else {
                    // Normal mode: set to actual pickup time
                    calendar.apply {
                        set(Calendar.YEAR, localDate.year)
                        set(Calendar.MONTH, localDate.monthValue - 1) // Month is 0-based in Calendar
                        set(Calendar.DAY_OF_MONTH, localDate.dayOfMonth)
                        set(Calendar.HOUR_OF_DAY, hour)
                        set(Calendar.MINUTE, minute)
                        set(Calendar.SECOND, 0)
                        set(Calendar.MILLISECOND, 0)
                    }
                }
                
                val reminderDate = calendar.time
                
                Log.d(TAG, "Setting reminder for: ${SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(reminderDate)}")
                
                // Create reminder request with a descriptive message
                val reminderRequest = ReminderRequest(
                    title = "GMS Trash Pickup Reminder",
                    reminderMessage = "You have a scheduled trash pickup at ${schedule.pickupTime} in your location",
                    reminderDate = reminderDate,
                    scheduleId = schedule.scheduleId
                )
                
                // Call the API in a coroutine
                CoroutineScope(Dispatchers.IO).launch {
                    try {
                        Log.d(TAG, "Calling createReminder API for schedule: ${schedule.scheduleId}")
                        val result = reminderService.createReminder(reminderRequest)
                        
                        withContext(Dispatchers.Main) {
                            if (result.isSuccess) {
                                val response = result.getOrNull()
                                if (response != null && response.reminderId != null) {
                                    Log.d(TAG, "Reminder created successfully with ID: ${response.reminderId}")
                                    
                                    // Show success message
                                    Toast.makeText(
                                        itemView.context,
                                        "Reminder set for ${SimpleDateFormat("hh:mm a", Locale.getDefault()).format(reminderDate)}",
                                        Toast.LENGTH_LONG
                                    ).show()
                                } else {
                                    Log.e(TAG, "Reminder created but no ID was returned")
                                }
                            } else {
                                val error = result.exceptionOrNull()
                                Log.e(TAG, "Error creating reminder: ${error?.message}")
                                
                                Toast.makeText(
                                    itemView.context,
                                    "Failed to create reminder: ${error?.message ?: "Unknown error"}",
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Exception creating reminder: ${e.message}", e)
                        
                        withContext(Dispatchers.Main) {
                            Toast.makeText(
                                itemView.context,
                                "Error creating reminder: ${e.message}",
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception preparing reminder: ${e.message}", e)
                Toast.makeText(
                    itemView.context,
                    "Error creating reminder: ${e.message}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }
} 