package com.example.GarbageMS.models

/**
 * Data class representing a history record of completed garbage collection
 */
data class History(
    val historyId: String = "",
    val collectionDate: String = "",
    val notes: String = "",
    val scheduleId: String = ""
) 