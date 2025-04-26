package com.g4.gms.model;

import com.google.cloud.firestore.annotation.PropertyName;

public class History {
    private String historyId;
    private String collectionDate;
    private String notes;
    private String scheduleId;

    // Default constructor
    public History() {}

    // Constructor with all fields
    public History(String historyId, String collectionDate, String notes, String scheduleId) {
        this.historyId = historyId;
        this.collectionDate = collectionDate;
        this.notes = notes;
        this.scheduleId = scheduleId;
    }

    @PropertyName("historyId")
    public String getHistoryId() {
        return historyId;
    }

    @PropertyName("historyId")
    public void setHistoryId(String historyId) {
        this.historyId = historyId;
    }

    @PropertyName("collectionDate")
    public String getCollectionDate() {
        return collectionDate;
    }

    @PropertyName("collectionDate")
    public void setCollectionDate(String collectionDate) {
        this.collectionDate = collectionDate;
    }

    @PropertyName("notes")
    public String getNotes() {
        return notes;
    }

    @PropertyName("notes")
    public void setNotes(String notes) {
        this.notes = notes;
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