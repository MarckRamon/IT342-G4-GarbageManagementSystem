package com.example.GarbageMS.models

import java.util.Date

class MockDataGenerator {
    companion object {
        // Generate mock notifications
        fun getMockNotifications(): MutableList<Notification> {
            val notifications = mutableListOf<Notification>()
            
            // Add some mock notifications
            notifications.add(
                Notification(
                    id = "1",
                    title = "Garbage Collection Reminder",
                    message = "Don't forget to put your trash out tonight for tomorrow's collection",
                    type = NotificationType.REMINDER,
                    timestamp = Date(System.currentTimeMillis() - 86400000), // 1 day ago
                    isRead = false
                )
            )
            
            notifications.add(
                Notification(
                    id = "2",
                    title = "Schedule Change",
                    message = "Due to the holiday, collection is delayed by one day this week",
                    type = NotificationType.SCHEDULE_CHANGE,
                    timestamp = Date(System.currentTimeMillis() - 172800000), // 2 days ago
                    isRead = true
                )
            )
            
            notifications.add(
                Notification(
                    id = "3",
                    title = "Recycling Pickup Completed",
                    message = "Your recycling has been collected. Thank you for recycling!",
                    type = NotificationType.PICKUP,
                    timestamp = Date(System.currentTimeMillis() - 259200000), // 3 days ago
                    isRead = false
                )
            )
            
            return notifications
        }
    }
} 