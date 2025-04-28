package com.example.GarbageMS

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.core.view.isVisible
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.GarbageMS.adapters.ScheduleAdapter
import com.example.GarbageMS.databinding.ActivityScheduleBinding
import com.example.GarbageMS.models.Schedule
import com.example.GarbageMS.services.ReminderService
import com.example.GarbageMS.services.ScheduleService
import com.example.GarbageMS.utils.DateConverter
import com.kizitonwose.calendar.core.CalendarDay
import com.kizitonwose.calendar.core.DayPosition
import com.kizitonwose.calendar.core.daysOfWeek
import com.kizitonwose.calendar.view.MonthDayBinder
import com.kizitonwose.calendar.view.ViewContainer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.LocalDate
import java.time.YearMonth
import java.time.temporal.WeekFields
import java.util.Locale
import android.widget.TextView

class ScheduleActivity : BaseActivity() {

    private lateinit var binding: ActivityScheduleBinding
    private val scheduleService = ScheduleService.getInstance()
    private val reminderService = ReminderService.getInstance()
    private lateinit var scheduleAdapter: ScheduleAdapter
    private val TAG = "ScheduleActivity"
    
    // Store all schedules for filtering by date
    private var allSchedules: List<Schedule> = emptyList()
    private var selectedDate: LocalDate = LocalDate.now()
    
    // For tracking selected day view
    private var selectedDayView: View? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        binding = ActivityScheduleBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // BaseActivity handles authentication checks
        scheduleService.initialize(sessionManager)
        reminderService.initialize(sessionManager)

        // Setup RecyclerView and adapter
        setupRecyclerView()
        
        // Setup UI components
        setupListeners()
        setupBottomNavigation()
        
