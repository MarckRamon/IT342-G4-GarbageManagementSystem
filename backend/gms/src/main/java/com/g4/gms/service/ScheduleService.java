package com.g4.gms.service;

import com.g4.gms.model.Schedule;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class ScheduleService {

    private static final String COLLECTION_NAME = "schedules";

    @Autowired
    private Firestore firestore;

    @Autowired
    private UserService userService;

    /**
     * Get all schedules
     * @return List of schedules
     */
    public List<Schedule> getAllSchedules() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        List<Schedule> schedules = new ArrayList<>();
        for (DocumentSnapshot document : documents) {
            Schedule schedule = document.toObject(Schedule.class);
            if (schedule != null) {
                schedule.setScheduleId(document.getId());
                schedules.add(schedule);
            }
        }
        
        return schedules;
    }

    /**
     * Get schedules by user ID
     * @param userId The ID of the user
     * @return List of schedules for the user
     */
    public List<Schedule> getSchedulesByUserId(String userId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("userId", userId)
                .get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        List<Schedule> schedules = new ArrayList<>();
        for (DocumentSnapshot document : documents) {
            Schedule schedule = document.toObject(Schedule.class);
            if (schedule != null) {
                schedule.setScheduleId(document.getId());
                schedules.add(schedule);
            }
        }
        
        return schedules;
    }

    /**
     * Get a schedule by ID
     * @param scheduleId The ID of the schedule to retrieve
     * @return The schedule, or null if not found
     */
    public Schedule getScheduleById(String scheduleId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(scheduleId);
        DocumentSnapshot document = docRef.get().get();
        
        if (document.exists()) {
            Schedule schedule = document.toObject(Schedule.class);
            if (schedule != null) {
                schedule.setScheduleId(document.getId());
                return schedule;
            }
        }
        
        return null;
    }

    /**
     * Create a new schedule
     * @param schedule The schedule data to save
     * @return The created schedule with ID
     */
    public Schedule createSchedule(Schedule schedule) throws ExecutionException, InterruptedException {
        // Create a new document with auto-generated ID
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document();
        schedule.setScheduleId(docRef.getId());
        
        // Save the document
        ApiFuture<WriteResult> result = docRef.set(schedule);
        result.get(); // Wait for the write to complete
        
        return schedule;
    }

    /**
     * Update an existing schedule
     * @param scheduleId The ID of the schedule to update
     * @param schedule The updated schedule data
     * @return The updated schedule
     */
    public Schedule updateSchedule(String scheduleId, Schedule schedule) 
            throws ExecutionException, InterruptedException, IllegalArgumentException {
        
        // Check if the schedule exists
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(scheduleId);
        DocumentSnapshot document = docRef.get().get();
        
        if (!document.exists()) {
            throw new IllegalArgumentException("Schedule with ID " + scheduleId + " not found");
        }
        
        // Set the ID
        schedule.setScheduleId(scheduleId);
        
        // Update the document
        ApiFuture<WriteResult> result = docRef.set(schedule);
        result.get(); // Wait for the write to complete
        
        return schedule;
    }

    /**
     * Delete a schedule
     * @param scheduleId The ID of the schedule to delete
     * @return true if deletion was successful
     */
    public boolean deleteSchedule(String scheduleId) 
            throws ExecutionException, InterruptedException, IllegalArgumentException {
        
        // Check if the schedule exists
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(scheduleId);
        DocumentSnapshot document = docRef.get().get();
        
        if (!document.exists()) {
            throw new IllegalArgumentException("Schedule with ID " + scheduleId + " not found");
        }
        
        // Delete the document
        ApiFuture<WriteResult> result = docRef.delete();
        result.get(); // Wait for the delete to complete
        
        return true;
    }

    /**
     * Get user email by user ID
     * @param userId The user ID
     * @return The user's email, or null if not found
     */
    public String getUserEmail(String userId) {
        try {
            return userService.getUserEmail(userId);
        } catch (Exception e) {
            return null;
        }
    }
} 