package com.g4.gms.model;

import com.google.cloud.firestore.annotation.PropertyName;

public class Schedule {
    private String scheduleId;
    private String title;
    private String pickupDate;
    private String pickupTime;
    private String locationId;
    private String status;
    private String userId;

    // Default constructor
    public Schedule() {}

    // Constructor with all fields
    public Schedule(String scheduleId, String title, String pickupDate, String pickupTime, String locationId, String status, String userId) {
        this.scheduleId = scheduleId;
        this.title = title;
        this.pickupDate = pickupDate;
        this.pickupTime = pickupTime;
        this.locationId = locationId;
        this.status = status;
        this.userId = userId;
    }

    @PropertyName("scheduleId")
    public String getScheduleId() {
        return scheduleId;
    }

    @PropertyName("scheduleId")
    public void setScheduleId(String scheduleId) {
        this.scheduleId = scheduleId;
    }

    @PropertyName("title")
    public String getTitle() {
        return title;
    }

    @PropertyName("title")
    public void setTitle(String title) {
        this.title = title;
    }

    @PropertyName("pickupDate")
    public String getPickupDate() {
        return pickupDate;
    }

    @PropertyName("pickupDate")
    public void setPickupDate(String pickupDate) {
        this.pickupDate = pickupDate;
    }

    @PropertyName("pickupTime")
    public String getPickupTime() {
        return pickupTime;
    }

    @PropertyName("pickupTime")
    public void setPickupTime(String pickupTime) {
        this.pickupTime = pickupTime;
    }

    @PropertyName("locationId")
    public String getLocationId() {
        return locationId;
    }

    @PropertyName("locationId")
    public void setLocationId(String locationId) {
        this.locationId = locationId;
    }

    @PropertyName("status")
    public String getStatus() {
        return status;
    }

    @PropertyName("status")
    public void setStatus(String status) {
        this.status = status;
    }

    @PropertyName("userId")
    public String getUserId() {
        return userId;
    }

    @PropertyName("userId")
    public void setUserId(String userId) {
        this.userId = userId;
    }
} 