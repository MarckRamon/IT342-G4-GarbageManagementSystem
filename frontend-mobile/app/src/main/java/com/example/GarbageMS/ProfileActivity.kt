package com.example.GarbageMS

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import com.google.android.material.button.MaterialButton
import com.example.GarbageMS.utils.ApiService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import android.widget.ImageButton
import kotlinx.coroutines.async

class ProfileActivity : BaseActivity() {
    private val apiService = ApiService.create()
    private val TAG = "ProfileActivity"
    private lateinit var userNameText: TextView
    private lateinit var userEmailText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile)
        
        // BaseActivity already handles session checks
        supportActionBar?.hide()
        initViews()
        setupClickListeners()
        loadUserData()
    }

    private fun initViews() {
        userNameText = findViewById(R.id.userName)
        userEmailText = findViewById(R.id.userEmail)
    }

    private fun setupClickListeners() {
        // Back button
        findViewById<ImageButton>(R.id.backButton).setOnClickListener {
            onBackPressed()
        }

        findViewById<LinearLayout>(R.id.editInfoButton).setOnClickListener {
            val intent = Intent(this, EditProfileActivity::class.java)
            startActivity(intent)
        }

        findViewById<LinearLayout>(R.id.forgotPasswordButton).setOnClickListener {
            // Navigate to ForgotPasswordActivity
            val intent = Intent(this, ForgotPasswordActivity::class.java)
            startActivity(intent)
        }

        findViewById<LinearLayout>(R.id.configureNotificationsButton).setOnClickListener {
            val intent = Intent(this, NotificationsActivity::class.java)
            intent.putExtra("SHOW_SETTINGS", true)
            startActivity(intent)
        }

        findViewById<MaterialButton>(R.id.logoutButton).setOnClickListener {
            sessionManager.logout()
            navigateToLogin()
        }
    }

    private fun loadUserData() {
        val token = sessionManager.getToken()
        val userId = sessionManager.getUserId()
        
        if (token == null || userId == null) {
            Log.e(TAG, "loadUserData - Missing credentials - token: $token, userId: $userId")
            // BaseActivity will handle the navigation to login
            return
        }
        
        Log.d(TAG, "Loading profile data for user ID: $userId")
        
        // Display initial data from session manager while loading
        userNameText.text = "Loading..."
        userEmailText.text = sessionManager.getUserEmail() ?: "Loading..."
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Fetch profile and email in parallel using async
                val profileDeferred = async { apiService.getProfile(userId, "Bearer $token") }
                val emailDeferred = async { apiService.getUserEmail(userId, "Bearer $token") }
                
                // Wait for both calls to complete
                val profileResponse = profileDeferred.await()
                val emailResponse = emailDeferred.await()
                
                withContext(Dispatchers.Main) {
                    // Handle Profile Response
                    if (profileResponse.isSuccessful) {
                        val profile = profileResponse.body()
                        if (profile != null && profile.success) {
                            Log.d(TAG, "Profile loaded successfully: ${profile.firstName} ${profile.lastName}")
                            userNameText.text = "${profile.firstName ?: ""} ${profile.lastName ?: ""}".trim()
                        } else {
                            Log.e(TAG, "Profile API call successful but error in response: ${profileResponse.message()}")
                            userNameText.text = "Error loading name"
                        }
                    } else {
                        val errorCode = profileResponse.code()
                        Log.e(TAG, "Failed to load profile: $errorCode - ${profileResponse.message()}")
                        userNameText.text = "Error loading name"
                        // Handle specific errors like 401/403 if necessary
                        handleApiError(errorCode, profileResponse.message())
                    }
                    
                    // Handle Email Response
                    if (emailResponse.isSuccessful) {
                        val emailData = emailResponse.body()
                        if (emailData != null && emailData.success) {
                            Log.d(TAG, "Email loaded successfully: ${emailData.email}")
                            userEmailText.text = emailData.email ?: "N/A"
                        } else {
                            Log.e(TAG, "Email API call successful but error in response: ${emailResponse.message()}")
                            userEmailText.text = "Error loading email"
                        }
                    } else {
                        val errorCode = emailResponse.code()
                        Log.e(TAG, "Failed to load email: $errorCode - ${emailResponse.message()}")
                        userEmailText.text = "Error loading email"
                        // Handle specific errors like 401/403 if necessary
                        handleApiError(errorCode, emailResponse.message())
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading user data", e)
                withContext(Dispatchers.Main) {
                    userNameText.text = "Error loading name"
                    userEmailText.text = "Error loading email"
                    Toast.makeText(this@ProfileActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
    
    private fun handleApiError(errorCode: Int, errorMessage: String?) {
        if (errorCode == 401 || errorCode == 403) {
            Log.e(TAG, "Auth error ($errorCode) detected. Logging out.")
            Toast.makeText(
                this@ProfileActivity,
                "Your session has expired. Please login again.",
                Toast.LENGTH_LONG
            ).show()
            sessionManager.logout()
            navigateToLogin()
        } else {
            Toast.makeText(
                this@ProfileActivity,
                "Failed to load data: $errorMessage",
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    // Override onResume to refresh data when returning from EditProfileActivity
    override fun onResume() {
        super.onResume()
        // BaseActivity already handles session management
        
        // Always refresh profile data when returning to this activity
        Log.d(TAG, "onResume - refreshing profile data")
        loadUserData()
    }
}


