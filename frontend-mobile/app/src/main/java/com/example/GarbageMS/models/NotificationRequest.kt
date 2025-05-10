package com.example.GarbageMS.models

/**
 * Data class for sending notification requests to the backend
 * This is used with the NotificationController API endpoint
 * The field names must exactly match what the API expects
 */
data class NotificationRequest(
    val token: String,     // FCM token
    val title: String,     // Notification title
    val body: String       // Notification message body
) 