package com.g4.gms.service;

import com.g4.gms.model.Tip;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class TipService {

    private static final String COLLECTION_NAME = "tips";

    @Autowired
    private Firestore firestore;
    
    @Autowired
    private UserService userService;

    /**
     * Get all tips
     * @return List of tips
     */
    public List<Tip> getAllTips() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        List<Tip> tipList = new ArrayList<>();
        for (DocumentSnapshot document : documents) {
            Tip tip = document.toObject(Tip.class);
            if (tip != null) {
                tip.setTipId(document.getId());
                tipList.add(tip);
            }
        }
        
        return tipList;
    }

    /**
     * Get a tip by ID
     * @param tipId The ID of the tip to retrieve
     * @return The tip, or null if not found
     */
    public Tip getTipById(String tipId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(tipId);
        DocumentSnapshot document = docRef.get().get();
        
        if (document.exists()) {
            Tip tip = document.toObject(Tip.class);
            if (tip != null) {
                tip.setTipId(document.getId());
                return tip;
            }
        }
        
        return null;
    }

    /**
     * Create a new tip
     * @param tip The tip data to save
     * @return The created tip with ID
     */
    public Tip createTip(Tip tip) throws ExecutionException, InterruptedException {
        // Create a new document with auto-generated ID
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document();
        tip.setTipId(docRef.getId());
        
        // Set timestamps
        Timestamp now = Timestamp.now();
        tip.setCreatedAt(now);
        tip.setUpdatedAt(now);
        
        // Save the document
        ApiFuture<WriteResult> result = docRef.set(tip);
        result.get(); // Wait for the write to complete
        
        return tip;
    }

    /**
     * Update an existing tip
     * @param tipId The ID of the tip to update
     * @param tip The updated tip data
     * @return The updated tip
     */
    public Tip updateTip(String tipId, Tip tip) 
            throws ExecutionException, InterruptedException, IllegalArgumentException {
        
        // Check if the tip exists
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(tipId);
        DocumentSnapshot document = docRef.get().get();
        
        if (!document.exists()) {
            throw new IllegalArgumentException("Tip with ID " + tipId + " not found");
        }
        
        // Preserve created timestamp
        Tip existingTip = document.toObject(Tip.class);
        if (existingTip != null) {
            tip.setCreatedAt(existingTip.getCreatedAt());
        }
        
        // Set ID and update timestamp
        tip.setTipId(tipId);
        tip.setUpdatedAt(Timestamp.now());
        
        // Update the document
        ApiFuture<WriteResult> result = docRef.set(tip);
        result.get(); // Wait for the write to complete
        
        return tip;
    }

    /**
     * Delete a tip
     * @param tipId The ID of the tip to delete
     * @return true if deletion was successful
     */
    public boolean deleteTip(String tipId) 
            throws ExecutionException, InterruptedException, IllegalArgumentException {
        
        // Check if the tip exists
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(tipId);
        DocumentSnapshot document = docRef.get().get();
        
        if (!document.exists()) {
            throw new IllegalArgumentException("Tip with ID " + tipId + " not found");
        }
        
        // Delete the document
        ApiFuture<WriteResult> result = docRef.delete();
        result.get(); // Wait for the delete to complete
        
        return true;
    }
    
    /**
     * Get user email by user ID 
     * @param userId The user ID
     * @return The user's email or null if not found
     */
    public String getUserEmailById(String userId) {
        try {
            return userService.getUserEmail(userId);
        } catch (Exception e) {
            return null;
        }
    }
} 