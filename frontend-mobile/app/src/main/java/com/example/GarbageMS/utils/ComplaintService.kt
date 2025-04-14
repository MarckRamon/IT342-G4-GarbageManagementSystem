package com.example.GarbageMS.utils

import android.util.Log
import com.example.GarbageMS.models.ComplaintReport
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.util.UUID

/**
 * Service for handling complaint submissions.
 * This is a temporary implementation that simulates API calls.
 * Replace with actual API implementation in the future.
 */
class ComplaintService {
    private val TAG = "ComplaintService"
    
    // Temporary storage for submitted complaints (for demo purposes only)
    private val submittedComplaints = mutableListOf<ComplaintReport>()
    
    /**
     * Submit a complaint report.
     * This is a temporary implementation that simulates an API call.
     * Would be replaced with a real API call in production.
     */
    suspend fun submitComplaint(complaint: ComplaintReport): Result<Boolean> {
        return withContext(Dispatchers.IO) {
            try {
                // Simulate network delay
                delay(1200)
                
                // Generate an ID (this would typically be done server-side)
                val complaintWithId = complaint.copy(id = UUID.randomUUID().toString())
                
                // Store in our temporary list (would be sent to backend in real implementation)
                submittedComplaints.add(complaintWithId)
                
                // Log the complaint (for testing purposes)
                Log.d(TAG, "Complaint submitted: $complaintWithId")
                
                // Return success
                Result.success(true)
            } catch (e: Exception) {
                Log.e(TAG, "Error submitting complaint", e)
                Result.failure(e)
            }
        }
    }
    
    /**
     * Get all submitted complaints.
     * This would typically fetch from an API, but for now just returns our local list.
     */
    suspend fun getComplaints(): Result<List<ComplaintReport>> {
        return withContext(Dispatchers.IO) {
            try {
                // Simulate network delay
                delay(800)
                
                // Return our local list
                Result.success(submittedComplaints.toList())
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
    
    companion object {
        @Volatile
        private var instance: ComplaintService? = null
        
        fun getInstance(): ComplaintService {
            return instance ?: synchronized(this) {
                instance ?: ComplaintService().also { instance = it }
            }
        }
    }
} 