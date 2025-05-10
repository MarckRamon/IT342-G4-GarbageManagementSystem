package com.example.GarbageMS.models

/**
 * Data class for history creation requests
 */
data class HistoryRequest(
    val collectionDate: String,
    val notes: String,
    val scheduleId: String
) 