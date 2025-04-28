package com.example.GarbageMS

import android.Manifest
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.preference.PreferenceManager
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.Toast
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.GarbageMS.adapters.FeedbackAdapter
import com.example.GarbageMS.models.Feedback
import com.example.GarbageMS.models.PickupLocation
import com.example.GarbageMS.services.FeedbackService
import com.example.GarbageMS.utils.CustomInfoWindow
import com.example.GarbageMS.utils.PickupLocationService
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.google.android.material.textfield.TextInputEditText
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.mylocation.GpsMyLocationProvider
import org.osmdroid.views.overlay.mylocation.MyLocationNewOverlay

class MapActivity : BaseActivity() {
    private val TAG = "MapActivity"
    private val LOCATION_PERMISSION_REQUEST = 1
    
    private lateinit var mapView: MapView
    private lateinit var myLocationOverlay: MyLocationNewOverlay
    private val pickupLocationService = PickupLocationService.getInstance()
    private val feedbackService = FeedbackService.getInstance()
    
    private lateinit var feedbackRecyclerView: RecyclerView
    private lateinit var feedbackAdapter: FeedbackAdapter
    private lateinit var addFeedbackButton: FloatingActionButton
    private lateinit var toggleViewButton: FloatingActionButton
    
    private var isMapViewVisible = true
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Configure osmdroid
        Configuration.getInstance().load(
            applicationContext,
            PreferenceManager.getDefaultSharedPreferences(applicationContext)
        )
        Configuration.getInstance().userAgentValue = "com.example.GarbageMS"
        
        setContentView(R.layout.activity_map)
        
        // BaseActivity already handles session checks
        supportActionBar?.hide()
        
        // Initialize feedbackService with the session manager
        feedbackService.initialize(sessionManager)
        
        // Initialize map
        mapView = findViewById(R.id.mapView)
        mapView.setTileSource(TileSourceFactory.MAPNIK)
        mapView.setMultiTouchControls(true)
        
        // Set up map controller
        val mapController = mapView.controller
        mapController.setZoom(15.0) // Initial zoom level
        
        // Set initial position (will be updated if location permission granted)
        // This is set to Cebu, Philippines
        val startPoint = GeoPoint(10.3157, 123.8854)
        mapController.setCenter(startPoint)
        
        // Initialize feedback components
        feedbackRecyclerView = findViewById(R.id.feedbackRecyclerView)
        feedbackRecyclerView.layoutManager = LinearLayoutManager(this)
        feedbackAdapter = FeedbackAdapter()
        feedbackRecyclerView.adapter = feedbackAdapter
        
        addFeedbackButton = findViewById(R.id.addFeedbackButton)
        toggleViewButton = findViewById(R.id.toggleViewButton)
        
        // Set up feedback button clicks
        setupFeedbackButtons()
        
        // Request location permissions
        requestLocationPermissions()
        
        // Set up back button
        findViewById<View>(R.id.backButton).setOnClickListener {
            finish()
        }
        
        // Set up refresh button
        findViewById<View>(R.id.refreshButton).setOnClickListener {
            if (isMapViewVisible) {
                refreshMap()
            } else {
                loadFeedback()
            }
        }
        
        // Set up bottom navigation
        setupBottomNavigation()
        
