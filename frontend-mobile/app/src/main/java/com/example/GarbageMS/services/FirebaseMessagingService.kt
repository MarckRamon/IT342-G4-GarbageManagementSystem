package com.example.GarbageMS.services

import android.content.Context
import android.util.Log
import com.example.GarbageMS.BuildConfig
import com.example.GarbageMS.models.NotificationRequest
import com.example.GarbageMS.utils.SessionManager
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Service to handle Firebase Cloud Messaging operations
 * Including sending notifications through the new notification API
 */
class FirebaseMessagingService(private val context: Context) {

    private val TAG = "FirebaseMessagingService"
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val gson = Gson()

    // API base URLs - try different options for troubleshooting
    private val API_BASE_URL = "http://10.0.2.2:8080" // Emulator localhost
    // private val API_BASE_URL = "http://localhost:8080" // Direct localhost
    // private val API_BASE_URL = "http://127.0.0.1:8080" // Alternative localhost

    /**
     * Send a notification to a single device using the device's FCM token
     *
     * @param token FCM token of the target device
     * @param title Notification title
     * @param body Notification message body
     * @return The message ID if successful, null otherwise
     */
    fun sendNotification(token: String, title: String, body: String): String? {
        try {
            Log.d(TAG, "Sending notification - Token: $token, Title: $title, Body: $body")
            
            // Get JWT token from SessionManager
            val sessionManager = SessionManager.getInstance(context)
            val jwtToken = sessionManager.getToken()
            
            if (jwtToken.isNullOrEmpty()) {
                Log.e(TAG, "Authentication token (JWT) is missing or empty")
                return null
            }
            
            // Create the JSON body matching exactly the required format
            val jsonBody = JSONObject()
            jsonBody.put("token", token)
            jsonBody.put("title", title)
            jsonBody.put("body", body)
            
            // Use the JSONObject directly to ensure exact format
            val requestBody = jsonBody.toString().toRequestBody("application/json".toMediaType())
            
            // Log the API URL and request body
            val apiUrl = "$API_BASE_URL/api/notifications/send"
            Log.d(TAG, "API URL: $apiUrl")
            Log.d(TAG, "Request body: ${jsonBody.toString()}")
            
            // Create request with authorization header
            val request = Request.Builder()
                .url(apiUrl)
                .post(requestBody)
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer $jwtToken")  // Add JWT token
                .build()
            
            // Log the full request headers
            Log.d(TAG, "Request headers: ${request.headers}")
            
            // Execute request synchronously
            Log.d(TAG, "Executing request...")
            
            try {
                val response = client.newCall(request).execute()
                val responseBody = response.body?.string()
                
                Log.d(TAG, "Notification API Response code: ${response.code}")
                Log.d(TAG, "Notification API Response headers: ${response.headers}")
                Log.d(TAG, "Notification API Response body: $responseBody")
                
                if (!response.isSuccessful) {
                    Log.e(TAG, "Failed to send notification: ${response.code} - $responseBody")
                    return null
                }
                
                // Parse response to get message ID
                try {
                    val jsonResponse = JSONObject(responseBody)
                    val messageId = jsonResponse.optString("messageId")
                    val status = jsonResponse.optString("status")
                    
                    Log.d(TAG, "Parsed response - messageId: $messageId, status: $status")
                    
                    if (status == "success" && messageId.isNotEmpty()) {
                        Log.d(TAG, "Notification sent successfully with ID: $messageId")
                        return messageId
                    } else {
                        Log.e(TAG, "Notification status not successful or no messageId returned")
                        return null
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing response JSON: ${e.message}", e)
                    return null
                }
            } catch (e: Exception) {
                // Detailed logging of the network error
                Log.e(TAG, "Network error sending notification: ${e.message}")
                Log.e(TAG, "Network error type: ${e.javaClass.simpleName}")
                Log.e(TAG, "Network error cause: ${e.cause?.message}")
                
                // Try alternative API URL if the primary one fails
                return tryAlternativeEndpoint(token, title, body, jwtToken)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error preparing notification: ${e.message}", e)
            return null
        }
    }
    
    /**
     * Try an alternative endpoint if the primary one fails
     */
    private fun tryAlternativeEndpoint(token: String, title: String, body: String, jwtToken: String): String? {
        try {
            Log.d(TAG, "Trying alternative endpoint...")
            
            // Create the JSON body
            val jsonBody = JSONObject()
            jsonBody.put("token", token)
            jsonBody.put("title", title)
            jsonBody.put("body", body)
            
            val requestBody = jsonBody.toString().toRequestBody("application/json".toMediaType())
            
            // Try a different URL
            val alternativeUrl = "http://127.0.0.1:8080/api/notifications/send"
            Log.d(TAG, "Alternative API URL: $alternativeUrl")
            
            val request = Request.Builder()
                .url(alternativeUrl)
                .post(requestBody)
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer $jwtToken")  // Add JWT token
                .build()
            
            val response = client.newCall(request).execute()
            val responseBody = response.body?.string()
            
            Log.d(TAG, "Alternative API Response code: ${response.code}")
            Log.d(TAG, "Alternative API Response body: $responseBody")
            
            if (response.isSuccessful && responseBody != null) {
                try {
                    val jsonResponse = JSONObject(responseBody ?: "")
                    return jsonResponse.optString("messageId")
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing alternative response: ${e.message}")
                    return null
                }
            } else {
                Log.e(TAG, "Alternative endpoint also failed: ${response.code}")
                return null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error with alternative endpoint: ${e.message}")
            return null
        }
    }

    /**
     * Send a notification to multiple devices using FCM tokens
     *
     * @param tokens Array of FCM tokens for target devices
     * @param title Notification title
     * @param body Notification message body
     * @return The number of successful deliveries
     */
    fun sendMulticastNotification(tokens: Array<String>, title: String, body: String): Int {
        try {
            Log.d(TAG, "Sending multicast notification - Tokens: ${tokens.size}, Title: $title, Body: $body")
            
            // Get JWT token from SessionManager
            val sessionManager = SessionManager.getInstance(context)
            val jwtToken = sessionManager.getToken()
            
            if (jwtToken.isNullOrEmpty()) {
                Log.e(TAG, "Authentication token (JWT) is missing or empty")
                return 0
            }
            
            // Create JSON body with the required format
            val jsonBody = JSONObject()
            jsonBody.put("tokens", tokens.joinToString(","))
            jsonBody.put("title", title)
            jsonBody.put("body", body)
            
            // Log the exact request for debugging
            Log.d(TAG, "Sending multicast notification request: ${jsonBody.toString()}")
            
            val requestBody = jsonBody.toString().toRequestBody("application/json".toMediaType())
            
            // Create request
            val request = Request.Builder()
                .url("$API_BASE_URL/api/notifications/send-multicast")
                .post(requestBody)
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer $jwtToken")  // Add JWT token
                .build()
            
            // Execute request synchronously
            val response = client.newCall(request).execute()
            val responseBody = response.body?.string()
            
            Log.d(TAG, "Multicast API Response code: ${response.code}")
            Log.d(TAG, "Multicast API Response: $responseBody")
            
            if (!response.isSuccessful) {
                Log.e(TAG, "Failed to send multicast notification: ${response.code} - $responseBody")
                return 0
            }
            
            // Parse response to get success count
            val jsonResponse = JSONObject(responseBody)
            val successCount = jsonResponse.optInt("successCount", 0)
            val status = jsonResponse.optString("status")
            
            if (status == "success") {
                Log.d(TAG, "Multicast notification sent successfully to $successCount devices")
                return successCount
            } else {
                Log.e(TAG, "Multicast notification failed")
                return 0
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error sending multicast notification: ${e.message}", e)
            return 0
        }
    }
} 