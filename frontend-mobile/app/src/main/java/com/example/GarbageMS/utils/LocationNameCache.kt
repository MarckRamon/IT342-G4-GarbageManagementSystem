package com.example.GarbageMS.utils

import android.util.Log
import com.example.GarbageMS.models.PickupLocation
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * A utility class to cache location names and provide lookup functionality.
 * This helps avoid repeated API calls for the same location.
 */
class LocationNameCache {
    private val TAG = "LocationNameCache"
    private val locationCache = mutableMapOf<String, String>()
    private val pickupLocationService = PickupLocationService.getInstance()
    private var isInitialized = false

    companion object {
        @Volatile
        private var instance: LocationNameCache? = null

        fun getInstance(): LocationNameCache {
            return instance ?: synchronized(this) {
                instance ?: LocationNameCache().also { instance = it }
            }
        }
    }

    /**
     * Initialize the cache with session manager
     */
    fun initialize(sessionManager: SessionManager) {
        Log.d(TAG, "Initializing LocationNameCache")

        // Always initialize the service with the latest session manager
        pickupLocationService.initialize(sessionManager)

        if (!isInitialized) {
            Log.d(TAG, "First initialization, will prefetch locations")
            isInitialized = true

            // Pre-fetch all locations to populate the cache
            CoroutineScope(Dispatchers.IO).launch {
                prefetchLocations()
            }
        } else {
            Log.d(TAG, "Already initialized, using existing cache with ${locationCache.size} entries")
        }
    }

    /**
     * Pre-fetch all locations to populate the cache
     */
    private suspend fun prefetchLocations() {
        try {
            Log.d(TAG, "Starting to prefetch all locations")
            val result = pickupLocationService.getPickupLocations()

            if (result.isSuccess) {
                val locations = result.getOrNull() ?: emptyList()
                Log.d(TAG, "Successfully fetched ${locations.size} locations from API")

                if (locations.isEmpty()) {
                    Log.w(TAG, "API returned empty location list")
                    return
                }

                // Clear the cache and add all new locations
                locationCache.clear()

                for (location in locations) {
                    Log.d(TAG, "Caching location: ${location.id} -> ${location.siteName}")
                    locationCache[location.id] = location.siteName
                }

                Log.d(TAG, "Successfully prefetched and cached ${locationCache.size} location names")
            } else {
                val error = result.exceptionOrNull()
                Log.e(TAG, "Failed to prefetch locations: ${error?.message}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception while prefetching locations", e)
        }
    }

    /**
     * Get a location name by ID, either from cache or by fetching it
     */
    suspend fun getLocationName(locationId: String): String {
        Log.d(TAG, "Getting location name for ID: $locationId")

        // If we have it in the cache, return it immediately
        locationCache[locationId]?.let {
            Log.d(TAG, "Found in cache: $locationId -> $it")
            return it
        }

        // Otherwise try to fetch it
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Fetching location from API for ID: $locationId")
                val result = pickupLocationService.getPickupLocationById(locationId)

                if (result.isSuccess) {
                    val location = result.getOrNull()
                    if (location != null) {
                        Log.d(TAG, "API returned location: ${location.siteName} for ID: $locationId")
                        // Cache the result for future use
                        locationCache[locationId] = location.siteName
                        return@withContext location.siteName
                    } else {
                        Log.w(TAG, "API returned success but null location for ID: $locationId")
                    }
                } else {
                    val error = result.exceptionOrNull()
                    Log.w(TAG, "API call failed for ID: $locationId - ${error?.message}")
                }

                // If we couldn't get the name, try to get it from all locations
                val allLocationsResult = pickupLocationService.getPickupLocations()
                if (allLocationsResult.isSuccess) {
                    val locations = allLocationsResult.getOrNull() ?: emptyList()
                    val matchingLocation = locations.find { it.id == locationId }

                    if (matchingLocation != null) {
                        Log.d(TAG, "Found location in all locations: ${matchingLocation.siteName} for ID: $locationId")
                        // Cache the result for future use
                        locationCache[locationId] = matchingLocation.siteName
                        return@withContext matchingLocation.siteName
                    }
                }

                // If we still couldn't get the name, use a fallback
                val fallbackName = getFallbackLocationName(locationId)
                Log.d(TAG, "Using fallback name: $fallbackName for ID: $locationId")
                return@withContext fallbackName
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching location name for ID: $locationId", e)
                val fallbackName = getFallbackLocationName(locationId)
                Log.d(TAG, "Using fallback name after exception: $fallbackName for ID: $locationId")
                return@withContext fallbackName
            }
        }
    }

    /**
     * Get a fallback location name when the API fails
     */
    private fun getFallbackLocationName(locationId: String): String {
        if (locationId.isEmpty()) {
            return "No location specified"
        }

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
        // This is better than showing the raw ID to the user
        return "Garbage Collection Point"
    }
}
