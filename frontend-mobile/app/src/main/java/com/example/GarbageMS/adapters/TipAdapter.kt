package com.example.GarbageMS.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.GarbageMS.R
import com.example.GarbageMS.models.Tip
import java.text.SimpleDateFormat
import java.util.Locale

class TipAdapter(private var tips: List<Tip>) : 
    RecyclerView.Adapter<TipAdapter.TipViewHolder>() {

    class TipViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val titleTextView: TextView = view.findViewById(R.id.tipTitle)
        val descriptionTextView: TextView = view.findViewById(R.id.tipDescription)
        val dateTextView: TextView = view.findViewById(R.id.tipDate)
        val userTextView: TextView = view.findViewById(R.id.tipUser)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TipViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_tip, parent, false)
        return TipViewHolder(view)
    }

    override fun onBindViewHolder(holder: TipViewHolder, position: Int) {
        val tip = tips[position]
        holder.titleTextView.text = tip.title
        holder.descriptionTextView.text = tip.description
        
        // Format the date
        try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
            val outputFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
            val date = inputFormat.parse(tip.createdAt)
            holder.dateTextView.text = date?.let { outputFormat.format(it) } ?: tip.createdAt
        } catch (e: Exception) {
            holder.dateTextView.text = tip.createdAt
        }
        
        // Set the user email (if available)
        holder.userTextView.text = if (tip.userEmail.isNotEmpty()) {
            "Posted by: ${tip.userEmail.split("@")[0]}"
        } else {
            "Posted by: Anonymous"
        }
    }

    override fun getItemCount() = tips.size

    fun updateTips(newTips: List<Tip>) {
        this.tips = newTips
        notifyDataSetChanged()
    }
} 