package com.example.GarbageMS

import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.GarbageMS.adapters.NotificationAdapter
import com.example.GarbageMS.databinding.ActivityNotificationsBinding
import com.example.GarbageMS.models.Notification
import com.example.GarbageMS.models.NotificationType
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.util.Date
import java.util.UUID

class NotificationsActivity : BaseActivity() {
    private lateinit var binding: ActivityNotificationsBinding
    private lateinit var adapter: NotificationAdapter
    private val TAG = "NotificationsActivity"
    private val db = FirebaseFirestore.getInstance()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityNotificationsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        // sessionManager is already initialized in BaseActivity

        // Hide the support action bar
        supportActionBar?.hide()
        
        // Set up recycler view
        setupRecyclerView()
        
        // Load notifications
        loadNotifications()
        
        // Set up mark all as read button
        binding.markAllReadFab.setOnClickListener {
            markAllNotificationsAsRead()
        }
        
        // Set up back button
        binding.backButton.setOnClickListener {
            finish()
        }
    }
    
    // Refresh the notifications when the activity comes to the foreground
    override fun onResume() {
        super.onResume()
        // Reload notifications to show the newly added ones
        loadNotifications()
    }
    
    // Method for NotificationsListFragment to call
    fun showMarkAllReadButton(show: Boolean) {
        binding.markAllReadFab.visibility = if (show) View.VISIBLE else View.GONE
    }
    
    private fun setupRecyclerView() {
        adapter = NotificationAdapter(mutableListOf()) { notification ->
            // Mark notification as read when clicked
            if (!notification.isRead) {
                markNotificationAsRead(notification.id)
            }
            
            // Handle notification click based on type
            when (notification.type) {
                NotificationType.PICKUP -> {
                    // Navigate to schedule view
                    Toast.makeText(this, "Opening schedule for pickup details", Toast.LENGTH_SHORT).show()
                }
                NotificationType.REPORT -> {
                    // Navigate to reports view
                    Toast.makeText(this, "Opening report details", Toast.LENGTH_SHORT).show()
                }
                NotificationType.SCHEDULE_CHANGE -> {
                    // Navigate to schedule view
                    Toast.makeText(this, "Opening schedule for changes", Toast.LENGTH_SHORT).show()
                }
                NotificationType.REMINDER -> {
                    // Navigate to relevant view
                    Toast.makeText(this, "Opening reminder details", Toast.LENGTH_SHORT).show()
                }
                NotificationType.SYSTEM, NotificationType.GENERAL -> {
                    // Just show toast
                    Toast.makeText(this, notification.message, Toast.LENGTH_LONG).show()
                }
            }
        }
        
        binding.notificationsRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@NotificationsActivity)
            adapter = this@NotificationsActivity.adapter
        }
    }
    
    private fun loadNotifications() {
        // Show loading state
        binding.progressBar.visibility = View.VISIBLE
        binding.notificationsRecyclerView.visibility = View.GONE
        binding.emptyNotificationsText.visibility = View.GONE
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val userId = sessionManager.getUserId() ?: throw Exception("User ID not available")
                
                // Query notifications for this user
                val notificationsSnapshot = db.collection("notifications")
                    .whereEqualTo("userId", userId)
                    .orderBy("timestamp", Query.Direction.DESCENDING)
                    .get()
                    .await()
                
                val notifications = notificationsSnapshot.documents.mapNotNull { doc ->
                    try {
                        Notification(
                            id = doc.id,
                            title = doc.getString("title") ?: "",
                            message = doc.getString("message") ?: "",
                            timestamp = doc.getTimestamp("timestamp")?.toDate() ?: Date(),
                            isRead = doc.getBoolean("isRead") ?: false,
                            type = try {
                                NotificationType.valueOf(doc.getString("type") ?: "SYSTEM")
                            } catch (e: Exception) {
                                NotificationType.SYSTEM
                            },
                            userId = doc.getString("userId") ?: "",
                            referenceId = doc.getString("referenceId") ?: ""
                        )
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing notification", e)
                        null
                    }
                }
                
                withContext(Dispatchers.Main) {
                    // Update UI with notifications
                    if (notifications.isEmpty()) {
                        binding.emptyNotificationsText.visibility = View.VISIBLE
                        binding.notificationsRecyclerView.visibility = View.GONE
                        binding.emptyNotificationsText.text = "No notifications yet"
                    } else {
                        binding.notificationsRecyclerView.visibility = View.VISIBLE
                        binding.emptyNotificationsText.visibility = View.GONE
                        adapter.updateNotifications(notifications)
                    }
                    binding.progressBar.visibility = View.GONE
                    
                    // Update badge count
                    updateNotificationBadgeCount()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading notifications: ${e.message}", e)
                Log.d(TAG, "userId: ${sessionManager.getUserId()}")
                
                withContext(Dispatchers.Main) {
                    // Handle specific error types
                    val errorMessage = when {
                        e.message?.contains("PERMISSION_DENIED") == true -> 
                            "Firestore permission denied. Please check your database rules."
                        e.message?.contains("NULL_VALUE") == true ->
                            "Error with data format. Please try again later."
                        e.message?.contains("UNAUTHENTICATED") == true ->
                            "Authentication error. Please log in again."
                        e.message?.contains("UNAVAILABLE") == true ->
                            "Service unavailable. Please check your internet connection."
                        e.message?.contains("FAILED_PRECONDITION") == true ->
                            "Database not properly configured. Please contact support."
                        else -> "Error loading notifications: ${e.message}"
                    }
                    
                    Toast.makeText(
                        this@NotificationsActivity,
                        errorMessage,
                        Toast.LENGTH_LONG
                    ).show()
                    
                    binding.progressBar.visibility = View.GONE
                    binding.emptyNotificationsText.visibility = View.VISIBLE
                    binding.notificationsRecyclerView.visibility = View.GONE
                    binding.emptyNotificationsText.text = "Unable to load notifications.\nTry again later."
                }
            }
        }
    }
    
    private fun markNotificationAsRead(notificationId: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Update in Firestore
                db.collection("notifications")
                    .document(notificationId)
                    .update("isRead", true)
                    .await()
                
                // Update locally
                adapter.markAsRead(notificationId)
                
                // Update badge count
                updateNotificationBadgeCount()
            } catch (e: Exception) {
                Log.e(TAG, "Error marking notification as read", e)
            }
        }
    }
    
    private fun markAllNotificationsAsRead() {
        val userId = sessionManager.getUserId()
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Get all unread notifications
                val unreadNotificationsSnapshot = db.collection("notifications")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("isRead", false)
                    .get()
                    .await()
                
                // Create a batch
                val batch = db.batch()
                
                // Add update operations to batch
                for (doc in unreadNotificationsSnapshot.documents) {
                    batch.update(doc.reference, "isRead", true)
                }
                
                // Commit batch
                batch.commit().await()
                
                withContext(Dispatchers.Main) {
                    // Update locally
                    adapter.markAllAsRead()
                    Toast.makeText(
                        this@NotificationsActivity,
                        "All notifications marked as read",
                        Toast.LENGTH_SHORT
                    ).show()
                    
                    // Update badge count
                    updateNotificationBadgeCount()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error marking all notifications as read", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@NotificationsActivity,
                        "Error marking notifications as read",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
    
    private fun updateNotificationBadgeCount() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val userId = sessionManager.getUserId()
                
                // Query unread notifications count
                val unreadCount = db.collection("notifications")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("isRead", false)
                    .get()
                    .await()
                    .size()
                
                // Update session manager with new count
                sessionManager.setUnreadNotificationCount(unreadCount)
            } catch (e: Exception) {
                Log.e(TAG, "Error updating notification badge count", e)
            }
        }
    }
} 