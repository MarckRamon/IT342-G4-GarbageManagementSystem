package com.g4.gms.service;

import com.g4.gms.model.Missed;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class MissedService {

    private static final String COLLECTION_NAME = "missed";

    @Autowired
    private Firestore firestore;

    /**
     * Get all missed records
     * @return List of missed records
     */
    public List<Missed> getAllMissed() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        List<Missed> missedList = new ArrayList<>();
        for (DocumentSnapshot document : documents) {
            Missed missed = document.toObject(Missed.class);
            if (missed != null) {
                missed.setMissedId(document.getId());
                missedList.add(missed);
            }
        }
        
        return missedList;
    }

    /**
     * Get missed by ID
     * @param missedId The ID of the missed record to retrieve
     * @return The missed record, or null if not found
     */
    public Missed getMissedById(String missedId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(missedId);
        DocumentSnapshot document = docRef.get().get();
        
        if (document.exists()) {
            Missed missed = document.toObject(Missed.class);
            if (missed != null) {
                missed.setMissedId(document.getId());
                return missed;
            }
        }
        
        return null;
    }

    /**
     * Create a new missed record
     * @param missed The missed data to save
     * @return The created missed record with ID
     */
    public Missed createMissed(Missed missed) throws ExecutionException, InterruptedException {
        // Create a new document with auto-generated ID
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document();
        missed.setMissedId(docRef.getId());
        
        // Save the document
        ApiFuture<WriteResult> result = docRef.set(missed);
        result.get(); // Wait for the write to complete
        
        return missed;
    }

    /**
     * Update an existing missed record
     * @param missedId The ID of the missed record to update
     * @param missed The updated missed data
     * @return The updated missed record, or null if not found
     */
    public Missed updateMissed(String missedId, Missed missed) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(missedId);
        DocumentSnapshot document = docRef.get().get();
        
        if (document.exists()) {
            missed.setMissedId(missedId);
            ApiFuture<WriteResult> result = docRef.set(missed);
            result.get(); // Wait for the write to complete
            return missed;
        }
        
        return null;
    }

    /**
     * Delete a missed record
     * @param missedId The ID of the missed record to delete
     * @return true if deleted, false if not found
     */
    public boolean deleteMissed(String missedId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(missedId);
        DocumentSnapshot document = docRef.get().get();
        
        if (document.exists()) {
            ApiFuture<WriteResult> result = docRef.delete();
            result.get(); // Wait for the delete to complete
            return true;
        }
        
        return false;
    }

    /**
     * Get missed records by schedule ID
     * @param scheduleId The ID of the schedule
     * @return List of missed records for the schedule
     */
    public List<Missed> getMissedByScheduleId(String scheduleId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("scheduleId", scheduleId)
                .get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        List<Missed> missedList = new ArrayList<>();
        for (DocumentSnapshot document : documents) {
            Missed missed = document.toObject(Missed.class);
            if (missed != null) {
                missed.setMissedId(document.getId());
                missedList.add(missed);
            }
        }
        
        return missedList;
    }

    /**
     * Get missed records by user ID
     * @param userId The ID of the user
     * @return List of missed records for the user
     */
    public List<Missed> getMissedByUserId(String userId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("userId", userId)
                .get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        List<Missed> missedList = new ArrayList<>();
        for (DocumentSnapshot document : documents) {
            Missed missed = document.toObject(Missed.class);
            if (missed != null) {
                missed.setMissedId(document.getId());
                missedList.add(missed);
            }
        }
        
        return missedList;
    }
} 