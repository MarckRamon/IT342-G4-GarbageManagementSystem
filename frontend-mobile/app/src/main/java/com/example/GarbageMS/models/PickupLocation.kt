package com.example.GarbageMS.models

import com.google.gson.annotations.SerializedName

/**
 * Data class representing a garbage pickup location.
 * Matches the backend model.
 */
data class PickupLocation(
    val id: String = "",
    val siteName: String = "",
    @SerializedName("wasteType")
    val garbageType: String = "", // This is named wasteType on the backend but we keep garbageType for compatibility
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val address: String? = null,
    // These fields aren't in the backend model but we keep them for app functionality
    val description: String? = null,
    val collectionDays: List<String>? = null
) 