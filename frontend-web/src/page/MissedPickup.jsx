import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
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
const MissedPickupPage = () => {
  const navigate = useNavigate();
  const [userEmails, setUserEmails] = useState({});

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleSearchTerm, setScheduleSearchTerm] = useState('');
  const [useScheduleDateTime, setUseScheduleDateTime] = useState(false);
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
  useEffect(() => {
    // Fetch emails for all unique userIds in missed pickups
    if (missedPickups.length > 0) {
      const uniqueUserIds = [...new Set(missedPickups.map(pickup => pickup.userId).filter(Boolean))];
      uniqueUserIds.forEach(userId => {
        fetchUserEmail1(userId);
      });
    }
  }, [missedPickups]);
  const fetchUserEmail1 = async (userId) => {
    if (!userId || userEmails[userId]) return; // Skip if no userId or already fetched
    
    try {
      const response = await api.get(`/users/${userId}/profile/email`, {
        headers: getAuthHeader()
      });
      
      if (response.data && response.data.success) {
        setUserEmails(prev => ({
          ...prev,
          [userId]: response.data.email
        }));
      }
    } catch (err) {
      console.error(`Failed to fetch email for user ${userId}:`, err);
      // Don't set error state here to avoid disrupting the UI
    }
  };
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
  const toggleProfilePopup = () => {
    setShowProfilePopup(!showProfilePopup);
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

      // Create the payload - if using schedule datetime, use the schedule's data
      const payload = {
        ...formData,
        userId: localStorage.getItem('userId') || 'current-user',
        status: 'pending'
      };

      if (useScheduleDateTime && selectedSchedule) {
        // Convert schedule's date and time to ISO format for reportDateTime
        const dateStr = selectedSchedule.pickupDate;
        const timeStr = selectedSchedule.pickupTime;
        
        // Parse the date and time strings to create a Date object
        const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
        let hours = 0;
        let minutes = 0;
        
        // Parse time - handle both 12-hour and 24-hour formats
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          const timeParts = timeStr.replace(/\s*(AM|PM)/i, '').split(':');
          hours = parseInt(timeParts[0], 10);
          minutes = parseInt(timeParts[1], 10);
          
          // Adjust hours for PM
          if (timeStr.includes('PM') && hours < 12) {
            hours += 12;
          }
          // Adjust for 12 AM
          if (timeStr.includes('AM') && hours === 12) {
            hours = 0;
          }
        } else {
          const timeParts = timeStr.split(':');
          hours = parseInt(timeParts[0], 10);
          minutes = parseInt(timeParts[1], 10);
        }
        
        // Create the date object and convert to ISO string
        const date = new Date(year, month - 1, day, hours, minutes);
        payload.reportDateTime = date.toISOString().substring(0, 16);
      }

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
  const openScheduleSelector = () => {
    setShowScheduleModal(true);
    setScheduleSearchTerm('');
  };
  const filteredSchedules = schedules.filter(schedule => {
    if (!scheduleSearchTerm) return true;
    
    const searchLower = scheduleSearchTerm.toLowerCase();
    return (
      (schedule.title && schedule.title.toLowerCase().includes(searchLower)) ||
      (schedule.locationId && schedule.locationId.toLowerCase().includes(searchLower)) ||
      (schedule.pickupDate && schedule.pickupDate.includes(searchLower)) ||
      (schedule.pickupTime && schedule.pickupTime.toLowerCase().includes(searchLower))
    );
  });
  const handleScheduleSelect = (schedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      ...formData,
      scheduleId: schedule.scheduleId,
      title: formData.title || schedule.title || ''
    });
    setShowScheduleModal(false);
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

    // Find the corresponding schedule if exists
    const schedule = schedules.find(s => s.scheduleId === pickup.scheduleId);
    if (schedule) {
      setSelectedSchedule(schedule);
    } else {
      setSelectedSchedule(null);
    }
    
    setUseScheduleDateTime(false);
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
    setSelectedSchedule(null);
    setUseScheduleDateTime(false);
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
            className="flex items-center px-4 py-2.5 text-green-600 font-medium bg-green-50 rounded-lg shadow-sm border-l-4 border-green-600 transition-all duration-200"        
          >
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">              <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
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
            className="flex items-center px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            to="/users" 
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
        <span className="text-green-600 font-medium">Missed Pickup</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-500">Overview</span>
      </div>
    </div>
    
    {/* Right side - Search, notifications, profile */}
    <div className="flex items-center space-x-4">
      
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
      <div className={`flex-1 ml-60 p-6 transition-all duration-700 ease-out ${mainContentAnimationClass}`}>
      <br></br><br></br>

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
      {pickup.userId && userEmails[pickup.userId] ? (
        <span title={pickup.userId}>{userEmails[pickup.userId]}</span>
      ) : (
        <span>{pickup.userId || 'Anonymous User'}</span>
      )}
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
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        readOnly
                        value={selectedSchedule ? `${selectedSchedule.title} (${selectedSchedule.pickupDate}, ${selectedSchedule.pickupTime})` : 'No schedule selected'}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 bg-slate-50 cursor-pointer"
                        onClick={openScheduleSelector}
                      />
                      <input
                        type="hidden"
                        name="scheduleId"
                        value={formData.scheduleId}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={openScheduleSelector}
                      className="px-3 py-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors duration-200"
                    >
                      Select
                    </button>
                  </div>
                  {selectedSchedule && (
                    <div className="mt-2 text-sm text-slate-500">
                      Location ID: {selectedSchedule.locationId} | Status: {selectedSchedule.status}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="useScheduleDateTime"
                      checked={useScheduleDateTime}
                      onChange={() => setUseScheduleDateTime(!useScheduleDateTime)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-slate-300 rounded"
                      disabled={!selectedSchedule}
                    />
                    <label htmlFor="useScheduleDateTime" className="ml-2 block text-sm font-medium text-slate-700">
                      Use schedule date and time
                    </label>
                  </div>
                  
                  <div className={useScheduleDateTime ? "opacity-50 pointer-events-none" : ""}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time of Missed Collection</label>
                    <input
                      type="datetime-local"
                      name="reportDateTime"
                      value={formData.reportDateTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      required={!useScheduleDateTime}
                      disabled={useScheduleDateTime}
                    />
                  </div>
                  
                  {useScheduleDateTime && selectedSchedule && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded-md text-sm text-green-700">
                      Using schedule datetime: {selectedSchedule.pickupDate} at {selectedSchedule.pickupTime}
                    </div>
                  )}
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
                  disabled={loading || (!formData.scheduleId)}
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
       {/* Schedule Selection Modal */}
       {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Select Schedule</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search schedules by title, date, time..."
                  className="w-full pl-10 pr-4 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  value={scheduleSearchTerm}
                  onChange={(e) => setScheduleSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center p-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                </div>
              ) : filteredSchedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <p className="mt-2 text-slate-500">No matching schedules found</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filteredSchedules.map((schedule) => (
                    <li 
                      key={schedule.scheduleId}
                      className="p-4 hover:bg-slate-50 cursor-pointer transition-colors duration-150"
                      onClick={() => handleScheduleSelect(schedule)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-slate-900">{schedule.title || 'Untitled Schedule'}</h3>
                          <div className="mt-1 text-sm text-slate-500">
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                  <line x1="16" y1="2" x2="16" y2="6"></line>
                                  <line x1="8" y1="2" x2="8" y2="6"></line>
                                  <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                {schedule.pickupDate}
                              </span>
                              <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                {schedule.pickupTime}
                              </span>
                            </div>
                            <div className="mt-1">
                              <span className="text-xs">Location ID: {schedule.locationId}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full uppercase ${
                          schedule.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          schedule.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {schedule.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors duration-200"
                >
                  Cancel
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