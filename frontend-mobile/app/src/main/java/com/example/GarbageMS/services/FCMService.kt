package com.example.GarbageMS.services

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
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.example.GarbageMS.utils.SessionManager
import com.example.GarbageMS.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class FCMService : FirebaseMessagingService() {
    private val TAG = "FCMService"
    private lateinit var sessionManager: SessionManager

    override fun onCreate() {
        super.onCreate()
        sessionManager = SessionManager.getInstance(applicationContext)
        Log.d(TAG, "FCMService created")
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "New FCM token: $token")
        // Store the token in SessionManager
        sessionManager.setFCMToken(token)
        
        // TODO: Send this token to your server immediately
        updateTokenOnServer(token)
    }
    
    private fun updateTokenOnServer(token: String) {
        // Get userId from session manager
        val userId = sessionManager.getUserId()
        if (userId.isNullOrEmpty()) {
            Log.w(TAG, "Cannot update FCM token on server: user ID is null or empty")
            return
        }
        
        // Use Retrofit or OkHttp to update the token
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Create a client for the HTTP request
                val client = OkHttpClient.Builder().build()
                
                // Get the API base URL from constants
                val apiBaseUrl = if (BuildConfig.DEBUG) {
                    BuildConfig.DEBUG_API_URL
                } else {
                    BuildConfig.RELEASE_API_URL
                }
                
                // Create the request body with the token
                val jsonBody = JSONObject()
                jsonBody.put("fcmToken", token)
                
                val requestBody = jsonBody.toString().toRequestBody("application/json".toMediaType())
                
                // Get auth token
                val authToken = sessionManager.getToken()
                if (authToken.isNullOrEmpty()) {
                    Log.w(TAG, "Cannot update FCM token on server: auth token is null or empty")
                    return@launch
                }
                
                // Build the request
                val request = Request.Builder()
                    .url("$apiBaseUrl/api/users/$userId/fcm-token")
                    .put(requestBody)
                    .header("Authorization", "Bearer $authToken")
                    .header("Content-Type", "application/json")
                    .build()
                
                // Execute the request
                Log.d(TAG, "Sending FCM token to server: $token for user: $userId")
                val response = client.newCall(request).execute()
                
                if (response.isSuccessful) {
                    Log.d(TAG, "FCM token successfully updated on server")
                } else {
                    val errorBody = response.body?.string() ?: "No error body"
                    Log.e(TAG, "Failed to update FCM token on server: ${response.code} - $errorBody")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error updating FCM token on server: ${e.message}", e)
            }
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "Received message from: ${remoteMessage.from}")
        Log.d(TAG, "RemoteMessage complete data: $remoteMessage")

        // Check if the message contains a notification payload
        if (remoteMessage.notification != null) {
            Log.d(TAG, "Message has notification payload - Title: ${remoteMessage.notification?.title}, Body: ${remoteMessage.notification?.body}")
            try {
                remoteMessage.notification?.let {
                    sendNotification(it.title ?: "Reminder", it.body ?: "You have a reminder")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error sending notification: ${e.message}", e)
            }
        } else {
            Log.d(TAG, "No notification payload in message")
        }

        // Check if the message contains a data payload
        if (remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "Message data payload: ${remoteMessage.data}")
            try {
                handleDataMessage(remoteMessage.data)
            } catch (e: Exception) {
                Log.e(TAG, "Error handling data message: ${e.message}", e)
            }
        } else {
            Log.d(TAG, "No data payload in message")
        }
    }

    fun handleDataMessage(data: Map<String, String>) {
        // Extract data from the payload
        val title = data["title"] ?: "Reminder"
        val message = data["message"] ?: data["body"] ?: return
        val reminderId = data["reminderId"]
        val scheduleId = data["scheduleId"]

        Log.d(TAG, "Handling data message - Title: $title, Message: $message, ReminderId: $reminderId, ScheduleId: $scheduleId")

        // Send notification
        sendNotification(title, message)

        // You can also store the reminder data locally or update UI if needed
    }

    private fun sendNotification(title: String, messageBody: String) {
        Log.d(TAG, "Preparing to send notification - Title: $title, Body: $messageBody")
        
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            // Add data for deep linking if needed
            putExtra("NOTIFICATION", true)
            putExtra("NOTIFICATION_TITLE", title)
            putExtra("NOTIFICATION_BODY", messageBody)
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE
        )

        val channelId = "reminder_channel"
        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(messageBody)
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setPriority(NotificationCompat.PRIORITY_HIGH) // Add high priority
            .setContentIntent(pendingIntent)

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        Log.d(TAG, "Got notification manager")

        // Create the notification channel for Android Oreo and above
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Log.d(TAG, "Creating notification channel for Android O+")
            val channel = NotificationChannel(
                channelId,
                "Reminder Channel",
                NotificationManager.IMPORTANCE_HIGH // Use IMPORTANCE_HIGH
            ).apply {
                description = "Channel for reminder notifications"
                enableLights(true)
                lightColor = resources.getColor(R.color.primary, theme)
                enableVibration(true)
                setShowBadge(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        // Use a unique notification ID for each notification
        val notificationId = System.currentTimeMillis().toInt()
        Log.d(TAG, "Showing notification with ID: $notificationId")
        notificationManager.notify(notificationId, notificationBuilder.build())
        Log.d(TAG, "Notification sent successfully")
    }
} 