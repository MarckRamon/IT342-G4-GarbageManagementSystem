package com.example.GarbageMS.services

import android.content.Context
import android.util.Log
import com.example.GarbageMS.models.Notification
import com.example.GarbageMS.models.NotificationType
import com.example.GarbageMS.utils.SessionManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.ArrayList
import java.util.Date
import java.util.Locale
import java.util.UUID

class NotificationService private constructor() {
    private lateinit var sessionManager: SessionManager
    private var context: Context? = null
    private val TAG = "NotificationService"
    
    companion object {
        @Volatile
        private var instance: NotificationService? = null
        
        fun getInstance(): NotificationService {
            return instance ?: synchronized(this) {
                instance ?: NotificationService().also { instance = it }
            }
        }
    }
    
    fun initialize(sessionManager: SessionManager) {
        this.sessionManager = sessionManager
    }
    
    fun setContext(context: Context) {
        this.context = context
    }
    
    suspend fun getAllNotifications(): List<Notification> {
        try {
            val notifications = fetchNotificationsFromServer()
            
            if (notifications.isEmpty()) {
                // If server returns no notifications, return mock data for now
                return getMockNotifications()
            } else {
                return notifications
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching notifications: ${e.message}", e)
            // Return mock data if there's an error
            return getMockNotifications()
        }
    }
    
    private suspend fun fetchNotificationsFromServer(): List<Notification> {
        return withContext(Dispatchers.IO) {
            val notifications = ArrayList<Notification>()
            
            try {
                val token = sessionManager.getToken()
                val userId = sessionManager.getUserId()
                
                if (token == null || userId == null) {
                    Log.e(TAG, "Token or userId is null, cannot fetch notifications")
                    return@withContext notifications
                }
                
                // Use the base URL from ApiService 
                val apiBaseUrl = com.example.GarbageMS.utils.ApiService.Companion.BASE_URL
                
                val client = OkHttpClient.Builder().build()
                val request = Request.Builder()
                    .url("${apiBaseUrl}api/users/$userId/notifications")
                    .addHeader("Authorization", "Bearer $token")
                    .build()
                    
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        val responseBody = response.body?.string()
                        if (responseBody != null && responseBody.isNotEmpty()) {
                            parseNotificationsFromJson(responseBody, notifications)
                        } else {
                            // Empty response body, nothing to parse
                        }
                    } else {
                        Log.e(TAG, "Failed to fetch notifications: ${response.code}")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching notifications from server: ${e.message}", e)
            }
            
            return@withContext notifications
        }
    }
    
    private fun parseNotificationsFromJson(jsonString: String, notifications: ArrayList<Notification>) {
        try {
            val jsonObject = JSONObject(jsonString)
            
            // Check if we have the expected fields
            val hasNotificationsField = jsonObject.has("notifications")
            val hasSuccessField = jsonObject.has("success")
            
            if (!hasNotificationsField || !hasSuccessField) {
                Log.e(TAG, "JSON response is missing required fields")
                return
            }
            
            val success = jsonObject.getBoolean("success")
            if (!success) {
                Log.e(TAG, "API response indicated failure")
                return
            }
            
            val notificationsArray = jsonObject.getJSONArray("notifications")
            
            for (i in 0 until notificationsArray.length()) {
                try {
                    val notificationObj = notificationsArray.getJSONObject(i)
                    
                    // Required fields
                    val id = notificationObj.getString("id")
                    val title = notificationObj.getString("title")
                    val message = notificationObj.getString("message")
                    val isRead = notificationObj.getBoolean("isRead")
                    
                    // Parse date
                    var timestamp = Date()
                    try {
                        val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
                        val parsedDate = dateFormat.parse(notificationObj.getString("timestamp"))
                        if (parsedDate != null) {
                            timestamp = parsedDate
                        } else {
                            // Use default timestamp
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing timestamp, using current date", e)
                    }
                    
                    // Parse notification type
                    var type = NotificationType.GENERAL
                    try {
                        if (notificationObj.has("type")) {
                            val typeStr = notificationObj.getString("type")
                            type = NotificationType.valueOf(typeStr)
                        } else {
                            // Use default type
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing notification type, using GENERAL", e)
                    }
                    
                    // Get related item ID if it exists
                    var relatedItemId: String? = null
                    try {
                        if (notificationObj.has("relatedItemId")) {
                            relatedItemId = notificationObj.getString("relatedItemId")
                        } else {
                            // Keep relatedItemId as null
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing relatedItemId", e)
                    }
                    
                    // Create and add the notification
                    val notification = Notification(
                        id = id,
                        title = title,
                        message = message,
                        timestamp = timestamp,
                        isRead = isRead,
                        type = type,
                        userId = sessionManager.getUserId() ?: "",
                        referenceId = relatedItemId ?: ""
                    )
                    
                    notifications.add(notification)
                } catch (e: Exception) {
                    Log.e(TAG, "Error processing notification object at index $i", e)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing notifications JSON: ${e.message}", e)
        }
    }
    
    suspend fun markAsRead(notificationId: String): Boolean {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.getToken()
                val userId = sessionManager.getUserId()
                
                if (token == null || userId == null) {
                    Log.e(TAG, "Token or userId is null, cannot mark notification as read")
                    return@withContext false
                }
                
                // TODO: Implement actual API call to mark notification as read
                
                // For now, we'll just return success
                true
            } catch (e: Exception) {
                Log.e(TAG, "Error marking notification as read: ${e.message}", e)
                false
            }
        }
    }
    
    suspend fun markAllAsRead(): Boolean {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.getToken()
                val userId = sessionManager.getUserId()
                
                if (token == null || userId == null) {
                    Log.e(TAG, "Token or userId is null, cannot mark all notifications as read")
                    return@withContext false
                }
                
                // TODO: Implement actual API call to mark all notifications as read
                
                // For now, we'll just return success
                true
            } catch (e: Exception) {
                Log.e(TAG, "Error marking all notifications as read: ${e.message}", e)
                false
            }
        }
    }
    
    private fun getMockNotifications(): List<Notification> {
        val mockNotifications = ArrayList<Notification>()
        
        // Add some mock notifications for testing
        mockNotifications.add(
            Notification(
                id = UUID.randomUUID().toString(),
                title = "Garbage Collection Today",
                message = "Don't forget to put out your garbage bins today!",
                timestamp = Date(System.currentTimeMillis() - 1000 * 60 * 60 * 2), // 2 hours ago
                isRead = false,
                type = NotificationType.PICKUP
            )
        )
        
        mockNotifications.add(
            Notification(
                id = UUID.randomUUID().toString(),
                title = "Recycling Schedule Change",
                message = "Your recycling collection has been rescheduled from Tuesday to Wednesday next week due to holiday.",
                timestamp = Date(System.currentTimeMillis() - 1000 * 60 * 60 * 24), // 1 day ago
                isRead = true,
                type = NotificationType.SCHEDULE_CHANGE
            )
        )
        
        mockNotifications.add(
            Notification(
                id = UUID.randomUUID().toString(),
                title = "Collection Route Update",
                message = "There's a new optimal route for collection in your area. Check the map for details.",
                timestamp = Date(System.currentTimeMillis() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
                isRead = false,
                type = NotificationType.SYSTEM
            )
        )
        
        mockNotifications.add(
            Notification(
                id = UUID.randomUUID().toString(),
                title = "Reminder: Hazardous Waste Day",
                message = "Drop off your hazardous waste at the community center this Saturday from 9 AM to 2 PM.",
                timestamp = Date(System.currentTimeMillis() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
                isRead = true,
                type = NotificationType.REMINDER
            )
        )
        
        mockNotifications.add(
            Notification(
                id = UUID.randomUUID().toString(),
                title = "System Maintenance",
                message = "The system will be undergoing maintenance this weekend. Some features may be temporarily unavailable.",
                timestamp = Date(System.currentTimeMillis() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
                isRead = true,
                type = NotificationType.SYSTEM
            )
        )
        
        return mockNotifications
    }
} 