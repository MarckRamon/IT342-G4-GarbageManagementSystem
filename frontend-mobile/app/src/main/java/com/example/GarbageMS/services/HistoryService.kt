package com.example.GarbageMS.services

import android.util.Log
import com.example.GarbageMS.models.History
import com.example.GarbageMS.models.HistoryRequest
import com.example.GarbageMS.utils.ApiService
import com.example.GarbageMS.utils.SessionManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.IOException

/**
 * Service for handling History-related API calls
 */
class HistoryService private constructor() {
    private val TAG = "HistoryService"
    private val apiService: ApiService = ApiService.create()
    private lateinit var sessionManager: SessionManager

    companion object {
        @Volatile
        private var instance: HistoryService? = null

        fun getInstance(): HistoryService {
            return instance ?: synchronized(this) {
                instance ?: HistoryService().also { instance = it }
            }
        }
    }

    fun initialize(sessionManager: SessionManager) {
        this.sessionManager = sessionManager
        Log.d(TAG, "HistoryService initialized with SessionManager")
    }

    /**
     * Get all history records
     * No JWT needed as per backend
     */
    suspend fun getAllHistory(): Result<List<History>> = withContext(Dispatchers.IO) {
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

            Log.d(TAG, "Getting all history records")
            val response = apiService.getAllHistory("Bearer $token")
            
            Log.d(TAG, "getAllHistory response code: ${response.code()}")
            
            if (!response.isSuccessful) {
                Log.e(TAG, "Failed to get history records: ${response.code()}")
                val errorBody = response.errorBody()?.string() ?: "No error body"
                Log.e(TAG, "Error body: $errorBody")
                return@withContext Result.failure(IOException("Failed to get history records: ${response.code()} - $errorBody"))
            }
            
            val historyResponses = response.body()
            if (historyResponses == null) {
                Log.e(TAG, "Empty response body")
                return@withContext Result.failure(IOException("Empty response body"))
            }
            
            Log.d(TAG, "Received ${historyResponses.size} history records from API")
            
            // Log detailed response
            historyResponses.forEachIndexed { index, resp ->
                Log.d(TAG, "History $index - ID: ${resp.historyId}, " +
                        "Date: ${resp.collectionDate}, " +
                        "Notes: ${resp.notes}, " +
                        "ScheduleId: ${resp.scheduleId}")
            }
            
            val histories = historyResponses.map { resp ->
                History(
                    historyId = resp.historyId ?: "",
                    collectionDate = resp.collectionDate ?: "",
                    notes = resp.notes ?: "",
                    scheduleId = resp.scheduleId ?: ""
                )
            }
            
            return@withContext Result.success(histories)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting history records: ${e.message}", e)
            return@withContext Result.failure(e)
        }
    }

    /**
     * Create a new history record
     * JWT required
     */
    suspend fun createHistory(historyRequest: HistoryRequest): Result<History> = withContext(Dispatchers.IO) {
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
            
            Log.d(TAG, "Creating history record with auth token: ${token.take(20)}...")
            
            val requestMap = mapOf(
                "collectionDate" to historyRequest.collectionDate,
                "notes" to historyRequest.notes,
                "scheduleId" to historyRequest.scheduleId
            )
            
            val authHeader = "Bearer $token"
            val response = apiService.createHistory(authHeader, requestMap)
            
            if (!response.isSuccessful) {
                Log.e(TAG, "Failed to create history record: ${response.code()}")
                val errorBody = response.errorBody()?.string() ?: "No error body"
                Log.e(TAG, "Error body: $errorBody")
                return@withContext Result.failure(IOException("Failed to create history record: ${response.code()} - $errorBody"))
            }
            
            val historyResponse = response.body()
            if (historyResponse == null) {
                Log.e(TAG, "Empty response body")
                return@withContext Result.failure(IOException("Empty response body"))
            }
            
            if (!historyResponse.success) {
                Log.e(TAG, "API returned failure: ${historyResponse.message}")
                return@withContext Result.failure(IOException(historyResponse.message ?: "Unknown error"))
            }
            
            val history = History(
                historyId = historyResponse.historyId ?: "",
                collectionDate = historyResponse.collectionDate ?: "",
                notes = historyResponse.notes ?: "",
                scheduleId = historyResponse.scheduleId ?: ""
            )
            
            return@withContext Result.success(history)
        } catch (e: Exception) {
            Log.e(TAG, "Error creating history record: ${e.message}", e)
            return@withContext Result.failure(e)
        }
    }
} 