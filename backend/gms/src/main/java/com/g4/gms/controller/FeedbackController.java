package com.g4.gms.controller;

import com.g4.gms.dto.FeedbackRequest;
import com.g4.gms.dto.FeedbackResponse;
import com.g4.gms.model.Feedback;
import com.g4.gms.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    /**
     * Get all feedback entries (public endpoint)
     * @return List of feedback entries
     */
    @GetMapping
    public ResponseEntity<?> getAllFeedback() {
        try {
            List<Feedback> feedbackList = feedbackService.getAllFeedback();
            
            List<Map<String, Object>> responseList = new ArrayList<>();
            for (Feedback feedback : feedbackList) {
                String userEmail = feedbackService.getUserEmailById(feedback.getUserId());
                
                // Create response without timestamps
                Map<String, Object> response = Map.of(
                    "feedbackId", feedback.getFeedbackId(),
                    "title", feedback.getTitle(),
                    "description", feedback.getDescription(),
                    "status", feedback.getStatus(),
                    "userId", feedback.getUserId(),
                    "userEmail", userEmail != null ? userEmail : "",
                    "success", true,
                    "message", "Feedback retrieved successfully"
                );
                
                responseList.add(response);
            }
            
            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error retrieving feedback: " + e.getMessage()));
        }
    }

    /**
     * Get a specific feedback by ID (public endpoint)
     * @param feedbackId Feedback ID
     * @return Feedback entry
     */
    @GetMapping("/{feedbackId}")
    public ResponseEntity<?> getFeedbackById(@PathVariable String feedbackId) {
        try {
            Feedback feedback = feedbackService.getFeedbackById(feedbackId);
            
            if (feedback == null) {
                return ResponseEntity.notFound().build();
            }
            
            String userEmail = feedbackService.getUserEmailById(feedback.getUserId());
            
            // Create response without timestamps
            Map<String, Object> response = Map.of(
                "feedbackId", feedback.getFeedbackId(),
                "title", feedback.getTitle(),
                "description", feedback.getDescription(),
                "status", feedback.getStatus(),
                "userId", feedback.getUserId(),
                "userEmail", userEmail != null ? userEmail : "",
                "success", true,
                "message", "Feedback retrieved successfully"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error retrieving feedback: " + e.getMessage()));
        }
    }

    /**
     * Create a new feedback entry (requires authentication)
     * @param request FeedbackRequest containing the feedback data
     * @return Created feedback with createdAt timestamp
     */
    @PostMapping
    public ResponseEntity<?> createFeedback(@RequestBody FeedbackRequest request) {
        try {
            // Get the authenticated user's ID
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();
            
            Feedback feedback = new Feedback();
            feedback.setTitle(request.getTitle());
            feedback.setDescription(request.getDescription());
            feedback.setStatus(request.getStatus());
            feedback.setUserId(userId);
            
            Feedback createdFeedback = feedbackService.createFeedback(feedback);
            String userEmail = feedbackService.getUserEmailById(userId);
            
            // Format createdAt timestamp
            String formattedCreatedAt = null;
            if (createdFeedback.getCreatedAt() != null) {
                formattedCreatedAt = formatTimestamp(createdFeedback.getCreatedAt());
            }
            
            // Create response with only createdAt timestamp
            return ResponseEntity.ok(Map.of(
                "feedbackId", createdFeedback.getFeedbackId(),
                "title", createdFeedback.getTitle(),
                "description", createdFeedback.getDescription(),
                "status", createdFeedback.getStatus(),
                "userId", createdFeedback.getUserId(),
                "userEmail", userEmail != null ? userEmail : "",
                "createdAt", formattedCreatedAt,
                "success", true,
                "message", "Feedback created successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error creating feedback: " + e.getMessage()));
        }
    }

    /**
     * Update an existing feedback entry (requires authentication)
     * @param feedbackId Feedback ID
     * @param request FeedbackRequest containing the updated feedback data
     * @return Updated feedback with updatedAt timestamp
     */
    @PutMapping("/{feedbackId}")
    public ResponseEntity<?> updateFeedback(
            @PathVariable String feedbackId,
            @RequestBody FeedbackRequest request) {
        try {
            // Get the authenticated user's ID
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();
            
            // Fetch existing feedback to check ownership
            Feedback existingFeedback = feedbackService.getFeedbackById(feedbackId);
            if (existingFeedback == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Update the feedback fields
            Feedback updatedFeedback = new Feedback();
            updatedFeedback.setFeedbackId(feedbackId);
            updatedFeedback.setTitle(request.getTitle());
            updatedFeedback.setDescription(request.getDescription());
            updatedFeedback.setStatus(request.getStatus());
            updatedFeedback.setUserId(existingFeedback.getUserId()); // Preserve original user ID
            
            Feedback savedFeedback = feedbackService.updateFeedback(feedbackId, updatedFeedback);
            String userEmail = feedbackService.getUserEmailById(savedFeedback.getUserId());
            
            // Format updatedAt timestamp
            String formattedUpdatedAt = null;
            if (savedFeedback.getUpdatedAt() != null) {
                formattedUpdatedAt = formatTimestamp(savedFeedback.getUpdatedAt());
            }
            
            // Create response with only updatedAt timestamp
            return ResponseEntity.ok(Map.of(
                "feedbackId", savedFeedback.getFeedbackId(),
                "title", savedFeedback.getTitle(),
                "description", savedFeedback.getDescription(),
                "status", savedFeedback.getStatus(),
                "userId", savedFeedback.getUserId(),
                "userEmail", userEmail != null ? userEmail : "",
                "updatedAt", formattedUpdatedAt,
                "success", true,
                "message", "Feedback updated successfully"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error updating feedback: " + e.getMessage()));
        }
    }

    /**
     * Delete a feedback entry (requires authentication)
     * @param feedbackId Feedback ID
     * @return Success message
     */
    @DeleteMapping("/{feedbackId}")
    public ResponseEntity<?> deleteFeedback(@PathVariable String feedbackId) {
        try {
            // Get the authenticated user's ID
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();
            
            // Fetch existing feedback to check ownership
            Feedback existingFeedback = feedbackService.getFeedbackById(feedbackId);
            if (existingFeedback == null) {
                return ResponseEntity.notFound().build();
            }
            
            boolean deleted = feedbackService.deleteFeedback(feedbackId);
            
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Feedback deleted successfully"));
            } else {
                return ResponseEntity.status(500).body(Map.of("message", "Failed to delete feedback"));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error deleting feedback: " + e.getMessage()));
        }
    }
    
    /**
     * Helper method to format timestamp
     */
    private String formatTimestamp(com.google.cloud.Timestamp timestamp) {
        if (timestamp == null) {
            return null;
        }
        
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter
            .ofPattern("yyyy-MM-dd HH:mm:ss")
            .withZone(java.time.ZoneId.systemDefault());
        return formatter.format(timestamp.toDate().toInstant());
    }
} 