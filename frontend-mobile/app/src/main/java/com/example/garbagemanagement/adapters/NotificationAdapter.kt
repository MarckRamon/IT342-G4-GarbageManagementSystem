package com.example.garbagemanagement.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.GarbageMS.R
import com.example.garbagemanagement.models.Notification
import java.text.SimpleDateFormat
import java.util.Locale

class NotificationAdapter(
    private var notifications: MutableList<Notification>,
    private val onNotificationClicked: (Notification) -> Unit
) : RecyclerView.Adapter<NotificationAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val titleTextView: TextView = view.findViewById(R.id.textViewTitle)
        val messageTextView: TextView = view.findViewById(R.id.textViewMessage)
        val timeTextView: TextView = view.findViewById(R.id.textViewTime)
        val statusView: View = view.findViewById(R.id.viewUnreadIndicator)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_notification, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val notification = notifications[position]
        
        holder.titleTextView.text = notification.title
        holder.messageTextView.text = notification.message
        
        // Format date
        val dateFormat = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
        holder.timeTextView.text = dateFormat.format(notification.timestamp)
        
        // Set read/unread status
        holder.statusView.visibility = if (notification.read) View.INVISIBLE else View.VISIBLE
        
        // Set background based on read status
        holder.itemView.setBackgroundResource(
            if (notification.read) R.drawable.notification_item_background else R.drawable.notification_item_background
        )
        
        // Set click listener
        holder.itemView.setOnClickListener {
            onNotificationClicked(notification)
        }
    }

    override fun getItemCount() = notifications.size

    fun updateNotifications(newNotifications: List<Notification>) {
        this.notifications.clear()
        this.notifications.addAll(newNotifications)
        notifyDataSetChanged()
    }
    
    fun markAsRead(notificationId: String) {
        val index = notifications.indexOfFirst { it.id == notificationId }
        if (index != -1) {
            notifications[index].read = true
            notifyItemChanged(index)
        }
    }
    
    fun markAllAsRead() {
        for (i in notifications.indices) {
            if (!notifications[i].read) {
                notifications[i].read = true
                notifyItemChanged(i)
            }
        }
    }
} 