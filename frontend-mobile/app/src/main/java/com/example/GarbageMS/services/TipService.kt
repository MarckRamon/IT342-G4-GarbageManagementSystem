package com.example.GarbageMS.services

import android.content.Context
import android.util.Log
import com.example.GarbageMS.models.Tip
import com.example.GarbageMS.utils.ApiService
import com.example.GarbageMS.utils.SessionManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class TipService private constructor() {
    private lateinit var sessionManager: SessionManager
    private lateinit var context: Context
    private val apiService = ApiService.create()
    private val TAG = "TipService"

    companion object {
        @Volatile
        private var instance: TipService? = null

        fun getInstance(): TipService {
            return instance ?: synchronized(this) {
                instance ?: TipService().also { instance = it }
            }
        }
    }

    fun initialize(sessionManager: SessionManager) {
        this.sessionManager = sessionManager
    }

    fun setContext(context: Context) {
        this.context = context
    }

    suspend fun getAllTips(): List<Tip> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.getAllTips()
                if (response.isSuccessful && response.body() != null) {
                    response.body()!!
                } else {
                    Log.e(TAG, "Error getting tips: ${response.message()}")
                    emptyList()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception getting tips", e)
                emptyList()
            }
        }
    }

    suspend fun getTipById(tipId: String): Tip? {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.getTipById(tipId)
                if (response.isSuccessful && response.body() != null) {
                    response.body()!!
                } else {
                    Log.e(TAG, "Error getting tip by ID: ${response.message()}")
                    null
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception getting tip by ID", e)
                null
            }
        }
    }
} 