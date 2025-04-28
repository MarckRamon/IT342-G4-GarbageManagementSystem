import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
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
const MissedPickupPage = () => {
  const navigate = useNavigate();
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [missedPickups, setMissedPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduleId: '',
    reportDateTime: new Date().toISOString().substring(0, 16)
  });
  const [isLoading, setIsLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMissedId, setCurrentMissedId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [responseText, setResponseText] = useState('');
  const [profileEmail, setProfileEmail] = useState({
    email: ""
  });
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
  const handleApiError = (err) => {
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
  };
  useEffect(() => {
    setTimeout(() => {
      setPageLoaded(true);
    }, 100);

    const authToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    console.log('Auth Token:', authToken);
    console.log('User ID:', userId);

    if (!authToken || !userId) {
      console.log('Authentication information missing');
      setIsLoading(false);
      return;
    }

    // Set up auth interceptor
    const interceptor = api.interceptors.request.use(
      config => {
        config.headers.Authorization = `Bearer ${authToken}`;
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
    const loadAllData = async () => {
      try {
        setIsLoading(true);

        // Fetch user profile and email
        const profilePromise = fetchUserProfile(userId, authToken);
        const emailPromise = fetchUserEmail(userId, authToken);

        const [profileResponse, emailResponse] = await Promise.all([
          profilePromise,
          emailPromise
        ]);

        console.log('Profile data received:', profileResponse);
        console.log('Email data received:', emailResponse);

        // Update profile data
        if (profileResponse && profileResponse.success) {
          setProfileData({
            ...profileData,
            name: `${profileResponse.firstName} ${profileResponse.lastName}`,
            phone: profileResponse.phoneNumber,
            firstName: profileResponse.firstName,
            lastName: profileResponse.lastName
          });
        }

        // Update email data
        if (emailResponse && emailResponse.success) {
          setProfileEmail({
            email: emailResponse.email
          });
        }

        // Update schedules


        setIsLoading(false);
      } catch (err) {
        handleApiError(err);
        setIsLoading(false);
      }
    };
    loadAllData(); return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, []);
  // Stats for dashboard
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    resolved: 0
  });

  // Helper function to get auth token
  const getAuthHeader = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    setTimeout(() => {
      setPageLoaded(true);
    }, 100);

    fetchMissedPickups();
    fetchSchedules();
  }, []);

  useEffect(() => {
    // Calculate stats when missed pickups change
    if (missedPickups.length > 0) {
      const newStats = {
        total: missedPickups.length,
        pending: missedPickups.filter(p => p.status === 'pending').length,
        inProgress: missedPickups.filter(p => p.status === 'in-progress').length,
        resolved: missedPickups.filter(p => p.status === 'resolved').length
      };
      setStats(newStats);
    }
  }, [missedPickups]);

  const fetchMissedPickups = async () => {
    setLoading(true);
    try {
      const response = await api.get('/missed', {
        headers: getAuthHeader()
      });

      // Handle various response formats
      let pickups = [];
      if (Array.isArray(response.data)) {
        pickups = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        pickups = response.data.data;
      } else if (response.data && response.data.success && Array.isArray(response.data.missedPickups)) {
        pickups = response.data.missedPickups;
      }

      // Add status for demonstration if not present
      pickups = pickups.map(pickup => ({
        ...pickup,
        status: pickup.status || 'pending',
        urgency: pickup.urgency || (Math.random() > 0.7 ? 'high' : 'normal')
      }));

      setMissedPickups(pickups);
      setError(null);
    } catch (err) {
      console.error('Error fetching missed pickups:', err);
      setError('Failed to load missed pickups. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  const openProfileModal = () => {
    setShowProfilePopup(false);
    setShowProfileModal(true);
  };
  const fetchSchedules = async () => {
    try {
      const response = await api.get('/schedule', {
        headers: getAuthHeader()
      });

      let scheduleData = [];
      if (Array.isArray(response.data)) {
        scheduleData = response.data;
      } else if (response.data && response.data.success && Array.isArray(response.data.schedules)) {
        scheduleData = response.data.schedules;
      }

      setSchedules(scheduleData);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = {
        ...formData,
        userId: localStorage.getItem('userId') || 'current-user',
        status: 'pending'
      };

      let response;

      if (isEditing && currentMissedId) {
        response = await api.put(`/missed/${currentMissedId}`, payload, {
          headers: getAuthHeader()
        });

        // Update state with edited item
        setMissedPickups(missedPickups.map(pickup =>
          pickup.missedId === currentMissedId ? { ...payload, missedId: currentMissedId } : pickup
        ));
      } else {
        response = await api.post('/missed', payload, {
          headers: getAuthHeader()
        });

        // Get the new ID from response or generate temporary one
        const newId = response.data?.missedId || `temp-${Date.now()}`;

        // Add new item to state
        setMissedPickups([...missedPickups, { ...payload, missedId: newId }]);
      }

      // Close modal and reset form
      setShowModal(false);
      resetForm();
      setIsEditing(false);
      setCurrentMissedId(null);

    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to save data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (e) => {
    if (selectedPickup) {
      const updatedPickup = { ...selectedPickup, status: e.target.value };
      setSelectedPickup(updatedPickup);

      // Update in the main list too
      setMissedPickups(missedPickups.map(pickup =>
        pickup.missedId === selectedPickup.missedId ? updatedPickup : pickup
      ));

      // In a real app, you would also make an API call to update the status
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    navigate('/login');
  };
  const handleEdit = (pickup) => {
    setFormData({
      title: pickup.title || '',
      description: pickup.description || '',
      scheduleId: pickup.scheduleId || '',
      reportDateTime: pickup.reportDateTime ? pickup.reportDateTime.substring(0, 16) : new Date().toISOString().substring(0, 16)
    });

    setIsEditing(true);
    setCurrentMissedId(pickup.missedId);
    setShowModal(true);
  };

  const initiateDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);

      await api.delete(`/missed/${deleteId}`, {
        headers: getAuthHeader()
      });

      setMissedPickups(missedPickups.filter(pickup => pickup.missedId !== deleteId));
      if (selectedPickup && selectedPickup.missedId === deleteId) {
        setSelectedPickup(null);
      }
      setShowDeleteConfirm(false);
      setDeleteId(null);

    } catch (err) {
      console.error('Error deleting record:', err);
      setError('Failed to delete record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      scheduleId: '',
      reportDateTime: new Date().toISOString().substring(0, 16)
    });
  };

  const handlePickupClick = (pickup) => {
    setSelectedPickup(pickup);
    setResponseText(''); // Reset response text when selecting new pickup
  };

  const handleClosePickupDetail = () => {
    setSelectedPickup(null);
  };

  const filterPickups = () => {
    if (statusFilter === 'all') return missedPickups;
    return missedPickups.filter(pickup => pickup.status === statusFilter);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const mainContentAnimationClass = pageLoaded
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 translate-y-6';

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar would go here - same as your other pages */}
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
            <li className="flex items-center px-5 py-3 text-green-600 font-medium cursor-pointer transition-all duration-300 bg-green-50/30">
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
            <li className="flex items-center px-5 py-3 text-gray-500 font-medium cursor-pointer transition duration-300 hover:bg-[rgba(93,166,70,0.05)]">
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


        <div className="absolute bottom-0 left-0 w-full p-4 flex items-center border-t border-gray-200 bg-white cursor-pointer" onClick={() => setShowProfilePopup(!showProfilePopup)}>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 font-medium text-sm">{profileData.lastName.charAt(0).toUpperCase()}</div>          <div className="ml-3">
            <div className="text-sm font-medium">{profileData.name}</div>
            <div className="text-xs text-gray-500">{profileEmail.email}</div>
          </div>
        </div>

        {/* Profile Popup */}
        {showProfilePopup && (
          <div className="profile-popup absolute bottom-[70px] left-[10px] w-[220px] bg-white shadow-md rounded-lg z-30 border border-gray-200 overflow-hidden">
            <div className="py-3 px-4 flex items-center cursor-pointer hover:bg-[rgba(93,166,70,0.05)]" onClick={openProfileModal}>
              <div className="mr-3 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="text-sm text-gray-800">View Profile</div>
            </div>
            <div className="h-px bg-gray-200"></div>
            <div className="py-3 px-4 flex items-center cursor-pointer hover:bg-[rgba(93,166,70,0.05)]" onClick={handleLogout}>
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
      {/* Main Content */}
      <div className={`flex-1 ml-60 p-6 transition-all duration-700 ease-out ${mainContentAnimationClass}`}>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">Missed Collections</h1>
          <p className="text-slate-500">Manage and respond to reported missed waste collection incidents</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 mt-0.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            {/* Filter Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 mb-6 flex flex-wrap justify-between items-center">
              <h2 className="text-lg font-semibold mb-4"> Missed Pickup Reports</h2>
              <button
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                onClick={() => {
                  resetForm();
                  setIsEditing(false);
                  setCurrentMissedId(null);
                  setShowModal(true);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Report Missed Collection
              </button>
            </div>

            {/* Missed Collections List */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">


              {loading && missedPickups.length === 0 ? (
                <div className="flex justify-center items-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                </div>
              ) : filterPickups().length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  <p className="mt-4 text-slate-500">No missed pickups reported</p>
                  <button
                    className="mt-3 px-4 py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium"
                    onClick={() => {
                      resetForm();
                      setIsEditing(false);
                      setCurrentMissedId(null);
                      setShowModal(true);
                    }}
                  >
                    Report Missed Collection
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filterPickups().map((pickup) => (
                    <li
                      key={pickup.missedId}
                      className={`p-4 transition-colors duration-200 hover:bg-slate-50 cursor-pointer ${selectedPickup && selectedPickup.missedId === pickup.missedId ? 'bg-slate-50' : ''}`}
                      onClick={() => handlePickupClick(pickup)}
                    >
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <h3 className="font-medium text-slate-900">{pickup.title}</h3>


                          </div>
                          <p className="text-sm text-slate-500 line-clamp-2">{pickup.description || 'No description provided'}</p>
                          <div className="flex items-center mt-1 text-xs text-slate-400">
                            <span className="mr-3">
                              Schedule: {schedules.find(s => s.id === pickup.scheduleId)?.location || pickup.scheduleId}
                            </span>
                            <span>
                              Reported: {pickup.reportDateTime ? format(parseISO(pickup.reportDateTime), 'MMM d, yyyy') : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center mt-2 md:mt-0">
                          <div className="text-xs text-slate-500 mr-6">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                              </svg>
                              {pickup.userId || 'Anonymous User'}
                            </div>
                          </div>
                          <button className="text-slate-400 hover:text-slate-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Stats and Detail View */}
          <div className="col-span-1">
            {selectedPickup ? (
              <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden sticky top-4">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Report Details</h2>
                  <button
                    className="text-slate-400 hover:text-slate-600"
                    onClick={handleClosePickupDetail}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div className="p-4">

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <div className="p-2 bg-slate-50 rounded-md text-slate-800">
                      {selectedPickup.title}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <div className="p-2 bg-slate-50 rounded-md text-slate-800 h-32 overflow-y-auto">
                      {selectedPickup.description || 'No description provided'}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Schedule ID</label>
                    <div className="p-2 bg-slate-50 rounded-md text-slate-800">
                      {selectedPickup.scheduleId || 'Not specified'}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Report Date</label>
                    <div className="p-2 bg-slate-50 rounded-md text-slate-800">
                      {selectedPickup.reportDateTime ? format(parseISO(selectedPickup.reportDateTime), 'MMM d, yyyy h:mm a') : 'N/A'}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">User ID</label>
                    <div className="p-2 bg-slate-50 rounded-md text-slate-800">
                      {selectedPickup.userId || 'Anonymous User'}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      className="flex-1 py-2 px-4 bg-green-600 rounded-md text-sm font-medium text-white hover:bg-green-700 transition-all duration-200"
                      onClick={() => handleEdit(selectedPickup)}
                    >
                      Edit Report
                    </button>
                    <button
                      className="py-2 px-4 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100 transition-all duration-200"
                      onClick={() => initiateDelete(selectedPickup.missedId)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h2 className="text-lg font-semibold">Click a list to view in detail</h2>
                </div>

                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border-t border-slate-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <p className="mt-2 text-slate-500 text-sm">Select a report to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-800">
                  {isEditing ? 'Edit Missed Collection Report' : 'Report Missed Collection'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    placeholder="Brief title for the missed collection"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    placeholder="Provide details about the missed collection"
                    rows="3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Schedule</label>
                  <select
                    name="scheduleId"
                    value={formData.scheduleId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select a schedule</option>
                    {schedules.map((schedule) => (
                      <option key={schedule.id} value={schedule.id}>
                        {schedule.location || schedule.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time of Missed Collection</label>
                  <input
                    type="datetime-local"
                    name="reportDateTime"
                    value={formData.reportDateTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : isEditing ? 'Update Report' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-red-500 mb-4">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Confirmation</h3>
              <p className="text-slate-600 mb-6">Are you sure you want to delete this report? This action cannot be undone.</p>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default MissedPickupPage;