package com.example.GarbageMS.models

/**
 * Represents a scheduled garbage pickup in the system
 * This model corresponds to the backend Schedule entity
 */
data class Schedule(
    val scheduleId: String = "",
    val pickupDate: String = "",
    val pickupTime: String = "",
    val locationId: String = "",
    val status: String = "PENDING",
    val userId: String = "",
    val userEmail: String = "",
    var locationName: String? = null // Added field for location name
) {
    /**
     * Get a user-friendly display name for the location
     */
    fun getLocationDisplayName(): String {
        // If we have a location name, use it
        if (!locationName.isNullOrEmpty()) {
            return locationName!!
        }

        // Otherwise, try to extract a meaningful name from the locationId
        if (locationId.isEmpty()) {
            return "No location specified"
        }

        // Try to extract a meaningful name from the locationId if it follows a pattern
        val parts = locationId.split("-")
        if (parts.size > 1) {
            // Capitalize each word for a nicer display
            return parts.subList(1, parts.size).joinToString(" ") {
                it.replaceFirstChar { char ->
                    if (char.isLowerCase()) char.titlecase() else char.toString()
                }
            }
        }

        // If the locationId doesn't contain hyphens, provide a more user-friendly fallback
        return "Garbage Collection Point"
    }
}