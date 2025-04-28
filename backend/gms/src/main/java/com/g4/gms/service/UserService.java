package com.g4.gms.service;

import com.g4.gms.model.User;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.AuthErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutionException;
import java.util.HashMap;
import java.util.Map;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    private static final String COLLECTION_NAME = "users";
    
    @Autowired
    private Firestore firestore;
    
    @Autowired
    private FirebaseAuth firebaseAuth;
    
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public User createUser(User user) throws ExecutionException, InterruptedException {
        // Set creation timestamp
        user.setCreatedAt(Timestamp.now());
        
        // If no role is specified, set a default role
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("USER");
        }
        
        // Save to Firestore
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(user.getUserId());
        ApiFuture<WriteResult> result = docRef.set(user);
        
        // Wait for the write to complete
        result.get();
        
        return user;
    }
    
    public User getUserById(String userId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(userId);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();
        
        if (document.exists()) {
            return document.toObject(User.class);
        } else {
            return null;
        }
    }
    
    public User getUserByEmail(String email) throws ExecutionException, InterruptedException {
        ApiFuture<com.google.cloud.firestore.QuerySnapshot> future = 
            firestore.collection(COLLECTION_NAME)
                .whereEqualTo("email", email)
                .limit(1)
                .get();
        
        var documents = future.get().getDocuments();
        
        if (!documents.isEmpty()) {
            return documents.get(0).toObject(User.class);
        } else {
            return null;
        }
    }
    
    public User updateUser(User user) throws ExecutionException, InterruptedException {
        // Get the existing user
        User existingUser = getUserById(user.getUserId());
        if (existingUser == null) {
            throw new IllegalArgumentException("User not found with ID: " + user.getUserId());
        }
        
        // Only hash the password if it has changed
        if (user.getPassword() != null && !user.getPassword().isEmpty() 
                && !passwordEncoder.matches(user.getPassword(), existingUser.getPassword())) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        } else {
            // Keep the existing hashed password
            user.setPassword(existingUser.getPassword());
        }
        
        // Keep the original creation timestamp
        user.setCreatedAt(existingUser.getCreatedAt());
        
        // Update in Firestore
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(user.getUserId());
        ApiFuture<WriteResult> result = docRef.set(user);
        
        // Wait for the write to complete
        result.get();
        
        return user;
    }
    
    public boolean deleteUser(String userId) throws ExecutionException, InterruptedException {
        ApiFuture<WriteResult> writeResult = firestore.collection(COLLECTION_NAME).document(userId).delete();
        writeResult.get();
        return true;
    }
    
    public boolean verifyPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
    
    // New methods for profile management
    
    /**
     * Get profile data (firstName, lastName, phoneNumber) for a user
     * @param userId User ID
     * @return Map containing the profile data
     * @throws ExecutionException
     * @throws InterruptedException
     */
    public Map<String, String> getUserProfile(String userId) throws ExecutionException, InterruptedException {
        User user = getUserById(userId);
        if (user == null) {
            return null;
        }
        
        Map<String, String> profileData = new HashMap<>();
        profileData.put("firstName", user.getFirstName());
        profileData.put("lastName", user.getLastName());
        profileData.put("phoneNumber", user.getPhoneNumber());
        
        return profileData;
    }
    
    /**
     * Update profile data (firstName, lastName, phoneNumber) for a user
     * @param userId User ID
     * @param firstName First name
     * @param lastName Last name
     * @param phoneNumber Phone number
     * @return Updated user object
     * @throws ExecutionException
     * @throws InterruptedException
     */
    public User updateUserProfile(String userId, String firstName, String lastName, String phoneNumber) 
            throws ExecutionException, InterruptedException {
        User user = getUserById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }
        
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPhoneNumber(phoneNumber);
        
        // Update in Firestore
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(userId);
        ApiFuture<WriteResult> result = docRef.set(user);
        
        // Wait for the write to complete
        result.get();
        
        return user;
    }
    
    /**
     * Get email for a user
     * @param userId User ID
     * @return Email address
     * @throws ExecutionException
     * @throws InterruptedException
     */
    public String getUserEmail(String userId) throws ExecutionException, InterruptedException {
        User user = getUserById(userId);
        if (user == null) {
            return null;
        }
        
        return user.getEmail();
    }
    
    /**
     * Update email for a user in both Firebase Auth and Firestore.
     * @param userId User ID
     * @param newEmail New email address
     * @return Updated user object from Firestore
     * @throws ExecutionException
     * @throws InterruptedException
     * @throws FirebaseAuthException If updating Firebase Auth fails
     * @throws IllegalArgumentException If user not found or email is already in use
     */
    public User updateUserEmail(String userId, String newEmail) 
            throws ExecutionException, InterruptedException, FirebaseAuthException, IllegalArgumentException {
        
        logger.info("Attempting to update email for user ID: {} to {}", userId, newEmail);

        // 1. Check if the new email is already in use in Firestore by ANOTHER user
        User existingUserWithEmail = getUserByEmail(newEmail);
        if (existingUserWithEmail != null && !existingUserWithEmail.getUserId().equals(userId)) {
             logger.warn("Email update failed: {} is already in use by user ID: {}", newEmail, existingUserWithEmail.getUserId());
            throw new IllegalArgumentException("Email is already in use by another user.");
        }

        // 2. Get the user data from Firestore
        User user = getUserById(userId);
        if (user == null) {
            logger.warn("Email update failed: User not found with ID: {}", userId);
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }

        // 3. Attempt to update the email in Firebase Authentication FIRST
        try {
            UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(userId)
                    .setEmail(newEmail);
            // You might also want to set setEmailVerified(false) here and trigger verification flow
            // request.setEmailVerified(false); 
            
            UserRecord userRecord = firebaseAuth.updateUser(request);
            logger.info("Successfully updated email in Firebase Auth for UID: {}", userRecord.getUid());
            
        } catch (FirebaseAuthException e) {
            logger.error("Failed to update email in Firebase Auth for UID {}: {}", userId, e.getMessage(), e);
            // Handle specific Firebase Auth errors
            if (e.getAuthErrorCode() == AuthErrorCode.EMAIL_ALREADY_EXISTS) {
                 throw new IllegalArgumentException("This email address is already associated with another Firebase Authentication account.", e);
            } else if (e.getAuthErrorCode() == AuthErrorCode.USER_NOT_FOUND) {
                 // This indicates an inconsistency if the user exists in Firestore but not Auth
                 logger.error("Inconsistency detected: User {} found in Firestore but not in Firebase Auth.", userId);
                 throw new IllegalArgumentException("User account not found in authentication system.", e);
            }
            // Re-throw other Firebase exceptions to be handled by the controller
            throw e; 
        }

        // 4. If Firebase Auth update succeeded, update the email in Firestore
        try {
            user.setEmail(newEmail); // Update the user object
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(userId);
            // Use update instead of set to only change the email field
            ApiFuture<WriteResult> result = docRef.update("email", newEmail); 
            result.get(); // Wait for the write to complete
            logger.info("Successfully updated email in Firestore for user ID: {}", userId);
        } catch (ExecutionException | InterruptedException e) {
             logger.error("Failed to update email in Firestore for user ID {}: {}", userId, e.getMessage(), e);
             // Potentially try to revert the Firebase Auth email change here (complex)
             // For now, just rethrow
             throw e;
        }
        
        return user; // Return the user object with the updated email
    }

    /**
     * Updates the notification preference for a user.
     * @param userId The ID of the user to update.
     * @param enabled The new notification setting.
     * @return The updated User object.
     * @throws ExecutionException If Firestore operation fails.
     * @throws InterruptedException If Firestore operation is interrupted.
     * @throws IllegalArgumentException If the user is not found.
     */
    public User updateNotificationSettings(String userId, boolean enabled) 
            throws ExecutionException, InterruptedException, IllegalArgumentException {
        User user = getUserById(userId);
        if (user == null) {
            logger.warn("Notification settings update failed: User not found with ID: {}", userId);
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }

        user.setNotificationsEnabled(enabled);

        // Update in Firestore
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(userId);
        ApiFuture<WriteResult> result = docRef.set(user, com.google.cloud.firestore.SetOptions.merge()); // Use merge to only update the specified field
        result.get(); // Wait for completion

        logger.info("Successfully updated notification settings for user ID: {} to {}", userId, enabled);
        return user;
    }

    /**
     * Gets the notification preference for a user.
     * @param userId The ID of the user.
     * @return The boolean value of the notification setting.
     * @throws ExecutionException If Firestore operation fails.
     * @throws InterruptedException If Firestore operation is interrupted.
     * @throws IllegalArgumentException If the user is not found.
     */
    public boolean getNotificationSettings(String userId) 
            throws ExecutionException, InterruptedException, IllegalArgumentException {
        User user = getUserById(userId);
        if (user == null) {
            logger.warn("Get notification settings failed: User not found with ID: {}", userId);
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }
        logger.info("Retrieved notification settings for user ID: {}: {}", userId, user.isNotificationsEnabled());
        return user.isNotificationsEnabled();
    }

    /**
     * Updates the FCM token for a user.
     * @param userId The ID of the user to update.
     * @param fcmToken The new FCM token.
     * @return The updated User object.
     * @throws ExecutionException If Firestore operation fails.
     * @throws InterruptedException If Firestore operation is interrupted.
     * @throws IllegalArgumentException If the user is not found.
     */
    public User updateFcmToken(String userId, String fcmToken) 
            throws ExecutionException, InterruptedException, IllegalArgumentException {
        User user = getUserById(userId);
        if (user == null) {
            logger.warn("FCM token update failed: User not found with ID: {}", userId);
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }

        user.setFcmToken(fcmToken);

        // Update in Firestore
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(userId);
        ApiFuture<WriteResult> result = docRef.update("fcmToken", fcmToken);
        result.get(); // Wait for completion

        logger.info("Successfully updated FCM token for user ID: {}", userId);
        return user;
    }
} 