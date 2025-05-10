package com.example.GarbageMS.models

/**
 * Response model for missed pickup operations
 * Corresponds to the backend MissedResponse DTO
 */
data class MissedResponse(
    val missedId: String? = null,
    val title: String? = null,
    val description: String? = null,
    val reportDateTime: String? = null,
    val scheduleId: String? = null,
    val userId: String? = null,
    val success: Boolean = false,
    val message: String? = null
) {
    // Secondary constructor for error/success messages without data
    constructor(success: Boolean, message: String?) : this(
        missedId = null,
        title = null,
        description = null,
        reportDateTime = null,
        scheduleId = null,
        userId = null,
        success = success,
        message = message
    )
} 