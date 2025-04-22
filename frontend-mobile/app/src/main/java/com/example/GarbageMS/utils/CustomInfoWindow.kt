package com.example.GarbageMS.utils

import android.view.View
import android.widget.TextView
import com.example.GarbageMS.R
import com.example.GarbageMS.models.PickupLocation
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
    }

    override fun onClose() {
        // Cleanup if needed when info window is closed
    }
} 