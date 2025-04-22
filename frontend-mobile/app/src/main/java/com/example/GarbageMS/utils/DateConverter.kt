package com.example.GarbageMS.utils

import com.kizitonwose.calendar.core.CalendarDay
import com.kizitonwose.calendar.core.CalendarMonth
import com.kizitonwose.calendar.core.DayPosition
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * Helper class for converting between different date formats used in the app
 */
object DateConverter {
    
    private val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
    private val displayFormatter = DateTimeFormatter.ofPattern("MMMM d, yyyy")

    /**
     * Converts a string date in format "yyyy-MM-dd" to a LocalDate object
     */
    fun stringToLocalDate(dateString: String): LocalDate? {
        return try {
            LocalDate.parse(dateString, dateFormatter)
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Check if a CalendarDay matches a given date string
     */
    fun calendarDayMatchesString(day: CalendarDay, dateString: String): Boolean {
        if (day.position != DayPosition.MonthDate) return false
        
        val localDate = stringToLocalDate(dateString) ?: return false
        return localDate.equals(day.date)
    }
    
    /**
     * Formats a LocalDate object to a display-friendly string format
     */
    fun localDateToDisplayString(date: LocalDate): String {
        return date.format(displayFormatter)
    }
    
    /**
     * Converts a LocalDate to string format "yyyy-MM-dd"
     */
    fun localDateToString(date: LocalDate): String {
        return date.format(dateFormatter)
    }
    
    /**
     * Formats a date string from "yyyy-MM-dd" to a display-friendly format
     */
    fun formatDateForDisplay(dateString: String): String {
        return try {
            val localDate = LocalDate.parse(dateString, dateFormatter)
            localDate.format(displayFormatter)
        } catch (e: Exception) {
            dateString
        }
    }
    
    /**
     * Get start month for calendar (current month - 6 months)
     */
    fun getStartMonth(): YearMonth {
        return YearMonth.now().minusMonths(6)
    }
    
    /**
     * Get end month for calendar (current month + 6 months)
     */
    fun getEndMonth(): YearMonth {
        return YearMonth.now().plusMonths(6)
    }
} 