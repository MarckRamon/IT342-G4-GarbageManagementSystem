package com.example.GarbageMS.services

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.example.GarbageMS.models.Reminder
import com.example.GarbageMS.models.ReminderRequest
import com.example.GarbageMS.models.ReminderResponse
import com.example.GarbageMS.utils.SessionManager
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonDeserializationContext
import com.google.gson.JsonDeserializer
import com.google.gson.JsonElement
import com.google.gson.JsonParseException
import com.google.gson.JsonPrimitive
import com.google.gson.JsonSerializationContext
import com.google.gson.JsonSerializer
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.tasks.await
import java.lang.reflect.Type
import java.net.URL
import java.net.HttpURLConnection
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import java.text.ParseException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import com.google.firebase.functions.FirebaseFunctions
import com.google.firebase.functions.ktx.functions
import com.google.firebase.ktx.Firebase
import org.json.JSONArray
import com.example.GarbageMS.receivers.NotificationAlarmReceiver
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import android.widget.Toast
import android.app.AlertDialog

class ReminderService private constructor() {
    private val TAG = "ReminderService"
    private lateinit var functions: FirebaseFunctions
    private lateinit var sessionManager: SessionManager
    
    // Custom date handler for flexible date parsing
    private val gson: Gson = GsonBuilder()
        .registerTypeAdapter(Date::class.java, object : JsonDeserializer<Date>, JsonSerializer<Date> {
            // Different date formats to try for parsing
            private val dateFormats = arrayOf(
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                "yyyy-MM-dd'T'HH:mm:ss'Z'",
                "yyyy-MM-dd'T'HH:mm:ss.SSS",
                "yyyy-MM-dd'T'HH:mm:ss",
                "yyyy-MM-dd",
                "MMM dd, yyyy HH:mm:ss"
            )
            
            override fun deserialize(
                json: JsonElement,
                typeOfT: Type,
                context: JsonDeserializationContext
            ): Date? {
                val dateString = json.asString
                if (dateString.isNullOrEmpty()) {
                    return null
                }
                
                // Try all date formats
                for (format in dateFormats) {
                    try {
                        val dateFormat = SimpleDateFormat(format, Locale.US).apply {
                            timeZone = TimeZone.getTimeZone("UTC")
                        }
                        return dateFormat.parse(dateString)
                    } catch (e: ParseException) {
                        // Try next format
                    }
                }
                
                Log.e(TAG, "Could not parse date: $dateString")
                return null
            }
            
            override fun serialize(
                src: Date,
                typeOfSrc: Type,
                context: JsonSerializationContext
            ): JsonElement {
                val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }
                return JsonPrimitive(dateFormat.format(src))
            }
        })
        .create()
    
    // Add direct API URL
    private val API_BASE_URL = "http://10.0.2.2:8080" // Use this for emulator
    private val client = OkHttpClient()
    
    // Add FirebaseMessagingService
    private lateinit var firebaseMessagingService: FirebaseMessagingService
    private lateinit var context: Context
    
    companion object {
        private var instance: ReminderService? = null
        
        fun getInstance(): ReminderService {
            if (instance == null) {
                instance = ReminderService()
            }
            return instance!!
        }
    }
    
    fun initialize(sessionManager: SessionManager) {
        this.sessionManager = sessionManager
        this.functions = Firebase.functions
    }
    
    fun setContext(context: Context) {
        this.context = context
        // Initialize FirebaseMessagingService with context
        this.firebaseMessagingService = FirebaseMessagingService(context)
    }
    
    suspend fun createReminder(reminder: ReminderRequest): Result<ReminderResponse> {
        try {
            Log.d(TAG, "Creating reminder for schedule: ${reminder.scheduleId}")
            
            // Only proceed if we have an auth token
            val token = sessionManager.getToken()
            if (token.isNullOrEmpty()) {
                return Result.failure(Exception("Authentication required. Please log in again."))
            }

            // Try Firebase Function first
            try {
                Log.d(TAG, "Attempting to create reminder via Firebase Function")
                
                // Get FCM token
                val fcmToken = sessionManager.getFCMToken()
                
                // Log FCM token to help debugging
                if (fcmToken.isNullOrEmpty()) {
                    Log.w(TAG, "FCM token is null or empty. Push notifications may not work.")
                } else {
                    Log.d(TAG, "Using FCM token: $fcmToken")
                }
                
                // Prepare the data to send
                val data = hashMapOf(
                    "endpoint" to "/api/reminder",
                    "method" to "POST",
                    "token" to token,
                    "body" to hashMapOf(
                        "title" to reminder.title,
                        "reminderMessage" to reminder.reminderMessage,
                        "reminderDate" to formatDateForApi(reminder.reminderDate),
                        "scheduleId" to reminder.scheduleId,
                        "fcmToken" to fcmToken  // Add FCM token to the request
                    )
                )
                
                Log.d(TAG, "Sending data to Firebase: $data")
                
                // Make the API call through Firebase Functions
                val result = withContext(Dispatchers.IO) {
                    functions
                        .getHttpsCallable("apiProxy")
                        .call(data)
                        .await()
                }
                
                // Process the result
                val resultData = result.data as Map<*, *>
                Log.d(TAG, "API Response: $resultData")
                
                if (resultData["error"] != null) {
                    val errorMessage = resultData["error"].toString()
                    Log.e(TAG, "API error: $errorMessage")
                    throw Exception(errorMessage)
                }
                
                // Convert the result to ReminderResponse
                val responseJson = gson.toJson(resultData)
                val response = gson.fromJson(responseJson, ReminderResponse::class.java)
                
                // Schedule the notification for the reminder time
                if (response.reminderId != null && response.reminderDate != null) {
                    scheduleNotificationForReminder(
                        response.reminderId!!,
                        response.title ?: "GMS Trash Pickup Reminder",
                        response.reminderMessage ?: "You have a trash pickup scheduled",
                        response.reminderDate!!
                    )
                }
                
                return Result.success(response)
            } catch (e: Exception) {
                // If Firebase Function fails, try direct API call
                Log.e(TAG, "Firebase Function failed, trying direct API call: ${e.message}")
                return createReminderDirectApi(reminder, token)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error creating reminder: ${e.message}", e)
            return Result.failure(e)
        }
    }
    
    suspend fun createReminderDirectApi(
        reminder: ReminderRequest,
        token: String
    ): Result<ReminderResponse> {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Creating reminder via direct API call")
                
                // Format the date to ISO format
                val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
                dateFormat.timeZone = TimeZone.getTimeZone("UTC")
                val reminderDateStr = dateFormat.format(reminder.reminderDate)
                
                // Get FCM token
                val fcmToken = sessionManager.getFCMToken()
                
                // Log FCM token to help debugging
                if (fcmToken.isNullOrEmpty()) {
                    Log.w(TAG, "FCM token is null or empty. Push notifications may not work.")
                } else {
                    Log.d(TAG, "Using FCM token: $fcmToken")
                }
                
                // Create the JSON body
                val jsonBody = JSONObject()
                jsonBody.put("title", reminder.title)
                jsonBody.put("reminderMessage", reminder.reminderMessage)
                jsonBody.put("reminderDate", reminderDateStr)
                jsonBody.put("scheduleId", reminder.scheduleId)
                jsonBody.put("fcmToken", fcmToken)  // Add FCM token to the request
                
                val requestBody = jsonBody.toString().toRequestBody("application/json".toMediaType())
                
                // Create request
                val request = Request.Builder()
                    .url("$API_BASE_URL/api/reminder")
                    .post(requestBody)
                    .header("Authorization", "Bearer $token")
                    .build()
                
                Log.d(TAG, "Direct API URL: $API_BASE_URL/api/reminder")
                Log.d(TAG, "Request body: $jsonBody")
                
                // Execute request
                val response = client.newCall(request).execute()
                val responseBody = response.body?.string()
                
                Log.d(TAG, "API Response code: ${response.code}")
                Log.d(TAG, "API Response: $responseBody")
                
                if (!response.isSuccessful) {
                    throw Exception("API error: ${response.code} - $responseBody")
                }
                
                try {
                    // Try to parse response with GSON
                    val reminderResponse = gson.fromJson(responseBody ?: "", ReminderResponse::class.java)
                    
                    // Schedule the notification for the reminder time
                    if (reminderResponse.reminderId != null && reminderResponse.reminderDate != null) {
                        scheduleNotificationForReminder(
                            reminderResponse.reminderId!!,
                            reminderResponse.title ?: "GMS Trash Pickup Reminder",
                            reminderResponse.reminderMessage ?: "You have a trash pickup scheduled",
                            reminderResponse.reminderDate!!
                        )
                    }
                    
                    return@withContext Result.success(reminderResponse)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing create reminder response with GSON: ${e.message}", e)
                    
                    // Fallback to manual JSON parsing
                    try {
                        val jsonObject = JSONObject(responseBody ?: "")
                        val reminderResponse = ReminderResponse().also {
                            it.reminderId = jsonObject.optString("_id", "")
                            it.title = jsonObject.optString("title", "")
                            it.reminderMessage = jsonObject.optString("reminderMessage", "")
                            it.userId = jsonObject.optString("userId", "")
                            it.scheduleId = jsonObject.optString("scheduleId", "")
                            it.success = jsonObject.optBoolean("success", true)
                            it.message = jsonObject.optString("message", "")
                            
                            // Parse the date
                            val reminderDateStr = jsonObject.optString("reminderDate")
                            if (reminderDateStr.isNotEmpty()) {
                                // List of date formats to try
                                val dateFormats = listOf(
                                    "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                                    "yyyy-MM-dd'T'HH:mm:ss'Z'",
                                    "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
                                    "yyyy-MM-dd HH:mm:ss",
                                    "yyyy-MM-dd"
                                )
                                
                                for (format in dateFormats) {
                                    try {
                                        val sdf = SimpleDateFormat(format, Locale.getDefault())
                                        sdf.timeZone = TimeZone.getTimeZone("UTC")
                                        val date = sdf.parse(reminderDateStr)
                                        if (date != null) {
                                            it.reminderDate = date
                                            break
                                        }
                                    } catch (e: Exception) {
                                        // Try the next format
                                        Log.d(TAG, "Date parsing failed with format $format: ${e.message}")
                                    }
                                }
                            }
                        }
                        
                        // Schedule the notification for the reminder time
                        if (reminderResponse.reminderId != null && reminderResponse.reminderDate != null) {
                            scheduleNotificationForReminder(
                                reminderResponse.reminderId!!,
                                reminderResponse.title ?: "GMS Trash Pickup Reminder",
                                reminderResponse.reminderMessage ?: "You have a trash pickup scheduled",
                                reminderResponse.reminderDate!!
                            )
                        }
                        
                        return@withContext Result.success(reminderResponse)
                    } catch (e2: Exception) {
                        Log.e(TAG, "Error with manual JSON parsing: ${e2.message}", e2)
                        throw e2
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error creating reminder via direct API: ${e.message}", e)
                return@withContext Result.failure(e)
            }
        }
    }
    
    suspend fun getAllReminders(): Result<List<Reminder>> {
        try {
            Log.d(TAG, "Getting all reminders")
            
            // Only proceed if we have an auth token
            val token = sessionManager.getToken()
            if (token.isNullOrEmpty()) {
                return Result.failure(Exception("Authentication required. Please log in again."))
            }
            
            try {
                // Try Firebase Function first
                Log.d(TAG, "Attempting to get reminders via Firebase Function")
                
                // Prepare the data to send
                val data = hashMapOf(
                    "endpoint" to "/api/reminder",
                    "method" to "GET",
                    "token" to token
                )
                
                // Make the API call through Firebase Functions
                val result = withContext(Dispatchers.IO) {
                    functions
                        .getHttpsCallable("apiProxy")
                        .call(data)
                        .await()
                }
                
                // Process the result
                val resultData = result.data as Map<*, *>
                
                if (resultData["error"] != null) {
                    val errorMessage = resultData["error"].toString()
                    Log.e(TAG, "API error: $errorMessage")
                    throw Exception(errorMessage)
                }
                
                // Parse the list of reminders
                val responseJson = gson.toJson(resultData)
                val listType: Type = object : TypeToken<List<ReminderResponse>>() {}.type
                val reminderResponses: List<ReminderResponse> = gson.fromJson(responseJson, listType)
                
                // Convert to Reminder objects
                val reminders = reminderResponses.mapNotNull { response ->
                    if (response.reminderId != null) {
                        val id = response.reminderId // Store the non-null value in a local val for smart cast
                        Reminder(
                            reminderId = id ?: "",
                            title = response.title ?: "",
                            reminderMessage = response.reminderMessage ?: "",
                            reminderDate = response.reminderDate,
                            userId = response.userId ?: "",
                            scheduleId = response.scheduleId ?: ""
                        )
                    } else null
                }
                
                return Result.success(reminders)
            } catch (e: Exception) {
                // If Firebase Function fails, try direct API call
                Log.e(TAG, "Firebase Function failed, trying direct API call: ${e.message}")
                return getAllReminders(token)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting reminders: ${e.message}", e)
            return Result.failure(e)
        }
    }
    
    private suspend fun getAllReminders(token: String): Result<List<Reminder>> {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Getting all reminders via direct API call")
                
                // Create request
                val request = Request.Builder()
                    .url("$API_BASE_URL/api/reminder")
                    .get()
                    .header("Authorization", "Bearer $token")
                    .build()
                
                Log.d(TAG, "Direct API URL: $API_BASE_URL/api/reminder")
                
                // Execute request
                val response = client.newCall(request).execute()
                val responseBody = response.body?.string()
                
                Log.d(TAG, "API Response code: ${response.code}")
                Log.d(TAG, "API Response: $responseBody")
                
                if (!response.isSuccessful) {
                    throw Exception("API error: ${response.code} - $responseBody")
                }
                
                if (responseBody.isNullOrEmpty()) {
                    return@withContext Result.success(emptyList())
                }
                
                try {
                    // Try to parse response with GSON
                    val type = object : TypeToken<List<ReminderResponse>>() {}.type
                    val reminderResponses = gson.fromJson<List<ReminderResponse>>(responseBody, type)
                    
                    // Check each reminder for date parsing issues
                    reminderResponses.forEach { reminder ->
                        if (reminder.reminderDate == null && responseBody.isNotEmpty()) {
                            try {
                                // Find the specific reminder in the JSON array
                                val jsonArray = JSONArray(responseBody)
                                for (i in 0 until jsonArray.length()) {
                                    val jsonObject = jsonArray.getJSONObject(i)
                                    if (jsonObject.optString("_id") == reminder.reminderId) {
                                        val reminderDateStr = jsonObject.optString("reminderDate")
                                        
                                        if (reminderDateStr.isNotEmpty()) {
                                            // List of date formats to try
                                            val dateFormats = listOf(
                                                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                                                "yyyy-MM-dd'T'HH:mm:ss'Z'",
                                                "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
                                                "yyyy-MM-dd HH:mm:ss",
                                                "yyyy-MM-dd"
                                            )
                                            
                                            for (format in dateFormats) {
                                                try {
                                                    val sdf = SimpleDateFormat(format, Locale.getDefault())
                                                    sdf.timeZone = TimeZone.getTimeZone("UTC")
                                                    val date = sdf.parse(reminderDateStr)
                                                    if (date != null) {
                                                        reminder.reminderDate = date
                                                        break
                                                    }
                                                } catch (e: Exception) {
                                                    // Try the next format
                                                    Log.d(TAG, "Date parsing failed with format $format: ${e.message}")
                                                }
                                            }
                                        }
                                        break
                                    }
                                }
                            } catch (e: Exception) {
                                Log.e(TAG, "Error with manual JSON date parsing: ${e.message}", e)
                            }
                        }
                    }
                    
                    // Convert ReminderResponse objects to Reminder objects
                    val reminders = reminderResponses.mapNotNull { response ->
                        if (response.reminderId != null) {
                            val id = response.reminderId // Store the non-null value in a local val for smart cast
                            Reminder(
                                reminderId = id ?: "",
                                title = response.title ?: "",
                                reminderMessage = response.reminderMessage ?: "",
                                reminderDate = response.reminderDate,
                                userId = response.userId ?: "",
                                scheduleId = response.scheduleId ?: ""
                            )
                        } else null
                    }
                    
                    return@withContext Result.success(reminders)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing get all reminders response with GSON: ${e.message}", e)
                    
                    // Fallback to manual JSON parsing
                    try {
                        val manualReminders = mutableListOf<ReminderResponse>()
                        val jsonArray = JSONArray(responseBody)
                        
                        for (i in 0 until jsonArray.length()) {
                            val jsonObject = jsonArray.getJSONObject(i)
                            val reminderResponse = ReminderResponse().also {
                                it.reminderId = jsonObject.optString("_id", "")
                                it.title = jsonObject.optString("title", "")
                                it.reminderMessage = jsonObject.optString("reminderMessage", "")
                                it.userId = jsonObject.optString("userId", "")
                                it.scheduleId = jsonObject.optString("scheduleId", "")
                                it.success = jsonObject.optBoolean("success", true)
                                it.message = jsonObject.optString("message", "")
                                
                                // Parse the date
                                val reminderDateStr = jsonObject.optString("reminderDate")
                                if (reminderDateStr.isNotEmpty()) {
                                    // List of date formats to try
                                    val dateFormats = listOf(
                                        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                                        "yyyy-MM-dd'T'HH:mm:ss'Z'",
                                        "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
                                        "yyyy-MM-dd HH:mm:ss",
                                        "yyyy-MM-dd"
                                    )
                                    
                                    for (format in dateFormats) {
                                        try {
                                            val sdf = SimpleDateFormat(format, Locale.getDefault())
                                            sdf.timeZone = TimeZone.getTimeZone("UTC")
                                            val date = sdf.parse(reminderDateStr)
                                            if (date != null) {
                                                it.reminderDate = date
                                                break
                                            }
                                        } catch (e: Exception) {
                                            // Try the next format
                                            Log.d(TAG, "Date parsing failed with format $format: ${e.message}")
                                        }
                                    }
                                }
                            }
                            
                            manualReminders.add(reminderResponse)
                        }
                        
                        // Convert ReminderResponse objects to Reminder objects
                        val reminders = manualReminders.mapNotNull { response ->
                            if (response.reminderId != null) {
                                val id = response.reminderId // Store the non-null value in a local val for smart cast
                                Reminder(
                                    reminderId = id ?: "",
                                    title = response.title ?: "",
                                    reminderMessage = response.reminderMessage ?: "",
                                    reminderDate = response.reminderDate,
                                    userId = response.userId ?: "",
                                    scheduleId = response.scheduleId ?: ""
                                )
                            } else null
                        }
                        
                        return@withContext Result.success(reminders)
                    } catch (e2: Exception) {
                        Log.e(TAG, "Error with manual JSON parsing: ${e2.message}", e2)
                        throw e2
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error getting all reminders via direct API: ${e.message}", e)
                return@withContext Result.failure(e)
            }
        }
    }
    
    suspend fun getReminderById(reminderId: String): Result<Reminder> {
        try {
            Log.d(TAG, "Getting reminder by ID: $reminderId")
            
            // Only proceed if we have an auth token
            val token = sessionManager.getToken()
            if (token.isNullOrEmpty()) {
                return Result.failure(Exception("Authentication required. Please log in again."))
            }
            
            try {
                // Try Firebase Function first
                Log.d(TAG, "Attempting to get reminder by ID via Firebase Function")
                
                // Prepare the data to send
                val data = hashMapOf(
                    "endpoint" to "/api/reminder/$reminderId",
                    "method" to "GET",
                    "token" to token
                )
                
                // Make the API call through Firebase Functions
                val result = withContext(Dispatchers.IO) {
                    functions
                        .getHttpsCallable("apiProxy")
                        .call(data)
                        .await()
                }
                
                // Process the result
                val resultData = result.data as Map<*, *>
                
                if (resultData["error"] != null) {
                    val errorMessage = resultData["error"].toString()
                    Log.e(TAG, "API error: $errorMessage")
                    throw Exception(errorMessage)
                }
                
                // Convert the result to ReminderResponse
                val responseJson = gson.toJson(resultData)
                val response = gson.fromJson(responseJson, ReminderResponse::class.java)
                
                if (response.reminderId == null) {
                    return Result.failure(Exception("Reminder not found"))
                }
                
                // Store the non-null value in a local val for smart cast
                val id = response.reminderId

                // Convert to Reminder object
                val reminder = Reminder(
                    reminderId = id ?: "",
                    title = response.title ?: "",
                    reminderMessage = response.reminderMessage ?: "",
                    reminderDate = response.reminderDate,
                    userId = response.userId ?: "",
                    scheduleId = response.scheduleId ?: ""
                )
                
                return Result.success(reminder)
            } catch (e: Exception) {
                // If Firebase Function fails, try direct API call
                Log.e(TAG, "Firebase Function failed, trying direct API call: ${e.message}")
                return getReminderByIdDirectApi(reminderId, token)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting reminder: ${e.message}", e)
            return Result.failure(e)
        }
    }
    
    private suspend fun getReminderByIdDirectApi(reminderId: String, token: String): Result<Reminder> {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Getting reminder details via direct API call for ID: $reminderId")
                
                // Create request
                val request = Request.Builder()
                    .url("$API_BASE_URL/api/reminder/$reminderId")
                    .get()
                    .header("Authorization", "Bearer $token")
                    .build()
                
                Log.d(TAG, "Direct API URL: $API_BASE_URL/api/reminder/$reminderId")
                
                // Execute request
                val response = client.newCall(request).execute()
                val responseBody = response.body?.string()
                
                Log.d(TAG, "API Response code: ${response.code}")
                Log.d(TAG, "API Response: $responseBody")
                
                if (!response.isSuccessful) {
                    throw Exception("API error: ${response.code} - $responseBody")
                }
                
                try {
                    // Try to parse response with GSON
                    val reminderResponse = gson.fromJson(responseBody ?: "", ReminderResponse::class.java)
                    
                    // If date parsing failed in GSON, try to manually parse it
                    if (reminderResponse.reminderDate == null && responseBody != null) {
                        try {
                            val jsonObject = JSONObject(responseBody ?: "")
                            val reminderDateStr = jsonObject.optString("reminderDate")
                            
                            if (reminderDateStr.isNotEmpty()) {
                                // List of date formats to try
                                val dateFormats = listOf(
                                    "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                                    "yyyy-MM-dd'T'HH:mm:ss'Z'",
                                    "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
                                    "yyyy-MM-dd HH:mm:ss",
                                    "yyyy-MM-dd"
                                )
                                
                                for (format in dateFormats) {
                                    try {
                                        val sdf = SimpleDateFormat(format, Locale.getDefault())
                                        sdf.timeZone = TimeZone.getTimeZone("UTC")
                                        val date = sdf.parse(reminderDateStr)
                                        if (date != null) {
                                            reminderResponse.reminderDate = date
                                            break
                                        }
                                    } catch (e: Exception) {
                                        // Try the next format
                                        Log.d(TAG, "Date parsing failed with format $format: ${e.message}")
                                    }
                                }
                            }
                        } catch (e: Exception) {
                            Log.e(TAG, "Error with manual JSON date parsing: ${e.message}", e)
                        }
                    }
                    
                    // Convert ReminderResponse to Reminder
                    val reminder = Reminder(
                        reminderId = reminderResponse.reminderId ?: "",
                        title = reminderResponse.title ?: "",
                        reminderMessage = reminderResponse.reminderMessage ?: "",
                        reminderDate = reminderResponse.reminderDate,
                        userId = reminderResponse.userId ?: "",
                        scheduleId = reminderResponse.scheduleId ?: ""
                    )
                    
                    return@withContext Result.success(reminder)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing get reminder response with GSON: ${e.message}", e)
                    
                    // Fallback to manual JSON parsing
                    try {
                        val jsonObject = JSONObject(responseBody ?: "")
                        val reminderResponse = ReminderResponse().also {
                            it.reminderId = jsonObject.optString("_id", "")
                            it.title = jsonObject.optString("title", "")
                            it.reminderMessage = jsonObject.optString("reminderMessage", "")
                            it.userId = jsonObject.optString("userId", "")
                            it.scheduleId = jsonObject.optString("scheduleId", "")
                            it.success = jsonObject.optBoolean("success", true)
                            it.message = jsonObject.optString("message", "")
                            
                            // Parse the date
                            val reminderDateStr = jsonObject.optString("reminderDate")
                            if (reminderDateStr.isNotEmpty()) {
                                // List of date formats to try
                                val dateFormats = listOf(
                                    "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                                    "yyyy-MM-dd'T'HH:mm:ss'Z'",
                                    "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
                                    "yyyy-MM-dd HH:mm:ss",
                                    "yyyy-MM-dd"
                                )
                                
                                for (format in dateFormats) {
                                    try {
                                        val sdf = SimpleDateFormat(format, Locale.getDefault())
                                        sdf.timeZone = TimeZone.getTimeZone("UTC")
                                        val date = sdf.parse(reminderDateStr)
                                        if (date != null) {
                                            it.reminderDate = date
                                            break
                                        }
                                    } catch (e: Exception) {
                                        // Try the next format
                                        Log.d(TAG, "Date parsing failed with format $format: ${e.message}")
                                    }
                                }
                            }
                        }
                        
                        // Convert ReminderResponse to Reminder
                        val reminder = Reminder(
                            reminderId = reminderResponse.reminderId ?: "",
                            title = reminderResponse.title ?: "",
                            reminderMessage = reminderResponse.reminderMessage ?: "",
                            reminderDate = reminderResponse.reminderDate,
                            userId = reminderResponse.userId ?: "",
                            scheduleId = reminderResponse.scheduleId ?: ""
                        )
                        
                        return@withContext Result.success(reminder)
                    } catch (e2: Exception) {
                        Log.e(TAG, "Error with manual JSON parsing: ${e2.message}", e2)
                        throw e2
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error getting reminder via direct API: ${e.message}", e)
                return@withContext Result.failure(e)
            }
        }
    }
    
    suspend fun deleteReminder(reminderId: String): Result<ReminderResponse> {
        try {
            Log.d(TAG, "Deleting reminder with ID: $reminderId")
            
            // Only proceed if we have an auth token
            val token = sessionManager.getToken()
            if (token.isNullOrEmpty()) {
                return Result.failure(Exception("Authentication required. Please log in again."))
            }
            
            try {
                // Try Firebase Function first
                Log.d(TAG, "Attempting to delete reminder via Firebase Function")
                
                // Prepare the data to send
                val data = hashMapOf(
                    "endpoint" to "/api/reminder/$reminderId",
                    "method" to "DELETE",
                    "token" to token
                )
                
                // Make the API call through Firebase Functions
                val result = withContext(Dispatchers.IO) {
                    functions
                        .getHttpsCallable("apiProxy")
                        .call(data)
                        .await()
                }
                
                // Process the result
                val resultData = result.data as Map<*, *>
                
                if (resultData["error"] != null) {
                    val errorMessage = resultData["error"].toString()
                    Log.e(TAG, "API error: $errorMessage")
                    throw Exception(errorMessage)
                }
                
                // Convert the result to ReminderResponse
                val responseJson = gson.toJson(resultData)
                val response = gson.fromJson(responseJson, ReminderResponse::class.java)
                
                return Result.success(response)
            } catch (e: Exception) {
                // If Firebase Function fails, try direct API call
                Log.e(TAG, "Firebase Function failed, trying direct API call: ${e.message}")
                return deleteReminderDirectApi(reminderId, token)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error deleting reminder: ${e.message}", e)
            return Result.failure(e)
        }
    }
    
    private suspend fun deleteReminderDirectApi(reminderId: String, token: String): Result<ReminderResponse> {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Deleting reminder via direct API call for ID: $reminderId")
                
                // Create request
                val request = Request.Builder()
                    .url("$API_BASE_URL/api/reminder/$reminderId")
                    .delete()
                    .header("Authorization", "Bearer $token")
                    .build()
                
                Log.d(TAG, "Direct API URL: $API_BASE_URL/api/reminder/$reminderId")
                
                // Execute request
                val response = client.newCall(request).execute()
                val responseBody = response.body?.string()
                
                Log.d(TAG, "API Response code: ${response.code}")
                Log.d(TAG, "API Response: $responseBody")
                
                if (!response.isSuccessful) {
                    throw Exception("API error: ${response.code} - $responseBody")
                }
                
                try {
                    // Try to parse response with GSON
                    val reminderResponse = gson.fromJson(responseBody ?: "", ReminderResponse::class.java)
                    return@withContext Result.success(reminderResponse)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing delete response with GSON: ${e.message}", e)
                    
                    // Fallback to manual JSON parsing
                    try {
                        val jsonObject = JSONObject(responseBody ?: "")
                        val success = jsonObject.optBoolean("success", false)
                        val message = jsonObject.optString("message", "Reminder deleted successfully")
                        
                        // Create a response with just success info
                        val reminderResponse = ReminderResponse(success, message)
                        return@withContext Result.success(reminderResponse)
                    } catch (e2: Exception) {
                        Log.e(TAG, "Error with manual JSON parsing: ${e2.message}", e2)
                        // If we can't parse the response at all, but the HTTP status was successful,
                        // assume the operation succeeded
                        val reminderResponse = ReminderResponse(true, "Reminder deleted successfully")
                        return@withContext Result.success(reminderResponse)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error deleting reminder via direct API: ${e.message}", e)
                return@withContext Result.failure(e)
            }
        }
    }
    
    private fun formatDateForApi(date: Date): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        return sdf.format(date)
    }
    
    /**
     * Schedule a notification to be sent at the reminder time
     */
    private fun scheduleNotificationForReminder(
        reminderId: String,
        title: String,
        message: String,
        reminderDate: Date
    ) {
        try {
            // Check if we have context
            if (!::context.isInitialized) {
                Log.e(TAG, "Cannot schedule notification: context not initialized")
                return
            }
            
            // Get FCM token
            val fcmToken = sessionManager.getFCMToken()
            if (fcmToken.isNullOrEmpty()) {
                Log.e(TAG, "Cannot schedule notification: FCM token is null or empty")
                return
            }
            
            // Calculate time until reminder
            val currentTime = System.currentTimeMillis()
            val reminderTime = reminderDate.time
            
            // Only schedule if the reminder is in the future
            if (reminderTime <= currentTime) {
                Log.w(TAG, "Not scheduling notification for reminder $reminderId as time has already passed")
                
                // If time has passed but it's within the last hour, send the notification immediately
                if (currentTime - reminderTime < TimeUnit.HOURS.toMillis(1)) {
                    Log.d(TAG, "Time has recently passed, sending notification immediately")
                    sendNotificationImmediately(reminderId, fcmToken, title, message)
                }
                return
            }
            
            Log.d(TAG, "Scheduling notification for reminder $reminderId at ${formatDateForApi(reminderDate)}")
            
            // Create intent for alarm receiver
            val intent = Intent(context, NotificationAlarmReceiver::class.java).apply {
                putExtra("REMINDER_ID", reminderId)
                putExtra("FCM_TOKEN", fcmToken)
                putExtra("TITLE", title)
                putExtra("MESSAGE", message)
            }
            
            // Create a unique request code based on the reminder ID
            val requestCode = reminderId.hashCode()
            
            // Create pending intent
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            // Get alarm manager
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            
            // Set exact alarm for the reminder time
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    reminderTime,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    reminderTime,
                    pendingIntent
                )
            }
            
            Log.d(TAG, "Notification scheduled successfully for reminder $reminderId")
        } catch (e: Exception) {
            Log.e(TAG, "Error scheduling notification: ${e.message}", e)
        }
    }
    
    /**
     * Send a notification immediately for cases where the reminder time has already passed
     */
    private fun sendNotificationImmediately(
        reminderId: String,
        fcmToken: String,
        title: String,
        message: String
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val result = firebaseMessagingService.sendNotification(fcmToken, title, message)
                if (result != null) {
                    Log.d(TAG, "Immediate notification sent successfully for reminder: $reminderId")
                } else {
                    Log.e(TAG, "Failed to send immediate notification for reminder: $reminderId")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error sending immediate notification: ${e.message}", e)
            }
        }
    }
    
    /**
     * Test method to send an immediate notification
     * This can be used to verify the notification API is working
     */
    fun sendTestNotification(context: Context): Boolean {
        try {
            Log.d(TAG, "Sending test notification")
            
            // Set context if not already done
            if (!::context.isInitialized) {
                this.context = context
            }
            
            // Get FCM token
            val fcmToken = sessionManager.getFCMToken()
            if (fcmToken.isNullOrEmpty()) {
                Log.e(TAG, "Cannot send test notification: FCM token is null or empty")
                Toast.makeText(
                    context,
                    "Error: FCM token not available. Check Firebase setup.",
                    Toast.LENGTH_LONG
                ).show()
                return false
            }
            
            Log.d(TAG, "Using FCM token: $fcmToken")
            Toast.makeText(
                context,
                "Sending test notification...",
                Toast.LENGTH_SHORT
            ).show()
            
            // Send test notification
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val result = firebaseMessagingService.sendNotification(
                        fcmToken,
                        "Test Notification",
                        "This is a test notification from the GMS app"
                    )
                    
                    withContext(Dispatchers.Main) {
                        if (result != null) {
                            Log.d(TAG, "Test notification sent successfully with ID: $result")
                            Toast.makeText(
                                context,
                                "Test notification sent successfully",
                                Toast.LENGTH_SHORT
                            ).show()
                        } else {
                            Log.e(TAG, "Failed to send test notification")
                            Toast.makeText(
                                context,
                                "Failed to send notification. Check logs for details.",
                                Toast.LENGTH_LONG
                            ).show()
                            
                            // Try a direct test to the actual server URL
                            directServerTest(context, fcmToken)
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error sending test notification: ${e.message}", e)
                    val errorMsg = "Error: ${e.javaClass.simpleName} - ${e.message}"
                    withContext(Dispatchers.Main) {
                        Toast.makeText(
                            context,
                            errorMsg,
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
            }
            
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Error preparing test notification: ${e.message}", e)
            Toast.makeText(
                context,
                "Error: ${e.message}",
                Toast.LENGTH_SHORT
            ).show()
            return false
        }
    }
    
    /**
     * Try a direct test to the actual server URL
     */
    private fun directServerTest(context: Context, fcmToken: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Create request manually
                val client = OkHttpClient.Builder()
                    .connectTimeout(15, TimeUnit.SECONDS)
                    .build()
                
                // Get auth token for authentication
                val token = sessionManager.getToken()
                if (token.isNullOrEmpty()) {
                    Log.e(TAG, "Cannot test connection: Authentication token not available")
                    withContext(Dispatchers.Main) {
                        Toast.makeText(
                            context,
                            "Error: Authentication token not available. Please log in again.",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                    return@launch
                }
                
                // Create JSON body
                val jsonBody = JSONObject()
                jsonBody.put("token", fcmToken)
                jsonBody.put("title", "Direct Test")
                jsonBody.put("body", "Testing direct connection to server")
                
                val requestBody = jsonBody.toString()
                    .toRequestBody("application/json".toMediaType())
                
                // Try multiple URLs to determine which works
                val urls = listOf(
                    "http://10.0.2.2:8080/api/notifications/send",
                    "http://localhost:8080/api/notifications/send",
                    "http://127.0.0.1:8080/api/notifications/send"
                )
                
                var success = false
                
                for (url in urls) {
                    try {
                        Log.d(TAG, "Trying direct test to URL: $url")
                        
                        val request = Request.Builder()
                            .url(url)
                            .post(requestBody)
                            .header("Content-Type", "application/json")
                            .header("Authorization", "Bearer $token")  // Add JWT token
                            .build()
                        
                        val response = client.newCall(request).execute()
                        val responseBody = response.body?.string()
                        
                        Log.d(TAG, "Direct test response code: ${response.code}")
                        Log.d(TAG, "Direct test response: $responseBody")
                        
                        if (response.isSuccessful) {
                            success = true
                            withContext(Dispatchers.Main) {
                                Toast.makeText(
                                    context,
                                    "Direct test successful with URL: $url",
                                    Toast.LENGTH_LONG
                                ).show()
                            }
                            break
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error with URL $url: ${e.message}")
                    }
                }
                
                if (!success) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(
                            context,
                            "All direct connection tests failed. Check server URL and connectivity.",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error in direct server test: ${e.message}")
            }
        }
    }
    
    /**
     * Try a direct connection to the server using the exact URL and format shown in the screenshot
     * This will help diagnose if we have the correct URL and request format
     */
    fun testDirectPostmanConnection(context: Context) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                Log.d(TAG, "Testing direct connection like Postman...")
                
                // Get FCM token
                val fcmToken = sessionManager.getFCMToken()
                if (fcmToken.isNullOrEmpty()) {
                    Log.e(TAG, "Cannot test connection: FCM token is null or empty")
                    withContext(Dispatchers.Main) {
                        Toast.makeText(
                            context,
                            "Error: FCM token not available",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                    return@launch
                }
                
                // Get auth token for authentication
                val token = sessionManager.getToken()
                if (token.isNullOrEmpty()) {
                    Log.e(TAG, "Cannot test connection: Authentication token not available")
                    withContext(Dispatchers.Main) {
                        Toast.makeText(
                            context,
                            "Error: Authentication token not available. Please log in again.",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                    return@launch
                }
                
                // Create client with extended timeouts
                val client = OkHttpClient.Builder()
                    .connectTimeout(30, TimeUnit.SECONDS)
                    .readTimeout(30, TimeUnit.SECONDS)
                    .writeTimeout(30, TimeUnit.SECONDS)
                    .build()
                
                // Create exact JSON payload as shown in screenshot
                val jsonBody = JSONObject()
                jsonBody.put("token", fcmToken)
                jsonBody.put("title", "GMS Trash Pickup Reminder")
                jsonBody.put("body", "Please watch 'To be Hero X' to proceed Trash Pickup in your Location")
                
                val requestBody = jsonBody.toString().toRequestBody("application/json".toMediaType())
                
                // List of URLs to try
                val urls = listOf(
                    "http://localhost:8080/api/notifications/send",  // Direct localhost
                    "http://10.0.2.2:8080/api/notifications/send",   // Emulator mapping to host
                    "http://127.0.0.1:8080/api/notifications/send",  // Alternative localhost
                    "http://192.168.0.1:8080/api/notifications/send" // Common local IP
                )
                
                var successUrl: String? = null
                var errorDetails = ""
                
                for (url in urls) {
                    try {
                        Log.d(TAG, "Trying Postman-style request to: $url")
                        withContext(Dispatchers.Main) {
                            Toast.makeText(
                                context,
                                "Testing URL: $url",
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                        
                        val request = Request.Builder()
                            .url(url)
                            .post(requestBody)
                            .header("Content-Type", "application/json")
                            .header("Authorization", "Bearer $token")  // Add JWT token
                            .build()
                        
                        // Execute synchronously
                        val response = client.newCall(request).execute()
                        val responseBody = response.body?.string()
                        
                        Log.d(TAG, "Response from $url - Code: ${response.code}")
                        Log.d(TAG, "Response body: $responseBody")
                        
                        if (response.isSuccessful) {
                            Log.d(TAG, "Successful connection to: $url")
                            successUrl = url
                            break
                        } else {
                            errorDetails += "URL $url: ${response.code} - $responseBody\n"
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error with URL $url: ${e.message}")
                        errorDetails += "URL $url: ${e.javaClass.simpleName} - ${e.message}\n"
                    }
                }
                
                withContext(Dispatchers.Main) {
                    if (successUrl != null) {
                        Toast.makeText(
                            context,
                            "Connection successful with URL: $successUrl",
                            Toast.LENGTH_LONG
                        ).show()
                        
                        // Success dialog with details
                        AlertDialog.Builder(context)
                            .setTitle("Connection Test Successful")
                            .setMessage("Successfully connected to: $successUrl\n" +
                                    "Please update the API_BASE_URL in FirebaseMessagingService.kt " +
                                    "to use this URL for all notifications.")
                            .setPositiveButton("OK", null)
                            .show()
                    } else {
                        Toast.makeText(
                            context,
                            "All connection tests failed",
                            Toast.LENGTH_LONG
                        ).show()
                        
                        // Error dialog with details
                        AlertDialog.Builder(context)
                            .setTitle("Connection Test Failed")
                            .setMessage("Could not connect to the notification server. Please check:\n\n" +
                                    "1. Is the server running?\n" +
                                    "2. Is the URL correct?\n" +
                                    "3. Network connectivity?\n\n" +
                                    "Error details:\n$errorDetails")
                            .setPositiveButton("OK", null)
                            .show()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error in direct Postman test: ${e.message}")
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        context,
                        "Test error: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
    
    /**
     * Log FCM token registration status for debugging
     */
    fun logFCMTokenStatus(context: Context) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Set context if not already done
                if (!::context.isInitialized) {
                    this@ReminderService.context = context
                }
                
                // Get FCM token
                val fcmToken = sessionManager.getFCMToken()
                if (fcmToken.isNullOrEmpty()) {
                    Log.e(TAG, "FCM TOKEN IS NULL OR EMPTY! Push notifications cannot work without a token.")
                    withContext(Dispatchers.Main) {
                        Toast.makeText(
                            context,
                            "Error: FCM token is not available. Notifications will not work.",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                    return@launch
                }
                
                Log.d(TAG, "FCM Token is available: ${fcmToken.substring(0, 20)}...") // Log first 20 chars for privacy
                
                // Get auth token
                val jwtToken = sessionManager.getToken()
                if (jwtToken.isNullOrEmpty()) {
                    Log.e(TAG, "JWT token is not available. Please log in again.")
                    return@launch
                }
                
                // Create a diagnostic request to check if server can send a test notification
                val jsonBody = JSONObject()
                jsonBody.put("token", fcmToken)
                jsonBody.put("title", "Diagnostic Test")
                jsonBody.put("body", "Testing push notification setup")
                
                val requestBody = jsonBody.toString().toRequestBody("application/json".toMediaType())
                
                // Log the API URL and request body
                val apiUrl = "$API_BASE_URL/api/notifications/send"
                Log.d(TAG, "Sending diagnostic request to: $apiUrl")
                
                // Create and execute request
                val request = Request.Builder()
                    .url(apiUrl)
                    .post(requestBody)
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer $jwtToken")
                    .build()
                
                try {
                    val response = client.newCall(request).execute()
                    val responseBody = response.body?.string()
                    
                    Log.d(TAG, "Diagnostic API Response code: ${response.code}")
                    Log.d(TAG, "Diagnostic API Response: $responseBody")
                    
                    withContext(Dispatchers.Main) {
                        if (response.isSuccessful) {
                            Toast.makeText(
                                context,
                                "Test notification sent. Please check if you receive it.",
                                Toast.LENGTH_LONG
                            ).show()
                        } else {
                            Toast.makeText(
                                context,
                                "Notification test failed. Status: ${response.code}",
                                Toast.LENGTH_LONG
                            ).show()
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error in diagnostic request: ${e.message}", e)
                    withContext(Dispatchers.Main) {
                        Toast.makeText(
                            context,
                            "Network error: ${e.message}",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error checking FCM token: ${e.message}", e)
            }
        }
    }
    
    /**
     * Get the API base URL used by this service
     * This allows other components to use the same URL
     */
    fun getApiBaseUrl(): String {
        return API_BASE_URL
    }
} 