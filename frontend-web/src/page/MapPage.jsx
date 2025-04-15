import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../styles/MapPage.css';

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
  
  // Profile data object
  const profileData = {
    name: "Primo Christian",
    email: "primoMontejo@gmail.com",
    role: "Waste Collection Manager",
    phone: "+1 (555) 123-4567",
    address: "123 Green Street, Eco City, EC 12345",
    joinDate: "January 15, 2021",
    department: "Field Operations"
  };
  
  // Fetch all pickup locations from API
  useEffect(() => {
    const fetchPickupLocations = async () => {
      setLoading(true);
      setError(null);
      try {
        // GET request doesn't need authentication according to controller comments
        const response = await axios.get(API_URL);
        if (response.data.success) {
          // Transform the data to match our marker format
          const transformedMarkers = response.data.locations.map(location => ({
            id: location.id,
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
    setEditingMarkerId(marker.id);
    setNewPin({ position: marker.position });
    setFormData({
      name: marker.name,
      wasteType: marker.wasteType,
      address: marker.address
    });
  };
  
  const handleDeletePin = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      // DELETE request needs JWT token
      const response = await axios.delete(`${API_URL}/${id}`, {
        headers: getAuthHeader()
      });
      
      if (response.data.success) {
        // Remove the marker from the state
        const updatedMarkers = markers.filter(marker => marker.id !== id);
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
              marker.id === editingMarkerId 
                ? {
                    id: updatedLocation.id || editingMarkerId, // Use existing ID as fallback
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
            const newId = newLocation.id || Date.now();
            
            // Add the new marker to the state
            const newMarker = {
              id: newId,
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
    // Clear localStorage, sessionStorage, and any authentication tokens
    localStorage.clear();
    sessionStorage.clear();

    // Optional: show alert or toast for better UX
    // alert('You have been logged out'); // or use toast library

    // Redirect to login
    navigate('/login');
};
  
  return (

    <div className="flex min-h-screen">
  
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
            <li className="flex items-center px-5 py-3 text-[#5da646] font-medium cursor-pointer transition duration-300 bg-[rgba(93,166,70,0.08)]">
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
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 font-medium text-sm">P</div>
          <div className="ml-3">
            <div className="text-sm font-medium">Primo Christian</div>
            <div className="text-xs text-gray-500">primoMontejo@gmail.com</div>
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
      <div className="flex-1 ml-60">
        <div className="map-page">
          <div className="map-header">
            
            <h1>Garbage Collection Sites</h1>
            {(!isAdding && !isEditing) ? (
              <button className="add-pin-btn" onClick={handleAddPin}>Add Collection Site</button>
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
                          onClick={() => handleDeletePin(marker.id)}
                          disabled={loading}
                        >
                          {loading ? 'Deleting...' : 'Delete'}
                        </button>
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
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setShowProfileModal(false)}>
    <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Profile Information</h3>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowProfileModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-medium text-xl">P</div>
                <div className="ml-4">
                  <div className="text-xl font-semibold">{profileData.name}</div>
                  <div className="text-sm text-gray-500">{profileData.role}</div>
                </div>
              </div>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-500">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <span>{profileData.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-500">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <span>{profileData.email}</span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-500">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>{profileData.address}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Work Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-500">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                    <span>{profileData.department}</span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-500">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>Joined on {profileData.joinDate}</span>
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-gray-200 flex justify-end">
                            <button 
                                className="px-4 py-2 rounded-md text-sm font-medium border border-gray-200 bg-transparent text-gray-800 mr-3 cursor-pointer transition-all duration-200 hover:bg-gray-100" 
                                onClick={() => setShowProfileModal(false)}
                            >
                                Close
                            </button>
                            <button 
                                className="px-4 py-2 rounded-md text-sm font-medium bg-[#5da646] text-white border-none cursor-pointer transition-all duration-200 hover:bg-[#40752f]"
                            >
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