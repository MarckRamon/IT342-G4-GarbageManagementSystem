package com.example.GarbageMS

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private val SPLASH_DURATION = 2000L // 2 seconds

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // Use Handler to delay the transition to login screen
        Handler(Looper.getMainLooper()).postDelayed({
            // Start LoginActivity
            startActivity(Intent(this, LoginActivity::class.java))
            
            // Close this activity
            finish()
        }, SPLASH_DURATION)
    }
} 