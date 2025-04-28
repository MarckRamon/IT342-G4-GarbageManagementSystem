package com.g4.gms.dto;

public class HistoryResponse {
    private String historyId;
    private String collectionDate;
    private String notes;
    private String scheduleId;
    private boolean success;
    private String message;

    // Default constructor
    public HistoryResponse() {}

    // Constructor for success/error messages only
    public HistoryResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    // Full constructor
    public HistoryResponse(String historyId, String collectionDate, String notes, String scheduleId, boolean success, String message) {
        this.historyId = historyId;
        this.collectionDate = collectionDate;
        this.notes = notes;
        this.scheduleId = scheduleId;
        this.success = success;
        this.message = message;
    }

    public String getHistoryId() {
        return historyId;
    }

    public void setHistoryId(String historyId) {
        this.historyId = historyId;
    }

    public String getCollectionDate() {
        return collectionDate;
    }

    public void setCollectionDate(String collectionDate) {
        this.collectionDate = collectionDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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