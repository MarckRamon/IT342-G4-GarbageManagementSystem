package com.example.GarbageMS.models

/**
 * Represents a missed pickup record
 */
data class Missed(
    var missedId: String = "",
    var title: String = "",
    var description: String = "",
    var reportDateTime: String = "",
    var scheduleId: String = "",
    var userId: String = ""
) 