package com.g4.gms.dto;

public class TipRequest {
    private String title;
    private String description;
    private String status;

    // Default constructor
    public TipRequest() {}

    // Constructor with fields
    public TipRequest(String title, String description, String status) {
        this.title = title;
        this.description = description;
        this.status = status;
    }

    // Getters and setters
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
} 