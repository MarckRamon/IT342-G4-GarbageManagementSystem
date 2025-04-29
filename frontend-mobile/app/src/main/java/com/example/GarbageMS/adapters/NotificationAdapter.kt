package com.example.GarbageMS.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.example.GarbageMS.R
import com.example.GarbageMS.databinding.ItemNotificationBinding
import com.example.GarbageMS.models.Notification
import com.example.GarbageMS.models.NotificationType
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class NotificationAdapter(
    private val notifications: List<Notification>,
    private val onNotificationClick: (Notification) -> Unit
) : RecyclerView.Adapter<NotificationAdapter.NotificationViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): NotificationViewHolder {
        val binding = ItemNotificationBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return NotificationViewHolder(binding)
    }

    override fun onBindViewHolder(holder: NotificationViewHolder, position: Int) {
        holder.bind(notifications[position])
    }

    override fun getItemCount() = notifications.size

    fun markAsRead(notificationId: String) {
        val position = notifications.indexOfFirst { it.id == notificationId }
        if (position != -1) {
            (notifications as MutableList<Notification>)[position].isRead = true
            notifyItemChanged(position)
        }
    }

    fun markAllAsRead() {
        notifications.forEachIndexed { index, notification ->
            if (!notification.isRead) {
                (notifications as MutableList<Notification>)[index].isRead = true
                notifyItemChanged(index)
            }
        }
    }

    fun updateNotifications(newNotifications: List<Notification>) {
        (notifications as MutableList<Notification>).clear()
        (notifications as MutableList<Notification>).addAll(newNotifications)
        notifyDataSetChanged()
    }

    inner class NotificationViewHolder(
        private val binding: ItemNotificationBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(notification: Notification) {
            binding.apply {
                textViewTitle.text = notification.title
                textViewMessage.text = notification.message
                textViewTime.text = formatDate(notification.timestamp)
                
                // Set icon based on notification type
                imageViewIcon.setImageResource(getIconForType(notification.type))
                
                // Set background color based on read status
                val backgroundColor = if (notification.isRead) {
                    R.color.notification_read_bg
                } else {
                    R.color.notification_unread_bg
                }
                
                // Set background color for the root view instead of cardNotification
                root.setBackgroundColor(
                    ContextCompat.getColor(root.context, backgroundColor)
                )
                
                // Show unread indicator if notification is not read
                viewUnreadIndicator.visibility = if (notification.isRead) View.GONE else View.VISIBLE
                
                // Set click listener
                root.setOnClickListener {
                    onNotificationClick(notification)
                }
            }
        }
        
        private fun formatDate(timestamp: Date): String {
            val now = Date()
            val diff = now.time - timestamp.time
            
            return when {
                diff < 60 * 60 * 1000 -> {
                    // Less than 1 hour ago
                    val minutes = (diff / (60 * 1000)).toInt()
                    if (minutes < 1) "Just now" else "$minutes min ago"
                }
                diff < 24 * 60 * 60 * 1000 -> {
                    // Less than 24 hours ago
                    val hours = (diff / (60 * 60 * 1000)).toInt()
                    "$hours ${if (hours == 1) "hour" else "hours"} ago"
                }
                diff < 7 * 24 * 60 * 60 * 1000 -> {
                    // Less than 7 days ago
                    val days = (diff / (24 * 60 * 60 * 1000)).toInt()
                    "$days ${if (days == 1) "day" else "days"} ago"
                }
                else -> {
                    // More than 7 days ago, show the date
                    SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(timestamp)
                }
            }
        }
        
        private fun getIconForType(type: NotificationType): Int {
            return when (type) {
                NotificationType.PICKUP -> R.drawable.ic_notification_pickup
                NotificationType.REPORT -> R.drawable.ic_notification_report
                NotificationType.SCHEDULE_CHANGE -> R.drawable.ic_notification_schedule
                NotificationType.REMINDER -> R.drawable.ic_notification_reminder
                else -> R.drawable.ic_notification_general
            }
        }
    }
} 