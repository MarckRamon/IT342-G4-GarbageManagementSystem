package com.g4.gms.dto;

public class EmailResponse {
    private String email;
    private boolean success;
    private String message;

    // Default constructor
    public EmailResponse() {}

    // Constructor with success and message
    public EmailResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    // Constructor with all fields
    public EmailResponse(String email, boolean success, String message) {
        this.email = email;
        this.success = success;
        this.message = message;
    }

    // Getters and setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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