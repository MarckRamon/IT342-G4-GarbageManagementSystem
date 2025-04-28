package com.g4.gms.scheduler;

import com.g4.gms.model.Reminder;
import com.g4.gms.service.NotificationService;
import com.g4.gms.service.ReminderService;
import com.g4.gms.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Component
public class ReminderScheduler {
    
    private static final Logger logger = LoggerFactory.getLogger(ReminderScheduler.class);
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ISO_DATE_TIME;
    
    @Autowired
    private ReminderService reminderService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private UserService userService;
    
    /**
     * Check for reminders that need notifications every minute
     */
    @Scheduled(cron = "0 * * * * *") // Run every minute
    public void checkReminders() {
        logger.info("Running scheduled reminder check");
        
        try {
            // Get all reminders
            List<Reminder> reminders = reminderService.getAllReminders();
            
            // Current time in UTC (as a base for comparison)
            ZonedDateTime nowUtc = ZonedDateTime.now(ZoneId.of("UTC"));
            
            // Check each reminder
            for (Reminder reminder : reminders) {
                try {
                    // Get the user's timezone
                    String userId = reminder.getUserId();
                    String userTimezone = "UTC"; // Default to UTC
                    
                    try {
                        userTimezone = userService.getUserTimezone(userId);
                    } catch (Exception e) {
                        logger.warn("Could not get timezone for user {}, using UTC: {}", userId, e.getMessage());
                    }
                    
                    ZoneId userZoneId = ZoneId.of(userTimezone);
                    
                    // Parse the reminder date in the user's timezone
                    LocalDateTime reminderLocalDateTime = LocalDateTime.parse(reminder.getReminderDate(), DATE_TIME_FORMATTER);
                    ZonedDateTime reminderZonedDateTime = reminderLocalDateTime.atZone(userZoneId);
                    
                    // Convert the reminder time to UTC for comparison
                    ZonedDateTime reminderUtcDateTime = reminderZonedDateTime.withZoneSameInstant(ZoneId.of("UTC"));
                    
                    // Calculate time difference in minutes
                    long minutesDifference = java.time.Duration.between(nowUtc, reminderUtcDateTime).toMinutes();
                    
                    // If the reminder time is within the last minute (accounting for scheduler delay)
                    if (minutesDifference >= -1 && minutesDifference <= 0) {
                        logger.info("Sending notification for reminder: {}", reminder.getReminderId());
                        notificationService.sendReminderNotification(reminder);
                    }
                } catch (DateTimeParseException e) {
                    logger.error("Error parsing reminder date for reminder ID {}: {}", reminder.getReminderId(), e.getMessage());
                }
            }
        } catch (ExecutionException | InterruptedException e) {
            logger.error("Error checking reminders: {}", e.getMessage(), e);
        }
    }
} 