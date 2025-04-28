package com.g4.gms.service;

import com.g4.gms.model.Reminder;
import com.g4.gms.model.User;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
public class NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    private static final String FCM_API_URL = "https://fcm.googleapis.com/v1/projects/%s/messages:send";
    private static final String FIREBASE_CONFIG_PATH = "serviceAccountKey.json";
    
    @Autowired
    private FirebaseApp firebaseApp;
    
    @Autowired
    private UserService userService;
    
    private final RestTemplate restTemplate;
    
    public NotificationService() {
        this.restTemplate = new RestTemplate();
    }
    
    /**
     * Send a notification to a user
     * @param userId User ID to send the notification to
     * @param title Notification title
     * @param body Notification body message
     * @return true if notification was sent successfully, false otherwise
     */
    public boolean sendNotification(String userId, String title, String body) {
        try {
            // Get the user to check if notifications are enabled and retrieve FCM token
            User user = userService.getUserById(userId);
            if (user == null) {
                logger.warn("Notification not sent: User not found with ID: {}", userId);
                return false;
            }
            
            // Check if user has notifications enabled
            if (!user.isNotificationsEnabled()) {
                logger.info("Notification not sent: User {} has notifications disabled", userId);
                return false;
            }
            
            // Check if user has a FCM token
            String fcmToken = user.getFcmToken();
            if (fcmToken == null || fcmToken.isEmpty()) {
                logger.warn("Notification not sent: User {} has no FCM token", userId);
                return false;
            }
            
            // Prepare the notification payload
            Map<String, Object> notification = new HashMap<>();
            notification.put("title", title);
            notification.put("body", body);
            
            Map<String, Object> message = new HashMap<>();
            message.put("token", fcmToken);
            message.put("notification", notification);
            
            // Add data payload if needed
            Map<String, String> data = new HashMap<>();
            data.put("userId", userId);
            message.put("data", data);
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("message", message);
            
            // Set up headers with access token
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + getAccessToken());
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            
            // Send the request to FCM
            String projectId = firebaseApp.getOptions().getProjectId();
            String url = String.format(FCM_API_URL, projectId);
            
            restTemplate.postForObject(url, request, String.class);
            logger.info("Successfully sent notification to user: {}", userId);
            return true;
        } catch (Exception e) {
            logger.error("Error sending notification to user {}: {}", userId, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Send a reminder notification
     * @param reminder The reminder to send a notification for
     * @return true if notification was sent successfully, false otherwise
     */
    public boolean sendReminderNotification(Reminder reminder) {
        String title = reminder.getTitle();
        String body = reminder.getReminderMessage();
        String userId = reminder.getUserId();
        
        logger.info("Sending reminder notification for reminder ID: {} to user: {}", 
                reminder.getReminderId(), userId);
        
        return sendNotification(userId, title, body);
    }
    
    /**
     * Get access token for FCM API
     * @return The access token
     * @throws IOException If unable to get access token
     */
    private String getAccessToken() throws IOException {
        // Load Firebase service account credentials from the resource file
        InputStream serviceAccount = new ClassPathResource(FIREBASE_CONFIG_PATH).getInputStream();
        
        // Create GoogleCredentials with the FCM scope
        GoogleCredentials googleCredentials = GoogleCredentials
                .fromStream(serviceAccount)
                .createScoped(Arrays.asList("https://www.googleapis.com/auth/firebase.messaging"));
        
        // Refresh the token if needed
        googleCredentials.refreshIfExpired();
        return googleCredentials.getAccessToken().getTokenValue();
    }
} 