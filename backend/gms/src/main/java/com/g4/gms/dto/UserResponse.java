package com.g4.gms.dto;

import com.google.cloud.Timestamp;

public class UserResponse {
    private String userId;
    private String username;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private String location;
    private String phoneNumber;
    private boolean notificationsEnabled;
    private Timestamp createdAt;
    private boolean success;
    private String message;

    // Default constructor
    public UserResponse() {
    }

    // Constructor for success responses with user data
    public UserResponse(String userId, String username, String firstName, String lastName, 
                       String email, String role, String location, String phoneNumber, 
                       boolean notificationsEnabled, Timestamp createdAt, 
                       boolean success, String message) {
        this.userId = userId;
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.role = role;
        this.location = location;
        this.phoneNumber = phoneNumber;
        this.notificationsEnabled = notificationsEnabled;
        this.createdAt = createdAt;
        this.success = success;
        this.message = message;
    }

    // Constructor for error responses
    public UserResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    // Getters and setters
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public boolean isNotificationsEnabled() {
        return notificationsEnabled;
    }

    public void setNotificationsEnabled(boolean notificationsEnabled) {
        this.notificationsEnabled = notificationsEnabled;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
} 