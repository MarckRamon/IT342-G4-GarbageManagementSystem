package com.example.GarbageMS.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.PowerManager
import android.util.Log
import com.example.GarbageMS.services.FirebaseMessagingService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Broadcast receiver that handles scheduled notification alarms
 * When triggered, it sends a notification using the new notification API
 */
class NotificationAlarmReceiver : BroadcastReceiver() {
    
    private val TAG = "NotificationAlarmReceiver"
    
    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Alarm received for notification")
        
        // Use a wake lock to ensure the notification is processed
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "GarbageMS:NotificationWakeLock"
        )
        
        // Acquire wake lock with timeout to prevent battery drain
        wakeLock.acquire(60000) // 60 seconds
        
        try {
            // Extract notification data from intent
            val reminderId = intent.getStringExtra("REMINDER_ID") ?: ""
            val fcmToken = intent.getStringExtra("FCM_TOKEN") ?: ""
            val title = intent.getStringExtra("TITLE") ?: "GMS Trash Pickup Reminder"
            val message = intent.getStringExtra("MESSAGE") ?: "You have a scheduled trash pickup"
            
            Log.d(TAG, "Preparing to send notification for reminder: $reminderId")
            Log.d(TAG, "Notification data - Token: $fcmToken, Title: '$title', Body: '$message'")
            
            // Validate required data
            if (fcmToken.isEmpty()) {
                Log.e(TAG, "Cannot send notification: FCM token is empty")
                return
            }
            
            // Send notification using the new notification API
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val firebaseMessagingService = FirebaseMessagingService(context)
                    val result = firebaseMessagingService.sendNotification(fcmToken, title, message)
                    
                    if (result != null) {
                        Log.d(TAG, "Notification sent successfully for reminder: $reminderId, messageId: $result")
                    } else {
                        Log.e(TAG, "Failed to send notification for reminder: $reminderId")
                        
                        // Retry once if failed
                        Log.d(TAG, "Retrying notification send...")
                        val retryResult = firebaseMessagingService.sendNotification(fcmToken, title, message)
                        
                        if (retryResult != null) {
                            Log.d(TAG, "Retry notification sent successfully for reminder: $reminderId")
                        } else {
                            Log.e(TAG, "Failed to send notification after retry for reminder: $reminderId")
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error sending notification: ${e.message}", e)
                } finally {
                    // Release wake lock in finally block to ensure it's always released
                    if (wakeLock.isHeld) {
                        wakeLock.release()
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error processing notification alarm: ${e.message}", e)
            // Always release the wake lock in case of error
            if (wakeLock.isHeld) {
                wakeLock.release()
            }
        }
    }
} 