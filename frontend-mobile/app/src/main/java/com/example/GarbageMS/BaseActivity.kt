package com.example.GarbageMS

import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import com.example.GarbageMS.ui.SessionTimeoutDialog
import com.example.GarbageMS.utils.SessionManager

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
} 