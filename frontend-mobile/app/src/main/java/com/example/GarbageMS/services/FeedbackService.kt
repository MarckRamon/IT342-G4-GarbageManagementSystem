package com.example.GarbageMS.services

import android.util.Log
import com.example.GarbageMS.models.Feedback
import com.example.GarbageMS.utils.ApiService
import com.example.GarbageMS.utils.SessionManager
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.ResponseBody
import org.json.JSONObject
import java.io.IOException

class FeedbackService private constructor() {
    private val TAG = "FeedbackService"
    private val apiService: ApiService = ApiService.create()
    private val gson = Gson()
    private lateinit var sessionManager: SessionManager

    companion object {
        @Volatile
        private var instance: FeedbackService? = null

        fun getInstance(): FeedbackService {
            return instance ?: synchronized(this) {
                instance ?: FeedbackService().also { instance = it }
            }
        }
    }

    fun initialize(sessionManager: SessionManager) {
        this.sessionManager = sessionManager
        Log.d(TAG, "FeedbackService initialized with SessionManager")
    }

    suspend fun getAllFeedback(): Result<List<Feedback>> = withContext(Dispatchers.IO) {
        try {
            if (!::sessionManager.isInitialized) {
                Log.e(TAG, "SessionManager not initialized!")
                return@withContext Result.failure(IOException("SessionManager not initialized"))
            }
            
            // Get JWT token from session manager - EXACTLY like ProfileActivity does
            val token = sessionManager.getToken()
            val userId = sessionManager.getUserId()
            
            Log.d(TAG, "UserID for getAllFeedback: $userId")
            if (token != null) {
                Log.d(TAG, "Token first 20 chars: ${token.take(20)}... length: ${token.length}")
                // Debug JWT structure
                try {
                    val parts = token.split(".")
                    if (parts.size >= 2) {
                        val payload = android.util.Base64.decode(parts[1], android.util.Base64.URL_SAFE)
                        val decoded = String(payload)
                        Log.d(TAG, "JWT Payload: $decoded")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error decoding JWT: ${e.message}")
                }
            } else {
                Log.e(TAG, "Token is null")
            }
            
            if (token.isNullOrEmpty()) {
                Log.e(TAG, "Token is null or empty")
                return@withContext Result.failure(IOException("No authentication token available"))
            }
            
            if (userId.isNullOrEmpty()) {
                Log.e(TAG, "UserId is null or empty")
                return@withContext Result.failure(IOException("No user ID available"))
            }

            // Create authorization header EXACTLY like in ProfileActivity
            val authHeader = "Bearer $token"
            Log.d(TAG, "Auth header: ${authHeader.take(Math.min(authHeader.length, 30))}...")
            
            // Try the fallback endpoint first since that matches the backend controller
            try {
                Log.d(TAG, "Calling getAllFeedback endpoint...")
                val response = apiService.getAllFeedback(authHeader)
                Log.d(TAG, "getAllFeedback response code: ${response.code()}")
                
                if (!response.isSuccessful) {
                    val errorBody = logErrorDetails(response.errorBody())
                    
                    // If we get 401, try directly calling a known working endpoint to see if auth works at all
                    if (response.code() == 401) {
                        Log.d(TAG, "Got 401, testing auth with getProfile...")
                        try {
                            val profileResponse = apiService.getProfile(userId, authHeader)
                            Log.d(TAG, "getProfile test response: ${profileResponse.code()}")
                            if (profileResponse.isSuccessful) {
                                Log.d(TAG, "getProfile works but feedback doesn't - likely a backend permission issue")
                            }
                        } catch (e: Exception) {
                            Log.e(TAG, "Error in profile test: ${e.message}")
                        }
                    }
                    
                    // Try the alternative endpoint with userId in case the backend requires it
                    Log.d(TAG, "Trying user-specific feedback endpoint...")
                    return@withContext getUserFeedback(userId, authHeader)
                }
                
                if (response.isSuccessful) {
                    val responseBody = response.body()
                    if (responseBody != null) {
                        Log.d(TAG, "Got successful response, parsing ${responseBody.size} items")
                        val listType = object : TypeToken<List<Map<String, Any>>>() {}.type
                        val feedbackMapList: List<Map<String, Any>> = gson.fromJson(gson.toJson(responseBody), listType)
                        
                        val feedbackList = feedbackMapList.map { map ->
                            Feedback(
                                feedbackId = map["feedbackId"] as? String ?: "",
                                title = map["title"] as? String ?: "",
                                description = map["description"] as? String ?: "",
                                status = map["status"] as? String ?: "PENDING",
                                userId = map["userId"] as? String ?: "",
                                userEmail = map["userEmail"] as? String ?: "",
                                createdAt = map["createdAt"] as? String
                            )
                        }
                        
                        return@withContext Result.success(feedbackList)
                    } else {
                        Log.e(TAG, "Response body is null")
                        return@withContext Result.failure(IOException("Empty response body"))
                    }
                } else {
                    Log.e(TAG, "API call failed with code: ${response.code()}")
                    return@withContext Result.failure(IOException("API call failed with code: ${response.code()}"))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception in getAllFeedback: ${e.message}", e)
                return@withContext Result.failure(e)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Outer exception in getAllFeedback: ${e.message}", e)
            return@withContext Result.failure(e)
        }
    }
    
    private suspend fun getUserFeedback(userId: String, authHeader: String): Result<List<Feedback>> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Trying getUserFeedback with userId: $userId")
            val response = apiService.getUserFeedback(userId, authHeader)
            Log.d(TAG, "getUserFeedback response code: ${response.code()}")
            
            if (!response.isSuccessful) {
                val errorBody = logErrorDetails(response.errorBody())
                return@withContext Result.failure(IOException("API call failed with code: ${response.code()} - $errorBody"))
            }
            
            val responseBody = response.body()
            if (responseBody != null) {
                val listType = object : TypeToken<List<Map<String, Any>>>() {}.type
                val feedbackMapList: List<Map<String, Any>> = gson.fromJson(gson.toJson(responseBody), listType)
                
                val feedbackList = feedbackMapList.map { map ->
                    Feedback(
                        feedbackId = map["feedbackId"] as? String ?: "",
                        title = map["title"] as? String ?: "",
                        description = map["description"] as? String ?: "",
                        status = map["status"] as? String ?: "PENDING",
                        userId = map["userId"] as? String ?: "",
                        userEmail = map["userEmail"] as? String ?: "",
                        createdAt = map["createdAt"] as? String
                    )
                }
                
                return@withContext Result.success(feedbackList)
            } else {
                Log.e(TAG, "Response body is null")
                return@withContext Result.failure(IOException("Empty response body"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception in getUserFeedback: ${e.message}", e)
            return@withContext Result.failure(e)
        }
    }

    suspend fun createFeedback(title: String, description: String): Result<Feedback> = withContext(Dispatchers.IO) {
        try {
            if (!::sessionManager.isInitialized) {
                Log.e(TAG, "SessionManager not initialized!")
                return@withContext Result.failure(IOException("SessionManager not initialized"))
            }
            
            // Get JWT token from session manager - EXACTLY like ProfileActivity does
            val token = sessionManager.getToken()
            val userId = sessionManager.getUserId()
            val userEmail = sessionManager.getUserEmail() ?: ""
            
            Log.d(TAG, "UserID for createFeedback: $userId")
            Log.d(TAG, "UserEmail for createFeedback: $userEmail")
            if (token != null) {
                Log.d(TAG, "Token first 20 chars: ${token.take(20)}... length: ${token.length}")
                // Extra debug: check token parts to verify it's well-formed
                try {
                    val parts = token.split(".")
                    Log.d(TAG, "Token has ${parts.size} parts")
                    if (parts.size == 3) {
                        Log.d(TAG, "Token appears to be well-formed JWT")
                    } else {
                        Log.e(TAG, "Token is not a standard JWT (should have 3 parts)")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error checking token format: ${e.message}")
                }
            } else {
                Log.e(TAG, "Token is null")
            }
            
            if (token.isNullOrEmpty()) {
                Log.e(TAG, "Token is null or empty")
                return@withContext Result.failure(IOException("No authentication token available"))
            }
            
            if (userId.isNullOrEmpty()) {
                Log.e(TAG, "UserId is null or empty")
                return@withContext Result.failure(IOException("No user ID available"))
            }

            // Create authorization header EXACTLY like in ProfileActivity
            val authHeader = "Bearer $token"
            Log.d(TAG, "Auth header: ${authHeader.take(Math.min(authHeader.length, 30))}...")
            
            // Check if auth header follows expected format
            if (!authHeader.startsWith("Bearer ")) {
                Log.e(TAG, "Auth header doesn't start with 'Bearer '")
            }
            
            // Match exactly the JSON format shown
            val requestMap = mapOf(
                "title" to title,
                "description" to description,
                "status" to "PENDING"
            )
            
            Log.d(TAG, "Request map: $requestMap")
            
            // Try the user-specific endpoint first since that's working for retrieval
            try {
                Log.d(TAG, "Trying user-specific feedback endpoint first...")
                val result = createUserFeedback(userId, authHeader, requestMap)
                
                // If user-specific endpoint worked, return the result
                if (result.isSuccess) {
                    return@withContext result
                }
                
                // If we got here, user-specific endpoint failed, try direct endpoint
                Log.d(TAG, "User-specific endpoint failed, trying direct endpoint")
            } catch (e: Exception) {
                Log.e(TAG, "Exception in user-specific createFeedback: ${e.message}", e)
            }
            
            // Try the direct endpoint
            try {
                Log.d(TAG, "Trying direct endpoint...")
                val response = apiService.createFeedback(authHeader, requestMap)
                Log.d(TAG, "createFeedback response code: ${response.code()}")
                
                if (response.isSuccessful) {
                    val responseBody = response.body()
                    if (responseBody != null) {
                        Log.d(TAG, "Got successful response: $responseBody")
                        val feedbackMap = responseBody as Map<String, Any>
                        
                        val feedback = Feedback(
                            feedbackId = feedbackMap["feedbackId"] as? String ?: "",
                            title = feedbackMap["title"] as? String ?: "",
                            description = feedbackMap["description"] as? String ?: "",
                            status = feedbackMap["status"] as? String ?: "PENDING",
                            userId = feedbackMap["userId"] as? String ?: "",
                            userEmail = feedbackMap["userEmail"] as? String ?: "",
                            createdAt = feedbackMap["createdAt"] as? String
                        )
                        
                        return@withContext Result.success(feedback)
                    } else {
                        Log.e(TAG, "Response body is null")
                    }
                } else {
                    val errorBody = logErrorDetails(response.errorBody())
                    Log.e(TAG, "Direct endpoint failed with code: ${response.code()} - $errorBody")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception in direct createFeedback: ${e.message}", e)
            }
            
            // Last resort - try using OkHttp directly to match exactly what Postman is doing
            try {
                Log.d(TAG, "Trying direct OkHttp implementation as last resort...")
                
                // Create the JSON payload exactly like Postman
                val jsonBody = """
                    {
                        "title": "$title",
                        "description": "$description",
                        "status": "PENDING"
                    }
                """.trimIndent()
                
                // Create OkHttp client
                val client = okhttp3.OkHttpClient.Builder()
                    .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                    .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                    .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                    .build()
                
                // Create request body using non-deprecated methods
                val mediaType = "application/json; charset=utf-8".toMediaTypeOrNull()
                val requestBody = jsonBody.toRequestBody(mediaType)
                
                // Create request with the same URL and headers as Postman
                val request = okhttp3.Request.Builder()
                    .url("https://it342-g4-garbagemanagementsystem-kflf.onrender.com/api/feedback/user/$userId")
                    .addHeader("Authorization", authHeader)
                    .addHeader("Content-Type", "application/json")
                    .post(requestBody)
                    .build()
                
                // Execute the request
                val okHttpResponse = client.newCall(request).execute()
                val responseBodyString = okHttpResponse.body?.string()
                
                Log.d(TAG, "OkHttp response code: ${okHttpResponse.code}")
                if (responseBodyString != null) {
                    Log.d(TAG, "OkHttp response body: $responseBodyString")
                }
                
                if (okHttpResponse.isSuccessful && responseBodyString != null) {
                    // Parse the response
                    try {
                        val jsonObject = JSONObject(responseBodyString)
                        
                        val feedback = Feedback(
                            feedbackId = jsonObject.optString("feedbackId", ""),
                            title = jsonObject.optString("title", ""),
                            description = jsonObject.optString("description", ""),
                            status = jsonObject.optString("status", "PENDING"),
                            userId = jsonObject.optString("userId", ""),
                            userEmail = jsonObject.optString("userEmail", ""),
                            createdAt = jsonObject.optString("createdAt")
                        )
                        
                        return@withContext Result.success(feedback)
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing OkHttp response: ${e.message}")
                    }
                } else {
                    Log.e(TAG, "OkHttp call failed: ${okHttpResponse.code} - $responseBodyString")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception in OkHttp implementation: ${e.message}", e)
            }
            
            // If we get here, all attempts failed
            return@withContext Result.failure(IOException("All attempts to submit feedback failed"))
        } catch (e: Exception) {
            Log.e(TAG, "Outer exception in createFeedback: ${e.message}", e)
            return@withContext Result.failure(e)
        }
    }
    
    private suspend fun createUserFeedback(userId: String, authHeader: String, requestMap: Map<String, String>): Result<Feedback> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Trying createUserFeedback with userId: $userId")
            
            // Use the request map exactly as provided without modifications
            Log.d(TAG, "Using exact request format: $requestMap")
            
            val response = apiService.createUserFeedback(userId, authHeader, requestMap)
            Log.d(TAG, "createUserFeedback response code: ${response.code()}")
            
            if (!response.isSuccessful) {
                val errorBody = logErrorDetails(response.errorBody())
                return@withContext Result.failure(IOException("API call failed with code: ${response.code()} - $errorBody"))
            }
            
            val responseBody = response.body()
            if (responseBody != null) {
                val feedbackMap = responseBody as Map<String, Any>
                
                val feedback = Feedback(
                    feedbackId = feedbackMap["feedbackId"] as? String ?: "",
                    title = feedbackMap["title"] as? String ?: "",
                    description = feedbackMap["description"] as? String ?: "",
                    status = feedbackMap["status"] as? String ?: "PENDING",
                    userId = feedbackMap["userId"] as? String ?: "",
                    userEmail = feedbackMap["userEmail"] as? String ?: "",
                    createdAt = feedbackMap["createdAt"] as? String
                )
                
                return@withContext Result.success(feedback)
            } else {
                Log.e(TAG, "Response body is null")
                return@withContext Result.failure(IOException("Empty response body"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception in createUserFeedback: ${e.message}", e)
            return@withContext Result.failure(e)
        }
    }
    
    private fun logErrorDetails(errorBody: ResponseBody?): String {
        if (errorBody == null) return "No error details available"
        
        try {
            val errorString = errorBody.string()
            Log.e(TAG, "Error body: $errorString")
            
            // Try to parse JSON
            try {
                val jsonObject = JSONObject(errorString)
                if (jsonObject.has("message")) {
                    val message = jsonObject.getString("message")
                    Log.e(TAG, "Error message: $message")
                    return message
                }
                // Try to log entire error response for debugging
                Log.e(TAG, "Full error JSON: $jsonObject")
                return jsonObject.toString()
            } catch (e: Exception) {
                Log.e(TAG, "Error parsing JSON error body: ${e.message}")
            }
            
            return errorString
        } catch (e: Exception) {
            Log.e(TAG, "Error reading error body: ${e.message}")
            return "Error reading error details: ${e.message}"
        }
    }
} 