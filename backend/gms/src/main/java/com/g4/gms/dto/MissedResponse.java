package com.g4.gms.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class MissedResponse {
    private String missedId;
    private String title;
    private String description;
    private String reportDateTime;
    private String scheduleId;
    private String userId;
    private boolean success;
    private String message;

    // Default constructor
    public MissedResponse() {}

    // Constructor for success response with all details
    public MissedResponse(String missedId, String title, String description, String reportDateTime, 
                          String scheduleId, String userId, boolean success, String message) {
        this.missedId = missedId;
        this.title = title;
        this.description = description;
        this.reportDateTime = reportDateTime;
        this.scheduleId = scheduleId;
        this.userId = userId;
        this.success = success;
        this.message = message;
    }

    // Constructor for detailed response
    public MissedResponse(String missedId, String title, String description, String reportDateTime, 
                          String scheduleId, String userId) {
        this.missedId = missedId;
        this.title = title;
        this.description = description;
        this.reportDateTime = reportDateTime;
        this.scheduleId = scheduleId;
        this.userId = userId;
        this.success = true;
        this.message = null;
    }

    // Constructor for status-only response
    public MissedResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public String getMissedId() {
        return missedId;
    }

    public void setMissedId(String missedId) {
        this.missedId = missedId;
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

    public String getReportDateTime() {
        return reportDateTime;
    }

    public void setReportDateTime(String reportDateTime) {
        this.reportDateTime = reportDateTime;
    }

    public String getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(String scheduleId) {
        this.scheduleId = scheduleId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
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