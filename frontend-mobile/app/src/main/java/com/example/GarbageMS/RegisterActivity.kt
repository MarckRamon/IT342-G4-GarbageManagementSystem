package com.example.GarbageMS

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.GarbageMS.databinding.ActivityRegisterBinding
import com.example.GarbageMS.models.RegistrationRequest
import com.example.GarbageMS.utils.ApiService
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class RegisterActivity : AppCompatActivity() {
    private lateinit var binding: ActivityRegisterBinding
    private val TAG = "RegisterActivity"
    private val apiService = ApiService.create()
    
    // User data to store between steps
    private var firstName = ""
    private var lastName = ""
    private var email = ""
    private var phoneNumber = ""
    private var password = ""
    private var username = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupListeners()
    }

    private fun setupListeners() {
        binding.btnNext.setOnClickListener {
            if (validateInputs()) {
                registerUser()
            }
        }

        binding.btnLogin.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }

    private fun validateInputs(): Boolean {
        val firstName = binding.etFirstName.text.toString().trim()
        val lastName = binding.etLastName.text.toString().trim()
        val email = binding.etEmail.text.toString().trim()
        val phoneNumber = binding.etPhone.text.toString().trim()
        val password = binding.etPassword.text.toString()
        val confirmPassword = binding.etConfirmPassword.text.toString()
        val username = binding.etUsername.text.toString().trim()

        if (firstName.isEmpty() || lastName.isEmpty() || email.isEmpty() || 
            phoneNumber.isEmpty() || password.isEmpty() || confirmPassword.isEmpty() || username.isEmpty()) {
            Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
            return false
        }

        // Check if email contains uppercase letters and reject them
        if (email != email.lowercase()) {
            binding.etEmail.error = "Email must contain only lowercase letters"
            binding.etEmail.requestFocus()
            return false
        }

        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            Toast.makeText(this, "Please enter a valid email address", Toast.LENGTH_SHORT).show()
            return false
        }
        
        // Validate phone number format (09XXXXXXXXX) - 11 digits total
        val phoneRegex = Regex("^09\\d{9}$")
        if (!phoneRegex.matches(phoneNumber)) {
            Toast.makeText(this, "Please enter a valid phone number in the format 09XXXXXXXXX", Toast.LENGTH_SHORT).show()
            return false
        }

        if (password.length < 6) {
            Toast.makeText(this, "Password should be at least 6 characters", Toast.LENGTH_SHORT).show()
            return false
        }

        if (password != confirmPassword) {
            Toast.makeText(this, "Passwords do not match", Toast.LENGTH_SHORT).show()
            return false
        }

        return true
    }

    private fun registerUser() {
        showLoading(true)
        Log.d(TAG, "Starting registration process...")
        
        // Save input data
        firstName = binding.etFirstName.text.toString().trim()
        lastName = binding.etLastName.text.toString().trim()
        email = binding.etEmail.text.toString().trim().lowercase()
        phoneNumber = binding.etPhone.text.toString().trim()
        password = binding.etPassword.text.toString()
        username = binding.etUsername.text.toString().trim()
        
        // Create registration request matching database structure
        val registrationRequest = RegistrationRequest(
            firstName = firstName,
            lastName = lastName,
            email = email,
            phoneNumber = phoneNumber,
            password = password,
            username = username,
            role = "USER"
        )

        // Use Retrofit API service instead of direct Firebase calls
        CoroutineScope(Dispatchers.IO).launch {
            try {
                Log.d(TAG, "Sending registration request to backend API")
                val response = apiService.register(registrationRequest)
                
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        Log.d(TAG, "Registration successful")
                        showLoading(false)
                        Toast.makeText(
                            this@RegisterActivity,
                            "Registration successful! Please log in.",
                            Toast.LENGTH_SHORT
                        ).show()
                        // Navigate to login screen
                        startActivity(Intent(this@RegisterActivity, LoginActivity::class.java))
                        finish()
                    } else {
                        Log.e(TAG, "Registration failed: ${response.code()} - ${response.message()}")
                        showLoading(false)
                        val errorBody = response.errorBody()?.string() ?: "Unknown error"
                        Toast.makeText(
                            this@RegisterActivity,
                            "Registration failed: $errorBody",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Registration exception", e)
                withContext(Dispatchers.Main) {
                    showLoading(false)
                    Toast.makeText(
                        this@RegisterActivity,
                        "Registration failed: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.btnNext.isEnabled = !show
    }
}