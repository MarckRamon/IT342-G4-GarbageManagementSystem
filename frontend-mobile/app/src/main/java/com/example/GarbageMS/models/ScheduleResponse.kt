package com.example.GarbageMS.models

/**
 * Represents the response from the Schedule API
 * This model corresponds to the backend ScheduleResponse DTO
 */
data class ScheduleResponse(
    val scheduleId: String? = null,
    val pickupDate: String? = null,
    val pickupTime: String? = null,
    val locationId: String? = null,
    val status: String? = null,
    val userId: String? = null,
    val userEmail: String? = null,
    val success: Boolean = true,
    val message: String? = null
) {
    constructor(success: Boolean, message: String) : this(
        scheduleId = null,
        pickupDate = null,
        pickupTime = null,
        locationId = null,
        status = null,
        userId = null,
        userEmail = null,
        success = success,
        message = message
    )
} 