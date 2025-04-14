package com.example.GarbageMS.models

/**
 * Data class representing a complaint report submitted by a user.
 */
data class ComplaintReport(
    val id: String? = null, // Generated server-side
    val userEmail: String,
    val description: String,
    val locationId: String,
    val locationName: String,
    val locationLatitude: Double,
    val locationLongitude: Double,
    val timestamp: Long = System.currentTimeMillis(),
    val status: String = "PENDING" // PENDING, REVIEWED, RESOLVED
) 