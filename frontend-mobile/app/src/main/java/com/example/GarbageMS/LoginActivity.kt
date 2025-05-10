package com.example.GarbageMS

import android.content.Intent
import android.os.Bundle
import android.text.method.PasswordTransformationMethod
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.GarbageMS.databinding.ActivityLoginBinding
import com.example.GarbageMS.models.LoginRequest
import com.example.GarbageMS.utils.ApiService
import com.example.GarbageMS.utils.SessionManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private var passwordVisible = false
    private val apiService = ApiService.create()
    private lateinit var sessionManager: SessionManager
    private val TAG = "LoginActivity"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager.getInstance(this)

        // Check if user is already logged in
        if (sessionManager.isLoggedIn()) {
            navigateToHome()
            return
        }

        setupListeners()
    }

    private fun setupListeners() {
        // Toggle password visibility
        binding.togglePasswordVisibility.setOnClickListener {
            passwordVisible = !passwordVisible
            if (passwordVisible) {
                // Show password
                binding.etPassword.transformationMethod = null
                binding.togglePasswordVisibility.setImageResource(R.drawable.ic_visibility_off)
            } else {
                // Hide password
                binding.etPassword.transformationMethod = PasswordTransformationMethod.getInstance()
                binding.togglePasswordVisibility.setImageResource(R.drawable.ic_visibility)
            }
            // Move cursor to the end
            binding.etPassword.setSelection(binding.etPassword.text.length)
        }

        binding.btnLogin.setOnClickListener {
            val email = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString()

            if (email.isNotEmpty() && password.isNotEmpty()) {
                loginUser(email, password)
            } else {
                Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show()
            }
        }

        binding.tvRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }

        binding.tvForgotPassword.setOnClickListener {
            // Navigate to Forgot Password screen
            startActivity(Intent(this, ForgotPasswordActivity::class.java))
        }
    }

    private fun loginUser(email: String, password: String) {
        // Show loading
        showLoading(true)

        val loginRequest = LoginRequest(email, password)

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = apiService.login(loginRequest)

                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        val loginResponse = response.body()
                        if (loginResponse != null) {
                            // Check if login was successful based on the success flag
                            if (loginResponse.success) {
                                // Verify user role is USER
                                if (loginResponse.role == "USER") {
                                    // Save authentication data
                                    sessionManager.saveToken(loginResponse.token)
                                    sessionManager.saveUserId(loginResponse.userId)
                                    sessionManager.saveUserType(loginResponse.role)

                                    Log.d(TAG, "Login successful: userId=${loginResponse.userId}, role=${loginResponse.role}")

                                    // Navigate to home screen
                                    navigateToHome()
                                } else {
                                    showLoading(false)
                                    Toast.makeText(this@LoginActivity,
                                        "Access denied: Only USER accounts are allowed",
                                        Toast.LENGTH_LONG).show()
                                }
                            } else {
                                showLoading(false)
                                val errorMessage = loginResponse.message ?: "Authentication failed"
                                Toast.makeText(this@LoginActivity, errorMessage, Toast.LENGTH_SHORT).show()
                            }
                        } else {
                            showLoading(false)
                            Toast.makeText(this@LoginActivity, "Login failed: Empty response", Toast.LENGTH_SHORT).show()
                        }
                    } else {
                        showLoading(false)
                        val errorMessage = response.errorBody()?.string() ?: "Unknown error"
                        Log.e(TAG, "Login failed: $errorMessage")
                        Toast.makeText(this@LoginActivity, "Login failed: $errorMessage", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    showLoading(false)
                    Log.e(TAG, "Login exception: ${e.message}", e)
                    Toast.makeText(this@LoginActivity, "Login failed: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun navigateToHome() {
        val intent = Intent(this, HomeActivity::class.java)
        startActivity(intent)
        finish()
    }

    private fun showLoading(show: Boolean) {
        if (show) {
            binding.btnLogin.isEnabled = false
            binding.btnLogin.text = "Signing in..."
        } else {
            binding.btnLogin.isEnabled = true
            binding.btnLogin.text = "Sign In"
        }
    }
}