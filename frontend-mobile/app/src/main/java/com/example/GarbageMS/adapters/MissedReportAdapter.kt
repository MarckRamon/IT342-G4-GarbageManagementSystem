package com.example.GarbageMS.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.GarbageMS.R
import com.example.GarbageMS.models.Missed
import java.text.SimpleDateFormat
import java.util.Locale

/**
 * Adapter for displaying missed pickup reports
 */
class MissedReportAdapter : RecyclerView.Adapter<MissedReportAdapter.MissedReportViewHolder>() {

    private var missedList: List<Missed> = emptyList()
    private var onItemClickListener: ((Missed) -> Unit)? = null

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MissedReportViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_missed_report, parent, false)
        return MissedReportViewHolder(view)
    }

    override fun onBindViewHolder(holder: MissedReportViewHolder, position: Int) {
        val missedReport = missedList[position]
        holder.bind(missedReport)
    }

    override fun getItemCount(): Int = missedList.size

    fun updateMissedReports(missedReports: List<Missed>) {
        missedList = missedReports
        notifyDataSetChanged()
    }

    fun setOnItemClickListener(listener: (Missed) -> Unit) {
        onItemClickListener = listener
    }

    inner class MissedReportViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val reportTitle: TextView = itemView.findViewById(R.id.reportTitle)
        private val reportDate: TextView = itemView.findViewById(R.id.reportDate)
        private val reportDescription: TextView = itemView.findViewById(R.id.reportDescription)
        private val scheduleId: TextView = itemView.findViewById(R.id.scheduleId)
        private val reportTime: TextView = itemView.findViewById(R.id.reportTime)

        init {
            itemView.setOnClickListener {
                val position = adapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    onItemClickListener?.invoke(missedList[position])
                }
            }
        }

        fun bind(missed: Missed) {
            reportTitle.text = missed.title
            reportDescription.text = missed.description
            scheduleId.text = missed.scheduleId

            try {
                // Parse the ISO date time string and format it
                val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                val outputDateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                val outputTimeFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
                
                val date = inputFormat.parse(missed.reportDateTime)
                if (date != null) {
                    reportDate.text = outputDateFormat.format(date)
                    reportTime.text = outputTimeFormat.format(date)
                } else {
                    reportDate.text = missed.reportDateTime
                    reportTime.text = ""
                }
            } catch (e: Exception) {
                // Fallback to original string if parsing fails
                reportDate.text = missed.reportDateTime
                reportTime.text = ""
            }
        }
    }
} 