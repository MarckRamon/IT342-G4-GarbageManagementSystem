package com.example.GarbageMS

import android.content.Intent
import android.os.Bundle
import android.text.method.PasswordTransformationMethod
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.GarbageMS.databinding.ActivityLoginBinding
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore
    private var passwordVisible = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()

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
            Toast.makeText(this, "Forgot password functionality coming soon", Toast.LENGTH_SHORT).show()
        }

        binding.googleButtonContainer.setOnClickListener {
            Toast.makeText(this, "Google sign-in functionality coming soon", Toast.LENGTH_SHORT).show()
        }
    }

    private fun loginUser(email: String, password: String) {
        // Show loading
        showLoading(true)
        
        auth.signInWithEmailAndPassword(email, password)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    checkUserType()
                } else {
                    showLoading(false)
                    Toast.makeText(this, "Login failed: ${task.exception?.message}", Toast.LENGTH_SHORT).show()
                }
            }
    }

    private fun checkUserType() {
        val currentUser = auth.currentUser
        if (currentUser != null) {
            Log.d("LoginActivity", "Checking user type for UID: ${currentUser.uid}")
            db.collection("users")
                .document(currentUser.uid)
                .get()
                .addOnSuccessListener { document ->
                    showLoading(false)
                    Log.d("LoginActivity", "Document exists: ${document.exists()}")
                    if (document.exists()) {
                        // Check for 'role' field instead of 'userType'
                        val userRole = document.getString("role")
                        Log.d("LoginActivity", "User role found: $userRole")
                        
                        // For now, just authenticate any user with a role
                        if (!userRole.isNullOrEmpty()) {
                            startActivity(Intent(this, HomeActivity::class.java))
                            finish()
                        } else {
                            Log.d("LoginActivity", "Invalid user role: $userRole")
                            Toast.makeText(this, "Invalid user role", Toast.LENGTH_SHORT).show()
                            auth.signOut()
                        }
                    } else {
                        Log.d("LoginActivity", "User document not found")
                        Toast.makeText(this, "User document not found", Toast.LENGTH_SHORT).show()
                        auth.signOut()
                    }
                }
                .addOnFailureListener { exception ->
                    showLoading(false)
                    Log.e("LoginActivity", "Error checking user type: ${exception.message}")
                    Toast.makeText(this, "Failed to check user type: ${exception.message}", Toast.LENGTH_SHORT).show()
                    auth.signOut()
                }
        } else {
            showLoading(false)
            Log.d("LoginActivity", "Current user is null")
            Toast.makeText(this, "No authenticated user found", Toast.LENGTH_SHORT).show()
        }
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