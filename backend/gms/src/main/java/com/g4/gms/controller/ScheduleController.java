package com.g4.gms.controller;

import com.g4.gms.dto.ScheduleRequest;
import com.g4.gms.dto.ScheduleResponse;
import com.g4.gms.model.Schedule;
import com.g4.gms.service.ScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/schedule")
public class ScheduleController {

    @Autowired
    private ScheduleService scheduleService;

    /**
     * Get all schedules
     * This endpoint is public (no JWT required)
     * @return List of all schedules
     */
    @GetMapping
    public ResponseEntity<List<ScheduleResponse>> getAllSchedules() {
        try {
            List<Schedule> schedules = scheduleService.getAllSchedules();
            List<ScheduleResponse> responseList = new ArrayList<>();
            
            for (Schedule schedule : schedules) {
                String userEmail = scheduleService.getUserEmail(schedule.getUserId());
                
                ScheduleResponse response = new ScheduleResponse(
                    schedule.getScheduleId(),
                    schedule.getPickupDate(),
                    schedule.getPickupTime(),
                    schedule.getLocationId(),
                    schedule.getStatus(),
                    schedule.getUserId(),
                    userEmail,
                    true,
                    null
                );
                
                responseList.add(response);
            }
            
            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Get schedule by ID
     * This endpoint is public (no JWT required)
     * @param scheduleId The ID of the schedule to retrieve
     * @return The schedule if found
     */
    @GetMapping("/{scheduleId}")
    public ResponseEntity<ScheduleResponse> getScheduleById(@PathVariable String scheduleId) {
        try {
            Schedule schedule = scheduleService.getScheduleById(scheduleId);
            
            if (schedule == null) {
                return ResponseEntity.notFound().build();
            }
            
            String userEmail = scheduleService.getUserEmail(schedule.getUserId());
            
            ScheduleResponse response = new ScheduleResponse(
                schedule.getScheduleId(),
                schedule.getPickupDate(),
                schedule.getPickupTime(),
                schedule.getLocationId(),
                schedule.getStatus(),
                schedule.getUserId(),
                userEmail,
                true,
                "Schedule retrieved successfully"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ScheduleResponse response = new ScheduleResponse(false, "Error retrieving schedule: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Create a new schedule
     * Requires JWT authentication
     * @param request The schedule data to create
     * @return The created schedule
     */
    @PostMapping
    public ResponseEntity<ScheduleResponse> createSchedule(@RequestBody ScheduleRequest request) {
        try {
            // Get the authenticated user ID from the security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();
            
            // Create a new Schedule object from the request
            Schedule schedule = new Schedule();
            schedule.setPickupDate(request.getPickupDate());
            schedule.setPickupTime(request.getPickupTime());
            schedule.setLocationId(request.getLocationId());
            schedule.setStatus(request.getStatus());
            schedule.setUserId(userId);
            
            // Save the schedule
            Schedule createdSchedule = scheduleService.createSchedule(schedule);
            String userEmail = scheduleService.getUserEmail(userId);
            
            ScheduleResponse response = new ScheduleResponse(
                createdSchedule.getScheduleId(),
                createdSchedule.getPickupDate(),
                createdSchedule.getPickupTime(),
                createdSchedule.getLocationId(),
                createdSchedule.getStatus(),
                createdSchedule.getUserId(),
                userEmail,
                true,
                "Schedule created successfully"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ScheduleResponse response = new ScheduleResponse(false, "Error creating schedule: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Update an existing schedule
     * Requires JWT authentication
     * @param scheduleId The ID of the schedule to update
     * @param request The updated schedule data
     * @return The updated schedule
     */
    @PutMapping("/{scheduleId}")
    public ResponseEntity<ScheduleResponse> updateSchedule(
            @PathVariable String scheduleId,
            @RequestBody ScheduleRequest request) {
        try {
            // Get the authenticated user ID from the security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();
            
            // Retrieve the existing schedule
            Schedule existingSchedule = scheduleService.getScheduleById(scheduleId);
            
            if (existingSchedule == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Check if the authenticated user is the owner of the schedule
            if (!existingSchedule.getUserId().equals(userId)) {
                ScheduleResponse response = new ScheduleResponse(false, "You are not authorized to update this schedule");
                return ResponseEntity.status(403).body(response);
            }
            
            // Update the schedule with the new data
            existingSchedule.setPickupDate(request.getPickupDate());
            existingSchedule.setPickupTime(request.getPickupTime());
            existingSchedule.setLocationId(request.getLocationId());
            existingSchedule.setStatus(request.getStatus());
            
            // Save the updated schedule
            Schedule updatedSchedule = scheduleService.updateSchedule(scheduleId, existingSchedule);
            String userEmail = scheduleService.getUserEmail(userId);
            
            ScheduleResponse response = new ScheduleResponse(
                updatedSchedule.getScheduleId(),
                updatedSchedule.getPickupDate(),
                updatedSchedule.getPickupTime(),
                updatedSchedule.getLocationId(),
                updatedSchedule.getStatus(),
                updatedSchedule.getUserId(),
                userEmail,
                true,
                "Schedule updated successfully"
            );
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            ScheduleResponse response = new ScheduleResponse(false, e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            ScheduleResponse response = new ScheduleResponse(false, "Error updating schedule: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Delete a schedule
     * Requires JWT authentication
     * @param scheduleId The ID of the schedule to delete
     * @return Success message
     */
    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<Map<String, Object>> deleteSchedule(@PathVariable String scheduleId) {
        try {
            // Get the authenticated user ID from the security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();
            
            // Retrieve the existing schedule
            Schedule existingSchedule = scheduleService.getScheduleById(scheduleId);
            
            if (existingSchedule == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Schedule not found");
                return ResponseEntity.status(404).body(response);
            }
            
            // Check if the authenticated user is the owner of the schedule
            if (!existingSchedule.getUserId().equals(userId)) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "You are not authorized to delete this schedule");
                return ResponseEntity.status(403).body(response);
            }
            
            // Delete the schedule
            boolean deleted = scheduleService.deleteSchedule(scheduleId);
            
            Map<String, Object> response = new HashMap<>();
            if (deleted) {
                response.put("success", true);
                response.put("message", "Schedule deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Failed to delete schedule");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error deleting schedule: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Get schedules for the authenticated user
     * Requires JWT authentication
     * @return List of schedules for the user
     */
    @GetMapping("/user")
    public ResponseEntity<List<ScheduleResponse>> getSchedulesForUser() {
        try {
            // Get the authenticated user ID from the security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();
            
            List<Schedule> schedules = scheduleService.getSchedulesByUserId(userId);
            List<ScheduleResponse> responseList = new ArrayList<>();
            
            String userEmail = scheduleService.getUserEmail(userId);
            
            for (Schedule schedule : schedules) {
                ScheduleResponse response = new ScheduleResponse(
                    schedule.getScheduleId(),
                    schedule.getPickupDate(),
                    schedule.getPickupTime(),
                    schedule.getLocationId(),
                    schedule.getStatus(),
                    schedule.getUserId(),
                    userEmail,
                    true,
                    null
                );
                
                responseList.add(response);
            }
            
            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }
} 