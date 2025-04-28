package com.g4.gms.dto;

public class UpdateFcmTokenDto {
    private String fcmToken;

    // Default constructor
    public UpdateFcmTokenDto() {}

    // Constructor with token
    public UpdateFcmTokenDto(String fcmToken) {
        this.fcmToken = fcmToken;
    }

    // Getter
    public String getFcmToken() {
        return fcmToken;
    }

    // Setter
    public void setFcmToken(String fcmToken) {
        this.fcmToken = fcmToken;
    }
} 