        // Load pickup locations
        loadPickupLocations()
    }
    
    private fun setupFeedbackButtons() {
        // Set up the add feedback button
        addFeedbackButton.setOnClickListener {
            showAddFeedbackDialog()
        }
        
        // Set up the toggle view button
        toggleViewButton.setOnClickListener {
            toggleView()
        }
    }
    
    private fun toggleView() {
        isMapViewVisible = !isMapViewVisible
        
        if (isMapViewVisible) {
            mapView.visibility = View.VISIBLE
            feedbackRecyclerView.visibility = View.GONE
        } else {
            mapView.visibility = View.GONE
            feedbackRecyclerView.visibility = View.VISIBLE
            loadFeedback()
        }
    }
    
    private fun loadFeedback() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val feedbackResult = feedbackService.getAllFeedback()
                
                withContext(Dispatchers.Main) {
                    if (feedbackResult.isSuccess) {
                        val feedbackList = feedbackResult.getOrNull() ?: emptyList()
                        
                        if (feedbackList.isEmpty()) {
                            Toast.makeText(
                                this@MapActivity,
                                "No feedback found",
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                        
                        feedbackAdapter.updateFeedback(feedbackList)
                    } else {
                        val exception = feedbackResult.exceptionOrNull()
                        Toast.makeText(
                            this@MapActivity,
                            "Error loading feedback: ${exception?.message}",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@MapActivity,
                        "Error: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
    
    private fun showAddFeedbackDialog() {
        val dialogView = View.inflate(this, R.layout.dialog_add_feedback, null)
        
        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .setCancelable(true)
            .create()
        
        val titleEditText = dialogView.findViewById<TextInputEditText>(R.id.titleEditText)
        val descriptionEditText = dialogView.findViewById<TextInputEditText>(R.id.descriptionEditText)
        val cancelButton = dialogView.findViewById<Button>(R.id.cancelButton)
        val submitButton = dialogView.findViewById<Button>(R.id.submitButton)
        
        cancelButton.setOnClickListener {
            dialog.dismiss()
        }
        
        submitButton.setOnClickListener {
            val title = titleEditText.text.toString().trim()
            val description = descriptionEditText.text.toString().trim()
            
            if (title.isEmpty()) {
                titleEditText.error = "Please enter a title"
                return@setOnClickListener
            }
            
            if (description.isEmpty()) {
                descriptionEditText.error = "Please enter a description"
                return@setOnClickListener
            }
            
            // Submit feedback
            submitFeedback(title, description)
            
            // Close the dialog
            dialog.dismiss()
        }
        
        dialog.show()
    }
    
    private fun submitFeedback(title: String, description: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val result = feedbackService.createFeedback(title, description)
                
                withContext(Dispatchers.Main) {
                    if (result.isSuccess) {
                        Toast.makeText(
                            this@MapActivity,
                            "Feedback submitted successfully",
                            Toast.LENGTH_SHORT
                        ).show()
                        
                        // If in feedback view, refresh the list
                        if (!isMapViewVisible) {
                            loadFeedback()
                        }
                    } else {
                        val exception = result.exceptionOrNull()
                        Toast.makeText(
                            this@MapActivity,
                            "Failed to submit feedback: ${exception?.message ?: "Unknown error"}",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@MapActivity,
                        "Error: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
    
    private fun setupBottomNavigation() {
        val bottomNavigationView = findViewById<BottomNavigationView>(R.id.bottomNavigation)
        bottomNavigationView.selectedItemId = R.id.navigation_map // Highlight the map icon
        
        bottomNavigationView.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.navigation_home -> {
                    val intent = Intent(this, HomeActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                    startActivity(intent)
                    true
                }
                R.id.navigation_schedule -> {
                    val intent = Intent(this, ScheduleActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                    startActivity(intent)
                    true
                }
                R.id.navigation_history -> {
                    val intent = Intent(this, HistoryActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                    startActivity(intent)
                    true
                }
                R.id.navigation_map -> {
                    // Already on this screen
                    true
                }
                else -> false
            }
        }
    }
    
    private fun requestLocationPermissions() {
        if (ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                ),
                LOCATION_PERMISSION_REQUEST
            )
        } else {
            enableMyLocation()
        }
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        if (requestCode == LOCATION_PERMISSION_REQUEST) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                enableMyLocation()
            } else {
                Toast.makeText(
                    this,
                    "Location permission denied. Unable to show your location.",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }
    
    private fun enableMyLocation() {
        // Add my location overlay
        myLocationOverlay = MyLocationNewOverlay(GpsMyLocationProvider(this), mapView)
        myLocationOverlay.enableMyLocation()
        mapView.overlays.add(myLocationOverlay)
        
        // Center map on user's location if available
        val myLocation = myLocationOverlay.myLocation
        if (myLocation != null) {
            mapView.controller.animateTo(myLocation)
        }
    }
    
    private fun loadPickupLocations() {
        Log.d(TAG, "Starting to load pickup locations")
        
        // Show loading UI if needed
        // You could add a progress indicator here
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val locationsResult = pickupLocationService.getPickupLocations()
                
                withContext(Dispatchers.Main) {
                    Log.d(TAG, "Location result received: success=${locationsResult.isSuccess}")
                    
                    if (locationsResult.isSuccess) {
                        val locations = locationsResult.getOrNull() ?: emptyList()
                        Log.d(TAG, "Got ${locations.size} pickup locations")
                        
                        if (locations.isEmpty()) {
                            Toast.makeText(
                                this@MapActivity,
                                "No pickup locations found",
                                Toast.LENGTH_SHORT
                            ).show()
                            return@withContext
                        }
                        
                        displayPickupLocations(locations)
                    } else {
                        val exception = locationsResult.exceptionOrNull()
                        Log.e(TAG, "Failed to load pickup locations", exception)
                        Toast.makeText(
                            this@MapActivity,
                            "Error loading pickup locations: ${exception?.message}",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception while loading pickup locations", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@MapActivity,
                        "Error: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
    
    private fun displayPickupLocations(locations: List<PickupLocation>) {
        // Debug info
        Log.d(TAG, "Displaying ${locations.size} locations on map")
        locations.forEach { 
            Log.d(TAG, "Location: ${it.siteName} at (${it.latitude}, ${it.longitude})")
        }
        
        // Clear existing markers (if any)
        mapView.overlays.removeAll { it is Marker }
        
        // Add new markers for each location
        locations.forEach { location ->
            try {
                addMarkerForLocation(location)
            } catch (e: Exception) {
                Log.e(TAG, "Error adding marker for location: ${location.siteName}", e)
            }
        }
        
        // Refresh the map display
        mapView.invalidate()
        
        // Try to fit all markers on screen
        if (locations.isNotEmpty()) {
            try {
                zoomToShowAllMarkers(locations)
            } catch (e: Exception) {
                Log.e(TAG, "Error zooming to show all markers", e)
            }
        }
    }
    
    private fun zoomToShowAllMarkers(locations: List<PickupLocation>) {
        if (locations.isEmpty()) return
        
        // If there's only one location, just center on it
        if (locations.size == 1) {
            val location = locations[0]
            mapView.controller.setCenter(GeoPoint(location.latitude, location.longitude))
            mapView.controller.setZoom(16.0)
            return
        }
        
        // Calculate bounds of all markers
        var minLat = Double.MAX_VALUE
        var maxLat = Double.MIN_VALUE
        var minLon = Double.MAX_VALUE
        var maxLon = Double.MIN_VALUE
        
        locations.forEach { location ->
            minLat = minOf(minLat, location.latitude)
            maxLat = maxOf(maxLat, location.latitude)
            minLon = minOf(minLon, location.longitude)
            maxLon = maxOf(maxLon, location.longitude)
        }
        
        // Add a little padding
        val latPadding = (maxLat - minLat) * 0.1
        val lonPadding = (maxLon - minLon) * 0.1
        
        // Create a bounding box
        val boundingBox = org.osmdroid.util.BoundingBox(
            maxLat + latPadding,
            maxLon + lonPadding,
            minLat - latPadding,
            minLon - lonPadding
        )
        
        // Zoom to the bounding box
        mapView.zoomToBoundingBox(boundingBox, true)
        
        // Limit max zoom out
        if (mapView.zoomLevelDouble < 10) {
            mapView.controller.setZoom(10.0)
        }
    }
    
    private fun addMarkerForLocation(location: PickupLocation) {
        val marker = Marker(mapView)
        
        // Set position
        marker.position = GeoPoint(location.latitude, location.longitude)
        Log.d(TAG, "Adding marker at (${location.latitude}, ${location.longitude}) for ${location.siteName}")
        
        // Set anchor (bottom-center of the icon)
        marker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
        
        // Set icon
        marker.icon = ContextCompat.getDrawable(this, R.drawable.ic_location_pin)
        
        // Set marker title and snippet (for basic info)
        marker.title = location.siteName
        marker.snippet = location.garbageType
        
        // Store the full location object with the marker
        marker.relatedObject = location
        
        // Set custom info window
        marker.infoWindow = CustomInfoWindow(mapView)
        
        // Set marker click listener
        marker.setOnMarkerClickListener { clickedMarker, _ ->
            if (clickedMarker.isInfoWindowShown) {
                clickedMarker.closeInfoWindow()
            } else {
                clickedMarker.showInfoWindow()
                mapView.controller.animateTo(clickedMarker.position)
            }
            true // We handled the event
        }
        
        // Add to map
        mapView.overlays.add(marker)
    }
    
    private fun refreshMap() {
        Toast.makeText(this, "Refreshing map...", Toast.LENGTH_SHORT).show()
        loadPickupLocations()
    }
    
    override fun onResume() {
        super.onResume()
        mapView.onResume()
        
        // Reload locations when returning to the map screen
        refreshMap()
    }
    
    override fun onPause() {
        super.onPause()
        mapView.onPause()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        // Clean up resources
        if (::myLocationOverlay.isInitialized) {
            myLocationOverlay.disableMyLocation()
        }
    }
} 