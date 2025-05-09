package com.g4.gms.dto;

public class ScheduleRequest {
    private String title;
    private String pickupDate;
    private String pickupTime;
    private String locationId;
    private String status;

    // Default constructor
    public ScheduleRequest() {}

    // Constructor with all fields
    public ScheduleRequest(String title, String pickupDate, String pickupTime, String locationId, String status) {
        this.title = title;
        this.pickupDate = pickupDate;
        this.pickupTime = pickupTime;
        this.locationId = locationId;
        this.status = status;
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
} 