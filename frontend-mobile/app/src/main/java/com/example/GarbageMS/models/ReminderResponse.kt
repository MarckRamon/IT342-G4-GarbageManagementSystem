package com.example.GarbageMS.models

import java.util.Date

data class ReminderResponse(
    var reminderId: String? = null,
    var title: String? = null,
    var reminderMessage: String? = null,
    var reminderDate: Date? = null,
    var userId: String? = null,
    var scheduleId: String? = null,
    var success: Boolean = false,
    var message: String? = null
) {
    // Secondary constructor for error/success messages without data
    constructor(success: Boolean, message: String?) : this(
        reminderId = null,
        title = null,
        reminderMessage = null,
        reminderDate = null,
        userId = null,
        scheduleId = null,
        success = success,
        message = message
    )
} 