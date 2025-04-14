package com.example.GarbageMS

import android.os.Bundle
import android.util.Patterns
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.GarbageMS.databinding.ActivityForgotPasswordBinding
import com.google.firebase.auth.FirebaseAuth

class ForgotPasswordActivity : AppCompatActivity() {

    private lateinit var binding: ActivityForgotPasswordBinding
    private lateinit var auth: FirebaseAuth

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityForgotPasswordBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize Firebase Auth
        auth = FirebaseAuth.getInstance()

        binding.backButton.setOnClickListener {
            finish() // Go back to the previous screen (LoginActivity)
        }

        binding.submitButton.setOnClickListener {
            val email = binding.emailEditText.text.toString().trim()

            if (email.isEmpty()) {
                binding.emailEditText.error = "Email is required"
                binding.emailEditText.requestFocus()
                return@setOnClickListener
            }

            if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                binding.emailEditText.error = "Please enter a valid email address"
                binding.emailEditText.requestFocus()
                return@setOnClickListener
            }

            requestPasswordReset(email)
        }
    }
    
    private fun requestPasswordReset(email: String) {
        // Show loading state
        binding.submitButton.isEnabled = false
        binding.submitButton.text = "Sending..."
        
        // Use Firebase to send password reset email
        auth.sendPasswordResetEmail(email)
            .addOnCompleteListener { task ->
                // Reset button state
                binding.submitButton.isEnabled = true
                binding.submitButton.text = "Submit"
                
                if (task.isSuccessful) {
                    // Success message
                    Toast.makeText(
                        this@ForgotPasswordActivity,
                        "Password reset link sent to $email",
                        Toast.LENGTH_LONG
                    ).show()
                    
                    // Return to login screen
                    finish()
                } else {
                    // Show error message
                    val exception = task.exception
                    val errorMessage = when {
                        exception?.message?.contains("no user record", ignoreCase = true) == true -> 
                            "No account found with this email address."
                        exception?.message?.contains("blocked", ignoreCase = true) == true -> 
                            "Too many attempts. Please try again later."
                        else -> exception?.message ?: "Failed to send password reset email."
                    }
                    
                    Toast.makeText(
                        this@ForgotPasswordActivity,
                        errorMessage,
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
    }
} 