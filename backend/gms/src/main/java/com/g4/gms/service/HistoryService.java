package com.g4.gms.service;

import com.g4.gms.model.History;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class HistoryService {

    private static final String COLLECTION_NAME = "history";

    @Autowired
    private Firestore firestore;

    /**
     * Get all history records
     * @return List of history records
     */
    public List<History> getAllHistory() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        List<History> historyList = new ArrayList<>();
        for (DocumentSnapshot document : documents) {
            History history = document.toObject(History.class);
            if (history != null) {
                history.setHistoryId(document.getId());
                historyList.add(history);
            }
        }
        
        return historyList;
    }

    /**
     * Get history by ID
     * @param historyId The ID of the history record to retrieve
     * @return The history record, or null if not found
     */
    public History getHistoryById(String historyId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(historyId);
        DocumentSnapshot document = docRef.get().get();
        
        if (document.exists()) {
            History history = document.toObject(History.class);
            if (history != null) {
                history.setHistoryId(document.getId());
                return history;
            }
        }
        
        return null;
    }

    /**
     * Create a new history record
     * @param history The history data to save
     * @return The created history record with ID
     */
    public History createHistory(History history) throws ExecutionException, InterruptedException {
        // Create a new document with auto-generated ID
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document();
        history.setHistoryId(docRef.getId());
        
        // Save the document
        ApiFuture<WriteResult> result = docRef.set(history);
        result.get(); // Wait for the write to complete
        
        return history;
    }

    /**
     * Get history records by schedule ID
     * @param scheduleId The ID of the schedule
     * @return List of history records for the schedule
     */
    public List<History> getHistoryByScheduleId(String scheduleId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("scheduleId", scheduleId)
                .get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        List<History> historyList = new ArrayList<>();
        for (DocumentSnapshot document : documents) {
            History history = document.toObject(History.class);
            if (history != null) {
                history.setHistoryId(document.getId());
                historyList.add(history);
            }
        }
        
        return historyList;
    }
} 