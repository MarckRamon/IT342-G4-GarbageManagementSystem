import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'https://it342-g4-garbagemanagementsystem-kflf.onrender.com/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL
});
const fetchLocations = async () => {
  try {
    const response = await api.get('/pickup-locations');
    return response.data;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
};
// API functions for history records
const fetchHistoryRecords = async () => {
  try {
    const authToken = localStorage.getItem('authToken');
    const response = await api.get('/history', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching history records:', error);
    throw error;
  }
};

const addHistoryRecord = async (historyData) => {
  try {
    const authToken = localStorage.getItem('authToken');
    const response = await api.post('/history', historyData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error adding history record:', error);
    throw error;
  }
};

// Fetch schedules for dropdown selection
const fetchSchedules = async () => {
  try {
    const authToken = localStorage.getItem('authToken');
    const response = await api.get('/schedule', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching schedules:', error);
    throw error;
  }
};

const HistoryPage = () => {
  
// Add these state variables to the existing state declarations in HistoryPage component
const [filters, setFilters] = useState({
  dateFrom: '',
  dateTo: '',
  locationId: '',
  scheduleId: '',
  status: '' // Assuming history records might have a status field
});
const [filteredHistoryRecords, setFilteredHistoryRecords] = useState([]);
const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
const [showFilters, setShowFilters] = useState(false);
  const [locations, setLocations] = useState([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleFilter, setScheduleFilter] = useState('');
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const navigate = useNavigate();
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [formData, setFormData] = useState({
    collectionDate: '',
    scheduleId: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageLoaded, setPageLoaded] = useState(false);
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
  const [profileEmail, setProfileEmail] = useState({
    email: ""
  });
  const handleScheduleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setScheduleFilter(searchTerm);

    if (!searchTerm) {
      setFilteredSchedules(schedules);
      return;
    }

    const filtered = schedules.filter(schedule =>
      (schedule.scheduleId && schedule.scheduleId.toLowerCase().includes(searchTerm)) ||
      (schedule.pickupDate && schedule.pickupDate.toLowerCase().includes(searchTerm)) ||
      (schedule.pickupTime && schedule.pickupTime.toLowerCase().includes(searchTerm)) ||
      (schedule.locationId && schedule.locationId.toLowerCase().includes(searchTerm)) // If you want to include locationId
    );

    setFilteredSchedules(filtered);
  };
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

  // Fetch data on component mount
  useEffect(() => {
    setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    const loadLocations = async () => {
      try {
        const locationsData = await fetchLocations();
        console.log('Locations received:', locationsData);

        // Check if the response contains the locations array
        if (locationsData && locationsData.success) {
          setLocations(locationsData.locations); // Set the locations state
          console.log('Locations state set:', locationsData.locations); // Log the locations array
        } else {
          console.error('Failed to load locations:', locationsData.message);
        }
      } catch (err) {
        console.error("Error loading locations:", err);
      }
    };

    loadLocations();
    // Retrieve authToken and userId from localStorage
    const authToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    // Log the values to the console
    console.log('Auth Token:', authToken);
    console.log('User ID:', userId);

    // Check if both values are present
    if (!authToken || !userId) {
      console.log('Authentication information missing');
      setLoading(false);
      return;
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

    const loadUserProfile = async () => {
      try {
        setLoading(true);
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

        setLoading(false);
      } catch (err) {
        console.error("Error loading profile:", err);
        setLoading(false);
      }
    };

    const loadUserEmail = async () => {
      try {
        const profileEmailResponse = await fetchUserEmail(userId, authToken);
        console.log('Profile email received:', profileEmailResponse);

        if (profileEmailResponse && profileEmailResponse.success) {
          setProfileEmail({
            email: profileEmailResponse.email
          });
        }
      } catch (err) {
        console.error("Error loading email:", err);
      }
    };

    const loadHistoryRecords = async () => {
      try {
        setLoading(true);
        const historyResponse = await fetchHistoryRecords();
        console.log('History records received:', historyResponse);

        // FIX: Check for both success property and if response is an array
        if (historyResponse && Array.isArray(historyResponse)) {
          // Directly use the array of records
          setHistoryRecords(historyResponse);
        } else if (historyResponse && historyResponse.success && Array.isArray(historyResponse.records)) {
          // If the API returns a success property and records array
          setHistoryRecords(historyResponse.records);
        } else {
          // If we don't get valid data but no error was thrown
          setError('Failed to load history records');
        }
        setLoading(false);
      } catch (err) {
        console.error("Error loading history:", err);
        setError('Error fetching history records');
        setLoading(false);
      }
    };

    const loadSchedules = async () => {
      try {
        const schedulesResponse = await fetchSchedules();
        console.log('Schedules received:', schedulesResponse);
        setSchedules(schedulesResponse);
        if (schedulesResponse && schedulesResponse.success) {
          setSchedules(schedulesResponse.schedules || []);

        }
      } catch (err) {
        console.error("Error loading schedules:", err);
      }
    };

    // Load all data
    if (authToken && userId) {
      loadUserProfile();
      loadUserEmail();
      loadHistoryRecords();
      loadSchedules();
    }

    // Clean up interceptor when component unmounts
    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddRecord = () => {
    setIsAdding(true);
    setIsEditing(false);
    setEditingRecordId(null);
    setFormData({
      collectionDate: new Date().toISOString().split('T')[0], // Default to today
      scheduleId: '',
      notes: ''
    });
  };
  const getSiteNameFromLocationId = (locationId) => {
    if (!locationId) return null;

    // Check if locations is an array
    if (Array.isArray(locations)) {
      const location = locations.find(loc => loc.locationId === locationId);
      return location ? location.siteName : null;
    } else {
      console.error('locations is not an array', locations);
      return null;
    }
  };
  const handleDeleteRecord = async (historyId) => {
    // Confirm deletion with user
    if (!window.confirm("Are you sure you want to delete this record?")) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await deleteHistoryRecord(historyId);

      if (response && response.success) {
        // Remove the record from the state
        const updatedRecords = historyRecords.filter(record => record.historyId !== historyId);
        setHistoryRecords(updatedRecords);
      } else {
        setError(response?.message || 'Failed to delete history record');
      }
    } catch (err) {
      console.error('Error deleting history record:', err);
      setError('Error deleting history record. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  const handleEditRecord = (record) => {
    setIsEditing(true);
    setIsAdding(false);
    setEditingRecordId(record.historyId);
    setFormData({
      collectionDate: record.collectionDate ? record.collectionDate.split('T')[0] : '',
      scheduleId: record.scheduleId,
      notes: record.notes || ''
    });
  };
  const handleCancelAdd = () => {
    setIsAdding(false);
    setIsEditing(false);
    setEditingRecordId(null);
    setFormData({
      collectionDate: '',
      scheduleId: '',
      notes: ''
    });
  };

  const handleSaveRecord = async () => {
    if (formData.collectionDate && formData.scheduleId) {
      try {
        setLoading(true);
        setError(null);

        let response;

        if (isEditing && editingRecordId) {
          // Update existing record
          response = await updateHistoryRecord(editingRecordId, formData);

          if (response && response.success) {
            // Update the record in the state
            const updatedRecords = historyRecords.map(record =>
              record.historyId === editingRecordId
                ? { ...record, ...formData }
                : record
            );

            setHistoryRecords(updatedRecords);
          } else {
            setError(response?.message || 'Failed to update history record');
          }
        } else {
          // Create new record
          response = await addHistoryRecord(formData);

          if (response && response.success) {
            // Add the new record to the state
            const newRecord = response.record || { ...formData, historyId: Date.now().toString() };
            setHistoryRecords([...historyRecords, newRecord]);
          } else {
            setError(response?.message || 'Failed to create history record');
          }
        }

        // Reset form and state if no error
        if (!error) {
          setIsAdding(false);
          setIsEditing(false);
          setEditingRecordId(null);
          setFormData({
            collectionDate: '',
            scheduleId: '',
            notes: ''
          });
        }
      } catch (err) {
        console.error('Error saving history record:', err);
        setError('Error saving history record. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
  };
  const selectSchedule = (schedule) => {
    setFormData({
      ...formData,
      scheduleId: schedule.scheduleId
    });
    setShowScheduleModal(false);
  };
  const toggleProfilePopup = () => {
    setShowProfilePopup(!showProfilePopup);
  };
  const openScheduleModal = () => {
    if (schedules.length > 0) {
      setFilteredSchedules(schedules);
    } else {
      console.log('Schedules are not loaded yet.');
    }
    setScheduleFilter('');
    setShowScheduleModal(true);
  };
  const openProfileModal = () => {
    setShowProfilePopup(false);
    setShowProfileModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    navigate('/login');
  };
  const handleOpenScheduleModal = () => {
    setIsScheduleModalOpen(true);
  };

  const handleCloseScheduleModal = () => {
    setIsScheduleModalOpen(false);
  };

  const handleSelectSchedule = (schedule) => {
    setFormData({
      ...formData,
      scheduleId: schedule.scheduleId
    });
  };
  const mainContentAnimationClass = pageLoaded
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 translate-y-6';

  const ScheduleSelectModal = ({ isOpen, onClose, onSelectSchedule, schedules }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredSchedules, setFilteredSchedules] = useState([]);

    // When modal opens or schedules change, update filtered schedules
    useEffect(() => {
      if (isOpen && Array.isArray(schedules)) {
        setFilteredSchedules(schedules);
      }
    }, [isOpen, schedules]);

    // Filter schedules based on search term
    useEffect(() => {
      if (Array.isArray(schedules)) {
        const filtered = schedules.filter(schedule =>
          (getSiteNameFromLocationId(schedule.locationId)?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (schedule.siteName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (schedule.pickupDate?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (schedule.pickupTime?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (schedule.status?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (schedule.scheduleId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
        setFilteredSchedules(filtered);
      }
    }, [searchTerm, schedules]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-96 flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Select Schedule</h3>
            <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search schedules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="overflow-y-auto flex-grow">
            {filteredSchedules && filteredSchedules.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredSchedules.map(schedule => {
                  // Get site name from location data
                  const siteName = getSiteNameFromLocationId(schedule.locationId) || schedule.siteName || 'Unknown Location';

                  return (
                    <div
                      key={schedule.scheduleId}
                      className="p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        onSelectSchedule(schedule);
                        onClose();
                      }}
                    >
                      <div className="font-medium">{siteName}</div>
                      <div className="text-sm text-gray-500 truncate">
                        {schedule.pickupDate || 'No Date'} • {schedule.pickupTime || 'No Time'}
                      </div>
                      <div className="text-xs mt-1">
                        {schedule.status && (
                          <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${schedule.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              schedule.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'}`}>
                            {schedule.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">No schedules found</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    // If no filters are active, show all records
    if (!filters.dateFrom && !filters.dateTo && !filters.locationId && !filters.scheduleId && !filters.status) {
      setFilteredHistoryRecords(historyRecords);
      return;
    }
  
    // Apply filters
    const filtered = historyRecords.filter(record => {
      // Date filtering
      if (filters.dateFrom || filters.dateTo) {
        const recordDate = new Date(record.collectionDate);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : new Date(0);
        const toDate = filters.dateTo ? new Date(filters.dateTo) : new Date(8640000000000000); // Max date
        
        if (recordDate < fromDate || recordDate > toDate) {
          return false;
        }
      }
  
      // Schedule filtering
      if (filters.scheduleId && record.scheduleId !== filters.scheduleId) {
        return false;
      }
  
      // Location filtering - assuming schedules are linked to locations
      if (filters.locationId && schedules.find(s => s.scheduleId === record.scheduleId)?.locationId !== filters.locationId) {
        return false;
      }
  
      // Status filtering
      if (filters.status && record.status !== filters.status) {
        return false;
      }
  
      return true;
    });
  
    setFilteredHistoryRecords(filtered);
  }, [historyRecords, filters, schedules]);
  
  // Add this handler to update filter state
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // Add this handler to clear all filters
  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      locationId: '',
      scheduleId: '',
      status: ''
    });
  };
  
  // Add this function to toggle the filter panel
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
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
            className="flex items-center px-4 py-2.5 text-green-600 font-medium bg-green-50 rounded-lg shadow-sm border-l-4 border-green-600 transition-all duration-200"                    >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <span className="text-green-600 font-medium">History</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-500">Data</span>
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


      {/* Main Content - Improved design */}
      <div className={`flex-1 ml-60 p-6 transition-all duration-700 ease-out ${mainContentAnimationClass}`}>
        <br></br>
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Header with Actions */}
          {/* Filter panel */}
{showFilters && (
  <div className="bg-white p-4 mb-6 rounded-lg border border-gray-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium text-gray-800">Filter History Records</h3>
      <button
        onClick={clearFilters}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Clear all filters
      </button>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Date range filters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
        <input
          type="date"
          name="dateFrom"
          value={filters.dateFrom}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#5da646] focus:border-[#5da646]"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
        <input
          type="date"
          name="dateTo"
          value={filters.dateTo}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#5da646] focus:border-[#5da646]"
        />
      </div>
      
      {/* Location filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <select
          name="locationId"
          value={filters.locationId}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#5da646] focus:border-[#5da646]"
        >
          <option value="">All Locations</option>
          {locations.map(location => (
            <option key={location.locationId} value={location.locationId}>
              {location.siteName}
            </option>
          ))}
        </select>
      </div>
      
      {/* Schedule filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
        <select
          name="scheduleId"
          value={filters.scheduleId}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#5da646] focus:border-[#5da646]"
        >
          <option value="">All Schedules</option>
          {schedules.map(schedule => (
            <option key={schedule.scheduleId} value={schedule.scheduleId}>
              {getSiteNameFromLocationId(schedule.locationId) || schedule.siteName || 'Unknown'} - {schedule.pickupDate || 'No Date'}
            </option>
          ))}
        </select>
      </div>
      
      {/* Status filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#5da646] focus:border-[#5da646]"
        >
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
    </div>
    
    {/* Filter summary and results count */}
    <div className="mt-4 pt-3 border-t border-gray-200 text-sm text-gray-600">
      {filteredHistoryRecords.length} records found
      {(filters.dateFrom || filters.dateTo || filters.locationId || filters.scheduleId || filters.status) && 
        " matching your filters"}
    </div>
  </div>
)}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-100">
  <h1 className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">
    Collection History
  </h1>

  {/* Buttons container */}
  {(!isAdding && !isEditing) && (
    <div className="flex gap-2">
      <button
        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        onClick={handleAddRecord}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add History Record
      </button>

      <button
        onClick={toggleFilters}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </button>
      
    </div>

    
  )}

  
</div>
         
          
          {/* Form for Add/Edit */}
          {(isAdding || isEditing) && (
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 mb-6">
              <h2 className="text-lg font-medium text-gray-700 mb-4">
                {isEditing ? 'Edit History Record' : 'Add New History Record'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection Date</label>
                  <input
                    type="date"
                    name="collectionDate"
                    value={formData.collectionDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#5da646] focus:border-[#5da646]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                  <button
                    type="button"
                    onClick={handleOpenScheduleModal}
                    className="w-full flex justify-between items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-left focus:outline-none focus:ring-1 focus:ring-[#5da646] focus:border-[#5da646]"
                  >
                    <span className="truncate text-gray-700">
                      {formData.scheduleId
                        ? (getSiteNameFromLocationId(schedules.find(s => s.scheduleId === formData.scheduleId)?.locationId) ||
                          schedules.find(s => s.scheduleId === formData.scheduleId)?.siteName ||
                          formData.scheduleId)
                        : 'Select Schedule'}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </div>

                <ScheduleSelectModal
                  isOpen={isScheduleModalOpen}
                  onClose={handleCloseScheduleModal}
                  onSelectSchedule={handleSelectSchedule}
                  schedules={schedules}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Enter notes about this collection"
                  rows="3"
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#5da646] focus:border-[#5da646]"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelAdd}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRecord}
                  disabled={!formData.collectionDate || !formData.scheduleId || loading}
                  className={`px-4 py-2 bg-[#5da646] text-white rounded-md hover:bg-[#4c8a3a] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#5da646] focus:ring-opacity-50 ${(!formData.collectionDate || !formData.scheduleId || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Saving...' : isEditing ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </div>
          )}

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

          {/* Loading State */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
  {loading ? (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
    </div>
  ) : error ? (
    <div className="p-6 text-center text-red-500">{error}</div>
  ) : filteredHistoryRecords.length > 0 ? (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Collection Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Schedule
            </th>
       
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Notes
            </th>
     
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredHistoryRecords.map((record) => {
            // Find the related schedule
            const schedule = schedules.find(s => s.scheduleId === record.scheduleId);
            
            return (
              <tr key={record.historyId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                  {new Date(record.collectionDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                  {schedule ? getSiteNameFromLocationId(schedule.locationId) || schedule.siteName || 'Unknown' : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                  {schedule ? `${schedule.pickupDate} ${schedule.pickupTime || ''}` : record.scheduleId}
                </td>
  
                <td className="px-6 py-4 text-sm text-gray-800">
                  <div className="max-w-xs truncate">
                    {record.notes || '-'}
                  </div>
                </td>
              
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="p-6 text-center text-gray-500">
      No history records found matching your criteria.
    </div>
  )}</div>
        </div>
      </div>
      {showScheduleModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-800">Select Schedule</h3>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className="p-4">
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={scheduleFilter}
                        onChange={handleScheduleSearch}
                        placeholder="Search schedules..."
                        className="w-full px-3 py-2 pl-10 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#5da646] focus:border-[#5da646]"
                      />
                      <div className="absolute left-3 top-2.5 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {filteredSchedules.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredSchedules.map((schedule) => (
                            <tr
                              key={schedule.scheduleId}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => selectSchedule(schedule)}
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                                {getSiteNameFromLocationId(schedule.locationId) || schedule.siteName || 'Unknown Location'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                                {schedule.pickupDate || schedule.day || 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                                {schedule.pickupTime || 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                {schedule.status ? (
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${schedule.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                      schedule.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'}`}>
                                    {schedule.status}
                                  </span>
                                ) : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="py-6 text-center text-gray-500">
                        No schedules found matching your search.
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    Cancel
                  </button>
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
    </div>
  );
};

export default HistoryPage;