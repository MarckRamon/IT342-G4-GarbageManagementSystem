package com.example.GarbageMS.models

import java.util.Date

data class Reminder(
    val reminderId: String = "",
    val title: String = "",
    val description: String = "",
    val reminderMessage: String = "",
    val scheduledTime: String = "",
    val location: String = "",
    val reminderDate: Date? = null,
    val userId: String = "",
    val scheduleId: String = ""
) {
    fun getDescriptionText(): String = reminderMessage.ifEmpty { description }
} 