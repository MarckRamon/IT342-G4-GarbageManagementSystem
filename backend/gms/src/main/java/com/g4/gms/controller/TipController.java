package com.g4.gms.controller;

import com.g4.gms.dto.TipRequest;
import com.g4.gms.model.Tip;
import com.g4.gms.service.TipService;
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
@RequestMapping("/api/tip")
public class TipController {

    @Autowired
    private TipService tipService;

    /**
     * Get all tips (public endpoint)
     * @return List of tips
     */
    @GetMapping
    public ResponseEntity<?> getAllTips() {
        try {
            List<Tip> tipList = tipService.getAllTips();
            
            List<Map<String, Object>> responseList = new ArrayList<>();
            for (Tip tip : tipList) {
                String userEmail = tipService.getUserEmailById(tip.getUserId());
                
                // Create response including all fields
                Map<String, Object> response = Map.of(
                    "tipId", tip.getTipId(),
                    "title", tip.getTitle(),
                    "description", tip.getDescription(),
                    "status", tip.getStatus(),
                    "userId", tip.getUserId(),
                    "userEmail", userEmail != null ? userEmail : "",
                    "createdAt", formatTimestamp(tip.getCreatedAt()),
                    "updatedAt", formatTimestamp(tip.getUpdatedAt()),
                    "success", true,
                    "message", "Tip retrieved successfully"
                );
                
                responseList.add(response);
            }
            
            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error retrieving tips: " + e.getMessage()));
        }
    }

    /**
     * Get a specific tip by ID (public endpoint)
     * @param tipId Tip ID
     * @return Tip entry
     */
    @GetMapping("/{tipId}")
    public ResponseEntity<?> getTipById(@PathVariable String tipId) {
        try {
            Tip tip = tipService.getTipById(tipId);
            
            if (tip == null) {
                return ResponseEntity.notFound().build();
            }
            
            String userEmail = tipService.getUserEmailById(tip.getUserId());
            
            // Create response including all fields
            Map<String, Object> response = Map.of(
                "tipId", tip.getTipId(),
                "title", tip.getTitle(),
                "description", tip.getDescription(),
                "status", tip.getStatus(),
                "userId", tip.getUserId(),
                "userEmail", userEmail != null ? userEmail : "",
                "createdAt", formatTimestamp(tip.getCreatedAt()),
                "updatedAt", formatTimestamp(tip.getUpdatedAt()),
                "success", true,
                "message", "Tip retrieved successfully"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error retrieving tip: " + e.getMessage()));
        }
    }

    /**
     * Create a new tip (requires authentication)
     * @param request TipRequest containing the tip data
     * @return Created tip with createdAt timestamp
     */
    @PostMapping
    public ResponseEntity<?> createTip(@RequestBody TipRequest request) {
        try {
            // Get the authenticated user's ID
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();
            
            Tip tip = new Tip();
            tip.setTitle(request.getTitle());
            tip.setDescription(request.getDescription());
            tip.setStatus(request.getStatus());
            tip.setUserId(userId);
            
            Tip createdTip = tipService.createTip(tip);
            String userEmail = tipService.getUserEmailById(userId);
            
            // Create response including all fields
            return ResponseEntity.ok(Map.of(
                "tipId", createdTip.getTipId(),
                "title", createdTip.getTitle(),
                "description", createdTip.getDescription(),
                "status", createdTip.getStatus(),
                "userId", createdTip.getUserId(),
                "userEmail", userEmail != null ? userEmail : "",
                "createdAt", formatTimestamp(createdTip.getCreatedAt()),
                "updatedAt", formatTimestamp(createdTip.getUpdatedAt()),
                "success", true,
                "message", "Tip created successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error creating tip: " + e.getMessage()));
        }
    }

    /**
     * Update an existing tip (requires authentication)
     * @param tipId Tip ID
     * @param request TipRequest containing the updated tip data
     * @return Updated tip with updatedAt timestamp
     */
    @PutMapping("/{tipId}")
    public ResponseEntity<?> updateTip(
            @PathVariable String tipId,
            @RequestBody TipRequest request) {
        try {
            // Get the authenticated user's ID
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();
            
            // Fetch existing tip to check ownership
            Tip existingTip = tipService.getTipById(tipId);
            if (existingTip == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Update the tip fields
            Tip updatedTip = new Tip();
            updatedTip.setTipId(tipId);
            updatedTip.setTitle(request.getTitle());
            updatedTip.setDescription(request.getDescription());
            updatedTip.setStatus(request.getStatus());
            updatedTip.setUserId(existingTip.getUserId()); // Preserve original user ID
            
            Tip savedTip = tipService.updateTip(tipId, updatedTip);
            String userEmail = tipService.getUserEmailById(savedTip.getUserId());
            
            // Create response including all fields
            return ResponseEntity.ok(Map.of(
                "tipId", savedTip.getTipId(),
                "title", savedTip.getTitle(),
                "description", savedTip.getDescription(),
                "status", savedTip.getStatus(),
                "userId", savedTip.getUserId(),
                "userEmail", userEmail != null ? userEmail : "",
                "createdAt", formatTimestamp(savedTip.getCreatedAt()),
                "updatedAt", formatTimestamp(savedTip.getUpdatedAt()),
                "success", true,
                "message", "Tip updated successfully"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error updating tip: " + e.getMessage()));
        }
    }

    /**
     * Delete a tip (requires authentication)
     * @param tipId Tip ID
     * @return Success message
     */
    @DeleteMapping("/{tipId}")
    public ResponseEntity<?> deleteTip(@PathVariable String tipId) {
        try {
            // Get the authenticated user's ID
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();
            
            // Fetch existing tip to check ownership
            Tip existingTip = tipService.getTipById(tipId);
            if (existingTip == null) {
                return ResponseEntity.notFound().build();
            }
            
            boolean deleted = tipService.deleteTip(tipId);
            
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Tip deleted successfully"));
            } else {
                return ResponseEntity.status(500).body(Map.of("message", "Failed to delete tip"));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error deleting tip: " + e.getMessage()));
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