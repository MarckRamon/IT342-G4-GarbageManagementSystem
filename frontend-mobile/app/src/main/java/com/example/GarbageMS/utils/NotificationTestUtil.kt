package com.example.GarbageMS.utils

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.example.GarbageMS.MainActivity
import com.example.GarbageMS.R
import com.example.GarbageMS.services.FCMService
import com.google.firebase.messaging.RemoteMessage
import java.util.Date

/**
 * Utility class to test local notifications directly
 * This helps bypass Firebase Cloud Messaging for testing
 */
object NotificationTestUtil {
    private const val TAG = "NotificationTestUtil"
    private const val CHANNEL_ID = "test_channel"
    
    /**
     * Shows a test notification immediately
     */
    fun showTestNotification(context: Context, title: String, body: String) {
        Log.d(TAG, "Showing test notification - Title: $title, Body: $body")
        try {
            val intent = Intent(context, MainActivity::class.java)
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            val pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_IMMUTABLE
            )

            val channelId = "test_channel"
            val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val notificationBuilder = NotificationCompat.Builder(context, channelId)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setSound(defaultSoundUri)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent)

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Create notification channel for Android Oreo and above
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    channelId,
                    "Test Channel",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Channel for test notifications"
                    enableLights(true)
                    enableVibration(true)
                }
                notificationManager.createNotificationChannel(channel)
            }

            val notificationId = System.currentTimeMillis().toInt()
            notificationManager.notify(notificationId, notificationBuilder.build())
            Log.d(TAG, "Test notification displayed with ID: $notificationId")
        } catch (e: Exception) {
            Log.e(TAG, "Error showing test notification: ${e.message}", e)
        }
    }

    // Test the FCM service directly
    fun testFCMService(context: Context) {
        try {
            Log.d(TAG, "Testing FCM notification handling directly")
            
            // Create a mock RemoteMessage with a notification payload
            val data = mapOf(
                "title" to "FCM Test Notification",
                "message" to "This is a direct test of the FCM notification service at ${Date()}"
            )
            
            // Create a dummy RemoteMessage
            val builder = RemoteMessage.Builder("test@fcm.googleapis.com")
            builder.setData(data)
            
            // Get instance of FCM service and process this message
            val fcmService = FCMService()
            fcmService.onCreate() // Initialize the service
            
            // Process the message manually
            try {
                fcmService.handleDataMessage(data)
                Log.d(TAG, "FCM test data message processed successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Error processing FCM test data message: ${e.message}", e)
            }
            
            // Also try the basic notification method
            showTestNotification(context, "Basic Test", "Testing notification channels and permissions")
            
            Log.d(TAG, "FCM test completed")
        } catch (e: Exception) {
            Log.e(TAG, "Error in FCM test: ${e.message}", e)
        }
    }
} 