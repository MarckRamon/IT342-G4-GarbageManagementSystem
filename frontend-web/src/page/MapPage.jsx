import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../styles/MapPage.css';
const API_BASE_URL = 'http://localhost:8080/api';


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
const API_URL = 'http://localhost:8080/api/pickup-locations';

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
  const [profileEmail, setProfileEmail]= useState({
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
    const loadUserEmail = async () =>{
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
      <div className="fixed w-60 h-screen bg-white border-r border-gray-200 shadow-sm z-10 left-0 top-0">
        <div className="p-5 border-b border-gray-200">
          <div className="text-2xl font-bold text-[#5da646]">Vermigo Admin</div>
        </div>
        <div className="py-5">
          <ul className="list-none">
            <li className="flex items-center px-5 py-3 text-gray-500 font-medium cursor-pointer transition duration-300 hover:bg-[rgba(93,166,70,0.05)]">
              <Link to="/dashboard" className="flex items-center no-underline text-inherit">
                <span className="mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </span>
                Dashboard
              </Link>
            </li>
            <li className="flex items-center px-5 py-3 text-gray-500 font-medium cursor-pointer transition duration-300 hover:bg-[rgba(93,166,70,0.05)]">
              <Link to="/complaints" className="flex items-center no-underline text-inherit">
              <span className="mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </span>
                Complaints
              </Link>
            </li>
            <li className="flex items-center px-5 py-3 text-gray-500 font-medium cursor-pointer transition duration-300 hover:bg-[rgba(93,166,70,0.05)]">
              <Link to="/missedPickup" className="flex items-center no-underline text-inherit">
                <span className="mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
  <path d="M3 8h18"></path>
  <line x1="8" y1="2" x2="8" y2="6"></line>
  <line x1="16" y1="2" x2="16" y2="6"></line>
  <line x1="12" y1="12" x2="12" y2="16"></line>
  <line x1="10" y1="14" x2="14" y2="14"></line>
  <line x1="18" y1="6" x2="6" y2="18"></line>
  <line x1="6" y1="6" x2="18" y2="18"></line>
</svg>
                </span>
                Missed Pickups
              </Link>
            </li>
            <li className="flex items-center px-5 py-3 text-gray-500 font-medium cursor-pointer transition duration-300 hover:bg-[rgba(93,166,70,0.05)]">
              <Link to="/schedule" className="flex items-center no-underline text-inherit">
                <span className="mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </span>
                Collection Schedule
              </Link>
            </li>
            <li className="flex items-center px-5 py-3 text-slate-500 font-medium cursor-pointer transition-all duration-300 hover:bg-green-50/20">
              <Link to="/history" className="flex items-center no-underline text-inherit">
                <span className="mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </span>
                Collection History
              </Link>
            </li>
            <li className="flex items-center px-5 py-3 text-green-600 font-medium cursor-pointer transition-all duration-300 bg-green-50/30">
              <Link to="/map" className="flex items-center no-underline text-inherit">
                <span className="mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </span>
                Collection Sites Map
              </Link>
            </li>
          </ul>
        </div>
        <div className="fixed bottom-0 left-0 w-60 p-4 flex items-center border-t border-gray-200 bg-white cursor-pointer" onClick={toggleProfilePopup}>
        {/* User Info with Clickable Profile */}
        <div className="fixed bottom-0 left-0 w-60 p-4 flex items-center border-t border-gray-200 bg-white cursor-pointer" onClick={toggleProfilePopup}>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 font-medium text-sm">{profileData.lastName.charAt(0).toUpperCase()}</div>
                    <div className="ml-3">
                        <div className="text-sm font-medium">{profileData.name}</div>
                        <div className="text-xs text-gray-500">{profileEmail.email}</div>
                    </div>

                </div>
          
          {/* Profile Popup */}
 

{showProfilePopup && (
  <div className="absolute bottom-16 left-2.5 w-56 bg-white shadow-md rounded-lg z-50 border border-gray-200 overflow-hidden">
    <div className="p-3 flex items-center cursor-pointer hover:bg-[rgba(93,166,70,0.05)] transition duration-200" onClick={openProfileModal}>
      <div className="mr-3 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
      <div className="text-sm text-gray-800">View Profile</div>
    </div>
    <div className="h-px bg-gray-200"></div>
    <div className="p-3 flex items-center cursor-pointer hover:bg-[rgba(93,166,70,0.05)] transition duration-200" onClick={handleLogout}>
      <div className="mr-3 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </div>
      <div className="text-sm text-gray-800">Logout</div>
    </div>
  </div>
)}
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 p-3 ml-60 transition-all duration-700 ease-out ${mainContentAnimationClass}`}>
        <div className="map-page">
          <div className="map-header">
          <h1 className="text-2xl font-semibold text-gray-800">Garbage Collection Sites</h1>

            {(!isAdding && !isEditing) ? (
              <button       className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"

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
          <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-slate-200">
              <h3 className="text-xl font-semibold">Profile</h3>
              <button 
                className="bg-transparent border-none cursor-pointer flex items-center justify-center p-2 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                onClick={() => setShowProfileModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="p-5">
              <div className="flex items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 font-medium text-2xl mr-5">
                {profileData.lastName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xl font-semibold">{profileData.name}</div>
                  <div className="text-sm text-slate-500">{profileData.role}</div>
                  <div className="text-xs text-slate-400 mt-1">Member since {profileData.joinDate}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Email</div>
                  <div className="text-sm">{profileEmail.email}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Phone</div>
                  <div className="text-sm">{profileData.phone}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Department</div>
                  <div className="text-sm">{profileData.department}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Address</div>
                  <div className="text-sm">{profileData.address}</div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button 
                  className="px-4 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => setShowProfileModal(false)}
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-green-600 rounded-md text-sm font-medium text-white hover:bg-green-700">
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default MapPage; 