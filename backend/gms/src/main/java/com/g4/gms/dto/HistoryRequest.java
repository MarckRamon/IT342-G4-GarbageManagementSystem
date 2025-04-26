package com.g4.gms.dto;

public class HistoryRequest {
    private String collectionDate;
    private String notes;
    private String scheduleId;

    public HistoryRequest() {}

    public HistoryRequest(String collectionDate, String notes, String scheduleId) {
        this.collectionDate = collectionDate;
        this.notes = notes;
        this.scheduleId = scheduleId;
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
} 