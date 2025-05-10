package com.example.GarbageMS.activities

import android.os.Bundle
import android.view.MenuItem
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.GarbageMS.R
import com.example.GarbageMS.adapters.NotificationAdapter
import com.example.GarbageMS.databinding.ActivityNotificationsBinding
import com.example.GarbageMS.models.Notification
import com.example.GarbageMS.models.NotificationType
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import java.util.Date

class NotificationsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityNotificationsBinding
    private lateinit var adapter: NotificationAdapter
    private val notificationsList = mutableListOf<Notification>()
    private val db = FirebaseFirestore.getInstance()
    private val currentUserId = FirebaseAuth.getInstance().currentUser?.uid

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityNotificationsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        setupRecyclerView()
        setupMarkAllAsReadButton()
        fetchNotifications()
    }

    // Refresh the notifications when the activity comes to the foreground
    override fun onResume() {
        super.onResume()
        // Reload notifications to show the newly added ones
        fetchNotifications()
    }

    private fun setupToolbar() {
        // Hide action bar
        supportActionBar?.hide()
        
        // Set back button
        binding.backButton.setOnClickListener {
            finish()
        }
    }

    private fun setupRecyclerView() {
        adapter = NotificationAdapter(notificationsList) { notification ->
            // Handle notification click
            markNotificationAsRead(notification)
            // Navigate to relevant screen based on notification type
            navigateBasedOnNotificationType(notification)
        }

        binding.notificationsRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@NotificationsActivity)
            adapter = this@NotificationsActivity.adapter
        }
    }

    private fun setupMarkAllAsReadButton() {
        binding.markAllReadFab.setOnClickListener {
            if (notificationsList.any { !it.isRead }) {
                markAllNotificationsAsRead()
            }
        }
    }

    private fun fetchNotifications() {
        binding.progressBar.visibility = View.VISIBLE
        
        if (currentUserId == null) {
            showEmptyState()
            binding.progressBar.visibility = View.GONE
            return
        }

        db.collection("users").document(currentUserId)
            .collection("notifications")
            .orderBy("timestamp", Query.Direction.DESCENDING)
            .get()
            .addOnSuccessListener { documents ->
                binding.progressBar.visibility = View.GONE
                
                notificationsList.clear()
                if (documents.isEmpty) {
                    showEmptyState()
                } else {
                    hideEmptyState()
                    for (document in documents) {
                        val notification = document.toObject(Notification::class.java)
                        notificationsList.add(notification)
                    }
                    adapter.notifyDataSetChanged()
                    updateMarkAllButtonVisibility()
                }
            }
            .addOnFailureListener {
                binding.progressBar.visibility = View.GONE
                showEmptyState()
                // Consider showing an error message
            }
    }

    private fun markNotificationAsRead(notification: Notification) {
        if (!notification.isRead) {
            currentUserId?.let { userId ->
                db.collection("users").document(userId)
                    .collection("notifications").document(notification.id)
                    .update("isRead", true)
                    .addOnSuccessListener {
                        adapter.markAsRead(notification.id)
                        updateMarkAllButtonVisibility()
                    }
            }
        }
    }

    private fun markAllNotificationsAsRead() {
        currentUserId?.let { userId ->
            val batch = db.batch()
            val unreadNotifications = notificationsList.filter { !it.isRead }
            
            unreadNotifications.forEach { notification ->
                val docRef = db.collection("users").document(userId)
                    .collection("notifications").document(notification.id)
                batch.update(docRef, "isRead", true)
            }
            
            batch.commit().addOnSuccessListener {
                adapter.markAllAsRead()
                updateMarkAllButtonVisibility()
            }
        }
    }

    private fun updateMarkAllButtonVisibility() {
        binding.markAllReadFab.visibility = 
            if (notificationsList.any { !it.isRead }) View.VISIBLE else View.GONE
    }

    private fun navigateBasedOnNotificationType(notification: Notification) {
        // Implement navigation based on notification type
        when (notification.type) {
            NotificationType.PICKUP -> {
                // Navigate to pickup details
            }
            NotificationType.REPORT -> {
                // Navigate to report details
            }
            NotificationType.SCHEDULE_CHANGE -> {
                // Navigate to schedule
            }
            NotificationType.REMINDER -> {
                // Navigate to relevant reminder screen
            }
            else -> {
                // Handle general notifications
            }
        }
    }

    private fun showEmptyState() {
        binding.notificationsRecyclerView.visibility = View.GONE
        binding.emptyNotificationsText.visibility = View.VISIBLE
    }

    private fun hideEmptyState() {
        binding.notificationsRecyclerView.visibility = View.VISIBLE
        binding.emptyNotificationsText.visibility = View.GONE
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (item.itemId == android.R.id.home) {
            finish()
            return true
        }
        return super.onOptionsItemSelected(item)
    }
} 