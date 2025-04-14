package com.g4.gms.service;

import com.g4.gms.dto.AuthResponse;
import com.g4.gms.dto.LoginRequest;
import com.g4.gms.dto.RegisterRequest;
import com.g4.gms.model.User;
import com.g4.gms.security.JwtTokenProvider;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.AuthErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private FirebaseAuth firebaseAuth;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    public AuthResponse register(RegisterRequest request) {
        try {
            logger.info("Attempting to register user with email: {}", request.getEmail());
            // First, create the user in Firebase Auth
            UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                    .setEmail(request.getEmail())
                    .setPassword(request.getPassword())
                    .setDisplayName(request.getFirstName() + " " + request.getLastName())
                    .setEmailVerified(false);

            UserRecord userRecord = firebaseAuth.createUser(createRequest);
            logger.info("Successfully created user in Firebase Auth with UID: {}", userRecord.getUid());
            
            // Set custom claims (role) in Firebase Auth - still useful if interacting with Firebase services directly
            String role = request.getRole() != null ? request.getRole() : "USER";
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", role);
            firebaseAuth.setCustomUserClaims(userRecord.getUid(), claims);
            logger.debug("Set custom claims in Firebase for UID: {}", userRecord.getUid());
            
            // Create user object for Firestore
            User user = new User();
            user.setUserId(userRecord.getUid());
            user.setEmail(request.getEmail());
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setUsername(request.getUsername());
            user.setRole(role);
            // Store encrypted password in Firestore
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setLocation(request.getLocation());
            user.setPhoneNumber(request.getPhoneNumber());
            // UserService will set createdAt

            // Store additional user data in Firestore
            userService.createUser(user);
            logger.info("Successfully stored user data in Firestore for UID: {}", user.getUserId());

            // Generate *our* JWT for backend authentication
            String jwtToken = jwtTokenProvider.generateToken(user);
            logger.info("Generated JWT for user: {}", user.getEmail());
            
            // Return the JWT in the response
            return new AuthResponse(jwtToken, userRecord.getUid(), userRecord.getEmail(), user.getRole());
            
        } catch (FirebaseAuthException e) {
            logger.error("Firebase registration failed for email {}: {}", request.getEmail(), e.getMessage(), e);
            String message = "Registration failed. ";
            AuthErrorCode errorCode = e.getAuthErrorCode();
            
            if (errorCode != null) {
                if (errorCode == AuthErrorCode.EMAIL_ALREADY_EXISTS) {
                    message += "Email already in use.";
                } else {
                    // Handle other specific known errors from the enum if needed
                    message += "An unexpected authentication error occurred (";
                    message += errorCode.toString();
                    message += "). Please try again.";
                }
            } else {
                // Handle cases where errorCode is null (less common)
                message += "An unexpected error occurred (no specific error code). Please try again.";
            }
            return new AuthResponse(message);
        } catch (ExecutionException | InterruptedException e) {
             logger.error("Firestore user creation failed for email {}: {}", request.getEmail(), e.getMessage(), e);
             // Consider cleaning up the Firebase Auth user if Firestore save fails (complex rollback needed)
             return new AuthResponse("Registration failed due to a database error. Please try again.");
        } catch (Exception e) { // Catch any other unexpected errors
            logger.error("Unexpected registration error for email {}: {}", request.getEmail(), e.getMessage(), e);
            return new AuthResponse("An unexpected error occurred during registration.");
        }
    }

    public AuthResponse login(LoginRequest request) {
        String userEmail = request.getEmail(); // Use a variable for email
        try {
            logger.info("Attempting login for email: {}", userEmail);
            // 1. Get user by email from Firestore (contains role and hashed password)
            User user = userService.getUserByEmail(userEmail);
            if (user == null) {
                logger.warn("Login failed: User not found in Firestore with email: {}", userEmail);
                return new AuthResponse("Invalid email or password."); // Generic message
            }
            
            // 2. Verify password using BCrypt
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                 logger.warn("Login failed: Invalid password for email: {}", userEmail);
                return new AuthResponse("Invalid email or password."); // Generic message
            }
            
            // 3. Verify user exists in Firebase Auth with the SAME email
            try {
                 UserRecord userRecord = firebaseAuth.getUserByEmail(userEmail);
                 // Ensure Firestore UID matches Firebase Auth UID (already existed, kept for safety)
                 if (!userRecord.getUid().equals(user.getUserId())) {
                     logger.error("CRITICAL INCONSISTENCY: UID mismatch for email {}. Firestore UID: {}, Firebase Auth UID: {}. Login denied.", 
                                  userEmail, user.getUserId(), userRecord.getUid());
                     return new AuthResponse("Login failed due to an internal account inconsistency.");
                 }
                 // Ensure the email matches exactly (case-sensitive)
                 if (!userRecord.getEmail().equals(user.getEmail())) {
                    logger.error("CRITICAL INCONSISTENCY: Email mismatch for UID {}. Firestore email: {}, Firebase Auth email: {}. Login denied.", 
                                  user.getUserId(), user.getEmail(), userRecord.getEmail());
                     // This is the scenario you described! Don't log in.
                     return new AuthResponse("Login failed due to an internal account inconsistency.");
                 }
                 logger.debug("Firebase Auth user confirmed for email: {}", userEmail);
            } catch (FirebaseAuthException e) {
                 // Specifically handle USER_NOT_FOUND in Firebase Auth
                 if (e.getAuthErrorCode() == AuthErrorCode.USER_NOT_FOUND) {
                     logger.error("CRITICAL INCONSISTENCY: User {} exists in Firestore but NOT in Firebase Auth. Login denied.", userEmail);
                     return new AuthResponse("Login failed due to an internal account inconsistency.");
                 } else {
                     // Log other Firebase exceptions but potentially still fail login
                     logger.error("Could not retrieve user from Firebase Auth during login for email {}: {}. Login denied.", userEmail, e.getMessage(), e);
                     return new AuthResponse("Login failed: Could not verify user account status.");
                 }
            }
            
            // 4. Generate *our* backend JWT (only if all checks passed)
            String jwtToken = jwtTokenProvider.generateToken(user);
            logger.info("Login successful, generated JWT for user: {}", userEmail);
            
            // 5. Return the JWT response
            return new AuthResponse(jwtToken, user.getUserId(), user.getEmail(), user.getRole());
            
        } catch (ExecutionException | InterruptedException e) {
             logger.error("Firestore lookup failed during login for email {}: {}", userEmail, e.getMessage(), e);
             return new AuthResponse("Login failed due to a database error.");
        } catch (Exception e) { // Catch any other unexpected errors
             logger.error("Unexpected login error for email {}: {}", userEmail, e.getMessage(), e);
             return new AuthResponse("An unexpected error occurred during login.");
        }
    }

    public void requestPasswordReset(String email) {
        try {
            // Firebase Admin SDK handles sending the email containing the reset link
            String link = firebaseAuth.generatePasswordResetLink(email);
            // Log success internally. The link variable is generated but typically not used directly here.
            logger.info("Successfully requested password reset for email (email sent by Firebase): {}", email);
            // NOTE: We intentionally do NOT indicate to the caller whether the email exists
            // in Firebase to prevent user enumeration attacks.

        } catch (FirebaseAuthException e) {
            // Log the error for backend visibility, especially if the email doesn't exist.
            if (e.getAuthErrorCode() == AuthErrorCode.USER_NOT_FOUND) {
                logger.info("Password reset requested for non-existent email: {}", email);
            } else {
                logger.warn("Firebase error during password reset request for email {}: {}", email, e.getMessage());
            }
            // IMPORTANT: Swallow the exception. Do not throw or return an error.
            // The controller should return a generic success response regardless.
        } catch (Exception e) {
            // Catch any other unexpected errors
            logger.error("Unexpected error during password reset request for email {}: {}", email, e.getMessage(), e);
            // Also swallow this exception.
        }
    }
} 