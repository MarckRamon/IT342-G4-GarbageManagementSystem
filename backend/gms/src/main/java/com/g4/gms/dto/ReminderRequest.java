package com.g4.gms.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReminderRequest {
    @NotEmpty(message = "Title cannot be empty")
    private String title;
    
    @NotEmpty(message = "Message cannot be empty")
    private String reminderMessage;
    
    @NotEmpty(message = "Reminder date cannot be empty")
    private String reminderDate;
    
    private String scheduleId;
} 