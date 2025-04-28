package com.example.GarbageMS.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.GarbageMS.R
import com.example.GarbageMS.models.History
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException

/**
 * Adapter for displaying history items in a RecyclerView
 */
class HistoryAdapter(private var historyList: List<History>) :
    RecyclerView.Adapter<HistoryAdapter.HistoryViewHolder>() {

    /**
     * ViewHolder for binding history item data
     */
    class HistoryViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvHistoryTitle: TextView = itemView.findViewById(R.id.tvHistoryTitle)
        private val tvCollectionDate: TextView = itemView.findViewById(R.id.tvCollectionDate)
        private val tvNotes: TextView = itemView.findViewById(R.id.tvNotes)
        private val tvHistoryId: TextView = itemView.findViewById(R.id.tvHistoryId)

        /**
         * Bind history data to view
         */
        fun bind(history: History) {
            // Set a friendly title
            tvHistoryTitle.text = "Completed Collection"
            
            // Format date to be more user-friendly
            try {
                val parsedDate = LocalDate.parse(history.collectionDate, DateTimeFormatter.ISO_DATE)
                val formattedDate = parsedDate.format(DateTimeFormatter.ofPattern("MMM dd, yyyy"))
                tvCollectionDate.text = formattedDate
            } catch (e: DateTimeParseException) {
                // Fallback to original date if parsing fails
                tvCollectionDate.text = history.collectionDate
            }
            
            tvNotes.text = history.notes
            tvHistoryId.text = "ID: ${history.historyId}"
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HistoryViewHolder {
        val itemView = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_history, parent, false)
        return HistoryViewHolder(itemView)
    }

    override fun onBindViewHolder(holder: HistoryViewHolder, position: Int) {
        holder.bind(historyList[position])
    }

    override fun getItemCount(): Int = historyList.size

    /**
     * Update the adapter data
     */
    fun updateData(newHistoryList: List<History>) {
        historyList = newHistoryList
        notifyDataSetChanged()
    }
} 