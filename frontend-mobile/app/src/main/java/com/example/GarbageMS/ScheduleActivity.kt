package com.example.GarbageMS

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import com.example.GarbageMS.databinding.ActivityScheduleBinding // Import View Binding class

class ScheduleActivity : BaseActivity() {

    private lateinit var binding: ActivityScheduleBinding
    private val TAG = "ScheduleActivity"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityScheduleBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // BaseActivity handles authentication checks

        setupListeners()
        setupBottomNavigation()
    }

    private fun setupListeners() {
        binding.backButton.setOnClickListener {
            finish() // Go back to the previous activity
        }

        binding.fabAddReminder.setOnClickListener {
            // Placeholder for adding a reminder
            Toast.makeText(this, "Add Reminder Clicked", Toast.LENGTH_SHORT).show()
        }

        binding.btnNotifications.setOnClickListener {
             // Placeholder for notifications
            Toast.makeText(this, "Notifications Clicked", Toast.LENGTH_SHORT).show()
        }

        binding.profileImage.setOnClickListener {
            // Navigate to profile page
             startActivity(Intent(this, ProfileActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_REORDER_TO_FRONT // Bring existing ProfileActivity to front if it exists
            })
        }

        // TODO: Add listener for CalendarView date selection if needed
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
        // If we are on a main screen (Home, Schedule, Map), pressing back should probably exit the app
        // or go to Home. For simplicity now, let's just finish the activity.
        // A more robust solution might involve checking the back stack or navigating to Home.
        super.onBackPressed()
    }
}
