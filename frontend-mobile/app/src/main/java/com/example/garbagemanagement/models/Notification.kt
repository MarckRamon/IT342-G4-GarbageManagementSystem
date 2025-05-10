package com.example.garbagemanagement.models

import java.util.Date

data class Notification(
    val id: String,
    val title: String,
    val message: String,
    val timestamp: Date,
    var read: Boolean,
    val type: String = "GENERAL",
    val relatedItemId: String? = null
) 