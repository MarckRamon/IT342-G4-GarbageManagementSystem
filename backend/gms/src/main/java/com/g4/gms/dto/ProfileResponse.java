package com.g4.gms.dto;

public class ProfileResponse {
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private boolean success;
    private String message;

    // Default constructor
    public ProfileResponse() {}

    // Constructor with success and message
    public ProfileResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    // Constructor with all fields
    public ProfileResponse(String firstName, String lastName, String phoneNumber, boolean success, String message) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.success = success;
        this.message = message;
    }

    // Getters and setters
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

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
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