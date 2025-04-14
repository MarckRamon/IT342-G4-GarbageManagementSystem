package com.example.GarbageMS.utils

import android.app.AlertDialog
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import com.example.GarbageMS.R
import com.example.GarbageMS.models.ComplaintReport
import com.example.GarbageMS.models.PickupLocation
import com.google.android.material.textfield.TextInputEditText
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.infowindow.InfoWindow

/**
 * Custom implementation of InfoWindow for displaying pickup location details
 * when a map marker is tapped.
 */
class CustomInfoWindow(
    private val mapView: MapView
) : InfoWindow(R.layout.marker_info_window, mapView) {

    private val complaintService = ComplaintService.getInstance()
    private val sessionManager = com.example.GarbageMS.utils.SessionManager.getInstance(mapView.context)

    override fun onOpen(item: Any?) {
        // The marker object that this info window is attached to
        val marker = item as? Marker ?: return
        
        // The pickup location data associated with this marker
        val pickupLocation = marker.relatedObject as? PickupLocation ?: return
        
        // Find views in the info window layout
        val titleTextView = mView.findViewById<TextView>(R.id.info_window_title)
        val garbageTypeTextView = mView.findViewById<TextView>(R.id.info_window_garbage_type)
        val descriptionTextView = mView.findViewById<TextView>(R.id.info_window_description)
        val reportButton = mView.findViewById<Button>(R.id.btn_report_complaint)
        
        // Set view contents with location data
        titleTextView.text = pickupLocation.siteName
        garbageTypeTextView.text = "Type: ${pickupLocation.garbageType}"
        
        // Create description text
        val descriptionBuilder = StringBuilder()
        
        pickupLocation.address?.let {
            descriptionBuilder.append("Address: $it\n")
        }
        
        pickupLocation.description?.let {
            descriptionBuilder.append("$it\n")
        }
        
        pickupLocation.collectionDays?.let {
            descriptionBuilder.append("Collection days: ${it.joinToString(", ")}")
        }
        
        descriptionTextView.text = descriptionBuilder.toString().trim()
        
        // Set up report complaint button click
        reportButton.setOnClickListener {
            showReportComplaintDialog(mapView.context, pickupLocation)
        }
    }
    
    private fun showReportComplaintDialog(context: android.content.Context, location: PickupLocation) {
        // Get user email from session
        val userEmail = sessionManager.getUserEmail()
        
        if (userEmail.isNullOrEmpty()) {
            Toast.makeText(
                context,
                "Unable to retrieve your email. Please try again later.",
                Toast.LENGTH_SHORT
            ).show()
            return
        }
        
        // Create the dialog view
        val dialogView = View.inflate(context, R.layout.dialog_report_complaint, null)
        
        // Set up the location name
        val locationNameTextView = dialogView.findViewById<TextView>(R.id.tv_location_name)
        locationNameTextView.text = "Location: ${location.siteName}"
        
        // Set the user's email text
        val userEmailTextView = dialogView.findViewById<TextView>(R.id.tv_user_email)
        userEmailTextView.text = "Your email: $userEmail"
        
        // Create and configure the dialog
        val dialog = AlertDialog.Builder(context)
            .setView(dialogView)
            .setCancelable(true)
            .create()
        
        // Set up the cancel button
        dialogView.findViewById<Button>(R.id.btn_cancel).setOnClickListener {
            dialog.dismiss()
        }
        
        // Set up the submit button
        dialogView.findViewById<Button>(R.id.btn_submit).setOnClickListener {
            val descriptionInput = dialogView.findViewById<TextInputEditText>(R.id.et_complaint_description)
            val description = descriptionInput.text.toString().trim()
            
            // Validate input
            if (description.isEmpty()) {
                descriptionInput.error = "Please describe your complaint"
                return@setOnClickListener
            }
            
            // Submit the complaint
            submitComplaint(context, userEmail, description, location)
            
            // Close the dialog
            dialog.dismiss()
            
            // Close the info window
            close()
        }
        
        // Show the dialog
        dialog.show()
    }
    
    private fun submitComplaint(
        context: android.content.Context,
        email: String,
        description: String,
        location: PickupLocation
    ) {
        // Create the complaint object
        val complaint = ComplaintReport(
            userEmail = email,
            description = description,
            locationId = location.id,
            locationName = location.siteName,
            locationLatitude = location.latitude,
            locationLongitude = location.longitude
        )
        
        // Submit in a coroutine
        CoroutineScope(Dispatchers.IO).launch {
            val result = complaintService.submitComplaint(complaint)
            
            withContext(Dispatchers.Main) {
                if (result.isSuccess) {
                    Toast.makeText(
                        context,
                        "Complaint submitted successfully",
                        Toast.LENGTH_SHORT
                    ).show()
                } else {
                    val exception = result.exceptionOrNull()
                    Toast.makeText(
                        context,
                        "Failed to submit complaint: ${exception?.message ?: "Unknown error"}",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }
    }

    override fun onClose() {
        // Cleanup if needed when info window is closed
    }
} 