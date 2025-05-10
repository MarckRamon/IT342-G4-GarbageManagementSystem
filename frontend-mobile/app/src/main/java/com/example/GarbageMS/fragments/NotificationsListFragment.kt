package com.example.GarbageMS.fragments

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.ProgressBar
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.example.GarbageMS.NotificationsActivity
import com.example.GarbageMS.R
import com.example.GarbageMS.adapters.NotificationAdapter
import com.example.GarbageMS.models.Notification
import com.example.GarbageMS.services.NotificationService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class NotificationsListFragment : Fragment() {
    private lateinit var recyclerView: RecyclerView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var emptyStateContainer: LinearLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var adapter: NotificationAdapter
    private val notificationService = NotificationService.getInstance()
    private val TAG = "NotificationsListFrag"
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_notifications_list, container, false)
        
        // Initialize views
        recyclerView = view.findViewById(R.id.notificationsRecyclerView)
        swipeRefreshLayout = view.findViewById(R.id.swipeRefreshLayout)
        emptyStateContainer = view.findViewById(R.id.emptyStateContainer)
        progressBar = view.findViewById(R.id.progressBar)
        
        // Setup RecyclerView
        setupRecyclerView()
        
        // Setup SwipeRefreshLayout
        swipeRefreshLayout.setOnRefreshListener {
            loadNotifications()
        }
        
        // Load notifications
        loadNotifications()
        
        return view
    }
    
    private fun setupRecyclerView() {
        recyclerView.layoutManager = LinearLayoutManager(requireContext())
        adapter = NotificationAdapter(emptyList()) { notification ->
            // Handle notification click
            handleNotificationClick(notification)
        }
        recyclerView.adapter = adapter
    }
    
    private fun loadNotifications() {
        showLoading()
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val notifications = notificationService.getAllNotifications()
                
                withContext(Dispatchers.Main) {
                    hideLoading()
                    
                    if (notifications.isEmpty()) {
                        showEmptyState()
                    } else {
                        showNotifications(notifications)
                        
                        // Show the mark all as read button if there are unread notifications
                        val hasUnreadNotifications = notifications.any { !it.isRead }
                        (activity as? NotificationsActivity)?.showMarkAllReadButton(hasUnreadNotifications)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading notifications", e)
                
                withContext(Dispatchers.Main) {
                    hideLoading()
                    showEmptyState()
                }
            }
        }
    }
    
    private fun handleNotificationClick(notification: Notification) {
        // Mark notification as read
        if (!notification.isRead) {
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val success = notificationService.markAsRead(notification.id)
                    if (success) {
                        // Refresh the list to update the read status
                        loadNotifications()
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error marking notification as read", e)
                }
            }
        }
        
        // Handle click based on notification type (if needed)
        when (notification.type) {
            // Add specific handling for different notification types if needed
            else -> {
                // Default handling: just log the click
                Log.d(TAG, "Notification clicked: ${notification.title}")
            }
        }
    }
    
    fun markAllAsRead() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val success = notificationService.markAllAsRead()
                if (success) {
                    // Refresh the list to update the read status
                    loadNotifications()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error marking all notifications as read", e)
            }
        }
    }
    
    private fun showNotifications(notifications: List<Notification>) {
        adapter.updateNotifications(notifications)
        recyclerView.visibility = View.VISIBLE
        emptyStateContainer.visibility = View.GONE
    }
    
    private fun showEmptyState() {
        recyclerView.visibility = View.GONE
        emptyStateContainer.visibility = View.VISIBLE
        (activity as? NotificationsActivity)?.showMarkAllReadButton(false)
    }
    
    private fun showLoading() {
        if (!swipeRefreshLayout.isRefreshing) {
            progressBar.visibility = View.VISIBLE
        }
    }
    
    private fun hideLoading() {
        progressBar.visibility = View.GONE
        swipeRefreshLayout.isRefreshing = false
    }
    
    override fun onResume() {
        super.onResume()
        // Refresh notifications when returning to this fragment
        loadNotifications()
    }
} 