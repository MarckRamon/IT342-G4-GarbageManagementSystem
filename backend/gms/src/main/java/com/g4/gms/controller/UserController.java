package com.g4.gms.controller;

import com.g4.gms.dto.EmailRequest;
import com.g4.gms.dto.EmailResponse;
import com.g4.gms.dto.ProfileRequest;
import com.g4.gms.dto.ProfileResponse;
import com.g4.gms.model.User;
import com.g4.gms.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * Get user profile data (firstName, lastName, phoneNumber)
     * @param userId User ID
     * @return ProfileResponse containing the profile data
     */
    @GetMapping("/{userId}/profile")
    public ResponseEntity<ProfileResponse> getUserProfile(@PathVariable String userId) {
        try {
            Map<String, String> profileData = userService.getUserProfile(userId);
            
            if (profileData == null) {
                return ResponseEntity.notFound().build();
            }
            
            ProfileResponse response = new ProfileResponse(
                profileData.get("firstName"),
                profileData.get("lastName"),
                profileData.get("phoneNumber"),
                true,
                "Profile data retrieved successfully"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ProfileResponse response = new ProfileResponse(false, "Error retrieving profile: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Update user profile data (firstName, lastName, phoneNumber)
     * @param userId User ID
     * @param request ProfileRequest containing the profile data to update
     * @return ProfileResponse containing the updated profile data
     */
    @PutMapping("/{userId}/profile")
    public ResponseEntity<ProfileResponse> updateUserProfile(
            @PathVariable String userId,
            @RequestBody ProfileRequest request) {
        try {
            User updatedUser = userService.updateUserProfile(
                userId,
                request.getFirstName(),
                request.getLastName(),
                request.getPhoneNumber()
            );
            
            ProfileResponse response = new ProfileResponse(
                updatedUser.getFirstName(),
                updatedUser.getLastName(),
                updatedUser.getPhoneNumber(),
                true,
                "Profile updated successfully"
            );
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            ProfileResponse response = new ProfileResponse(false, e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            ProfileResponse response = new ProfileResponse(false, "Error updating profile: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Get user email
     * @param userId User ID
     * @return EmailResponse containing the email
     */
    @GetMapping("/{userId}/profile/email")
    public ResponseEntity<EmailResponse> getUserEmail(@PathVariable String userId) {
        try {
            String email = userService.getUserEmail(userId);
            
            if (email == null) {
                return ResponseEntity.notFound().build();
            }
            
            EmailResponse response = new EmailResponse(email, true, "Email retrieved successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            EmailResponse response = new EmailResponse(false, "Error retrieving email: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Update user email
     * @param userId User ID
     * @param request EmailRequest containing the email to update
     * @return EmailResponse containing the updated email
     */
    @PutMapping("/{userId}/profile/email")
    public ResponseEntity<EmailResponse> updateUserEmail(
            @PathVariable String userId,
            @RequestBody EmailRequest request) {
        try {
            User updatedUser = userService.updateUserEmail(userId, request.getEmail());
            
            EmailResponse response = new EmailResponse(
                updatedUser.getEmail(),
                true,
                "Email updated successfully"
            );
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            EmailResponse response = new EmailResponse(false, e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            EmailResponse response = new EmailResponse(false, "Error updating email: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
} 