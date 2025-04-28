package com.g4.gms.dto;

public class ScheduleResponse {
    private String scheduleId;
    private String title;
    private String pickupDate;
    private String pickupTime;
    private String locationId;
    private String status;
    private String userId;
    private String userEmail;
    private boolean success;
    private String message;

    // Default constructor
    public ScheduleResponse() {}

    // Constructor for success responses with data
    public ScheduleResponse(String scheduleId, String title, String pickupDate, String pickupTime, 
                          String locationId, String status, String userId, String userEmail,
                          boolean success, String message) {
        this.scheduleId = scheduleId;
        this.title = title;
        this.pickupDate = pickupDate;
        this.pickupTime = pickupTime;
        this.locationId = locationId;
        this.status = status;
        this.userId = userId;
        this.userEmail = userEmail;
        this.success = success;
        this.message = message;
    }

    // Constructor for error responses
    public ScheduleResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public String getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(String scheduleId) {
        this.scheduleId = scheduleId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getPickupDate() {
        return pickupDate;
    }

    public void setPickupDate(String pickupDate) {
        this.pickupDate = pickupDate;
    }

    public String getPickupTime() {
        return pickupTime;
    }

    public void setPickupTime(String pickupTime) {
        this.pickupTime = pickupTime;
    }

    public String getLocationId() {
        return locationId;
    }

    public void setLocationId(String locationId) {
        this.locationId = locationId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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