package com.g4.gms.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReminderResponse {
    private String reminderId;
    private String title;
    private String reminderMessage;
    private String reminderDate;
    private String userId;
    private String scheduleId;
    private boolean success;
    private String message;

    // Default constructor
    public ReminderResponse() {}

    // Constructor for success responses with data
    public ReminderResponse(String reminderId, String title, String reminderMessage, 
                           String reminderDate, String userId, String scheduleId,
                           boolean success, String message) {
        this.reminderId = reminderId;
        this.title = title;
        this.reminderMessage = reminderMessage;
        this.reminderDate = reminderDate;
        this.userId = userId;
        this.scheduleId = scheduleId;
        this.success = success;
        this.message = message;
    }

    // Constructor for error responses
    public ReminderResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public String getReminderId() {
        return reminderId;
    }

    public void setReminderId(String reminderId) {
        this.reminderId = reminderId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getReminderMessage() {
        return reminderMessage;
    }

    public void setReminderMessage(String reminderMessage) {
        this.reminderMessage = reminderMessage;
    }

    public String getReminderDate() {
        return reminderDate;
    }

    public void setReminderDate(String reminderDate) {
        this.reminderDate = reminderDate;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(String scheduleId) {
        this.scheduleId = scheduleId;
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