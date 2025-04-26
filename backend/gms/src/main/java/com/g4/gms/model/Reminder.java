package com.g4.gms.model;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reminder {
    private String reminderId;
    
    @NotEmpty(message = "Title cannot be empty")
    private String title;
    
    @NotEmpty(message = "Message cannot be empty")
    private String reminderMessage;
    
    @NotEmpty(message = "Reminder date cannot be empty")
    private String reminderDate;
    
    private String userId;
    
    private String scheduleId;
} 