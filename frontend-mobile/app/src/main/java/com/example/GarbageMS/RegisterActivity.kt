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

        if (firstName.isEmpty() || lastName.isEmpty() || email.isEmpty() || 
            phoneNumber.isEmpty() || password.isEmpty() || confirmPassword.isEmpty()) {
            Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
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
        email = binding.etEmail.text.toString().trim()
        phoneNumber = binding.etPhone.text.toString().trim()
        password = binding.etPassword.text.toString()
        
        Log.d(TAG, "Creating Firebase Auth account for: $email")
        // Create Firebase Auth account directly (skip API call for now)
        FirebaseAuth.getInstance().createUserWithEmailAndPassword(email, password)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    Log.d(TAG, "Firebase Auth account created successfully")
                    // Create Firestore document for the user
                    val user = task.result?.user
                    if (user != null) {
                        val userData = hashMapOf(
                            "firstName" to firstName,
                            "lastName" to lastName,
                            "email" to email,
                            "phoneNumber" to phoneNumber,
                            "role" to "USER"
                        )
                        
                        Log.d(TAG, "Creating Firestore document for user: ${user.uid}")
                        FirebaseFirestore.getInstance()
                            .collection("users")
                            .document(user.uid)
                            .set(userData)
                            .addOnSuccessListener {
                                Log.d(TAG, "Firestore document created successfully")
                                showLoading(false)
                                Toast.makeText(
                                    this@RegisterActivity,
                                    "Registration successful!",
                                    Toast.LENGTH_SHORT
                                ).show()
                                startActivity(Intent(this@RegisterActivity, LoginActivity::class.java))
                                finish()
                            }
                            .addOnFailureListener { e ->
                                showLoading(false)
                                Log.e(TAG, "Error creating Firestore document", e)
                                Toast.makeText(
                                    this@RegisterActivity,
                                    "Error creating user profile. Please try again.",
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
                    }
                } else {
                    showLoading(false)
                    Log.e(TAG, "Firebase Auth registration failed", task.exception)
                    Toast.makeText(
                        this@RegisterActivity,
                        "Registration failed: ${task.exception?.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.btnNext.isEnabled = !show
    }
}