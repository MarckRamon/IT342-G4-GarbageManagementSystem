package com.g4.gms.dto;

public class UpdateTimezoneDto {
    private String timezone;

    // Default constructor
    public UpdateTimezoneDto() {}

    // Constructor with timezone
    public UpdateTimezoneDto(String timezone) {
        this.timezone = timezone;
    }

    // Getter
    public String getTimezone() {
        return timezone;
    }

    // Setter
    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }
} 