package com.g4.gms.service;

import com.g4.gms.dto.AuthResponse;
import com.g4.gms.dto.LoginRequest;
import com.g4.gms.dto.RegisterRequest;
import com.g4.gms.model.User;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
public class AuthService {

    @Autowired
    private FirebaseAuth firebaseAuth;
    
    @Autowired
    private UserService userService;

    public AuthResponse register(RegisterRequest request) {
        try {
            // First, create the user in Firebase Auth
            UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                    .setEmail(request.getEmail())
                    .setPassword(request.getPassword())
                    .setDisplayName(request.getFirstName() + " " + request.getLastName())
                    .setEmailVerified(false);

            UserRecord userRecord = firebaseAuth.createUser(createRequest);
            
            // Create custom claims for role
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", request.getRole() != null ? request.getRole() : "USER");
            firebaseAuth.setCustomUserClaims(userRecord.getUid(), claims);
            
            // Create a custom token for the user
            String token = firebaseAuth.createCustomToken(userRecord.getUid(), claims);
            
            // Store additional user data in Firestore
            User user = new User();
            user.setUserId(userRecord.getUid());
            user.setEmail(request.getEmail());
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setUsername(request.getUsername());
            user.setRole(request.getRole() != null ? request.getRole() : "USER");
            user.setPassword(""); // We don't store the actual password in Firestore
            user.setLocation(request.getLocation());
            user.setPhoneNumber(request.getPhoneNumber());

            userService.createUser(user);
            
            // Return the response
            return new AuthResponse(token, userRecord.getUid(), userRecord.getEmail(), user.getRole());
            
        } catch (FirebaseAuthException | InterruptedException | ExecutionException e) {
            return new AuthResponse("Registration failed: " + e.getMessage());
        }
    }

    public AuthResponse login(LoginRequest request) {
        try {
            // Get user by email from Firestore
            User user = userService.getUserByEmail(request.getEmail());
            if (user == null) {
                return new AuthResponse("User not found with email: " + request.getEmail());
            }
            
            // Try to get the user from Firebase Auth
            UserRecord userRecord = firebaseAuth.getUserByEmail(request.getEmail());
            
            // Create custom claims based on user role
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", user.getRole());
            
            // Create a custom token
            String token = firebaseAuth.createCustomToken(userRecord.getUid(), claims);
            
            return new AuthResponse(token, user.getUserId(), user.getEmail(), user.getRole());
            
        } catch (FirebaseAuthException | InterruptedException | ExecutionException e) {
            return new AuthResponse("Login failed: " + e.getMessage());
        }
    }
    
    public boolean verifyToken(String idToken) {
        try {
            firebaseAuth.verifyIdToken(idToken);
            return true;
        } catch (FirebaseAuthException e) {
            return false;
        }
    }
} 