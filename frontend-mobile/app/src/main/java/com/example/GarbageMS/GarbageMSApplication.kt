package com.example.GarbageMS

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationManagerCompat
import com.example.GarbageMS.services.ReminderService
import com.example.GarbageMS.utils.ActivityLifecycleHandler
import com.example.GarbageMS.utils.NotificationTestUtil
import com.example.GarbageMS.utils.SessionManager
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging

class GarbageMSApplication : Application() {
    private lateinit var sessionManager: SessionManager
    private lateinit var activityLifecycleHandler: ActivityLifecycleHandler
    private val TAG = "GarbageMSApplication"
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize the session manager with application context
        sessionManager = SessionManager.getInstance(applicationContext)
        
        // Register activity lifecycle callbacks to track current activity
        activityLifecycleHandler = ActivityLifecycleHandler(sessionManager)
        registerActivityLifecycleCallbacks(activityLifecycleHandler)
        
        // Initialize ReminderService
        initializeReminderService()
        
        // Create notification channels
        createNotificationChannels()
        
        // Initialize Firebase
        try {
            FirebaseApp.initializeApp(this)
            Log.d(TAG, "Firebase initialized successfully")
            
            // Initialize FCM and get token
            initializeFirebaseMessaging()
            
            // Check notification permissions
            checkNotificationPermissions()
            
            // Test notification on first launch to verify notification channel setup
            // Only send test notification if needed for debugging
            //NotificationTestUtil.showTestNotification(
            //    applicationContext,
            //    "Notification System Check",
            //    "Testing notification system at app startup"
            //)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Firebase: ${e.message}")
            e.printStackTrace()
        }
        
        Log.d(TAG, "Application initialized")
    }
    
    /**
     * Initialize the ReminderService with application context
     */
    private fun initializeReminderService() {
        val reminderService = ReminderService.getInstance()
        reminderService.initialize(sessionManager)
        reminderService.setContext(applicationContext)
        Log.d(TAG, "ReminderService initialized with application context")
    }
    
    private fun initializeFirebaseMessaging() {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val token = task.result
                Log.d(TAG, "FCM Token at app startup: $token")
                sessionManager.setFCMToken(token)
                
                // Enable auto-init
                FirebaseMessaging.getInstance().isAutoInitEnabled = true
                
                // Test notifications are enabled on this device
                logNotificationStatus()
            } else {
                Log.e(TAG, "Failed to get FCM token", task.exception)
            }
        }
    }
    
    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Create the reminder channel
            val reminderChannel = NotificationChannel(
                "reminder_channel",
                "Reminder Notifications",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Shows notifications for garbage pickup reminders"
                enableLights(true)
                enableVibration(true)
                setShowBadge(true)
            }
            
            // Create the test channel
            val testChannel = NotificationChannel(
                "test_channel",
                "Test Notifications",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Shows test notifications"
                enableLights(true)
                enableVibration(true)
            }
            
            // Register the channels with the system
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(reminderChannel)
            notificationManager.createNotificationChannel(testChannel)
            
            Log.d(TAG, "Notification channels created")
        }
    }
    
    private fun checkNotificationPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ActivityCompat.checkSelfPermission(
                    this,
                    android.Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                Log.w(TAG, "Notification permission not granted - notifications may not work")
                // We can't request permissions from the Application class, 
                // but we'll log it so we know there's an issue
            } else {
                Log.d(TAG, "Notification permission granted")
            }
        } else {
            // For versions below Android 13, notification permissions are included in the app install
            Log.d(TAG, "Running on Android < 13, notification permission automatically granted")
        }
    }
    
    private fun logNotificationStatus() {
        val notificationManager = NotificationManagerCompat.from(applicationContext)
        val areNotificationsEnabled = notificationManager.areNotificationsEnabled()
        
        Log.d(TAG, "Notifications enabled on this device: $areNotificationsEnabled")
        
        // Check for specific channels on Android O+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val systemNotificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val reminderChannel = systemNotificationManager.getNotificationChannel("reminder_channel")
            val reminderChannelEnabled = reminderChannel?.importance != NotificationManager.IMPORTANCE_NONE
            Log.d(TAG, "Reminder channel enabled: $reminderChannelEnabled")
        }
    }
} 