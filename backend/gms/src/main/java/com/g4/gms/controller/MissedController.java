package com.g4.gms.controller;

import com.g4.gms.dto.MissedRequest;
import com.g4.gms.dto.MissedResponse;
import com.g4.gms.model.Missed;
import com.g4.gms.service.MissedService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/missed")
public class MissedController {

    @Autowired
    private MissedService missedService;

    /**
     * Get all missed records
     * This endpoint is public (no JWT required)
     * @return List of all missed records
     */
    @GetMapping
    public ResponseEntity<List<MissedResponse>> getAllMissed() {
        try {
            List<Missed> missedList = missedService.getAllMissed();
            List<MissedResponse> responseList = new ArrayList<>();
            
            for (Missed missed : missedList) {
                MissedResponse response = new MissedResponse(
                    missed.getMissedId(),
                    missed.getTitle(),
                    missed.getDescription(),
                    missed.getReportDateTime(),
                    missed.getScheduleId(),
                    missed.getUserId()
                );
                
                responseList.add(response);
            }
            
            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Get a missed record by ID
     * This endpoint is public (no JWT required)
     * @param missedId The ID of the missed record
     * @return The missed record if found
     */
    @GetMapping("/{missedId}")
    public ResponseEntity<MissedResponse> getMissedById(@PathVariable String missedId) {
        try {
            Missed missed = missedService.getMissedById(missedId);
            
            if (missed != null) {
                MissedResponse response = new MissedResponse(
                    missed.getMissedId(),
                    missed.getTitle(),
                    missed.getDescription(),
                    missed.getReportDateTime(),
                    missed.getScheduleId(),
                    missed.getUserId()
                );
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            MissedResponse response = new MissedResponse(false, "Error retrieving missed record: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Create a new missed record
     * Requires JWT authentication
     * @param request The missed data to create
     * @return The created missed record
     */
    @PostMapping
    public ResponseEntity<MissedResponse> createMissed(@RequestBody MissedRequest request) {
        try {
            // Get the authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            // Create a new Missed object from the request
            Missed missed = new Missed();
            missed.setTitle(request.getTitle());
            missed.setDescription(request.getDescription());
            missed.setReportDateTime(request.getReportDateTime());
            missed.setScheduleId(request.getScheduleId());
            missed.setUserId(request.getUserId());
            
            // Save the missed record
            Missed createdMissed = missedService.createMissed(missed);
            
            MissedResponse response = new MissedResponse(
                createdMissed.getMissedId(),
                createdMissed.getTitle(),
                createdMissed.getDescription(),
                createdMissed.getReportDateTime(),
                createdMissed.getScheduleId(),
                createdMissed.getUserId(),
                true,
                "Missed record created successfully"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            MissedResponse response = new MissedResponse(false, "Error creating missed record: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Update an existing missed record
     * Requires JWT authentication
     * @param missedId The ID of the missed record to update
     * @param request The updated missed data
     * @return The updated missed record
     */
    @PutMapping("/{missedId}")
    public ResponseEntity<MissedResponse> updateMissed(@PathVariable String missedId, @RequestBody MissedRequest request) {
        try {
            // Get the current missed record
            Missed existingMissed = missedService.getMissedById(missedId);
            
            if (existingMissed == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Update the missed record with new values
            existingMissed.setTitle(request.getTitle());
            existingMissed.setDescription(request.getDescription());
            existingMissed.setReportDateTime(request.getReportDateTime());
            existingMissed.setScheduleId(request.getScheduleId());
            existingMissed.setUserId(request.getUserId());
            
            // Save the updated missed record
            Missed updatedMissed = missedService.updateMissed(missedId, existingMissed);
            
            MissedResponse response = new MissedResponse(
                updatedMissed.getMissedId(),
                updatedMissed.getTitle(),
                updatedMissed.getDescription(),
                updatedMissed.getReportDateTime(),
                updatedMissed.getScheduleId(),
                updatedMissed.getUserId(),
                true,
                "Missed record updated successfully"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            MissedResponse response = new MissedResponse(false, "Error updating missed record: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Delete a missed record
     * Requires JWT authentication
     * @param missedId The ID of the missed record to delete
     * @return Success response
     */
    @DeleteMapping("/{missedId}")
    public ResponseEntity<MissedResponse> deleteMissed(@PathVariable String missedId) {
        try {
            boolean deleted = missedService.deleteMissed(missedId);
            
            if (deleted) {
                MissedResponse response = new MissedResponse(true, "Missed record deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            MissedResponse response = new MissedResponse(false, "Error deleting missed record: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Get missed records by schedule ID
     * This endpoint is public (no JWT required)
     * @param scheduleId The ID of the schedule
     * @return List of missed records for the schedule
     */
    @GetMapping("/schedule/{scheduleId}")
    public ResponseEntity<List<MissedResponse>> getMissedByScheduleId(@PathVariable String scheduleId) {
        try {
            List<Missed> missedList = missedService.getMissedByScheduleId(scheduleId);
            List<MissedResponse> responseList = new ArrayList<>();
            
            for (Missed missed : missedList) {
                MissedResponse response = new MissedResponse(
                    missed.getMissedId(),
                    missed.getTitle(),
                    missed.getDescription(),
                    missed.getReportDateTime(),
                    missed.getScheduleId(),
                    missed.getUserId()
                );
                
                responseList.add(response);
            }
            
            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Get missed records by user ID
     * This endpoint is public (no JWT required)
     * @param userId The ID of the user
     * @return List of missed records for the user
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<MissedResponse>> getMissedByUserId(@PathVariable String userId) {
        try {
            List<Missed> missedList = missedService.getMissedByUserId(userId);
            List<MissedResponse> responseList = new ArrayList<>();
            
            for (Missed missed : missedList) {
                MissedResponse response = new MissedResponse(
                    missed.getMissedId(),
                    missed.getTitle(),
                    missed.getDescription(),
                    missed.getReportDateTime(),
                    missed.getScheduleId(),
                    missed.getUserId()
                );
                
                responseList.add(response);
            }
            
            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }
} 