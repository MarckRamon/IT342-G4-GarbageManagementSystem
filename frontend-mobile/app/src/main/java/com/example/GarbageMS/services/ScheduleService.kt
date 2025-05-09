package com.example.GarbageMS.services

import android.util.Log
import com.example.GarbageMS.models.Schedule
import com.example.GarbageMS.models.ScheduleRequest
import com.example.GarbageMS.models.ScheduleResponse
import com.example.GarbageMS.utils.ApiService
import com.example.GarbageMS.utils.SessionManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.IOException

/**
 * Service for handling Schedule-related API calls
 */
class ScheduleService private constructor() {
    private val TAG = "ScheduleService"
    private val apiService: ApiService = ApiService.create()
    private lateinit var sessionManager: SessionManager

    companion object {
        @Volatile
        private var instance: ScheduleService? = null

        fun getInstance(): ScheduleService {
            return instance ?: synchronized(this) {
                instance ?: ScheduleService().also { instance = it }
            }
        }
    }

    fun initialize(sessionManager: SessionManager) {
        this.sessionManager = sessionManager
        Log.d(TAG, "ScheduleService initialized with SessionManager")
    }

    /**
     * Get all schedules - as per your requirements, this should only get all publicly available schedules
     * No JWT needed as per backend
     */
    suspend fun getAllSchedules(): Result<List<Schedule>> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Getting all schedules")
            val response = apiService.getAllSchedules()
            
            Log.d(TAG, "getAllSchedules response code: ${response.code()}")
            
            if (!response.isSuccessful) {
                Log.e(TAG, "Failed to get schedules: ${response.code()}")
                val errorBody = response.errorBody()?.string() ?: "No error body"
                Log.e(TAG, "Error body: $errorBody")
                return@withContext Result.failure(IOException("Failed to get schedules: ${response.code()} - $errorBody"))
            }
            
            val scheduleResponses = response.body()
            if (scheduleResponses == null) {
                Log.e(TAG, "Empty response body")
                return@withContext Result.failure(IOException("Empty response body"))
            }
            
            Log.d(TAG, "Received ${scheduleResponses.size} schedules from API")
            
            // Log detailed response
            scheduleResponses.forEachIndexed { index, resp ->
                Log.d(TAG, "Schedule $index - ID: ${resp.scheduleId}, " +
                        "Location: ${resp.locationId}, " +
                        "Date: ${resp.pickupDate}, " +
                        "Time: ${resp.pickupTime}, " +
                        "Status: ${resp.status}")
            }
            
            val schedules = scheduleResponses.map { resp ->
                Schedule(
                    scheduleId = resp.scheduleId ?: "",
                    pickupDate = resp.pickupDate ?: "",
                    pickupTime = resp.pickupTime ?: "",
                    locationId = resp.locationId ?: "",
                    status = resp.status ?: "PENDING",
                    userId = resp.userId ?: "",
                    userEmail = resp.userEmail ?: ""
                )
            }
            
            return@withContext Result.success(schedules)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting schedules: ${e.message}", e)
            return@withContext Result.failure(e)
        }
    }

    /**
     * Get schedules for the current logged-in user
     * JWT required
     */
    suspend fun getUserSchedules(): Result<List<Schedule>> = withContext(Dispatchers.IO) {
        try {
            if (!::sessionManager.isInitialized) {
                Log.e(TAG, "SessionManager not initialized!")
                return@withContext Result.failure(IOException("SessionManager not initialized"))
            }
            
            val token = sessionManager.getToken()
            if (token.isNullOrEmpty()) {
                Log.e(TAG, "No auth token available")
                return@withContext Result.failure(IOException("No authentication token available"))
            }
            
            val userId = sessionManager.getUserId()
            Log.d(TAG, "Getting schedules for user ID: $userId")
            
            val authHeader = "Bearer $token"
            Log.d(TAG, "Getting user schedules with auth token: ${token.take(20)}...")
            
            val response = apiService.getUserSchedules(authHeader)
            Log.d(TAG, "getUserSchedules response code: ${response.code()}")
            
            if (!response.isSuccessful) {
                Log.e(TAG, "Failed to get user schedules: ${response.code()}")
                val errorBody = response.errorBody()?.string() ?: "No error body"
                Log.e(TAG, "Error body: $errorBody")
                return@withContext Result.failure(IOException("Failed to get user schedules: ${response.code()} - $errorBody"))
            }
            
            val scheduleResponses = response.body()
            if (scheduleResponses == null) {
                Log.e(TAG, "Empty response body")
                return@withContext Result.failure(IOException("Empty response body"))
            }
            
            Log.d(TAG, "Received ${scheduleResponses.size} user schedules from API")
            
            // Log detailed response
            scheduleResponses.forEachIndexed { index, resp ->
                Log.d(TAG, "User Schedule $index - ID: ${resp.scheduleId}, " +
                        "Location: ${resp.locationId}, " +
                        "Date: ${resp.pickupDate}, " +
                        "Time: ${resp.pickupTime}, " +
                        "Status: ${resp.status}")
            }
            
            val schedules = scheduleResponses.map { resp ->
                Schedule(
                    scheduleId = resp.scheduleId ?: "",
                    pickupDate = resp.pickupDate ?: "",
                    pickupTime = resp.pickupTime ?: "",
                    locationId = resp.locationId ?: "",
                    status = resp.status ?: "PENDING",
                    userId = resp.userId ?: "",
                    userEmail = resp.userEmail ?: ""
                )
            }
            
            return@withContext Result.success(schedules)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting user schedules: ${e.message}", e)
            return@withContext Result.failure(e)
        }
    }

    /**
     * Get a specific schedule by ID
     * No JWT needed as per backend
     */
    suspend fun getScheduleById(scheduleId: String): Result<Schedule> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Getting schedule by ID: $scheduleId")
            val response = apiService.getScheduleById(scheduleId)
            
            if (!response.isSuccessful) {
                Log.e(TAG, "Failed to get schedule: ${response.code()}")
                return@withContext Result.failure(IOException("Failed to get schedule: ${response.code()}"))
            }
            
            val scheduleResponse = response.body()
            if (scheduleResponse == null) {
                Log.e(TAG, "Empty response body")
                return@withContext Result.failure(IOException("Empty response body"))
            }
            
            if (!scheduleResponse.success) {
                Log.e(TAG, "API returned failure: ${scheduleResponse.message}")
                return@withContext Result.failure(IOException(scheduleResponse.message ?: "Unknown error"))
            }
            
            val schedule = Schedule(
                scheduleId = scheduleResponse.scheduleId ?: "",
                pickupDate = scheduleResponse.pickupDate ?: "",
                pickupTime = scheduleResponse.pickupTime ?: "",
                locationId = scheduleResponse.locationId ?: "",
                status = scheduleResponse.status ?: "PENDING",
                userId = scheduleResponse.userId ?: "",
                userEmail = scheduleResponse.userEmail ?: ""
            )
            
            return@withContext Result.success(schedule)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting schedule by ID: ${e.message}", e)
            return@withContext Result.failure(e)
        }
    }
} 