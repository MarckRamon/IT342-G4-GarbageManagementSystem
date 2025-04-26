package com.g4.gms.controller;

import com.g4.gms.model.Reminder;
import com.g4.gms.dto.ReminderRequest;
import com.g4.gms.dto.ReminderResponse;
import com.g4.gms.service.ReminderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/reminder")
public class ReminderController {

    private final ReminderService reminderService;

    public ReminderController(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    // GET endpoint - accessible to everyone
    @GetMapping
    public ResponseEntity<List<ReminderResponse>> getAllReminders() {
        try {
            List<Reminder> reminders = reminderService.getAllReminders();
            List<ReminderResponse> responseList = new ArrayList<>();
            
            for (Reminder reminder : reminders) {
                ReminderResponse response = new ReminderResponse(
                    reminder.getReminderId(),
                    reminder.getTitle(),
                    reminder.getReminderMessage(),
                    reminder.getReminderDate(),
                    reminder.getUserId(),
                    reminder.getScheduleId(),
                    true,
                    null // No message needed for list items
                );
                responseList.add(response);
            }
            
            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            // Return a more informative error response
            List<ReminderResponse> errorList = new ArrayList<>();
            errorList.add(new ReminderResponse(false, "Error retrieving reminders: " + e.getMessage()));
            return ResponseEntity.status(500).body(errorList);
        }
    }

    // GET by ID endpoint - accessible to everyone
    @GetMapping("/{reminderId}")
    public ResponseEntity<ReminderResponse> getReminderById(@PathVariable String reminderId) {
        try {
            Reminder reminder = reminderService.getReminderById(reminderId);
            
            if (reminder != null) {
                ReminderResponse response = new ReminderResponse(
                    reminder.getReminderId(),
                    reminder.getTitle(),
                    reminder.getReminderMessage(),
                    reminder.getReminderDate(),
                    reminder.getUserId(),
                    reminder.getScheduleId(),
                    true,
                    "Reminder retrieved successfully"
                );
                return ResponseEntity.ok(response);
            } else {
                // Return only success status and message for not found errors
                return ResponseEntity.status(404).body(new ReminderResponse(false, "Reminder not found"));
            }
        } catch (Exception e) {
            // Return only success status and message for errors
            ReminderResponse response = new ReminderResponse(false, "Error retrieving reminder: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // POST endpoint - requires JWT authentication
    @PostMapping
    public ResponseEntity<ReminderResponse> createReminder(@Valid @RequestBody ReminderRequest reminderRequest) {
        try {
            // Get the authenticated user ID from the security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();
            
            // Create a new Reminder from the request
            Reminder reminder = new Reminder();
            reminder.setTitle(reminderRequest.getTitle());
            reminder.setReminderMessage(reminderRequest.getReminderMessage());
            reminder.setReminderDate(reminderRequest.getReminderDate());
            reminder.setScheduleId(reminderRequest.getScheduleId());
            reminder.setUserId(userId);
            
            Reminder createdReminder = reminderService.createReminder(reminder);
            
            ReminderResponse response = new ReminderResponse(
                createdReminder.getReminderId(),
                createdReminder.getTitle(),
                createdReminder.getReminderMessage(),
                createdReminder.getReminderDate(),
                createdReminder.getUserId(),
                createdReminder.getScheduleId(),
                true,
                "Reminder created successfully"
            );
            
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            // Return only success status and message for validation errors
            ReminderResponse response = new ReminderResponse(false, e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            // Return only success status and message for errors
            ReminderResponse response = new ReminderResponse(false, "Error creating reminder: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // PUT endpoint - requires JWT authentication
    @PutMapping("/{reminderId}")
    public ResponseEntity<ReminderResponse> updateReminder(@PathVariable String reminderId, @Valid @RequestBody ReminderRequest reminderRequest) {
        try {
            // Get the authenticated user ID
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();
            
            // Retrieve existing reminder
            Reminder existingReminder = reminderService.getReminderById(reminderId);
            
            if (existingReminder == null) {
                // Return only success status and message for not found errors
                return ResponseEntity.status(404).body(new ReminderResponse(false, "Reminder not found"));
            }
            
            // Check if the authenticated user is the owner of the reminder
            if (!existingReminder.getUserId().equals(userId)) {
                // Return only success status and message for authorization errors
                ReminderResponse response = new ReminderResponse(false, "You are not authorized to update this reminder");
                return ResponseEntity.status(403).body(response);
            }
            
            // Update the existing reminder with request data
            existingReminder.setTitle(reminderRequest.getTitle());
            existingReminder.setReminderMessage(reminderRequest.getReminderMessage());
            existingReminder.setReminderDate(reminderRequest.getReminderDate());
            existingReminder.setScheduleId(reminderRequest.getScheduleId());
            
            Reminder updatedReminder = reminderService.updateReminder(reminderId, existingReminder);
            
            if (updatedReminder != null) {
                ReminderResponse response = new ReminderResponse(
                    updatedReminder.getReminderId(),
                    updatedReminder.getTitle(),
                    updatedReminder.getReminderMessage(),
                    updatedReminder.getReminderDate(),
                    updatedReminder.getUserId(),
                    updatedReminder.getScheduleId(),
                    true,
                    "Reminder updated successfully"
                );
                return ResponseEntity.ok(response);
            } else {
                // Return only success status and message for not found errors
                return ResponseEntity.status(404).body(new ReminderResponse(false, "Reminder not found"));
            }
        } catch (IllegalArgumentException e) {
            // Return only success status and message for validation errors
            ReminderResponse response = new ReminderResponse(false, e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (ExecutionException | InterruptedException e) {
            // Return only success status and message for errors
            ReminderResponse response = new ReminderResponse(false, "Error updating reminder: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // DELETE endpoint - requires JWT authentication
    @DeleteMapping("/{reminderId}")
    public ResponseEntity<ReminderResponse> deleteReminder(@PathVariable String reminderId) {
        try {
            // Get the authenticated user ID
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();
            
            // Retrieve existing reminder
            Reminder existingReminder = reminderService.getReminderById(reminderId);
            
            if (existingReminder == null) {
                // Return only success status and message for not found errors
                return ResponseEntity.status(404).body(new ReminderResponse(false, "Reminder not found"));
            }
            
            // Check if the authenticated user is the owner of the reminder
            if (!existingReminder.getUserId().equals(userId)) {
                // Return only success status and message for authorization errors
                ReminderResponse response = new ReminderResponse(false, "You are not authorized to delete this reminder");
                return ResponseEntity.status(403).body(response);
            }
            
            boolean deleted = reminderService.deleteReminder(reminderId);
            
            if (deleted) {
                // Return only success status and message for DELETE operations
                ReminderResponse response = new ReminderResponse(true, "Reminder deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                // Return only success status and message for not found errors
                return ResponseEntity.status(404).body(new ReminderResponse(false, "Reminder not found"));
            }
        } catch (ExecutionException | InterruptedException e) {
            // Return only success status and message for errors
            ReminderResponse response = new ReminderResponse(false, "Error deleting reminder: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
} 