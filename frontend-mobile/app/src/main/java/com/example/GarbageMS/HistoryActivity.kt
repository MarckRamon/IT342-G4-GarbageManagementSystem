package com.example.GarbageMS

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.GarbageMS.adapters.HistoryAdapter
import com.example.GarbageMS.databinding.ActivityHistoryBinding
import com.example.GarbageMS.models.History
import com.example.GarbageMS.models.HistoryRequest
import com.example.GarbageMS.services.HistoryService
import com.example.GarbageMS.services.ScheduleService
import com.example.GarbageMS.utils.ToastUtils
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/**
 * Activity for displaying garbage collection history records
 */
class HistoryActivity : BaseActivity() {
    private lateinit var binding: ActivityHistoryBinding
    private lateinit var adapter: HistoryAdapter
    private lateinit var historyService: HistoryService
    private lateinit var scheduleService: ScheduleService
    private val historyList = mutableListOf<History>()
    private val TAG = "HistoryActivity"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHistoryBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize services
        historyService = HistoryService.getInstance().apply {
            initialize(sessionManager)
        }
        scheduleService = ScheduleService.getInstance().apply {
            initialize(sessionManager)
        }

        // Setup RecyclerView
        adapter = HistoryAdapter(historyList)
        binding.recyclerView.apply {
            layoutManager = LinearLayoutManager(this@HistoryActivity)
            adapter = this@HistoryActivity.adapter
        }

        // Setup SwipeRefreshLayout
        binding.swipeRefreshLayout.setOnRefreshListener {
            loadHistoryData()
        }

        // Setup listeners
        setupListeners()

        // Check if we received a completed schedule from an intent
        intent.getStringExtra("COMPLETED_SCHEDULE_ID")?.let { scheduleId ->
            createHistoryFromSchedule(scheduleId)
        }

        // Load history data
        loadHistoryData()
    }

    private fun setupListeners() {
        // Set up back button
        binding.backButton.setOnClickListener {
            onBackPressed()
        }

        // Set up profile image
        binding.profileImage.setOnClickListener {
            startActivity(Intent(this, ProfileActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            })
        }
    }

    /**
     * Load history data from the API
     */
    private fun loadHistoryData() {
        showLoading(true)
        lifecycleScope.launch {
            try {
                val result = historyService.getAllHistory()
                if (result.isSuccess) {
                    val histories = result.getOrNull() ?: emptyList()
                    updateUI(histories)
                } else {
                    val exception = result.exceptionOrNull()
                    Log.e(TAG, "Error loading history: ${exception?.message}", exception)
                    ToastUtils.showErrorToast(this@HistoryActivity, "Failed to load history data")
                    updateUI(emptyList())
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error in loadHistoryData: ${e.message}", e)
                ToastUtils.showErrorToast(this@HistoryActivity, "An error occurred")
                updateUI(emptyList())
            } finally {
                showLoading(false)
            }
        }
    }

    /**
     * Update UI with history data
     */
    private fun updateUI(histories: List<History>) {
        historyList.clear()
        historyList.addAll(histories)
        adapter.updateData(historyList)
        
        // Show empty state if no history records
        if (histories.isEmpty()) {
            binding.emptyStateLayout.visibility = View.VISIBLE
            binding.recyclerView.visibility = View.GONE
        } else {
            binding.emptyStateLayout.visibility = View.GONE
            binding.recyclerView.visibility = View.VISIBLE
        }
        
        binding.swipeRefreshLayout.isRefreshing = false
    }

    /**
     * Show/hide loading indicators
     */
    private fun showLoading(isLoading: Boolean) {
        if (isLoading) {
            binding.progressBar.visibility = View.VISIBLE
        } else {
            binding.progressBar.visibility = View.GONE
            binding.swipeRefreshLayout.isRefreshing = false
        }
    }

    /**
     * Create a history record from a completed schedule
     */
    private fun createHistoryFromSchedule(scheduleId: String) {
        showLoading(true)
        Log.d(TAG, "Creating history record for schedule ID: $scheduleId")
        
        lifecycleScope.launch {
            try {
                // First check if history already exists for this schedule to avoid duplicates
                val existingHistories = historyService.getAllHistory().getOrNull() ?: emptyList()
                val historyExists = existingHistories.any { it.scheduleId == scheduleId }
                
                if (historyExists) {
                    Log.d(TAG, "History record already exists for schedule ID: $scheduleId")
                    showLoading(false)
                    return@launch
                }
                
                // Get schedule details
                val scheduleResult = scheduleService.getScheduleById(scheduleId)
                if (scheduleResult.isSuccess) {
                    val schedule = scheduleResult.getOrThrow()
                    Log.d(TAG, "Retrieved schedule status: ${schedule.status}")
                    
                    // Verify schedule is completed
                    if (schedule.status.equals("COMPLETED", ignoreCase = true)) {
                        // Create history record
                        val currentDate = LocalDate.now().format(DateTimeFormatter.ISO_DATE)
                        val notes = "Garbage collected from location ${schedule.locationId}"
                        
                        val historyRequest = HistoryRequest(
                            collectionDate = currentDate,
                            notes = notes,
                            scheduleId = schedule.scheduleId
                        )
                        
                        val result = historyService.createHistory(historyRequest)
                        if (result.isSuccess) {
                            ToastUtils.showSuccessToast(this@HistoryActivity, "History record created")
                            Log.d(TAG, "Successfully created history record")
                            loadHistoryData() // Reload data to show the new record
                        } else {
                            val exception = result.exceptionOrNull()
                            Log.e(TAG, "Error creating history: ${exception?.message}", exception)
                            ToastUtils.showErrorToast(this@HistoryActivity, "Failed to create history record")
                        }
                    } else {
                        Log.e(TAG, "Schedule is not completed, current status: ${schedule.status}")
                        ToastUtils.showErrorToast(this@HistoryActivity, "Schedule is not marked as completed")
                    }
                } else {
                    val exception = scheduleResult.exceptionOrNull()
                    Log.e(TAG, "Error getting schedule: ${exception?.message}", exception)
                    ToastUtils.showErrorToast(this@HistoryActivity, "Failed to get schedule details")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error in createHistoryFromSchedule: ${e.message}", e)
                ToastUtils.showErrorToast(this@HistoryActivity, "An error occurred")
            } finally {
                showLoading(false)
            }
        }
    }
    
    // Prevent navigating back to Login/Register if back is pressed from a main activity
    override fun onBackPressed() {
        super.onBackPressed()
    }
    
    override fun onResume() {
        super.onResume()
        // Reload data when coming back to this screen
        loadHistoryData()
    }
} 