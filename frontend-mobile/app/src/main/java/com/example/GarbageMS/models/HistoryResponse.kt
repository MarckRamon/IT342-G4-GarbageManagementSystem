package com.example.GarbageMS.models

/**
 * Data class for history API responses
 */
data class HistoryResponse(
    val historyId: String? = null,
    val collectionDate: String? = null, 
    val notes: String? = null,
    val scheduleId: String? = null,
    val success: Boolean = false,
    val message: String? = null
) {
    constructor(success: Boolean, message: String) : this(
        historyId = null,
        collectionDate = null,
        notes = null,
        scheduleId = null,
        success = success,
        message = message
    )
} 