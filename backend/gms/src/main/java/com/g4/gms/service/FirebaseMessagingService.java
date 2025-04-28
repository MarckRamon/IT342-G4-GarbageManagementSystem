package com.g4.gms.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class FirebaseMessagingService {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseMessagingService.class);

    private final FirebaseMessaging firebaseMessaging;

    public FirebaseMessagingService(FirebaseMessaging firebaseMessaging) {
        this.firebaseMessaging = firebaseMessaging;
    }

    /**
     * Sends a notification to a specific device using its FCM token
     * @param token The FCM token of the target device
     * @param title The title of the notification
     * @param body The body/content of the notification
     * @return The message ID if successful, null otherwise
     */
    public String sendNotification(String token, String title, String body) {
        try {
            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build();

            Message message = Message.builder()
                    .setToken(token)
                    .setNotification(notification)
                    .build();

            String response = firebaseMessaging.send(message);
            logger.info("Successfully sent notification to token: {}, response: {}", token, response);
            return response;
        } catch (Exception e) {
            logger.error("Failed to send notification to token: {}, error: {}", token, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Sends a notification to multiple devices using their FCM tokens
     * @param tokens List of FCM tokens
     * @param title The title of the notification
     * @param body The body/content of the notification
     * @return The number of successful notifications sent
     */
    public int sendMulticastNotification(String[] tokens, String title, String body) {
        try {
            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build();

            com.google.firebase.messaging.MulticastMessage message = com.google.firebase.messaging.MulticastMessage.builder()
                    .addAllTokens(java.util.Arrays.asList(tokens))
                    .setNotification(notification)
                    .build();

            com.google.firebase.messaging.BatchResponse response = firebaseMessaging.sendMulticast(message);
            logger.info("Successfully sent multicast notification to {} devices, {} successful", 
                    tokens.length, response.getSuccessCount());
            return response.getSuccessCount();
        } catch (Exception e) {
            logger.error("Failed to send multicast notification, error: {}", e.getMessage(), e);
            return 0;
        }
    }
} 