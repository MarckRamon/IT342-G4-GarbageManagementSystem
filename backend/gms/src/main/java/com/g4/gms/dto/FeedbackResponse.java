package com.g4.gms.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.google.cloud.Timestamp;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;

public class FeedbackResponse {
    private String feedbackId;
    private String title;
    private String description;
    private String status;
    private String createdAt;
    private String updatedAt;
    private String userId;
    private String userEmail;
    private boolean success;
    private String message;

    // Default constructor
    public FeedbackResponse() {}

    // Constructor with success/message for error responses
    public FeedbackResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    // Full constructor
    public FeedbackResponse(String feedbackId, String title, String description, String status,
                           Timestamp createdAt, Timestamp updatedAt, String userId, String userEmail,
                           boolean success, String message) {
        this.feedbackId = feedbackId;
        this.title = title;
        this.description = description;
        this.status = status;
        this.createdAt = formatTimestamp(createdAt);
        this.updatedAt = formatTimestamp(updatedAt);
        this.userId = userId;
        this.userEmail = userEmail;
        this.success = success;
        this.message = message;
    }
    
    // Helper method to format timestamp
    private String formatTimestamp(Timestamp timestamp) {
        if (timestamp == null) {
            return null;
        }
        
        // Convert to java.util.Date and format
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                .withZone(ZoneId.systemDefault());
        return formatter.format(timestamp.toDate().toInstant());
    }

    public String getFeedbackId() {
        return feedbackId;
    }

    public void setFeedbackId(String feedbackId) {
        this.feedbackId = feedbackId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
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