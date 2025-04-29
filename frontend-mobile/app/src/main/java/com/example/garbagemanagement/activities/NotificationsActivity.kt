package com.example.garbagemanagement.activities

import android.os.Bundle
import android.view.View
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.example.GarbageMS.R
import com.example.garbagemanagement.adapters.NotificationAdapter
import com.example.garbagemanagement.models.Notification
import com.example.garbagemanagement.services.NotificationService
import com.google.android.material.floatingactionbutton.FloatingActionButton
import kotlinx.coroutines.launch

class NotificationsActivity : AppCompatActivity() {
    
    private lateinit var recyclerView: RecyclerView
    private lateinit var emptyView: TextView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var markAllReadFab: FloatingActionButton
    private lateinit var adapter: NotificationAdapter
    private lateinit var notificationService: NotificationService
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_notifications)
        
        // Initialize notification service
        notificationService = NotificationService(this)
        
        // Hide action bar
        supportActionBar?.hide()
        
        // Initialize views
        recyclerView = findViewById(R.id.notificationsRecyclerView)
        emptyView = findViewById(R.id.emptyNotificationsText)
        swipeRefreshLayout = findViewById(R.id.swipeRefresh)
        markAllReadFab = findViewById(R.id.markAllReadFab)
        
        // Setup back button
        val backButton: ImageButton = findViewById(R.id.backButton)
        backButton.setOnClickListener {
            finish()
        }
        
        // Set up RecyclerView
        recyclerView.layoutManager = LinearLayoutManager(this)
        adapter = NotificationAdapter(mutableListOf()) { notification ->
            if (!notification.read) {
                markNotificationAsRead(notification)
            }
        }
        recyclerView.adapter = adapter
        
        // Set up swipe refresh
        swipeRefreshLayout.setOnRefreshListener {
            fetchNotifications()
        }
        
        // Set up mark all as read button
        markAllReadFab.setOnClickListener {
            markAllAsRead()
        }
        
        // Fetch notifications
        fetchNotifications()
    }
    
    private fun fetchNotifications() {
        swipeRefreshLayout.isRefreshing = true
        
        lifecycleScope.launch {
            notificationService.getNotifications().fold(
                onSuccess = { notificationsList ->
                    adapter.updateNotifications(notificationsList)
                    
                    // Show/hide empty view and FAB
                    if (notificationsList.isEmpty()) {
                        recyclerView.visibility = View.GONE
                        emptyView.visibility = View.VISIBLE
                        markAllReadFab.visibility = View.GONE
                    } else {
                        recyclerView.visibility = View.VISIBLE
                        emptyView.visibility = View.GONE
                        
                        // Only show FAB if there are unread notifications
                        val hasUnread = notificationsList.any { !it.read }
                        markAllReadFab.visibility = if (hasUnread) View.VISIBLE else View.GONE
                    }
                    
                    swipeRefreshLayout.isRefreshing = false
                },
                onFailure = { _ ->
                    // Handle error
                    swipeRefreshLayout.isRefreshing = false
                }
            )
        }
    }
    
    private fun markNotificationAsRead(notification: Notification) {
        lifecycleScope.launch {
            notificationService.markAsRead(notification.id).fold(
                onSuccess = {
                    // Refresh notifications to update UI
                    fetchNotifications()
                },
                onFailure = { _ ->
                    // Handle error
                }
            )
        }
    }
    
    private fun markAllAsRead() {
        lifecycleScope.launch {
            notificationService.markAllAsRead().fold(
                onSuccess = {
                    // Refresh notifications to update UI
                    fetchNotifications()
                },
                onFailure = { _ ->
                    // Handle error
                }
            )
        }
    }
} 