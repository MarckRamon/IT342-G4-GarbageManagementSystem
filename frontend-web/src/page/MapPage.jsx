import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../styles/MapPage.css';
const API_BASE_URL = 'https://it342-g4-garbagemanagementsystem-kflf.onrender.com/api';


// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL
});

const fetchUserProfile = async (userId, authToken) => {
  try {
    const response = await api.get(`/users/${userId}/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

const fetchUserEmail = async (userId, authToken) => {
  try {
    const response = await api.get(`/users/${userId}/profile/email`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};
const updateUserProfile = async (userId, authToken, profileData) => {
  try {
    const response = await api.put(`/users/${userId}/profile`, profileData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Backend API URL
const API_URL = 'https://it342-g4-garbagemanagementsystem-kflf.onrender.com/api/pickup-locations';

// Helper function to get auth token
const getAuthHeader = () => {
  // Check localStorage first, then sessionStorage
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Geocoder for reverse geocoding
const provider = new OpenStreetMapProvider();

// Component to handle map interactions
function MapInteraction({ onPinPlace }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;

      // Reverse geocode to get address
      try {
        const results = await provider.search({ query: `${lat}, ${lng}` });
        const address = results.length > 0 ? results[0].label : 'Unknown location';
        onPinPlace(lat, lng, address);
      } catch (error) {
        console.error('Geocoding error:', error);
        onPinPlace(lat, lng, 'Address lookup failed');
      }
    }
  });

  return null;
}

const MapPage = () => {
  const [pickupLocations, setPickupLocations] = useState([]);
const [complaints, setComplaints] = useState([]);
const [pendingComplaints, setPendingComplaints] = useState(0);
const [monthlyPickupCounts, setMonthlyPickupCounts] = useState([]);
  const navigate = useNavigate();
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMarkerId, setEditingMarkerId] = useState(null);
  const [newPin, setNewPin] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    wasteType: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [profileEmail, setProfileEmail] = useState({
    email: ""
  });
  // Profile data object
  const [profileData, setProfileData] = useState({
    name: "Loading...",
    email: "loading@example.com",
    role: "Admin",
    phone: "Loading...",
    address: "123 Green Street, Eco City, EC 12345",
    joinDate: "January 15, 2021",
    department: "Field Operations",
    firstName: "",
    lastName: ""
  });
  useEffect(() => {
    // Retrieve authToken and userId from localStorage
    const authToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    // Log the values to the console
    console.log('Auth Token:', authToken);
    console.log('User ID:', userId);

    // Check if both values are present
    if (!authToken || !userId) {
      console.log('Authentication information missing');
      // For development purposes, we'll still load the dashboard
      setIsLoading(false);
      return;
      // In production, you would redirect to login:
      // setError('Authentication information missing. Please log in again.');
      // navigate('/login');
      // return;
    }

    // Setup axios interceptor to add auth token to all requests
    const interceptor = api.interceptors.request.use(
      config => {
        config.headers.Authorization = `Bearer ${authToken}`;
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
    const loadUserEmail = async () => {
      const profileEmailResponse = await fetchUserEmail(userId, authToken);
      console.log('Profile email received:', profileEmailResponse);

      if (profileEmailResponse && profileEmailResponse.success) {
        setProfileEmail({
          email: profileEmailResponse.email
        })
      }
    }
    // Fetch user profile data
    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        const profileResponse = await fetchUserProfile(userId, authToken);

        console.log('Profile data received:', profileResponse);

        if (profileResponse && profileResponse.success) {
          // Update the profileData state
          setProfileData({
            ...profileData,
            name: `${profileResponse.firstName} ${profileResponse.lastName}`,
            phone: profileResponse.phoneNumber,
            firstName: profileResponse.firstName,
            lastName: profileResponse.lastName
          });
        } else {
          setError('Failed to load profile data');
        }

        setIsLoading(false);
      } catch (err) {
        // Handle axios specific errors
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error("Server error:", err.response.status, err.response.data);
          setError(`Server error: ${err.response.status}`);
        } else if (err.request) {
          // The request was made but no response was received
          console.error("Network error:", err.request);
          setError('Network error. Please check your connection.');
        } else {
          // Something happened in setting up the request
          console.error("Request configuration error:", err.message);
          setError('Error setting up request');
        }
        setIsLoading(false);
      }
    };

    // Load profile data if auth token and user ID are available
    if (authToken && userId) {
      loadUserProfile();
      loadUserEmail();
    } else {
      setIsLoading(false);
    }

    // Clean up interceptor when component unmounts
    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, []);
  // Fetch all pickup locations from API
  useEffect(() => {
    setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    const fetchPickupLocations = async () => {
      setLoading(true);
      setError(null);
      try {
        // GET request doesn't need authentication according to controller comments
        const response = await axios.get(API_URL);
        if (response.data.success) {
          // Transform the data to match our marker format
          const transformedMarkers = response.data.locations.map(location => ({
            locationId: location.locationId,
            position: [location.latitude, location.longitude],
            name: location.siteName,
            wasteType: location.wasteType,
            address: location.address
          }));
          setMarkers(transformedMarkers);
        } else {
          setError(response.data.message || 'Failed to load pickup locations');
        }
      } catch (err) {
        console.error('Error fetching pickup locations:', err);
        if (err.response && err.response.status === 401) {
          setError('Authentication required. Please login again.');
        } else {
          setError('Error fetching pickup locations. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPickupLocations();
  }, []);

  const handlePinPlace = (lat, lng, address) => {
    if (isAdding || isEditing) {
      // Use exact coordinates where user clicked
      setNewPin({ position: [lat, lng] });
      setFormData({
        ...formData,
        address: address
      });
    }
  };

  const handleAddPin = () => {
    setIsAdding(true);
    setIsEditing(false);
    setEditingMarkerId(null);
    setNewPin(null);
    setFormData({
      name: '',
      wasteType: '',
      address: ''
    });
  };

  const handleEditPin = (marker) => {
    setIsEditing(true);
    setIsAdding(false);
    setEditingMarkerId(marker.locationId);
    setNewPin({ position: marker.position });
    setFormData({
      name: marker.name,
      wasteType: marker.wasteType,
      address: marker.address
    });
  };

  const handleDeletePin = async (locationId) => {
    try {
      setLoading(true);
      setError(null);

      // DELETE request needs JWT token
      const response = await axios.delete(`${API_URL}/${locationId}`, {
        headers: getAuthHeader()
      });

      if (response.data.success) {
        // Remove the marker from the state
        const updatedMarkers = markers.filter(marker => marker.locationId !== locationId);
        setMarkers(updatedMarkers);
      } else {
        setError(response.data.message || 'Failed to delete pickup location');
      }
    } catch (err) {
      console.error('Error deleting pickup location:', err);
      if (err.response && err.response.status === 401) {
        setError('Authentication required. Please login again.');
      } else {
        setError('Error deleting pickup location. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setIsEditing(false);
    setEditingMarkerId(null);
    setNewPin(null);
    setFormData({
      name: '',
      wasteType: '',
      address: ''
    });
  };

  const handleSavePin = async () => {
    if (newPin && formData.name && formData.wasteType && formData.address) {
      try {
        setLoading(true);
        setError(null);

        // Prepare request payload
        const pickupLocationData = {
          siteName: formData.name,
          wasteType: formData.wasteType,
          address: formData.address,
          latitude: newPin.position[0],
          longitude: newPin.position[1]
        };

        let response;

        if (isEditing && editingMarkerId) {
          // Update existing pickup location - needs JWT token
          response = await axios.put(`${API_URL}/${editingMarkerId}`, pickupLocationData, {
            headers: getAuthHeader()
          });

          if (response.data.success) {
            // Get the location data from the response
            // Backend might return the location directly in 'data' or in another property
            const updatedLocation = response.data.location || response.data.data || response.data;

            // Update the marker in the state
            const updatedMarkers = markers.map(marker =>
              marker.locationId === editingMarkerId
                ? {
                  locationId: updatedLocation.locationId || editingMarkerId, // Use existing ID as fallback
                  position: [
                    updatedLocation.latitude || newPin.position[0],
                    updatedLocation.longitude || newPin.position[1]
                  ],
                  name: updatedLocation.siteName || formData.name,
                  wasteType: updatedLocation.wasteType || formData.wasteType,
                  address: updatedLocation.address || formData.address
                }
                : marker
            );

            setMarkers(updatedMarkers);
          } else {
            setError(response.data.message || 'Failed to update pickup location');
          }
        } else {
          // Create new pickup location - needs JWT token
          response = await axios.post(API_URL, pickupLocationData, {
            headers: getAuthHeader()
          });

          if (response.data.success) {
            // Get the location data from the response
            // Backend might return the location directly in 'data' or in another property
            const newLocation = response.data.location || response.data.data || response.data;

            // Generate a temporary ID if none is provided by the backend
            const newId = newLocation.locationId || Date.now();

            // Add the new marker to the state
            const newMarker = {
              locationId: newId,
              position: [
                newLocation.latitude || newPin.position[0],
                newLocation.longitude || newPin.position[1]
              ],
              name: newLocation.siteName || formData.name,
              wasteType: newLocation.wasteType || formData.wasteType,
              address: newLocation.address || formData.address
            };

            setMarkers([...markers, newMarker]);
          } else {
            setError(response.data.message || 'Failed to create pickup location');
          }
        }

        // Reset form and state
        if (!error) {
          setIsAdding(false);
          setIsEditing(false);
          setEditingMarkerId(null);
          setNewPin(null);
          setFormData({
            name: '',
            wasteType: '',
            address: ''
          });
        }
      } catch (err) {
        console.error('Error saving pickup location:', err);
        if (err.response && err.response.status === 401) {
          setError('Authentication required. Please login again.');
          // Optionally redirect to login page
          // navigate('/login');
        } else {
          setError('Error saving pickup location. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const toggleProfilePopup = () => {
    setShowProfilePopup(!showProfilePopup);
  };

  const openProfileModal = () => {
    setShowProfilePopup(false);
    setShowProfileModal(true);
  };

  const handleLogout = () => {
    // Here you would normally clear authentication tokens, etc.
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const mainContentAnimationClass = pageLoaded
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 translate-y-6';

  return (

    <div className="flex min-h-screen bg-gray-50">

       
 {/* Sidebar */}
 <div className="w-64 h-full bg-white border-r border-gray-200 shadow-lg z-10 flex flex-col fixed pt-16">
    {/* Logo & Brand */}
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="text-xl font-semibold text-[#5da646] flex items-center">
      <img src="/logo.svg" alt="Vermigo Logo" className="h-6 w-6 mr-2" />

        Vermigo Admin
      </div>
    </div>
    
    {/* Navigation Menu */}
    <nav className="py-3 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      <div className="px-6 pb-2 pt-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Main Navigation</p>
      </div>
      <ul className="space-y-1 px-3">
        {/* Dashboard */}
        <li>
          <Link 
            to="/dashboard" 
            className="flex items-center px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Dashboard
          </Link>
        </li>
        
        {/* Complaints */}
        <li>
          <Link 
            to="/complaints" 
            className="flex items-center px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-all duration-200">            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              
            </svg>
            Complaints
          </Link>
        </li>
        
        {/* Missed Pickups */}
        <li>
          <Link 
            to="/missedPickup" 
            className="flex items-center px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
              <line x1="3" y1="10" x2="21" y2="10"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <path d="M17 14l-5-5-5 5"></path>
            </svg>
            Missed Pickups
          </Link>
        </li>
      </ul>
      
      <div className="px-6 pb-2 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Collections</p>
      </div>
      <ul className="space-y-1 px-3">
        {/* Collection Schedule */}
        <li>
          <Link 
            to="/schedule" 
            className="flex items-center px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Schedule
          </Link>
        </li>
        
        {/* Collection History */}
        <li>
          <Link 
            to="/history" 
            className="flex items-center px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            History
          </Link>
        </li>
        
        {/* Collection Sites Map */}
        <li>
          <Link 
            to="/map" 
            className="flex items-center px-4 py-2.5 text-green-600 font-medium bg-green-50 rounded-lg shadow-sm border-l-4 border-green-600 transition-all duration-200"                    >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Sites Map
          </Link>
        </li>
      </ul>
      <div className="px-6 pb-2 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">USER</p>
      </div>
      <ul className="space-y-1 px-3">
        {/* Collection Schedule */}
        <li>
          <Link 
            to="/schedule" 
            className="flex items-center px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
  <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
  <circle cx="12" cy="7" r="4" />
  <path d="M17.5 12.5l1.5 1.5-1.5 1.5" />
  <path d="M19 14h2" />
</svg>
            User Management
          </Link>
        </li>
        
      </ul>
    </nav>
    <div className="absolute bottom-16 left-0 right-0 flex justify-center items-center pointer-events-none">
    <img src="/logo.svg" alt="Vermigo Logo Background" className="w-32 h-32 opacity-5" />
  </div>
  <div className="mt-auto px-6 py-4 border-t border-gray-100">
    <div className="flex flex-col items-center">
      <div className="text-xs text-gray-400 mb-2">Vermigo      © 2025</div>
      <div className="flex space-x-4">
        <p className="text-xs text-gray-500 hover:text-green-600 transition-colors duration-200">Gella</p>
        <p className="text-xs text-gray-500 hover:text-green-600 transition-colors duration-200">Paraiso</p>
        <p className="text-xs text-gray-500 hover:text-green-600 transition-colors duration-200">Largo</p>
      </div>
    </div>
</div>
  </div>
  
  {/* Top Navbar */}
  <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 shadow-sm z-20 flex items-center justify-between px-4">
    {/* Left side - Toggle button & breadcrumbs */}
    <div className="flex items-center">
      <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 lg:hidden">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      <div className="ml-4 lg:ml-6 hidden sm:flex items-center text-gray-600">
        <span className="text-green-600 font-medium">Pick-up Sites</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-500">Map</span>
      </div>
    </div>
    
    {/* Right side - Search, notifications, profile */}
    <div className="flex items-center space-x-4">
      {/* Search */}
    
      
   
      
      {/* Profile */}
      <div className="relative">
        <div 
          className="flex items-center cursor-pointer"
          onClick={toggleProfilePopup}
        >
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium mr-2">
            {profileData.lastName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-gray-700">{profileData.name}</div>
            <div className="text-xs text-gray-500">{profileEmail.email}</div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
        
        {/* Profile Dropdown */}
        {showProfilePopup && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white shadow-xl rounded-lg z-30 border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium text-lg">
                  {profileData.lastName.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <div className="text-sm font-semibold text-gray-800">{profileData.name}</div>
                  <div className="text-xs text-gray-500">{profileEmail.email}</div>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                    <span className="text-xs font-medium text-green-600">Active</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="py-2">
              <div 
                className="px-4 py-2 flex items-center hover:bg-gray-50 transition-all duration-200 cursor-pointer" 
                onClick={openProfileModal}
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-50 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div className="ml-3 text-sm font-medium text-gray-700">My Profile</div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 py-2">
              <div 
                className="px-4 py-2 flex items-center hover:bg-red-50 text-red-600 transition-all duration-200 cursor-pointer" 
                onClick={handleLogout}
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </div>
                <div className="ml-3 text-sm font-medium">Logout</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>


      {/* Main Content */}
      <div className={`flex-1 p-3 ml-60 transition-all duration-700 ease-out ${mainContentAnimationClass}`}>
        <br></br><br></br>
        <div className="map-page">
          <div className="map-header">
            <h1 className="text-2xl font-semibold text-gray-800">Garbage Collection Sites</h1>

            {(!isAdding && !isEditing) ? (
              <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"

                onClick={handleAddPin}>Add Collection Site</button>
            ) : (
              <div className="pin-form">
                <input
                  type="text"
                  name="name"
                  placeholder="Site Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                <select
                  name="wasteType"
                  value={formData.wasteType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Waste Type</option>
                  <option value="General Waste">General Waste</option>
                  <option value="Recyclables">Recyclables</option>
                  <option value="Organic Waste">Organic Waste</option>
                  <option value="Hazardous Waste">Hazardous Waste</option>
                </select>
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  readOnly
                />
                <div className="form-buttons">
                  <button
                    onClick={handleSavePin}
                    disabled={!newPin || !formData.name || !formData.wasteType || loading}
                  >
                    {loading ? 'Saving...' : isEditing ? 'Update' : 'Save'}
                  </button>
                  <button onClick={handleCancelAdd}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              {error}
              {error.includes('Authentication required') && (
                <button
                  onClick={() => navigate('/login')}
                  className="text-blue-700 underline ml-4"
                >
                  Login
                </button>
              )}
            </div>
          )}

          <div className="map-container z-10">

            {loading && !isAdding && !isEditing && (
              <div className="loading-overlay">
                <span>Loading...</span>
              </div>
            )}

            <MapContainer
              center={[14.5995, 120.9842]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {(isAdding || isEditing) && <MapInteraction onPinPlace={handlePinPlace} />}

              {/* Display existing markers */}
              {markers.map((marker) => (
                <Marker key={marker.id} position={marker.position}>
                  <Popup>
                    <div className="marker-popup">
                      <h3>{marker.name}</h3>
                      <p><strong>Waste Type:</strong> {marker.wasteType}</p>
                      <p><strong>Address:</strong> {marker.address}</p>
                      <div className="marker-actions">
                        <button
                          className="edit-btn"
                          onClick={() => handleEditPin(marker)}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() => handleDeletePin(marker.locationId)}>Delete</button>

                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Display new pin being placed */}
              {newPin && (
                <Marker position={newPin.position}>
                  <Popup>
                    <div className="marker-popup">
                      <p>{isEditing ? 'Editing collection site' : 'New collection site'}</p>
                      {formData.name && <p><strong>Name:</strong> {formData.name}</p>}
                      {formData.wasteType && <p><strong>Waste Type:</strong> {formData.wasteType}</p>}
                      {formData.address && <p><strong>Address:</strong> {formData.address}</p>}
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {/* Instructions for add/edit mode */}
          {(isAdding || isEditing) && (
            <div className="map-instructions">
              <p>Click on the map to place the {isEditing ? 'updated' : 'new'} collection site location</p>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
{showProfileModal && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
      {/* Header with green accent similar to sidebar */}
      <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-green-50">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          My Profile
        </h3>
        <button
          className="bg-transparent border-none cursor-pointer flex items-center justify-center p-2 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all duration-200"
          onClick={() => setShowProfileModal(false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="p-6">
        {/* User info with green accent */}
        <div className="flex items-center mb-6 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium text-3xl mr-5 shadow-sm">
            {profileData.lastName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-xl font-semibold text-gray-800">{profileData.name}</div>
            <div className="text-sm text-gray-600">{profileData.role}</div>
            <div className="flex items-center mt-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
              <span className="text-xs font-medium text-green-600">Active</span>
              <span className="text-xs text-gray-400 ml-2">• Member since {profileData.joinDate}</span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Email Address</div>
                  <div className="text-sm font-medium text-gray-700">{profileEmail.email}</div>
                </div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Phone Number</div>
                  <div className="text-sm font-medium text-gray-700">{profileData.phone}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Work Information */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Work Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Department</div>
                  <div className="text-sm font-medium text-gray-700">{profileData.department}</div>
                </div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Office Address</div>
                  <div className="text-sm font-medium text-gray-700">{profileData.address}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
{/*
    
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account Settings</h4>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Password</div>
        
                </div>
              </div>
              <button className="text-xs text-green-600 font-medium hover:text-green-700 transition-all duration-200">
                Change
              </button>
            </div>
          </div>
        </div>*/}

        {/* Footer with buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
            onClick={() => setShowProfileModal(false)}
          >
            Close
          </button>
          {/*<button
            className="px-4 py-2 bg-green-600 border border-green-600 rounded-lg text-sm font-medium text-white hover:bg-green-700 transition-all duration-200"
          >
            Edit Profile
          </button>
          */}
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default MapPage; 