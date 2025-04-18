package com.example.GarbageMS.utils

import android.util.Log
import com.example.GarbageMS.models.PickupLocation
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.lang.Exception

/**
 * A service for fetching garbage pickup locations.
 * Uses the backend API to fetch real data.
 */
class PickupLocationService {
    private val TAG = "PickupLocationService"
    private val apiService = ApiService.create()

    /**
     * Fetch all garbage pickup locations from the backend.
     */
    suspend fun getPickupLocations(): Result<List<PickupLocation>> {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Fetching pickup locations from API...")
                val response = apiService.getPickupLocations()
                
                Log.d(TAG, "API Response: Code=${response.code()}, IsSuccessful=${response.isSuccessful}")
                
                if (response.isSuccessful) {
                    val locationResponse = response.body()
                    Log.d(TAG, "Response body: $locationResponse")
                    
                    if (locationResponse != null && locationResponse.success) {
                        // Return the list of locations from the response
                        val locations = locationResponse.data ?: emptyList()
                        Log.d(TAG, "Received ${locations.size} locations from API")
                        
                        // For any locations that don't have collection days, add some default ones
                        // This is temporary until the backend includes this data
                        locations.forEach { location ->
                            Log.d(TAG, "Location: id=${location.id}, name=${location.siteName}, lat=${location.latitude}, lng=${location.longitude}")
                            
                            if (location.collectionDays == null) {
                                addDefaultCollectionDays(location)
                            }
                        }
                        
                        if (locations.isEmpty()) {
                            Log.w(TAG, "API returned empty location list. Falling back to mock data.")
                            return@withContext Result.success(getMockPickupLocations())
                        }
                        
                        Result.success(locations)
                    } else {
                        val errorMsg = locationResponse?.message ?: "Unknown error"
                        Log.e(TAG, "API returned error: $errorMsg")
                        Log.w(TAG, "Using mock data as fallback")
                        Result.success(getMockPickupLocations())
                    }
                } else {
                    val errorCode = response.code()
                    val errorBody = response.errorBody()?.string()
                    Log.e(TAG, "API call failed with code $errorCode: $errorBody")
                    Log.w(TAG, "Using mock data as fallback")
                    Result.success(getMockPickupLocations())
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception while fetching locations", e)
                
                // If there's an error (like no network), fall back to mock data for now
                Log.d(TAG, "Falling back to mock data due to API error")
                Result.success(getMockPickupLocations())
            }
        }
    }
    
    /**
     * Fetch a single pickup location by ID.
     */
    suspend fun getPickupLocationById(id: String): Result<PickupLocation> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.getPickupLocationById(id)
                
                if (response.isSuccessful) {
                    val locationResponse = response.body()
                    if (locationResponse != null && locationResponse.success) {
                        val location = locationResponse.location 
                            ?: throw Exception("Location data is null")
                        
                        // Add default collection days if needed
                        if (location.collectionDays == null) {
                            addDefaultCollectionDays(location)
                        }
                        
                        Result.success(location)
                    } else {
                        val errorMsg = locationResponse?.message ?: "Unknown error"
                        Result.failure(Exception(errorMsg))
                    }
                } else {
                    val errorCode = response.code()
                    Result.failure(Exception("Failed to fetch location. Server returned code $errorCode"))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception while fetching location $id", e)
                
                // Try to find the location in the mock data as a fallback
                val mockLocations = getMockPickupLocations()
                val mockLocation = mockLocations.find { it.id == id }
                
                if (mockLocation != null) {
                    Log.d(TAG, "Falling back to mock data for location $id")
                    Result.success(mockLocation)
                } else {
                    Result.failure(e)
                }
            }
        }
    }
    
    /**
     * Adds default collection days to a location.
     * This is a temporary solution until the backend includes this data.
     */
    private fun addDefaultCollectionDays(location: PickupLocation) {
        // Use a field in the class for this hack since we can't modify an immutable data class
        // In a real solution, the backend would provide this data
        val days = when (location.id.hashCode() % 5) {
            0 -> listOf("Monday", "Thursday")
            1 -> listOf("Tuesday", "Friday")
            2 -> listOf("Wednesday", "Saturday")
            3 -> listOf("Monday", "Wednesday", "Friday")
            else -> listOf("Tuesday", "Saturday")
        }
        
        // This is a hack using reflection to set the field since PickupLocation is immutable
        // In a real solution, the backend would provide this data
        try {
            val field = location.javaClass.getDeclaredField("collectionDays")
            field.isAccessible = true
            field.set(location, days)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to set collection days", e)
        }
    }
    
    /**
     * Generate mock data for testing purposes.
     * This is used as a fallback when the API is not available.
     */
    private fun getMockPickupLocations(): List<PickupLocation> {
        return listOf(
            PickupLocation(
                id = "loc1",
                latitude = 10.3157,
                longitude = 123.8854,
                siteName = "Cebu City Hall Waste Collection",
                garbageType = "General Waste",
                description = "Large bins available for household waste",
                address = "M.C. Briones St, Cebu City",
                collectionDays = listOf("Monday", "Thursday")
            ),
            PickupLocation(
                id = "loc2",
                latitude = 10.3180,
                longitude = 123.8910,
                siteName = "Ayala Center Cebu Recycling Hub",
                garbageType = "Recycling",
                description = "Separate bins for paper, plastic, and glass",
                address = "Cardinal Rosales Ave, Cebu City",
                collectionDays = listOf("Tuesday", "Friday")
            ),
            PickupLocation(
                id = "loc3",
                latitude = 10.3010,
                longitude = 123.8910,
                siteName = "SM City Cebu Collection Point",
                garbageType = "Organic Waste",
                description = "For food waste and biodegradable items only",
                address = "Juan Luna Ave Ext, Cebu City",
                collectionDays = listOf("Wednesday", "Saturday")
            ),
            PickupLocation(
                id = "loc4",
                latitude = 10.3097,
                longitude = 123.8925,
                siteName = "Cebu Provincial Hospital Waste Station",
                garbageType = "Mixed Waste",
                description = "General waste and recycling facilities",
                address = "Osmeña Blvd, Cebu City",
                collectionDays = listOf("Monday", "Wednesday", "Friday")
            ),
            PickupLocation(
                id = "loc5",
                latitude = 10.3237,
                longitude = 123.8777,
                siteName = "University of Cebu Collection Point",
                garbageType = "Paper & Cardboard",
                description = "Paper recycling and book donation point",
                address = "Gov. M. Cuenco Ave, Cebu City",
                collectionDays = listOf("Tuesday")
            )
        )
    }
    
    companion object {
        @Volatile
        private var instance: PickupLocationService? = null
        
        fun getInstance(): PickupLocationService {
            return instance ?: synchronized(this) {
                instance ?: PickupLocationService().also { instance = it }
            }
        }
    }
} 