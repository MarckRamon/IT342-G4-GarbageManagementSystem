package com.example.GarbageMS

import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import com.example.GarbageMS.databinding.ActivityEditProfileBinding
import com.example.GarbageMS.models.ProfileRequest
import com.example.GarbageMS.models.EmailRequest
import com.example.GarbageMS.models.ProfileUpdateRequest
import com.example.GarbageMS.utils.ApiService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class EditProfileActivity : BaseActivity() {
    private lateinit var binding: ActivityEditProfileBinding
    private val apiService = ApiService.create()
    private val TAG = "EditProfileActivity"
    
    // Store original profile values - make nullable
    private var originalEmail: String? = null
    private var originalFirstName: String? = null
    private var originalLastName: String? = null
    
    // Count email update attempts to avoid infinite loops
    private var emailUpdateAttempts = 0
    private val MAX_EMAIL_ATTEMPTS = 3

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityEditProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // BaseActivity handles session checks

        binding.backButton.setOnClickListener {
            finish()
        }

        loadUserProfile()

        binding.saveButton.setOnClickListener {
            updateProfile()
        }
    }

    private fun loadUserProfile() {
        val token = sessionManager.getToken()
        val userId = sessionManager.getUserId()

        if (token == null || userId == null) {
            Log.e(TAG, "loadUserProfile - Missing credentials - token: $token, userId: $userId")
            // BaseActivity will handle the redirect to login if needed
            return
        }

        Log.d(TAG, "Attempting to load profile for userId: $userId")
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Get profile data (name, phone)
                val profileResponse = apiService.getProfile(userId, "Bearer $token")
                
                // Get email separately since it's not in the profile response
                val emailResponse = apiService.getUserEmail(userId, "Bearer $token")
                
                withContext(Dispatchers.Main) {
                    if (profileResponse.isSuccessful) {
                        val profile = profileResponse.body()
                        if (profile != null && profile.success) {
                            Log.d(TAG, "Profile loaded successfully: ${profile.firstName} ${profile.lastName}")
                            
                            // Store original name values
                            originalFirstName = profile.firstName
                            originalLastName = profile.lastName
                            
                            // Set name fields
                            binding.firstNameInput.setText(profile.firstName ?: "")
                            binding.lastNameInput.setText(profile.lastName ?: "")
                            
                            // Now handle email response
                            if (emailResponse.isSuccessful) {
                                val emailData = emailResponse.body()
                                if (emailData != null && emailData.success) {
                                    val email = emailData.email
                                    Log.d(TAG, "Email loaded successfully: $email")
                                    
                                    // Store original email
                                    originalEmail = email
                                    
                                    // Set email field
                                    binding.emailInput.setText(email ?: "")
                                    
                                    // Make email field editable with warning
                                    binding.emailInput.isEnabled = true
                                    binding.emailInputLayout.helperText = "Note: Changing your email will require you to login again"
                                } else {
                                    Log.e(TAG, "Failed to load email: ${emailResponse.message()}")
                                    binding.emailInput.setText(sessionManager.getUserEmail() ?: "")
                                    binding.emailInputLayout.error = "Could not load email from server"
                                }
                            } else {
                                Log.e(TAG, "Failed to load email: ${emailResponse.code()} - ${emailResponse.message()}")
                                binding.emailInput.setText(sessionManager.getUserEmail() ?: "")
                                binding.emailInputLayout.error = "Could not load email from server"
                            }
                        }
                    } else {
                        Log.e(TAG, "Failed to load profile: ${profileResponse.code()} - ${profileResponse.message()}")
                        val errorBody = profileResponse.errorBody()?.string()
                        Log.e(TAG, "Error body: $errorBody")
                        
                        // Show appropriate error message
                        Toast.makeText(this@EditProfileActivity, "Failed to load profile", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading profile", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@EditProfileActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun updateProfile() {
        val token = sessionManager.getToken()
        val userId = sessionManager.getUserId()

        if (token == null || userId == null) {
            Log.e(TAG, "updateProfile - Missing credentials - token: $token, userId: $userId")
            // BaseActivity will handle the redirect to login if needed
            return
        }

        val firstName = binding.firstNameInput.text.toString().trim()
        val lastName = binding.lastNameInput.text.toString().trim()
        val email = binding.emailInput.text.toString().trim()

        // Check if email contains uppercase letters
        if (email != email.lowercase()) {
            // Reject emails with uppercase letters
            binding.emailInputLayout.error = "Email must contain only lowercase letters"
            binding.emailInput.requestFocus()
            return
        }

        if (firstName.isEmpty() || lastName.isEmpty() || email.isEmpty()) {
            Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show()
            return
        }

        // Show progress indicator
        showLoading(true)

        // Check if any field actually changed
        val nameChanged = firstName != originalFirstName || lastName != originalLastName
        val emailChanged = email != originalEmail
        
        if (!nameChanged && !emailChanged) {
            Log.d(TAG, "No changes detected, returning to previous screen")
            Toast.makeText(this, "No changes were made", Toast.LENGTH_SHORT).show()
            showLoading(false)
            finish()
            return
        }

        Log.d(TAG, "Attempting to update profile for userId: $userId")
        Log.d(TAG, "Update data: firstName=$firstName, lastName=$lastName, email=$email")
        Log.d(TAG, "Original values: firstName=$originalFirstName, lastName=$originalLastName, email=$originalEmail")
        Log.d(TAG, "Email changed: $emailChanged, Name changed: $nameChanged")
        
        updateProfileWithNewEmail(userId, token, firstName, lastName, email)
    }
    
    private fun updateProfileWithNewEmail(
        userId: String, 
        token: String, 
        firstName: String, 
        lastName: String, 
        newEmail: String
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // We now need to make two separate API calls
                // First update the profile data (first name, last name)
                val nameChanged = firstName != originalFirstName || lastName != originalLastName
                val emailChanged = newEmail != originalEmail
                
                var profileUpdateSuccess = true
                
                // Only update profile if name changed
                if (nameChanged) {
                    val profileRequest = ProfileRequest(
                        firstName,
                        lastName,
                        null // phoneNumber not provided in this UI
                    )
                    
                    Log.d(TAG, "Sending profile update request: $profileRequest")
                    
                    val profileResponse = apiService.updateUserProfile(
                        userId,
                        "Bearer $token",
                        profileRequest
                    )
                    
                    profileUpdateSuccess = profileResponse.isSuccessful && 
                                         profileResponse.body()?.success == true
                    
                    if (!profileUpdateSuccess) {
                        Log.e(TAG, "Failed to update profile: ${profileResponse.code()} - ${profileResponse.message()}")
                    }
                }
                
                // Then update the email in a separate call if needed
                var emailUpdateSuccess = true
                
                if (emailChanged && profileUpdateSuccess) {
                    val emailRequest = EmailRequest(newEmail)
                    
                    Log.d(TAG, "Sending email update request: $emailRequest")
                    
                    val emailResponse = apiService.updateUserEmail(
                        userId,
                        "Bearer $token",
                        emailRequest
                    )
                    
                    emailUpdateSuccess = emailResponse.isSuccessful && 
                                        emailResponse.body()?.success == true
                    
                    if (!emailUpdateSuccess) {
                        Log.e(TAG, "Failed to update email: ${emailResponse.code()} - ${emailResponse.message()}")
                    }
                }
                
                withContext(Dispatchers.Main) {
                    showLoading(false)
                    
                    if (profileUpdateSuccess && (emailUpdateSuccess || !emailChanged)) {
                        Log.d(TAG, "Profile updated successfully")
                        
                        if (emailChanged && emailUpdateSuccess) {
                            // If email was changed, need to logout and relogin
                            Toast.makeText(
                                this@EditProfileActivity,
                                "Profile updated successfully. Please login again with your new email.",
                                Toast.LENGTH_LONG
                            ).show()
                            
                            // Logout and navigate to login
                            sessionManager.logout()
                            navigateToLogin()
                        } else {
                            Toast.makeText(
                                this@EditProfileActivity,
                                "Profile updated successfully", 
                                Toast.LENGTH_SHORT
                            ).show()
                            finish()
                        }
                    } else {
                        // Handle specific error cases
                        if (!profileUpdateSuccess) {
                            Toast.makeText(this@EditProfileActivity, 
                                "Failed to update profile information", 
                                Toast.LENGTH_LONG).show()
                        } else if (emailChanged && !emailUpdateSuccess) {
                            Toast.makeText(this@EditProfileActivity, 
                                "Profile updated but email change failed. The email may already be in use.", 
                                Toast.LENGTH_LONG).show()
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error updating profile", e)
                withContext(Dispatchers.Main) {
                    showLoading(false)
                    Toast.makeText(this@EditProfileActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
    
    private fun handleEmailInUseError(
        userId: String,
        token: String,
        firstName: String,
        lastName: String,
        attemptedEmail: String
    ) {
        // Generate alternative email suggestions
        val username = attemptedEmail.substringBefore('@')
        val domain = attemptedEmail.substringAfter('@')
        
        val options = arrayOf(
            // Try with name only changes, keep email the same
            "Continue with original email (${originalEmail ?: "Not Available"})",
            // Try with a timestamp
            "${username}_${System.currentTimeMillis()}@$domain",
            // Try with a different domain
            "$username@outlook.com",
            // Try another variation
            "${username}.alt@$domain"
        )
        
        AlertDialog.Builder(this)
            .setTitle("Email Already Exists")
            .setMessage(
                "The server reports that '$attemptedEmail' is already in use.\n\n" +
                "Would you like to:\n" +
                "1. Keep your current email and update only your name\n" +
                "2. Try a different email format"
            )
            .setItems(options) { _, which ->
                emailUpdateAttempts++
                
                when (which) {
                    0 -> {
                        // Use original email, update only names
                        showLoading(true)
                        updateProfileWithNewEmail(userId, token, firstName, lastName, originalEmail ?: "")
                    }
                    else -> {
                        val selectedEmail = options[which]
                        binding.emailInput.setText(selectedEmail)
                        showLoading(true)
                        updateProfileWithNewEmail(userId, token, firstName, lastName, selectedEmail)
                    }
                }
            }
            .setNeutralButton("Cancel") { _, _ ->
                // Reset to original email
                binding.emailInput.setText(originalEmail ?: "")
            }
            .setCancelable(false)
            .show()
    }
    
    private fun showLoading(isLoading: Boolean) {
        binding.saveButton.isEnabled = !isLoading
        binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
    }
}