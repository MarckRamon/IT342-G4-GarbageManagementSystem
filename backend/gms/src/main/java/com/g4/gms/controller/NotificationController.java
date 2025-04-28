package com.g4.gms.controller;

import com.g4.gms.dto.NotificationRequest;
import com.g4.gms.service.FirebaseMessagingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final FirebaseMessagingService firebaseMessagingService;

    @Autowired
    public NotificationController(FirebaseMessagingService firebaseMessagingService) {
        this.firebaseMessagingService = firebaseMessagingService;
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendNotification(@RequestBody NotificationRequest request) {
        String response = firebaseMessagingService.sendNotification(
                request.getToken(),
                request.getTitle(),
                request.getBody()
        );

        if (response != null) {
            Map<String, String> responseMap = new HashMap<>();
            responseMap.put("messageId", response);
            responseMap.put("status", "success");
            return ResponseEntity.ok(responseMap);
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Failed to send notification"
            ));
        }
    }

    @PostMapping("/send-multicast")
    public ResponseEntity<?> sendMulticastNotification(
            @RequestParam String[] tokens,
            @RequestParam String title,
            @RequestParam String body) {
        
        int successCount = firebaseMessagingService.sendMulticastNotification(tokens, title, body);
        
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "successCount", successCount,
                "totalTokens", tokens.length
        ));
    }
} 