package com.example.GarbageMS.models

import java.util.Date

enum class NotificationType {
    PICKUP,
    REPORT,
    SCHEDULE_CHANGE,
    REMINDER,
    SYSTEM,
    GENERAL
}

data class Notification(
    val id: String = "",
    val title: String = "",
    val message: String = "",
    val timestamp: Date = Date(),
    val type: NotificationType = NotificationType.GENERAL,
    var isRead: Boolean = false,
    val userId: String = "",
    val referenceId: String = "" // ID of related item (pickup, report, etc.)
) {
    // Empty constructor for Firestore
    constructor() : this(
        id = "",
        title = "",
        message = "",
        timestamp = Date(),
        type = NotificationType.GENERAL,
        isRead = false,
        userId = "",
        referenceId = ""
    )
    
    companion object {
        fun fromMap(id: String, data: Map<String, Any>): Notification {
            return Notification(
                id = id,
                title = data["title"] as? String ?: "",
                message = data["message"] as? String ?: "",
                timestamp = data["timestamp"] as? Date ?: Date(),
                type = getTypeFromString(data["type"] as? String),
                isRead = data["isRead"] as? Boolean ?: false,
                userId = data["userId"] as? String ?: "",
                referenceId = data["referenceId"] as? String ?: ""
            )
        }
        
        private fun getTypeFromString(typeStr: String?): NotificationType {
            return when (typeStr) {
                "PICKUP" -> NotificationType.PICKUP
                "REPORT" -> NotificationType.REPORT
                "SCHEDULE_CHANGE" -> NotificationType.SCHEDULE_CHANGE
                "REMINDER" -> NotificationType.REMINDER
                "SYSTEM" -> NotificationType.SYSTEM
                else -> NotificationType.GENERAL
            }
        }
    }
    
    fun toMap(): Map<String, Any> {
        return mapOf(
            "title" to title,
            "message" to message,
            "timestamp" to timestamp,
            "type" to type.toString(),
            "isRead" to isRead,
            "userId" to userId,
            "referenceId" to referenceId
        )
    }
} 