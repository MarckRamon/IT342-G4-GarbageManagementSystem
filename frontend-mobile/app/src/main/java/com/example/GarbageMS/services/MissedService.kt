package com.example.GarbageMS.services

import android.util.Log
import com.example.GarbageMS.models.Missed
import com.example.GarbageMS.models.MissedRequest
import com.example.GarbageMS.models.MissedResponse
import com.example.GarbageMS.utils.ApiService
import com.example.GarbageMS.utils.SessionManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.IOException

/**
 * Service for handling Missed Pickup related API calls
 */
class MissedService private constructor() {
    private val TAG = "MissedService"
    private val apiService: ApiService = ApiService.create()
    private lateinit var sessionManager: SessionManager

    companion object {
        @Volatile
        private var instance: MissedService? = null

        fun getInstance(): MissedService {
            return instance ?: synchronized(this) {
                instance ?: MissedService().also { instance = it }
            }
        }
    }

    fun initialize(sessionManager: SessionManager) {
        this.sessionManager = sessionManager
        Log.d(TAG, "MissedService initialized with SessionManager")
    }

    /**
     * Report a missed pickup
     * @param missed The missed pickup data to report
     * @return Result containing the created missed pickup or an error
     */
    suspend fun reportMissed(missed: Missed): Result<Missed> {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Reporting missed pickup for scheduleId: ${missed.scheduleId}")
                
                val token = sessionManager.getToken()
                if (token == null) {
                    Log.e(TAG, "No authentication token available")
                    return@withContext Result.failure(IOException("Authentication required"))
                }
                
                val request = MissedRequest(
                    title = missed.title,
                    description = missed.description,
                    reportDateTime = missed.reportDateTime,
                    scheduleId = missed.scheduleId,
                    userId = missed.userId
                )
                
                val response = apiService.createMissed("Bearer $token", request)
                
                if (response.isSuccessful) {
                    val missedResponse = response.body()
                    if (missedResponse != null) {
                        Log.d(TAG, "Successfully reported missed pickup with ID: ${missedResponse.missedId}")
                        
                        val createdMissed = Missed(
                            missedId = missedResponse.missedId ?: "",
                            title = missedResponse.title ?: "",
                            description = missedResponse.description ?: "",
                            reportDateTime = missedResponse.reportDateTime ?: "",
                            scheduleId = missedResponse.scheduleId ?: "",
                            userId = missedResponse.userId ?: ""
                        )
                        
                        return@withContext Result.success(createdMissed)
                    }
                }
                
                val errorBody = response.errorBody()?.string() ?: "Unknown error"
                Log.e(TAG, "Failed to report missed pickup: $errorBody")
                return@withContext Result.failure(IOException("Failed to report missed pickup: $errorBody"))
                
            } catch (e: Exception) {
                Log.e(TAG, "Error reporting missed pickup", e)
                return@withContext Result.failure(e)
            }
        }
    }

    /**
     * Get all missed pickups
     * @return List of missed pickups
     */
    suspend fun getAllMissed(): Result<List<Missed>> {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Getting all missed pickups")
                
                val response = apiService.getAllMissed()
                
                if (response.isSuccessful) {
                    val missedResponses = response.body()
                    if (missedResponses != null) {
                        Log.d(TAG, "Successfully retrieved ${missedResponses.size} missed pickups")
                        
                        val missedList = missedResponses.map { missedResponse ->
                            Missed(
                                missedId = missedResponse.missedId ?: "",
                                title = missedResponse.title ?: "",
                                description = missedResponse.description ?: "",
                                reportDateTime = missedResponse.reportDateTime ?: "",
                                scheduleId = missedResponse.scheduleId ?: "",
                                userId = missedResponse.userId ?: ""
                            )
                        }
                        
                        return@withContext Result.success(missedList)
                    }
                }
                
                val errorBody = response.errorBody()?.string() ?: "Unknown error"
                Log.e(TAG, "Failed to get missed pickups: $errorBody")
                return@withContext Result.failure(IOException("Failed to get missed pickups: $errorBody"))
                
            } catch (e: Exception) {
                Log.e(TAG, "Error getting missed pickups", e)
                return@withContext Result.failure(e)
            }
        }
    }

    /**
     * Get missed pickups by user ID
     * @param userId The user ID to filter by
     * @return List of missed pickups for the user
     */
    suspend fun getMissedByUserId(userId: String): Result<List<Missed>> {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Getting missed pickups for user: $userId")
                
                val response = apiService.getMissedByUserId(userId)
                
                if (response.isSuccessful) {
                    val missedResponses = response.body()
                    if (missedResponses != null) {
                        Log.d(TAG, "Successfully retrieved ${missedResponses.size} missed pickups for user")
                        
                        val missedList = missedResponses.map { missedResponse ->
                            Missed(
                                missedId = missedResponse.missedId ?: "",
                                title = missedResponse.title ?: "",
                                description = missedResponse.description ?: "",
                                reportDateTime = missedResponse.reportDateTime ?: "",
                                scheduleId = missedResponse.scheduleId ?: "",
                                userId = missedResponse.userId ?: ""
                            )
                        }
                        
                        return@withContext Result.success(missedList)
                    }
                }
                
                val errorBody = response.errorBody()?.string() ?: "Unknown error"
                Log.e(TAG, "Failed to get missed pickups for user: $errorBody")
                return@withContext Result.failure(IOException("Failed to get missed pickups for user: $errorBody"))
                
            } catch (e: Exception) {
                Log.e(TAG, "Error getting missed pickups for user", e)
                return@withContext Result.failure(e)
            }
        }
    }

    /**
     * Get missed pickups by schedule ID
     * @param scheduleId The schedule ID to filter by
     * @return List of missed pickups for the schedule
     */
    suspend fun getMissedByScheduleId(scheduleId: String): Result<List<Missed>> {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Getting missed pickups for schedule: $scheduleId")
                
                val response = apiService.getMissedByScheduleId(scheduleId)
                
                if (response.isSuccessful) {
                    val missedResponses = response.body()
                    if (missedResponses != null) {
                        Log.d(TAG, "Successfully retrieved ${missedResponses.size} missed pickups for schedule")
                        
                        val missedList = missedResponses.map { missedResponse ->
                            Missed(
                                missedId = missedResponse.missedId ?: "",
                                title = missedResponse.title ?: "",
                                description = missedResponse.description ?: "",
                                reportDateTime = missedResponse.reportDateTime ?: "",
                                scheduleId = missedResponse.scheduleId ?: "",
                                userId = missedResponse.userId ?: ""
                            )
                        }
                        
                        return@withContext Result.success(missedList)
                    }
                }
                
                val errorBody = response.errorBody()?.string() ?: "Unknown error"
                Log.e(TAG, "Failed to get missed pickups for schedule: $errorBody")
                return@withContext Result.failure(IOException("Failed to get missed pickups for schedule: $errorBody"))
                
            } catch (e: Exception) {
                Log.e(TAG, "Error getting missed pickups for schedule", e)
                return@withContext Result.failure(e)
            }
        }
    }
} 