        // Setup calendar after the view has been laid out
        binding.root.post {
            setupCalendar()
            // Load schedules after calendar is set up
            loadSchedules()
        }
    }
    
    private fun setupRecyclerView() {
        // Create a vertical layout manager for our RecyclerView
        val layoutManager = LinearLayoutManager(this)
        binding.schedulesRecyclerView.layoutManager = layoutManager
        
        // Create and set the adapter
        scheduleAdapter = ScheduleAdapter()
        binding.schedulesRecyclerView.adapter = scheduleAdapter
        
        // Set up click listener
        scheduleAdapter.setOnItemClickListener { schedule ->
            // Show schedule details if needed
            Toast.makeText(this, "Schedule: ${schedule.pickupDate} at ${schedule.pickupTime}", Toast.LENGTH_SHORT).show()
        }
        
        // Set up Remind Me button click listener
        scheduleAdapter.setOnRemindMeClickListener { schedule ->
            // Log when remind me is clicked, actual reminder is created in adapter
            Log.d(TAG, "Remind Me button clicked for schedule: ${schedule.scheduleId}")
        }
        
        // Set up Complete button click listener
        scheduleAdapter.setOnCompleteClickListener { schedule ->
            // Log when complete button is clicked, actual completion is handled in adapter
            Log.d(TAG, "Complete button clicked for schedule: ${schedule.scheduleId}")
        }
    }
    
    private fun setupCalendar() {
        // Set up calendar layout first
        val daysOfWeek = daysOfWeek()
        
        // Set up the calendar with day binder
        binding.calendarView.dayBinder = object : MonthDayBinder<DayViewContainer> {
            override fun create(view: View) = DayViewContainer(view)
            
            override fun bind(container: DayViewContainer, day: CalendarDay) {
                container.day = day
                val textView = container.textView
                
                textView.text = day.date.dayOfMonth.toString()
                
                // Style based on day position and selection
                when (day.position) {
                    DayPosition.MonthDate -> {
                        textView.setTextColor(ContextCompat.getColor(this@ScheduleActivity, R.color.black))
                        textView.alpha = 1f
                        
                        // Set selection color if this day is selected
                        if (day.date.equals(selectedDate)) {
                            container.view.setBackgroundResource(R.drawable.selected_day_background)
                            selectedDayView = container.view
                        } else {
                            container.view.background = null
                        }
                        
                        // Mark days that have schedules with a dot
                        val dateString = DateConverter.localDateToString(day.date)
                        val hasSchedule = allSchedules.any { schedule ->
                            schedule.pickupDate == dateString
                        }
                        
                        Log.d(TAG, "Day ${day.date}: hasSchedule=$hasSchedule, date=$dateString")
                        if (hasSchedule) {
                            Log.d(TAG, "Matching schedules for $dateString: ${allSchedules.filter { it.pickupDate == dateString }}")
                        }
                        
                        // Show/hide the event indicator based on whether there are any schedules
                        container.eventDot.isVisible = hasSchedule
                    }
                    DayPosition.InDate, DayPosition.OutDate -> {
                        // Fade out the day if it's outside the current month
                        textView.setTextColor(ContextCompat.getColor(this@ScheduleActivity, R.color.grey))
                        textView.alpha = 0.5f
                        container.view.background = null
                        container.eventDot.isVisible = false
                    }
                }
            }
        }
        
        // Set up month header
        binding.calendarView.monthScrollListener = { month ->
            val monthText = month.yearMonth.month.toString().lowercase().replaceFirstChar { 
                if (it.isLowerCase()) it.titlecase(Locale.getDefault()) else it.toString() 
            }
            val yearText = month.yearMonth.year.toString()
            val headerTitle = "$monthText $yearText"
            
            try {
                val headerView = findViewById<TextView>(R.id.calendarHeaderTitle)
                if (headerView != null) {
                    headerView.text = headerTitle
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error updating calendar header: ${e.message}")
            }
        }
        
        // Set up the calendar
        val startMonth = DateConverter.getStartMonth()
        val endMonth = DateConverter.getEndMonth()
        val firstDayOfWeek = WeekFields.of(Locale.getDefault()).firstDayOfWeek
        
        binding.calendarView.setup(startMonth, endMonth, firstDayOfWeek)
        
        // Explicitly scroll to current month and ensure it's visible
        val currentMonth = YearMonth.now()
        Log.d(TAG, "Scrolling to current month: $currentMonth")
        binding.calendarView.scrollToMonth(currentMonth)
        
        // Update selected date text
        updateSelectedDateText(LocalDate.now())
    }

    private fun loadSchedules() {
        // Show loading state
        binding.progressBar.visibility = View.VISIBLE
        binding.schedulesRecyclerView.visibility = View.GONE
        binding.emptyStateLayout.visibility = View.GONE
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Directly load all schedules since they're meant to be public
                val result = scheduleService.getAllSchedules()
                
                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = View.GONE
                    
                    if (result.isSuccess) {
                        allSchedules = result.getOrNull() ?: emptyList()
                        
                        // Log the schedules for debugging
                        Log.d(TAG, "Loaded ${allSchedules.size} schedules")
                        allSchedules.forEach { schedule ->
                            Log.d(TAG, "Schedule: ${schedule.scheduleId} - Date: ${schedule.pickupDate}, Time: ${schedule.pickupTime}, Status: ${schedule.status}")
                            
                            // Check for completed schedules and create history records for them
                            if (schedule.status.equals("COMPLETED", ignoreCase = true)) {
                                checkAndCreateHistoryForCompletedSchedule(schedule)
                            }
                        }
                        
                        // Add test data if no schedules are available
                        if (allSchedules.isEmpty()) {
                            Log.d(TAG, "No schedules found from API, creating test data")
                            allSchedules = createTestSchedules()
                        }
                        
                        // Refresh calendar to show event dots
                        binding.calendarView.notifyCalendarChanged()
                        
                        // Filter schedules for the selected date
                        filterSchedulesByDate(selectedDate)
                        
                        // Handle update for next pickup card
                        updateNextPickupCard(allSchedules)
                    } else {
                        val exception = result.exceptionOrNull()
                        Log.e(TAG, "Failed to load schedules: ${exception?.message}", exception)
                        
                        // Use test data as fallback
                        Log.d(TAG, "Using test data as fallback")
                        allSchedules = createTestSchedules()
                        binding.calendarView.notifyCalendarChanged()
                        filterSchedulesByDate(selectedDate)
                        updateNextPickupCard(allSchedules)
                        
                        Toast.makeText(
                            this@ScheduleActivity,
                            "Using test schedule data",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading schedules: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = View.GONE
                    
                    // Use test data as fallback
                    Log.d(TAG, "Using test data as fallback due to exception")
                    allSchedules = createTestSchedules()
                    binding.calendarView.notifyCalendarChanged()
                    filterSchedulesByDate(selectedDate)
                    updateNextPickupCard(allSchedules)
                    
                    Toast.makeText(
                        this@ScheduleActivity,
                        "Error loading schedules: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
    
    /**
     * Check if a completed schedule already has a history record and creates one if needed
     */
    private fun checkAndCreateHistoryForCompletedSchedule(schedule: Schedule) {
        Log.d(TAG, "Checking if history record exists for completed schedule: ${schedule.scheduleId}")
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // First, check if the user is logged in
                if (sessionManager.getToken().isNullOrEmpty()) {
                    Log.d(TAG, "User not logged in, cannot create history")
                    return@launch
                }
                
                // Check if history record already exists for this schedule
                val historyService = com.example.GarbageMS.services.HistoryService.getInstance().apply {
                    initialize(sessionManager)
                }
                
                val existingHistories = historyService.getAllHistory().getOrNull() ?: emptyList()
                val historyExists = existingHistories.any { it.scheduleId == schedule.scheduleId }
                
                if (historyExists) {
                    Log.d(TAG, "History record already exists for schedule ID: ${schedule.scheduleId}")
                    return@launch
                }
                
                // Create a history record in the background without navigating
                val currentDate = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ISO_DATE)
                val notes = "Garbage collected from location ${schedule.locationId}"
                
                val historyRequest = com.example.GarbageMS.models.HistoryRequest(
                    collectionDate = currentDate,
                    notes = notes,
                    scheduleId = schedule.scheduleId
                )
                
                val result = historyService.createHistory(historyRequest)
                if (result.isSuccess) {
                    Log.d(TAG, "Successfully created history record for schedule: ${schedule.scheduleId}")
                    
                    withContext(Dispatchers.Main) {
                        Toast.makeText(
                            this@ScheduleActivity,
                            "Created history record for completed collection",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                } else {
                    val exception = result.exceptionOrNull()
                    Log.e(TAG, "Error creating history: ${exception?.message}", exception)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error checking/creating history: ${e.message}", e)
            }
        }
    }
    
    /**
     * Creates test schedule data for development and testing
     */
    private fun createTestSchedules(): List<Schedule> {
        val today = LocalDate.now()
        val tomorrow = today.plusDays(1)
        val nextWeek = today.plusDays(7)
        
        val testSchedules = listOf(
            Schedule(
                scheduleId = "test-1",
                pickupDate = DateConverter.localDateToString(today),
                pickupTime = "08:00 AM",
                locationId = "loc-1",
                status = "PENDING",
                userId = "user-1",
                userEmail = "test@example.com"
            ),
            Schedule(
                scheduleId = "test-2",
                pickupDate = DateConverter.localDateToString(tomorrow),
                pickupTime = "10:00 AM",
                locationId = "loc-2",
                status = "PENDING",
                userId = "user-1",
                userEmail = "test@example.com"
            ),
            Schedule(
                scheduleId = "test-3",
                pickupDate = DateConverter.localDateToString(nextWeek),
                pickupTime = "09:00 AM",
                locationId = "loc-3",
                status = "PENDING",
                userId = "user-1",
                userEmail = "test@example.com"
            )
        )
        
        Log.d(TAG, "Created ${testSchedules.size} test schedules:")
        testSchedules.forEach { schedule ->
            Log.d(TAG, "Test Schedule: Date: ${schedule.pickupDate}, Time: ${schedule.pickupTime}")
        }
        
        return testSchedules
    }
    
    private fun filterSchedulesByDate(date: LocalDate) {
        // Convert LocalDate to string format for comparison
        val dateString = DateConverter.localDateToString(date)
        
        // Filter schedules for the selected date
        val filteredSchedules = allSchedules.filter { 
            it.pickupDate == dateString 
        }
        
        Log.d(TAG, "Filtering schedules for date $dateString: found ${filteredSchedules.size} schedules")
        
        // Update adapter with filtered schedules
        if (filteredSchedules.isEmpty()) {
            showEmptyState("No schedules for this date")
        } else {
            binding.schedulesRecyclerView.visibility = View.VISIBLE
            binding.emptyStateLayout.visibility = View.GONE
            scheduleAdapter.updateSchedules(filteredSchedules)
        }
    }
    
    private fun updateSelectedDateText(date: LocalDate) {
        val formattedDate = DateConverter.localDateToDisplayString(date)
        binding.selectedDateText.text = "Schedules for $formattedDate"
    }
    
    private fun updateNextPickupCard(schedules: List<Schedule>) {
        // Find the next pending schedule
        val nextSchedule = schedules
            .filter { it.status.equals("PENDING", ignoreCase = true) }
            .minByOrNull { it.pickupDate }
        
        if (nextSchedule != null) {
            // We've removed the pickup card from this activity, 
            // so we'll just log the information
            Log.d(TAG, "Next pickup would be at ${nextSchedule.pickupTime}")
        }
    }
    
    private fun showEmptyState(message: String) {
        binding.schedulesRecyclerView.visibility = View.GONE
        binding.emptyStateLayout.visibility = View.VISIBLE
        binding.emptyStateText.text = message
    }

    private fun setupListeners() {
        binding.backButton.setOnClickListener {
            finish() // Go back to the previous activity
        }

        binding.btnNotifications.setOnClickListener {
            startActivity(Intent(this, NotificationsActivity::class.java))
        }

        binding.profileImage.setOnClickListener {
            // Navigate to profile page
            startActivity(Intent(this, ProfileActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_REORDER_TO_FRONT // Bring existing ProfileActivity to front if it exists
            })
        }
        
        binding.refreshLayout.setOnRefreshListener {
            // Reload schedules when user performs pull-to-refresh
            loadSchedules()
            binding.refreshLayout.isRefreshing = false
        }
    }

    private fun setupBottomNavigation() {
        binding.bottomNavigation.selectedItemId = R.id.navigation_schedule // Highlight the schedule icon

        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.navigation_home -> {
                    val intent = Intent(this, HomeActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_REORDER_TO_FRONT // Bring existing HomeActivity to front
                    startActivity(intent)
                    true // Consume the event
                }
                R.id.navigation_schedule -> {
                    // Already on this screen, do nothing
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

    // Prevent navigating back to Login/Register if back is pressed from a main activity
    override fun onBackPressed() {
        super.onBackPressed()
    }
    
    override fun onResume() {
        super.onResume()
        // Ensure we're showing the current month
        binding.root.post {
            val currentMonth = YearMonth.now()
            binding.calendarView.scrollToMonth(currentMonth)
        }
        // Reload data when coming back to this screen
        loadSchedules()
    }
    
    // Custom container for calendar day cells
    inner class DayViewContainer(view: View) : ViewContainer(view) {
        lateinit var day: CalendarDay
        val textView: TextView = view.findViewById(R.id.calendarDayText)
        val eventDot: View = view.findViewById(R.id.eventDot)
        
        init {
            view.setOnClickListener {
                if (day.position == DayPosition.MonthDate) {
                    // Deselect previous selection
                    selectedDayView?.background = null
                    
                    // Select this day
                    view.setBackgroundResource(R.drawable.selected_day_background)
                    selectedDayView = view
                    
                    // Update selected date and filter schedules
                    selectedDate = day.date
                    updateSelectedDateText(selectedDate)
                    filterSchedulesByDate(selectedDate)
                }
            }
        }
    }

    // Helper method to create calendar reminders
    private fun createCalendarReminder(schedule: Schedule) {
        try {
            // Parse the date and time
            val localDate = DateConverter.stringToLocalDate(schedule.pickupDate)
            if (localDate == null) {
                Toast.makeText(this, "Could not parse date format", Toast.LENGTH_SHORT).show()
                return
            }
            
            // Create intent to add calendar event
            val intent = Intent(Intent.ACTION_INSERT).apply {
                data = android.provider.CalendarContract.Events.CONTENT_URI
                putExtra(android.provider.CalendarContract.Events.TITLE, "Garbage Pickup")
                putExtra(android.provider.CalendarContract.Events.DESCRIPTION, 
                    "Scheduled garbage pickup at ${schedule.locationId}")
                // Set the date (assuming time is in format like "10:00 AM")
                val dateParts = schedule.pickupDate.split("-")
                val timeParts = schedule.pickupTime.split(":")
                if (dateParts.size >= 3 && timeParts.size >= 2) {
                    val year = dateParts[0].toInt()
                    val month = dateParts[1].toInt() - 1 // Calendar months are 0-based
                    val day = dateParts[2].toInt()
                    
                    // Extract hour and minute from time - basic parsing
                    var hourStr = timeParts[0]
                    var isPM = false
                    
                    // Check for AM/PM format
                    if (schedule.pickupTime.contains("PM", ignoreCase = true)) {
                        isPM = true
                    }
                    
                    // Convert hour to 24-hour format
                    var hour = hourStr.trim().toInt()
                    if (isPM && hour < 12) hour += 12
                    if (!isPM && hour == 12) hour = 0
                    
                    // Extract minutes and remove AM/PM if present
                    val minuteStr = timeParts[1].replace("AM", "").replace("PM", "").trim()
                    val minute = minuteStr.toInt()

                    // Set begin time - 30 minutes before pickup
                    val beginTime = java.util.Calendar.getInstance().apply {
                        set(year, month, day, hour, minute)
                        add(java.util.Calendar.MINUTE, -30)
                    }
                    putExtra(android.provider.CalendarContract.EXTRA_EVENT_BEGIN_TIME, beginTime.timeInMillis)
                    
                    // Set end time - 30 minutes after pickup
                    val endTime = java.util.Calendar.getInstance().apply {
                        set(year, month, day, hour, minute)
                        add(java.util.Calendar.MINUTE, 30)
                    }
                    putExtra(android.provider.CalendarContract.EXTRA_EVENT_END_TIME, endTime.timeInMillis)
                }
                
                // Add reminder 1 hour before
                putExtra(android.provider.CalendarContract.Reminders.MINUTES, 60)
                
                // Make it a popup reminder
                putExtra(android.provider.CalendarContract.Reminders.METHOD, 
                    android.provider.CalendarContract.Reminders.METHOD_ALERT)
            }
            
            // Start the calendar activity
            startActivity(intent)
            
            Log.d(TAG, "Calendar reminder intent launched for schedule: ${schedule.scheduleId}")
        } catch (e: Exception) {
            Log.e(TAG, "Error creating calendar reminder: ${e.message}", e)
            Toast.makeText(
                this,
                "Could not create reminder: ${e.message}",
                Toast.LENGTH_SHORT
            ).show()
        }
    }
}
