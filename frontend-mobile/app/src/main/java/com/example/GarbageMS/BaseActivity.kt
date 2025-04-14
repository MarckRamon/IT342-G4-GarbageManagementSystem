package com.example.GarbageMS

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.GarbageMS.ui.SessionTimeoutDialog
import com.example.GarbageMS.utils.SessionManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * BaseActivity that handles session management for all activities.
 * Activities that require session management should extend this class.
 */
abstract class BaseActivity : AppCompatActivity(), SessionTimeoutDialog.SessionTimeoutListener {
    
    protected lateinit var sessionManager: SessionManager
    private val TAG = "BaseActivity"
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize session manager
        sessionManager = SessionManager.getInstance(this)
        
        // Check if the activity requires authentication
        if (requiresAuthentication() && !sessionManager.isLoggedIn()) {
            Log.d(TAG, "User not logged in, redirecting to login")
            navigateToLogin()
            return
        }
    }
    
    /**
     * Override this method in activities that require authentication
     */
    protected open fun requiresAuthentication(): Boolean {
        return true
    }
    
    override fun onResume() {
        super.onResume()
        
        // Set current activity in session manager
        sessionManager.setCurrentActivity(this)
        
        // Check login status again in case token was invalidated
        if (requiresAuthentication() && !sessionManager.isLoggedIn()) {
            Log.d(TAG, "User not logged in on resume, redirecting to login")
            navigateToLogin()
            return
        }
        
        // Update last activity timestamp
        sessionManager.updateLastActivity()
        
        // Only verify with backend if the activity is requiring authentication
        if (requiresAuthentication()) {
            validateToken()
        }
    }
    
    override fun onPause() {
        super.onPause()
        sessionManager.setCurrentActivity(null)
    }
    
    override fun onUserInteraction() {
        super.onUserInteraction()
        sessionManager.updateLastActivity()
    }
    
    /**
     * Navigate to login screen
     */
    protected fun navigateToLogin() {
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
    
    /**
     * Handles the login button click from session timeout dialog
     */
    override fun onLoginClicked() {
        Log.d(TAG, "Login clicked from session timeout dialog")
        navigateToLogin()
    }
    
    /**
     * Validates the token with the backend when possible
     * Falls back to local validation when offline
     */
    private fun validateToken() {
        val token = sessionManager.getToken()
        if (token == null) {
            Log.d(TAG, "No token found, redirecting to login")
            sessionManager.logout()
            navigateToLogin()
            return
        }
        
        // Use coroutine to perform network operation
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val isValid = sessionManager.verifyTokenWithBackend()
                Log.d(TAG, "Token validation with backend: $isValid")
                
                if (!isValid) {
                    // Instead of immediately logging out, check if the token is locally valid
                    val isTokenValid = validateTokenLocally(token)
                    if (!isTokenValid) {
                        withContext(Dispatchers.Main) {
                            Toast.makeText(
                                this@BaseActivity,
                                "Your session has expired. Please login again.",
                                Toast.LENGTH_LONG
                            ).show()
                            sessionManager.logout()
                            navigateToLogin()
                        }
                    } else {
                        Log.d(TAG, "Backend validation failed but token is locally valid. Continuing session.")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to validate token with backend: ${e.message}")
                // Continue with local validation if we can't reach the backend
                val isTokenValid = validateTokenLocally(token)
                if (!isTokenValid) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(
                            this@BaseActivity,
                            "Your session has expired. Please login again.",
                            Toast.LENGTH_LONG
                        ).show()
                        sessionManager.logout()
                        navigateToLogin()
                    }
                }
            }
        }
    }
    
    /**
     * Validates the token locally by checking its format and expiry
     */
    private fun validateTokenLocally(token: String): Boolean {
        // Check if the token has valid JWT format
        val parts = token.split(".")
        if (parts.size != 3) {
            return false
        }
        
        // Check if the token is expired by decoding the payload
        try {
            val payload = parts[1]
            val decodedBytes = android.util.Base64.decode(payload, android.util.Base64.URL_SAFE)
            val decodedString = String(decodedBytes)
            val jsonObject = org.json.JSONObject(decodedString)
            
            if (jsonObject.has("exp")) {
                val expiry = jsonObject.getLong("exp")
                val currentTime = System.currentTimeMillis() / 1000
                return expiry > currentTime
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error validating token locally: ${e.message}", e)
        }
        
        // If we can't check expiry, assume it's valid
        return true
    }
} 