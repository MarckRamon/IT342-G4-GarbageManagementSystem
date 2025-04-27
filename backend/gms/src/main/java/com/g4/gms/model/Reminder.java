package com.g4.gms.model;

import com.google.cloud.firestore.annotation.PropertyName;

public class Reminder {
    private String reminderId;
    private String title;
    private String reminderMessage;
    private String reminderDate;
    private String userId;
    private String scheduleId;

    // Default constructor
    public Reminder() {}

    // Constructor with all fields
    public Reminder(String reminderId, String title, String reminderMessage, String reminderDate, 
                   String userId, String scheduleId) {
        this.reminderId = reminderId;
        this.title = title;
        this.reminderMessage = reminderMessage;
        this.reminderDate = reminderDate;
        this.userId = userId;
        this.scheduleId = scheduleId;
    }

    @PropertyName("reminderId")
    public String getReminderId() {
        return reminderId;
    }

    @PropertyName("reminderId")
    public void setReminderId(String reminderId) {
        this.reminderId = reminderId;
    }

    @PropertyName("title")
    public String getTitle() {
        return title;
    }

    @PropertyName("title")
    public void setTitle(String title) {
        this.title = title;
    }

    @PropertyName("reminderMessage")
    public String getReminderMessage() {
        return reminderMessage;
    }

    @PropertyName("reminderMessage")
    public void setReminderMessage(String reminderMessage) {
        this.reminderMessage = reminderMessage;
    }

    @PropertyName("reminderDate")
    public String getReminderDate() {
        return reminderDate;
    }

    @PropertyName("reminderDate")
    public void setReminderDate(String reminderDate) {
        this.reminderDate = reminderDate;
    }

    @PropertyName("userId")
    public String getUserId() {
        return userId;
    }

    @PropertyName("userId")
    public void setUserId(String userId) {
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
} 