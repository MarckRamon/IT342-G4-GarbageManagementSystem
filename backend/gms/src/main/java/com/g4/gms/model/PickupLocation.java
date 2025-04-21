package com.g4.gms.model;

import com.google.cloud.firestore.annotation.PropertyName;

public class PickupLocation {
    private String locationId;
    private String siteName;
    private String wasteType;
    private String address;
    private Double latitude;
    private Double longitude;

    // Default constructor
    public PickupLocation() {}

    // Constructor with all fields
    public PickupLocation(String locationId, String siteName, String wasteType, String address, Double latitude, Double longitude) {
        this.locationId = locationId;
        this.siteName = siteName;
        this.wasteType = wasteType;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    @PropertyName("locationId")
    public String getLocationId() {
        return locationId;
    }

    @PropertyName("locationId")
    public void setLocationId(String locationId) {
        this.locationId = locationId;
    }

    @PropertyName("siteName")
    public String getSiteName() {
        return siteName;
    }

    @PropertyName("siteName")
    public void setSiteName(String siteName) {
        this.siteName = siteName;
    }

    @PropertyName("wasteType")
    public String getWasteType() {
        return wasteType;
    }

    @PropertyName("wasteType")
    public void setWasteType(String wasteType) {
        this.wasteType = wasteType;
    }

    @PropertyName("address")
    public String getAddress() {
        return address;
    }

    @PropertyName("address")
    public void setAddress(String address) {
        this.address = address;
    }
    
    @PropertyName("latitude")
    public Double getLatitude() {
        return latitude;
    }

    @PropertyName("latitude")
    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }
    
    @PropertyName("longitude")
    public Double getLongitude() {
        return longitude;
    }

    @PropertyName("longitude")
    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
} 