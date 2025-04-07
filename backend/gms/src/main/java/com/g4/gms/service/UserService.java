package com.g4.gms.service;

import com.g4.gms.model.User;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutionException;
import java.util.HashMap;
import java.util.Map;

@Service
public class UserService {

    private static final String COLLECTION_NAME = "users";
    
    @Autowired
    private Firestore firestore;
    
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
     * Update email for a user
     * @param userId User ID
     * @param email New email address
     * @return Updated user object
     * @throws ExecutionException
     * @throws InterruptedException
     */
    public User updateUserEmail(String userId, String email) 
            throws ExecutionException, InterruptedException {
        // Check if email is already in use by another user
        User existingUserWithEmail = getUserByEmail(email);
        if (existingUserWithEmail != null && !existingUserWithEmail.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Email is already in use by another user");
        }
        
        User user = getUserById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }
        
        user.setEmail(email);
        
        // Update in Firestore
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(userId);
        ApiFuture<WriteResult> result = docRef.set(user);
        
        // Wait for the write to complete
        result.get();
        
        return user;
    }
} 