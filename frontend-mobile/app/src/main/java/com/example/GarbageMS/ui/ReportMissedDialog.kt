package com.example.GarbageMS.ui

import android.app.Dialog
import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.Window
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import com.example.GarbageMS.R
import com.example.GarbageMS.models.Missed
import com.example.GarbageMS.models.Schedule
import com.example.GarbageMS.services.MissedService
import com.example.GarbageMS.utils.DateConverter
import com.example.GarbageMS.utils.SessionManager
import com.google.android.material.textfield.TextInputEditText
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Dialog for reporting missed pickups
 */
class ReportMissedDialog(
    context: Context,
    private val schedule: Schedule,
    private val onReportSubmitted: () -> Unit
) : Dialog(context) {

    private lateinit var titleInput: TextInputEditText
    private lateinit var descriptionInput: TextInputEditText
    private lateinit var scheduleInfoText: TextView
    private lateinit var cancelButton: Button
    private lateinit var submitButton: Button
    
    private val missedService = MissedService.getInstance()
    private val sessionManager = SessionManager.getInstance(context)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestWindowFeature(Window.FEATURE_NO_TITLE)
        setContentView(
            LayoutInflater.from(context).inflate(R.layout.dialog_report_missed, null)
        )
        
        // Initialize views
        titleInput = findViewById(R.id.titleInput)
        descriptionInput = findViewById(R.id.descriptionInput)
        scheduleInfoText = findViewById(R.id.scheduleInfoText)
        cancelButton = findViewById(R.id.cancelButton)
        submitButton = findViewById(R.id.submitButton)
        
        // Set default title
        titleInput.setText("Missed Pickup ${schedule.scheduleId}")
        
        // Display schedule info
        val dateStr = schedule.pickupDate ?: "Unknown date"
        val timeStr = schedule.pickupTime ?: "Unknown time"
        scheduleInfoText.text = "Schedule: $dateStr at $timeStr"
        
        // Set up listeners
        cancelButton.setOnClickListener {
            dismiss()
        }
        
        submitButton.setOnClickListener {
            submitReport()
        }
    }
    
    private fun submitReport() {
        val title = titleInput.text.toString().trim()
        val description = descriptionInput.text.toString().trim()
        
        // Validate inputs
        if (title.isEmpty()) {
            Toast.makeText(context, "Please enter a title", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (description.isEmpty()) {
            Toast.makeText(context, "Please enter a description", Toast.LENGTH_SHORT).show()
            return
        }
        
        // Get current date time in ISO format
        val currentDateTime = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).format(Date())
        
        // Get user ID from session
        val userId = sessionManager.getUserId() ?: ""
        if (userId.isEmpty()) {
            Toast.makeText(context, "User not authenticated", Toast.LENGTH_SHORT).show()
            return
        }
        
        // Create missed report
        val missed = Missed(
            title = title,
            description = description,
            reportDateTime = currentDateTime,
            scheduleId = schedule.scheduleId ?: "",
            userId = userId
        )
        
        // Show loading state
        submitButton.isEnabled = false
        submitButton.text = "Submitting..."
        
        // Submit report
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val result = missedService.reportMissed(missed)
                
                withContext(Dispatchers.Main) {
                    if (result.isSuccess) {
                        Toast.makeText(context, "Report submitted successfully", Toast.LENGTH_SHORT).show()
                        onReportSubmitted()
                        dismiss()
                    } else {
                        submitButton.isEnabled = true
                        submitButton.text = "Submit"
                        val errorMessage = result.exceptionOrNull()?.message ?: "Failed to submit report"
                        Toast.makeText(context, errorMessage, Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    submitButton.isEnabled = true
                    submitButton.text = "Submit"
                    Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
} 