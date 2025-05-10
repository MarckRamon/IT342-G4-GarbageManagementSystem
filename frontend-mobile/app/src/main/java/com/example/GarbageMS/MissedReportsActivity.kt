package com.example.GarbageMS

import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.GarbageMS.adapters.MissedReportAdapter
import com.example.GarbageMS.databinding.ActivityMissedReportsBinding
import com.example.GarbageMS.services.MissedService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Activity for displaying missed pickup reports
 */
class MissedReportsActivity : BaseActivity() {

    private lateinit var binding: ActivityMissedReportsBinding
    private val missedService = MissedService.getInstance()
    private lateinit var missedReportAdapter: MissedReportAdapter
    private val TAG = "MissedReportsActivity"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMissedReportsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize service
        missedService.initialize(sessionManager)
        
        // Setup RecyclerView
        missedReportAdapter = MissedReportAdapter()
        binding.missedReportsRecyclerView.apply {
            adapter = missedReportAdapter
            layoutManager = LinearLayoutManager(this@MissedReportsActivity)
        }
        
        // Set up listeners
        setupListeners()
        
        // Load reports
        loadMissedReports()
    }
    
    private fun setupListeners() {
        binding.backButton.setOnClickListener {
            finish() // Go back to previous activity
        }
        
        binding.refreshLayout.setOnRefreshListener {
            loadMissedReports()
            binding.refreshLayout.isRefreshing = false
        }
        
        missedReportAdapter.setOnItemClickListener { missed ->
            // Show report details when clicked
            Toast.makeText(this, "Report Details: ${missed.title}", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun loadMissedReports() {
        // Show loading state
        showLoading(true)
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val userId = sessionManager.getUserId()
                
                if (userId == null) {
                    withContext(Dispatchers.Main) {
                        showError("User not authenticated")
                    }
                    return@launch
                }
                
                val result = missedService.getMissedByUserId(userId)
                
                withContext(Dispatchers.Main) {
                    if (result.isSuccess) {
                        val missedReports = result.getOrNull() ?: emptyList()
                        
                        Log.d(TAG, "Loaded ${missedReports.size} missed reports")
                        
                        if (missedReports.isEmpty()) {
                            showEmptyState()
                        } else {
                            missedReportAdapter.updateMissedReports(missedReports)
                            showReports()
                        }
                    } else {
                        showError(result.exceptionOrNull()?.message ?: "Failed to load reports")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading missed reports", e)
                withContext(Dispatchers.Main) {
                    showError("Error: ${e.message}")
                }
            }
        }
    }
    
    private fun showLoading(isLoading: Boolean) {
        binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        binding.missedReportsRecyclerView.visibility = if (isLoading) View.GONE else View.VISIBLE
        binding.emptyStateLayout.visibility = View.GONE
    }
    
    private fun showEmptyState() {
        binding.progressBar.visibility = View.GONE
        binding.missedReportsRecyclerView.visibility = View.GONE
        binding.emptyStateLayout.visibility = View.VISIBLE
    }
    
    private fun showReports() {
        binding.progressBar.visibility = View.GONE
        binding.missedReportsRecyclerView.visibility = View.VISIBLE
        binding.emptyStateLayout.visibility = View.GONE
    }
    
    private fun showError(message: String) {
        showEmptyState()
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
} 