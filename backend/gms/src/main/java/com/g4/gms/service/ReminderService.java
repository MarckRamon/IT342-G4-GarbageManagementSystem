package com.g4.gms.service;

import com.g4.gms.model.Reminder;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class ReminderService {
    
    private final Firestore firestore;
    private final String COLLECTION_NAME = "reminders";
    
    public ReminderService(Firestore firestore) {
        this.firestore = firestore;
    }
    
    public List<Reminder> getAllReminders() throws ExecutionException, InterruptedException {
        List<Reminder> reminderList = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        for (QueryDocumentSnapshot document : documents) {
            Reminder reminder = document.toObject(Reminder.class);
            reminder.setReminderId(document.getId());
            reminderList.add(reminder);
        }
        
        return reminderList;
    }
    
    public Reminder getReminderById(String reminderId) throws ExecutionException, InterruptedException {
        DocumentReference documentReference = firestore.collection(COLLECTION_NAME).document(reminderId);
        ApiFuture<DocumentSnapshot> future = documentReference.get();
        DocumentSnapshot document = future.get();
        
        if (document.exists()) {
            Reminder reminder = document.toObject(Reminder.class);
            reminder.setReminderId(document.getId());
            return reminder;
        } else {
            return null;
        }
    }
    
    public Reminder createReminder(Reminder reminder) throws ExecutionException, InterruptedException {
        // Validate reminder date
        if (reminder.getReminderDate() == null || reminder.getReminderDate().isEmpty()) {
            throw new IllegalArgumentException("Reminder date cannot be empty");
        }
        
        // Let Firestore auto-generate the document ID
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document();
        String reminderId = docRef.getId();
        reminder.setReminderId(reminderId);
        
        ApiFuture<WriteResult> writeResult = docRef.set(reminder);
        writeResult.get();
        
        return reminder;
    }
    
    public Reminder updateReminder(String reminderId, Reminder reminder) throws ExecutionException, InterruptedException {
        // Validate reminder date
        if (reminder.getReminderDate() == null || reminder.getReminderDate().isEmpty()) {
            throw new IllegalArgumentException("Reminder date cannot be empty");
        }
        
        DocumentReference documentReference = firestore.collection(COLLECTION_NAME).document(reminderId);
        ApiFuture<DocumentSnapshot> future = documentReference.get();
        DocumentSnapshot document = future.get();
        
        if (document.exists()) {
            reminder.setReminderId(reminderId);
            ApiFuture<WriteResult> writeResult = documentReference.set(reminder);
            writeResult.get();
            return reminder;
        } else {
            return null;
        }
    }
    
    public boolean deleteReminder(String reminderId) throws ExecutionException, InterruptedException {
        DocumentReference documentReference = firestore.collection(COLLECTION_NAME).document(reminderId);
        ApiFuture<DocumentSnapshot> future = documentReference.get();
        DocumentSnapshot document = future.get();
        
        if (document.exists()) {
            ApiFuture<WriteResult> writeResult = documentReference.delete();
            writeResult.get();
            return true;
        } else {
            return false;
        }
    }
} 