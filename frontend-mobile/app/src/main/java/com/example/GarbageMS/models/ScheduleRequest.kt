package com.example.GarbageMS.models

/**
 * Represents the request to the Schedule API
 * This model corresponds to the backend ScheduleRequest DTO
 */
data class ScheduleRequest(
    val pickupDate: String,
    val pickupTime: String,
    val locationId: String,
    val status: String = "PENDING"
) 