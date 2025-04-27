package com.g4.gms.dto;

public class MissedRequest {
    private String title;
    private String description;
    private String reportDateTime;
    private String scheduleId;
    private String userId;

    public MissedRequest() {}

    public MissedRequest(String title, String description, String reportDateTime, String scheduleId, String userId) {
        this.title = title;
        this.description = description;
        this.reportDateTime = reportDateTime;
        this.scheduleId = scheduleId;
        this.userId = userId;
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
} 