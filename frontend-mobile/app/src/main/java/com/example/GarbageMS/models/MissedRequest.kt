package com.example.GarbageMS.models

/**
 * Request model for reporting a missed pickup
 * Corresponds to the backend MissedRequest DTO
 */
data class MissedRequest(
    val title: String,
    val description: String,
    val reportDateTime: String,
    val scheduleId: String,
    val userId: String
) 