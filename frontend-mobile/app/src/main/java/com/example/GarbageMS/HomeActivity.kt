package com.example.GarbageMS

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import com.example.GarbageMS.databinding.ActivityHomeBinding
import com.example.GarbageMS.utils.ApiService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class HomeActivity : BaseActivity() {
    private lateinit var binding: ActivityHomeBinding
    private val apiService = ApiService.create()
    private val TAG = "HomeActivity"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // The authentication check is already done in BaseActivity
        // We only continue if the user is authenticated

        setupListeners()
        setupBottomNavigation() // Added call
        loadUserData()
    }

    private fun setupListeners() {
        binding.btnProfile.setOnClickListener {
            // Navigate to profile page
            startActivity(Intent(this, ProfileActivity::class.java))
        }

        binding.btnNotifications.setOnClickListener {
            // Handle notifications click
            Toast.makeText(this, "Notifications clicked", Toast.LENGTH_SHORT).show()
        }

        binding.btnLogout.setOnClickListener {
            sessionManager.logout()
            navigateToLogin()
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
}
