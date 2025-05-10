package com.example.GarbageMS.utils

import android.util.Log
import com.example.GarbageMS.models.PickupLocation
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * A utility class to directly fetch location names from the API.
 * This is a simplified version that focuses on getting the location name.
 */
class DirectLocationFetcher {
    private val TAG = "DirectLocationFetcher"
    private val apiService = ApiService.create()
    private var token: String? = null

    /**
     * Set the authentication token for API calls
     */
    fun setToken(token: String) {
        this.token = token
    }

    /**
     * Fetch a location name directly from the API
     */
    suspend fun getLocationName(locationId: String): String {
        Log.d(TAG, "Directly fetching location name for ID: $locationId")
        
        return withContext(Dispatchers.IO) {
            try {
                if (token.isNullOrEmpty()) {
                    Log.e(TAG, "No auth token available")
                    return@withContext "Location $locationId"
                }
                
                val authHeader = "Bearer $token"
                val response = apiService.getPickupLocationById(locationId, authHeader)
                
                Log.d(TAG, "API Response: Code=${response.code()}, IsSuccessful=${response.isSuccessful}")
                
                if (response.isSuccessful) {
                    val locationResponse = response.body()
                    Log.d(TAG, "Response body: $locationResponse")
                    
                    if (locationResponse != null && locationResponse.success) {
                        val location = locationResponse.location
                        
                        if (location != null) {
                            Log.d(TAG, "Successfully retrieved location: ${location.siteName}")
                            return@withContext location.siteName
                        } else {
                            Log.e(TAG, "Location data is null")
                        }
                    } else {
                        val errorMsg = locationResponse?.message ?: "Unknown error"
                        Log.e(TAG, "API returned error: $errorMsg")
                    }
                } else {
                    val errorCode = response.code()
                    val errorBody = response.errorBody()?.string()
                    Log.e(TAG, "API call failed with code $errorCode: $errorBody")
                }
                
                // If we get here, something went wrong, return a fallback
                return@withContext getFallbackName(locationId)
            } catch (e: Exception) {
                Log.e(TAG, "Exception while fetching location name: ${e.message}", e)
                return@withContext getFallbackName(locationId)
            }
        }
    }
    
    /**
     * Get a fallback location name when the API fails
     */
    private fun getFallbackName(locationId: String): String {
        // Try to extract a meaningful name from the locationId if it follows a pattern
        val parts = locationId.split("-")
        if (parts.size > 1) {
            // Capitalize each word for a nicer display
            return parts.subList(1, parts.size).joinToString(" ") { 
                it.replaceFirstChar { char -> 
                    if (char.isLowerCase()) char.titlecase() else char.toString() 
                }
            }
        }
        
        // For IDs that don't follow the pattern, provide a more user-friendly name
        return "Pickup Location #${locationId.takeLast(4)}"
    }
    
    companion object {
        @Volatile
        private var instance: DirectLocationFetcher? = null
        
        fun getInstance(): DirectLocationFetcher {
            return instance ?: synchronized(this) {
                instance ?: DirectLocationFetcher().also { instance = it }
            }
        }
    }
}
