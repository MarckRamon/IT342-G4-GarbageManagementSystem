package com.example.GarbageMS.models

import java.util.Date

data class Reminder(
    val reminderId: String = "",
    val title: String = "",
    val reminderMessage: String = "",
    val reminderDate: Date? = null,
    val userId: String = "",
    val scheduleId: String = ""
) 