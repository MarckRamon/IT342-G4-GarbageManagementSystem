package com.g4.gms.controller;

import com.g4.gms.dto.*;
import com.g4.gms.model.User;
import com.g4.gms.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    /**
     * Get all users
     * @return List of UserResponse containing all users' data
     */
    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            List<UserResponse> responses = new ArrayList<>();
            
            for (User user : users) {
                UserResponse response = new UserResponse(
                    user.getUserId(),
                    user.getUsername(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getEmail(),
                    user.getRole(),
                    user.getLocation(),
                    user.getPhoneNumber(),
                    user.isNotificationsEnabled(),
                    user.getCreatedAt(),
                    true,
                    null
                );
                responses.add(response);
            }
            
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error retrieving users: " + e.getMessage()));
        }
    }

    /**
     * Create a new user
     * @param request UserRequest containing user data
     * @return UserResponse containing the created user data
     */
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@RequestBody UserRequest request) {
        try {
            User user = new User();
            user.setUsername(request.getUsername());
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setEmail(request.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setRole(request.getRole());
            user.setLocation(request.getLocation());
            user.setPhoneNumber(request.getPhoneNumber());
            user.setNotificationsEnabled(request.isNotificationsEnabled());
            
            User createdUser = userService.createUser(user);
            
            UserResponse response = new UserResponse(
                createdUser.getUserId(),
                createdUser.getUsername(),
                createdUser.getFirstName(),
                createdUser.getLastName(),
                createdUser.getEmail(),
                createdUser.getRole(),
                createdUser.getLocation(),
                createdUser.getPhoneNumber(),
                createdUser.isNotificationsEnabled(),
                createdUser.getCreatedAt(),
                true,
                "User created successfully"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            UserResponse response = new UserResponse(false, "Error creating user: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Get a user by ID
     * @param userId User ID
     * @return UserResponse containing the user data
     */
    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable String userId) {
        try {
            User user = userService.getUserById(userId);
            
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            UserResponse response = new UserResponse(
                user.getUserId(),
                user.getUsername(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole(),
                user.getLocation(),
                user.getPhoneNumber(),
                user.isNotificationsEnabled(),
                user.getCreatedAt(),
                true,
                "User retrieved successfully"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            UserResponse response = new UserResponse(false, "Error retrieving user: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Update a user
     * @param userId User ID
     * @param request UserRequest containing updated user data
     * @return UserResponse containing the updated user data
     */
    @PutMapping("/{userId}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable String userId,
            @RequestBody UserRequest request) {
        try {
            User user = userService.getUserById(userId);
            
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            user.setUsername(request.getUsername());
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setEmail(request.getEmail());
            if (request.getPassword() != null && !request.getPassword().isEmpty()) {
                user.setPassword(passwordEncoder.encode(request.getPassword()));
            }
            user.setRole(request.getRole());
            user.setLocation(request.getLocation());
            user.setPhoneNumber(request.getPhoneNumber());
            user.setNotificationsEnabled(request.isNotificationsEnabled());
            
            User updatedUser = userService.updateUser(user);
            
            UserResponse response = new UserResponse(
                updatedUser.getUserId(),
                updatedUser.getUsername(),
                updatedUser.getFirstName(),
                updatedUser.getLastName(),
                updatedUser.getEmail(),
                updatedUser.getRole(),
                updatedUser.getLocation(),
                updatedUser.getPhoneNumber(),
                updatedUser.isNotificationsEnabled(),
                updatedUser.getCreatedAt(),
                true,
                "User updated successfully"
            );
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            UserResponse response = new UserResponse(false, e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            UserResponse response = new UserResponse(false, "Error updating user: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Delete a user
     * @param userId User ID
     * @return ResponseEntity indicating success or failure
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable String userId) {
        try {
            User user = userService.getUserById(userId);
            
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            userService.deleteUser(userId);
            
            return ResponseEntity.ok().body(Map.of("message", "User deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error deleting user: " + e.getMessage()));
        }
    }

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

    /**
     * Update user notification settings
     * @param userId User ID
     * @param request UpdateNotificationSettingsDto containing the new setting
     * @return ResponseEntity indicating success or failure
     */
    @PutMapping("/{userId}/profile/notifications")
    public ResponseEntity<?> updateNotificationSettings(
            @PathVariable String userId,
            @RequestBody UpdateNotificationSettingsDto request) {
        try {
            userService.updateNotificationSettings(userId, request.isNotificationsEnabled());
            return ResponseEntity.ok().body(Map.of("message", "Notification settings updated successfully"));
        } catch (IllegalArgumentException e) {
            // User not found
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        } catch (ExecutionException | InterruptedException e) {
            // Firestore operation failed
            return ResponseEntity.status(500).body(Map.of("message", "Error updating notification settings: " + e.getMessage()));
        } catch (Exception e) {
            // Catch any other unexpected exceptions
            return ResponseEntity.status(500).body(Map.of("message", "An unexpected error occurred: " + e.getMessage()));
        }
    }

    /**
     * Get user notification settings
     * @param userId User ID
     * @return ResponseEntity containing the notification setting (boolean) or an error message
     */
    @GetMapping("/{userId}/profile/notifications")
    public ResponseEntity<?> getNotificationSettings(@PathVariable String userId) {
        try {
            boolean isEnabled = userService.getNotificationSettings(userId);
            // Return the boolean value directly in the body, Spring will handle JSON conversion
            return ResponseEntity.ok().body(Map.of("notificationsEnabled", isEnabled));
        } catch (IllegalArgumentException e) {
            // User not found
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        } catch (ExecutionException | InterruptedException e) {
            // Firestore operation failed
            return ResponseEntity.status(500).body(Map.of("message", "Error retrieving notification settings: " + e.getMessage()));
        } catch (Exception e) {
            // Catch any other unexpected exceptions
            return ResponseEntity.status(500).body(Map.of("message", "An unexpected error occurred: " + e.getMessage()));
        }
    }
} 