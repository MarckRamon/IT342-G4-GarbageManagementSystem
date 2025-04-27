package com.g4.gms.model;

import com.google.cloud.firestore.annotation.PropertyName;

public class Missed {
    private String missedId;
    private String title;
    private String description;
    private String reportDateTime;
    private String scheduleId;
    private String userId;

    // Default constructor
    public Missed() {}

    // Constructor with all fields
    public Missed(String missedId, String title, String description, String reportDateTime, String scheduleId, String userId) {
        this.missedId = missedId;
        this.title = title;
        this.description = description;
        this.reportDateTime = reportDateTime;
        this.scheduleId = scheduleId;
        this.userId = userId;
    }

    @PropertyName("missedId")
    public String getMissedId() {
        return missedId;
    }

    @PropertyName("missedId")
    public void setMissedId(String missedId) {
        this.missedId = missedId;
    }

    @PropertyName("title")
    public String getTitle() {
        return title;
    }

    @PropertyName("title")
    public void setTitle(String title) {
        this.title = title;
    }

    @PropertyName("description")
    public String getDescription() {
        return description;
    }

    @PropertyName("description")
    public void setDescription(String description) {
        this.description = description;
    }

    @PropertyName("reportDateTime")
    public String getReportDateTime() {
        return reportDateTime;
    }

    @PropertyName("reportDateTime")
    public void setReportDateTime(String reportDateTime) {
        this.reportDateTime = reportDateTime;
    }

    @PropertyName("scheduleId")
    public String getScheduleId() {
        return scheduleId;
    }

    @PropertyName("scheduleId")
    public void setScheduleId(String scheduleId) {
        this.scheduleId = scheduleId;
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