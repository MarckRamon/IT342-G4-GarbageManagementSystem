package com.example.GarbageMS.models

/**
 * Represents a scheduled garbage pickup in the system
 * This model corresponds to the backend Schedule entity
 */
data class Schedule(
    val scheduleId: String = "",
    val pickupDate: String = "",
    val pickupTime: String = "",
    val locationId: String = "",
    val status: String = "PENDING",
    val userId: String = "",
    val userEmail: String = ""
) 