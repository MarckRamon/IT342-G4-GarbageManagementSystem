package com.g4.gms.service;

import com.g4.gms.model.Feedback;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class FeedbackService {

    private static final String COLLECTION_NAME = "feedback";

    @Autowired
    private Firestore firestore;
    
    @Autowired
    private UserService userService;

    /**
     * Get all feedback entries
     * @return List of feedback entries
     */
    public List<Feedback> getAllFeedback() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        List<Feedback> feedbackList = new ArrayList<>();
        for (DocumentSnapshot document : documents) {
            Feedback feedback = document.toObject(Feedback.class);
            if (feedback != null) {
                feedback.setFeedbackId(document.getId());
                feedbackList.add(feedback);
            }
        }
        
        return feedbackList;
    }

    /**
     * Get a feedback entry by ID
     * @param feedbackId The ID of the feedback to retrieve
     * @return The feedback entry, or null if not found
     */
    public Feedback getFeedbackById(String feedbackId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(feedbackId);
        DocumentSnapshot document = docRef.get().get();
        
        if (document.exists()) {
            Feedback feedback = document.toObject(Feedback.class);
            if (feedback != null) {
                feedback.setFeedbackId(document.getId());
                return feedback;
            }
        }
        
        return null;
    }

    /**
     * Create a new feedback entry
     * @param feedback The feedback data to save
     * @return The created feedback with ID
     */
    public Feedback createFeedback(Feedback feedback) throws ExecutionException, InterruptedException {
        // Create a new document with auto-generated ID
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document();
        feedback.setFeedbackId(docRef.getId());
        
        // Set timestamps
        Timestamp now = Timestamp.now();
        feedback.setCreatedAt(now);
        feedback.setUpdatedAt(now);
        
        // Save the document
        ApiFuture<WriteResult> result = docRef.set(feedback);
        result.get(); // Wait for the write to complete
        
        return feedback;
    }

    /**
     * Update an existing feedback entry
     * @param feedbackId The ID of the feedback to update
     * @param feedback The updated feedback data
     * @return The updated feedback
     */
    public Feedback updateFeedback(String feedbackId, Feedback feedback) 
            throws ExecutionException, InterruptedException, IllegalArgumentException {
        
        // Check if the feedback exists
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(feedbackId);
        DocumentSnapshot document = docRef.get().get();
        
        if (!document.exists()) {
            throw new IllegalArgumentException("Feedback with ID " + feedbackId + " not found");
        }
        
        // Preserve created timestamp
        Feedback existingFeedback = document.toObject(Feedback.class);
        if (existingFeedback != null) {
            feedback.setCreatedAt(existingFeedback.getCreatedAt());
        }
        
        // Set ID and update timestamp
        feedback.setFeedbackId(feedbackId);
        feedback.setUpdatedAt(Timestamp.now());
        
        // Update the document
        ApiFuture<WriteResult> result = docRef.set(feedback);
        result.get(); // Wait for the write to complete
        
        return feedback;
    }

    /**
     * Delete a feedback entry
     * @param feedbackId The ID of the feedback to delete
     * @return true if deletion was successful
     */
    public boolean deleteFeedback(String feedbackId) 
            throws ExecutionException, InterruptedException, IllegalArgumentException {
        
        // Check if the feedback exists
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(feedbackId);
        DocumentSnapshot document = docRef.get().get();
        
        if (!document.exists()) {
            throw new IllegalArgumentException("Feedback with ID " + feedbackId + " not found");
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