package com.example.GarbageMS.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.GarbageMS.R
import com.example.GarbageMS.models.Feedback
import com.example.GarbageMS.utils.DateConverter

class FeedbackAdapter : RecyclerView.Adapter<FeedbackAdapter.FeedbackViewHolder>() {

    private var feedbackList: List<Feedback> = emptyList()

    fun updateFeedback(newFeedbackList: List<Feedback>) {
        feedbackList = newFeedbackList
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FeedbackViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_feedback, parent, false)
        return FeedbackViewHolder(view)
    }

    override fun onBindViewHolder(holder: FeedbackViewHolder, position: Int) {
        holder.bind(feedbackList[position])
    }

    override fun getItemCount(): Int = feedbackList.size

    inner class FeedbackViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val userAvatar: ImageView = itemView.findViewById(R.id.userAvatar)
        private val userEmail: TextView = itemView.findViewById(R.id.userEmail)
        private val timestamp: TextView = itemView.findViewById(R.id.timestamp)
        private val feedbackTitle: TextView = itemView.findViewById(R.id.feedbackTitle)
        private val feedbackDescription: TextView = itemView.findViewById(R.id.feedbackDescription)
        private val feedbackStatus: TextView = itemView.findViewById(R.id.feedbackStatus)

        fun bind(feedback: Feedback) {
            // Set user email
            userEmail.text = feedback.userEmail

            // Set timestamp with proper formatting
            val timestampStr = when {
                feedback.createdAt != null -> formatTimestamp(feedback.createdAt)
                feedback.updatedAt != null -> formatTimestamp(feedback.updatedAt)
                else -> ""
            }
            timestamp.text = timestampStr

            // Set feedback content
            feedbackTitle.text = feedback.title
            feedbackDescription.text = feedback.description

            // Set status with appropriate background color
            feedbackStatus.text = feedback.status
            
            // Apply different status colors
            when (feedback.status.uppercase()) {
                "PENDING" -> {
                    feedbackStatus.setBackgroundResource(R.drawable.status_background_pending)
                }
                "RESOLVED" -> {
                    feedbackStatus.setBackgroundResource(R.drawable.status_background_resolved)
                }
                "IN_PROGRESS" -> {
                    feedbackStatus.setBackgroundResource(R.drawable.status_background_in_progress)
                }
                else -> {
                    feedbackStatus.setBackgroundResource(R.drawable.status_background)
                }
            }
        }
        
        private fun formatTimestamp(dateString: String?): String {
            if (dateString.isNullOrEmpty()) return ""
            
            return try {
                // First try to parse as complete ISO date
                val localDate = DateConverter.stringToLocalDate(dateString)
                if (localDate != null) {
                    return DateConverter.localDateToDisplayString(localDate)
                }
                
                // If that fails, try to extract just the date portion
                if (dateString.length >= 10) {
                    val datePart = dateString.substring(0, 10)
                    DateConverter.formatDateForDisplay(datePart)
                } else {
                    dateString
                }
            } catch (e: Exception) {
                dateString
            }
        }
    }
} 