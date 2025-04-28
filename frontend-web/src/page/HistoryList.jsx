import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

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

const updateHistoryRecord = async (historyId, historyData) => {
  try {
    const authToken = localStorage.getItem('authToken');
    const response = await api.put(`/history/${historyId}`, historyData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating history record:', error);
    throw error;
  }
};

const deleteHistoryRecord = async (historyId) => {
  try {
    const authToken = localStorage.getItem('authToken');
    const response = await api.delete(`/history/${historyId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting history record:', error);
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
            <li className="flex items-center px-5 py-3 text-green-600 font-medium cursor-pointer transition-all duration-300 bg-green-50/30">
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

        {/* User Info with Clickable Profile */}
        <div className="fixed bottom-0 left-0 w-60 p-4 flex items-center border-t border-gray-200 bg-white cursor-pointer" onClick={toggleProfilePopup}>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 font-medium text-sm">
            {profileData.lastName.charAt(0).toUpperCase()}
          </div>
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

      {/* Main Content - Improved design */}
      <div className={`flex-1 ml-60 p-6 transition-all duration-700 ease-out ${mainContentAnimationClass}`}>
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Header with Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-100">
            <h1 className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">Collection History</h1>

            {(!isAdding && !isEditing) ? (
              <button
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                onClick={handleAddRecord}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add History Record
              </button>
            ) : null}
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
          {loading && !isAdding && !isEditing && historyRecords.length === 0 ? (
            <div className="py-8 flex justify-center items-center text-gray-500">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#5da646]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading history records...</span>
            </div>
          ) : historyRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50 text-gray-600 text-sm">
                  <tr>
                    <th className="py-3 px-4 text-left font-medium">Collection Date</th>
                    <th className="py-3 px-4 text-left font-medium">Schedule ID</th>
                    <th className="py-3 px-4 text-left font-medium">Notes</th>
                    <th className="py-3 px-4 text-left font-medium w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyRecords.map((record) => (
                    <tr key={record.historyId} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800">
                        {new Date(record.collectionDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4 text-gray-800">{record.scheduleId}</td>
                      <td className="py-3 px-4 text-gray-700">
                        {record.notes ||
                          <span className="text-gray-400 italic">No notes</span>
                        }
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditRecord(record)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(record.historyId)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="inline-flex justify-center items-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No History Records Found</h3>
              <p className="text-gray-500 mb-4">Start tracking your collections by adding a new record.</p>
              <button
                className="inline-flex items-center px-4 py-2 bg-[#5da646] text-white rounded-md hover:bg-[#4c8a3a] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#5da646] focus:ring-opacity-50"
                onClick={handleAddRecord}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add First Record
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">User Profile</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 font-medium text-2xl mr-4">
                  {profileData.firstName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-800">{profileData.name}</h3>
                  <p className="text-gray-600">{profileData.role}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="text-gray-500 w-8 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">Phone</div>
                    <div className="text-gray-800">{profileData.phone}</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="text-gray-500 w-8 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">Email</div>
                    <div className="text-gray-800">{profileEmail.email}</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="text-gray-500 w-8 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">Address</div>
                    <div className="text-gray-800">{profileData.address}</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="text-gray-500 w-8 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">Join Date</div>
                    <div className="text-gray-800">{profileData.joinDate}</div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="text-gray-500 w-8 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">Department</div>
                    <div className="text-gray-800">{profileData.department}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;