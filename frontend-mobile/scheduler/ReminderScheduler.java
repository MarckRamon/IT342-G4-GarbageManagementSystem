package com.g4.gms.scheduler;

import com.g4.gms.model.Reminder;
import com.g4.gms.service.NotificationService;
import com.g4.gms.service.ReminderService;
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
    private static final ZoneId PHILIPPINES_ZONE = ZoneId.of("Asia/Manila");
    
    @Autowired
    private ReminderService reminderService;
    
    @Autowired
    private NotificationService notificationService;
    
    /**
     * Check for reminders that need notifications every minute
     */
    @Scheduled(cron = "0 * * * * *") // Run every minute
    public void checkReminders() {
        logger.info("Running scheduled reminder check in Philippine timezone");
        
        try {
            // Get all reminders
            List<Reminder> reminders = reminderService.getAllReminders();
            
            // Current time in Philippine timezone
            ZonedDateTime now = ZonedDateTime.now(PHILIPPINES_ZONE);
            logger.debug("Current Philippine time: {}", now.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            // Check each reminder
            for (Reminder reminder : reminders) {
                try {
                    // Parse the reminder date and set to Philippine timezone
                    LocalDateTime reminderDateTime = LocalDateTime.parse(reminder.getReminderDate(), DATE_TIME_FORMATTER);
                    ZonedDateTime reminderZonedDateTime = reminderDateTime.atZone(PHILIPPINES_ZONE);
                    
                    // Calculate time difference in minutes
                    long minutesDifference = java.time.Duration.between(now, reminderZonedDateTime).toMinutes();
                    
                    // Log the times for debugging
                    logger.debug("Reminder ID: {}, Scheduled time: {}, Current time: {}, Difference: {} minutes",
                            reminder.getReminderId(),
                            reminderZonedDateTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                            now.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                            minutesDifference);
                    
                    // If the reminder time is within the last minute (accounting for scheduler delay)
                    if (minutesDifference >= -1 && minutesDifference <= 0) {
                        logger.info("Sending notification for reminder: {} at Philippine time: {}", 
                                reminder.getReminderId(), 
                                reminderZonedDateTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
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