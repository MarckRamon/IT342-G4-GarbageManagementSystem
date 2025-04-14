package com.example.GarbageMS.models

import com.google.gson.annotations.SerializedName

/**
 * Response class for the pickup location API.
 * Mirrors the backend response format.
 */
data class PickupLocationResponse(
    // The field is called "locations" in the backend response, not "data"
    @SerializedName("locations")
    val data: List<PickupLocation>? = null,
    // For single location endpoint
    @SerializedName("location")
    val location: PickupLocation? = null,
    val success: Boolean,
    val message: String
) 