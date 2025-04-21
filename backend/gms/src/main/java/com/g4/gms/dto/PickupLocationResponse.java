package com.g4.gms.dto;

import com.g4.gms.model.PickupLocation;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class PickupLocationResponse {
    private String locationId;
    private String siteName;
    private String wasteType;
    private String address;
    private Double latitude;
    private Double longitude;
    private boolean success;
    private String message;
    private List<PickupLocation> locations;

    // Default constructor
    public PickupLocationResponse() {}

    // Success response for a single location
    public PickupLocationResponse(String locationId, String siteName, String wasteType, String address, Double latitude, Double longitude, boolean success, String message) {
        this.locationId = locationId;
        this.siteName = siteName;
        this.wasteType = wasteType;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.success = success;
        this.message = message;
    }

    // Constructor from PickupLocation model
    public PickupLocationResponse(PickupLocation location, boolean success, String message) {
        this.locationId = location.getLocationId();
        this.siteName = location.getSiteName();
        this.wasteType = location.getWasteType();
        this.address = location.getAddress();
        this.latitude = location.getLatitude();
        this.longitude = location.getLongitude();
        this.success = success;
        this.message = message;
    }

    // Success response for multiple locations
    public PickupLocationResponse(List<PickupLocation> locations, boolean success, String message) {
        // Explicitly set single location fields to null
        this.locationId = null;
        this.siteName = null;
        this.wasteType = null;
        this.address = null;
        this.latitude = null;
        this.longitude = null;
        
        // Set list fields
        this.locations = locations;
        this.success = success;
        this.message = message;
    }

    // Error response
    public PickupLocationResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public String getLocationId() {
        return locationId;
    }

    public void setLocationId(String locationId) {
        this.locationId = locationId;
    }

    public String getSiteName() {
        return siteName;
    }

    public void setSiteName(String siteName) {
        this.siteName = siteName;
    }

    public String getWasteType() {
        return wasteType;
    }

    public void setWasteType(String wasteType) {
        this.wasteType = wasteType;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
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

    public List<PickupLocation> getLocations() {
        return locations;
    }

    public void setLocations(List<PickupLocation> locations) {
        this.locations = locations;
    }
} 