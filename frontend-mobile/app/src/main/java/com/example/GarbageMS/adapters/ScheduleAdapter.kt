package com.example.GarbageMS.adapters

import android.content.Intent
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.cardview.widget.CardView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.example.GarbageMS.R
import com.example.GarbageMS.HomeActivity
import com.example.GarbageMS.models.Schedule

class ScheduleAdapter : RecyclerView.Adapter<ScheduleAdapter.ScheduleViewHolder>() {

    private var scheduleList: List<Schedule> = emptyList()
    private var onItemClickListener: ((Schedule) -> Unit)? = null
    private var onRemindMeClickListener: ((Schedule) -> Unit)? = null

    fun updateSchedules(newScheduleList: List<Schedule>) {
        scheduleList = newScheduleList
        notifyDataSetChanged()
    }

    fun setOnItemClickListener(listener: (Schedule) -> Unit) {
        onItemClickListener = listener
    }
    
    fun setOnRemindMeClickListener(listener: (Schedule) -> Unit) {
        onRemindMeClickListener = listener
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ScheduleViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_schedule, parent, false)
        return ScheduleViewHolder(view)
    }

    override fun onBindViewHolder(holder: ScheduleViewHolder, position: Int) {
        holder.bind(scheduleList[position])
    }

    override fun getItemCount(): Int = scheduleList.size

    inner class ScheduleViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val cardView: CardView = itemView.findViewById(R.id.scheduleCard)
        private val locationText: TextView = itemView.findViewById(R.id.locationText)
        private val dateText: TextView = itemView.findViewById(R.id.dateText)
        private val timeText: TextView = itemView.findViewById(R.id.timeText)
        private val statusText: TextView = itemView.findViewById(R.id.statusText)
        private val btnRemindMe: Button = itemView.findViewById(R.id.btnRemindMe)

        fun bind(schedule: Schedule) {
            // Improve location display
            val locationDisplay = when {
                schedule.locationId.contains("location-id-from-pickup-locations") -> {
                    "Community Pickup Location" // Friendly name for standard pickup location
                }
                schedule.locationId.isEmpty() -> {
                    "No location specified"
                }
                else -> {
                    // Try to extract a meaningful name from the locationId if it follows a pattern
                    val parts = schedule.locationId.split("-")
                    if (parts.size > 1) {
                        // Capitalize each word for a nicer display
                        parts.subList(1, parts.size).joinToString(" ") { 
                            it.replaceFirstChar { char -> 
                                if (char.isLowerCase()) char.titlecase() else char.toString() 
                            }
                        }
                    } else {
                        schedule.locationId // Fallback to the original ID
                    }
                }
            }
            
            locationText.text = locationDisplay
            dateText.text = schedule.pickupDate
            timeText.text = schedule.pickupTime
            statusText.text = schedule.status
            
            // Debug - log schedule details
            Log.d("ScheduleAdapter", "Binding schedule: ${schedule.scheduleId}, " +
                    "location: ${schedule.locationId}, " +
                    "date: ${schedule.pickupDate}, " +
                    "time: ${schedule.pickupTime}, " +
                    "status: ${schedule.status}")

            // Set color based on status
            when (schedule.status.uppercase()) {
                "PENDING" -> {
                    statusText.setTextColor(ContextCompat.getColor(itemView.context, R.color.orange))
                    // Show Remind Me button only for PENDING schedules
                    btnRemindMe.visibility = View.VISIBLE
                }
                "COMPLETED" -> {
                    statusText.setTextColor(ContextCompat.getColor(itemView.context, R.color.secondary))
                    btnRemindMe.visibility = View.GONE
                }
                "CANCELLED" -> {
                    statusText.setTextColor(ContextCompat.getColor(itemView.context, R.color.error))
                    btnRemindMe.visibility = View.GONE
                }
                else -> {
                    statusText.setTextColor(ContextCompat.getColor(itemView.context, R.color.text_secondary))
                    btnRemindMe.visibility = View.GONE
                }
            }

            // Set click listener for the entire item
            itemView.setOnClickListener {
                onItemClickListener?.invoke(schedule)
            }
            
            // Set click listener for the Remind Me button
            btnRemindMe.setOnClickListener {
                onRemindMeClickListener?.invoke(schedule)
                
                // Show feedback to user when clicked
                Toast.makeText(
                    itemView.context,
                    "Reminder set for pickup",
                    Toast.LENGTH_SHORT
                ).show()
                
                // Navigate to Home screen with the schedule ID to show the reminder
                val intent = Intent(itemView.context, HomeActivity::class.java)
                intent.putExtra("SHOW_REMINDER_SCHEDULE_ID", schedule.scheduleId)
                intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
                itemView.context.startActivity(intent)
            }
        }
    }
} 