package com.g4.gms.controller;

import com.g4.gms.dto.HistoryRequest;
import com.g4.gms.dto.HistoryResponse;
import com.g4.gms.model.History;
import com.g4.gms.service.HistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/history")
public class HistoryController {

    @Autowired
    private HistoryService historyService;

    /**
     * Get all history records
     * This endpoint is public (no JWT required)
     * @return List of all history records
     */
    @GetMapping
    public ResponseEntity<List<HistoryResponse>> getAllHistory() {
        try {
            List<History> historyList = historyService.getAllHistory();
            List<HistoryResponse> responseList = new ArrayList<>();
            
            for (History history : historyList) {
                HistoryResponse response = new HistoryResponse(
                    history.getHistoryId(),
                    history.getCollectionDate(),
                    history.getNotes(),
                    history.getScheduleId(),
                    true,
                    null
                );
                
                responseList.add(response);
            }
            
            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Create a new history record
     * Requires JWT authentication
     * @param request The history data to create
     * @return The created history record
     */
    @PostMapping
    public ResponseEntity<HistoryResponse> createHistory(@RequestBody HistoryRequest request) {
        try {
            // Create a new History object from the request
            History history = new History();
            history.setCollectionDate(request.getCollectionDate());
            history.setNotes(request.getNotes());
            history.setScheduleId(request.getScheduleId());
            
            // Save the history record
            History createdHistory = historyService.createHistory(history);
            
            HistoryResponse response = new HistoryResponse(
                createdHistory.getHistoryId(),
                createdHistory.getCollectionDate(),
                createdHistory.getNotes(),
                createdHistory.getScheduleId(),
                true,
                "History record created successfully"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            HistoryResponse response = new HistoryResponse(false, "Error creating history record: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
} 