package com.example.GarbageMS.models

import java.util.Date

data class ReminderRequest(
    val title: String,
    val reminderMessage: String,
    val reminderDate: Date,
    val scheduleId: String,
    val fcmToken: String? = null  // Optional FCM token field
) 