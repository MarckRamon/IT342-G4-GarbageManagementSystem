import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, Home, MapPin, User, Mail, Phone, Briefcase, LogOut, ChevronLeft, ChevronRight, Plus, X, Trash2, Edit } from 'lucide-react';
import HistoryWidget from './DashboardHistoryWidget'
import { Link, useNavigate } from 'react-router-dom';
const API_BASE_URL = 'https://it342-g4-garbagemanagementsystem-kflf.onrender.com/api';
import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL
});

// New API function for pickup locations
const fetchPickupLocations = async (authToken) => {
  try {
    const response = await api.get('/pickup-locations', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching pickup locations:', error);
    throw error;
  }
};

// New API function for complaints/feedback
const fetchComplaints = async (authToken) => {
  try {
    const response = await api.get('/feedback', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching complaints:', error);
    throw error;
  }
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

// New API functions for schedules
const fetchSchedules = async () => {
  try {
    const response = await api.get('/schedule');
    return response.data;
  } catch (error) {
    console.error('Error fetching schedules:', error);
    throw error;
  }
};

// New API functions for tips
const fetchTips = async () => {
  try {
    const response = await api.get('/tip');
    return response.data;
  } catch (error) {
    console.error('Error fetching tips:', error);
    throw error;
  }
};

const createTip = async (tipData) => {
  try {
    const response = await api.post('/tip', tipData);
    return response.data;
  } catch (error) {
    console.error('Error creating tip:', error);
    throw error;
  }
};

const updateTip = async (tipId, tipData) => {
  try {
    const response = await api.put(`/tip/${tipId}`, tipData);
    return response.data;
  } catch (error) {
    console.error('Error updating tip:', error);
    throw error;
  }
};

const deleteTip = async (tipId) => {
  try {
    const response = await api.delete(`/tip/${tipId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting tip:', error);
    throw error;
  }
};

function VermigoDashboard() {
  // Navigation hook
  const authToken = localStorage.getItem('authToken');
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  // State for profile popup and modal
  const [pickupLocations, setPickupLocations] = useState([]);
const [complaints, setComplaints] = useState([]);
const [pendingComplaints, setPendingComplaints] = useState(0);
const [monthlyPickupCounts, setMonthlyPickupCounts] = useState([]);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [schedules, setSchedules] = useState([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [daySchedules, setDaySchedules] = useState([]);
  // Tips management state
  const [tips, setTips] = useState([]);
  const [showAddTipModal, setShowAddTipModal] = useState(false);
  const [showEditTipModal, setShowEditTipModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentTip, setCurrentTip] = useState(null);
  const [tipFormData, setTipFormData] = useState({
    title: '',
    description: '',
    status: 'active'
  });
  const [tipLoadingState, setTipLoadingState] = useState({
    loading: false,
    error: null
  });
  const countPickupLocations = (locationData) => {
    // Check if locationData exists and has a locations property that is an array
    if (locationData && locationData.locations && Array.isArray(locationData.locations)) {
      return locationData.locations.length;
    }
    
    // Return 0 if the data structure doesn't match what we expect
    return 0;
  };
  useEffect(() => {
    setTimeout(() => {
      setPageLoaded(true);
    }, 100);
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

    const loadAllData = async () => {
      try {
        setIsLoading(true);
  
        // Fetch user profile and email
        const profilePromise = fetchUserProfile(userId, authToken);
        const emailPromise = fetchUserEmail(userId, authToken);
        const schedulesPromise = fetchSchedules(authToken);
        const tipsPromise = fetchTips();
        const locationsPromise = fetchPickupLocations(authToken);
        const complaintsPromise = fetchComplaints(authToken);
        const usersPromise = api.get('/users', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        const [profileResponse, emailResponse, schedulesResponse, tipsResponse, locationsResponse, complaintsResponse,usersResponse] = await Promise.all([
          profilePromise,
          emailPromise,
          schedulesPromise,
          tipsPromise,
          locationsPromise,
          complaintsPromise,
          usersPromise
        ]);
  
       console.log('Profile data received:', profileResponse);
       console.log('Email data received:', emailResponse);
       console.log('Schedules data received:', schedulesResponse);
       console.log('Tips data received:', tipsResponse);
        console.log('Pickup locations received:', locationsResponse);
        console.log('Complaints data received:', complaintsResponse);

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
     console.log('Users data received:', usersResponse.data);
      
        // Set the active users count
        if (usersResponse.data && Array.isArray(usersResponse.data)) {
          setActiveUsers(usersResponse.data.length);
        }
        
        // Update email data
        if (emailResponse && emailResponse.success) {
          setProfileEmail({
            email: emailResponse.email
          });
        }
        if (schedulesResponse) {
          setSchedules(schedulesResponse);
          // Process schedules to get monthly counts
          const monthlyCounts = processSchedulesForChart(schedulesResponse);
          setMonthlyPickupCounts(monthlyCounts);
        }
        
        if (locationsResponse) {
          setPickupLocations(locationsResponse);
        }

        
        // Update tips
        if (tipsResponse) {
          setTips(tipsResponse);
        }
        if (complaintsResponse) {
          setComplaints(complaintsResponse);
          // Count pending complaints
          const pendingCount = complaintsResponse.filter(complaint => complaint.status === 'PENDING').length;
          setPendingComplaints(pendingCount);
        }
        setIsLoading(false);
      } catch (err) {
        handleApiError(err);
        setIsLoading(false);
      }
    };

    loadAllData();
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
    const processSchedulesForChart = (schedules) => {
      const monthCounts = Array(12).fill(0);
      
      schedules.forEach(schedule => {
        if (schedule.pickupDate) {
          const date = new Date(schedule.pickupDate);
          const month = date.getMonth();
          monthCounts[month]++;
        }
      });
      
      return monthNames.map((name, index) => ({
        name: name.substring(0, 3),
        value: monthCounts[index]
      }));
    };
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

    // Load tips data
    const loadTips = async () => {
      try {
        setTipLoadingState({ loading: true, error: null });
        const tipsData = await fetchTips();
        setTips(tipsData);
        setTipLoadingState({ loading: false, error: null });
      } catch (err) {
        console.error('Error loading tips:', err);
        setTipLoadingState({ loading: false, error: 'Failed to load tips' });
      }
    };

    // Load profile data if auth token and user ID are available
    if (authToken && userId) {
      loadUserProfile();
      loadUserEmail();
      loadTips();
    } else {
      setIsLoading(false);
    }

    // Clean up interceptor when component unmounts
    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, []);

  // Handle API errors
  const handleApiError = (err) => {
    if (err.response) {
      console.error("Server error:", err.response.status, err.response.data);
      setError(`Server error: ${err.response.status}`);
    } else if (err.request) {
      console.error("Network error:", err.request);
      setError('Network error. Please check your connection.');
    } else {
      console.error("Request configuration error:", err.message);
      setError('Error setting up request');
    }
  };

  // Static chart data based on the image
  const chartData = [
    { name: 'Jan', value: 3200 },
    { name: 'Feb', value: 4100 },
    { name: 'Mar', value: 3800 },
    { name: 'Apr', value: 2900 },
    { name: 'May', value: 5200 },
    { name: 'Jun', value: 3600 },
    { name: 'Jul', value: 4300 },
    { name: 'Aug', value: 3100 },
    { name: 'Sep', value: 5100 },
    { name: 'Oct', value: 4000 },
    { name: 'Nov', value: 4800 },
    { name: 'Dec', value: 5400 },
  ];

  // Top waste collection locations data
  const topLocationsData = [
    { name: 'Barrangu Lighting', value: 6239, color: '#FF6B6B' },
    { name: 'Therona', value: 4975, color: '#FF9E7A' },
    { name: 'Lineast B', value: 2385, color: '#FFBB94' },
  ];

  // Current month and year
  const [currentMonth, setCurrentMonth] = useState('March');
  const [currentYear, setCurrentYear] = useState('2021');

  const [profileEmail, setProfileEmail] = useState({
    email: ""
  });
  // Profile data object;
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
  const interceptor = api.interceptors.request.use(
    config => {
      config.headers.Authorization = `Bearer ${authToken}`;
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );
  // Handler functions
  const handleLogout = () => {
    // Here you would normally clear authentication tokens, etc.
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const toggleProfilePopup = () => {
    setShowProfilePopup(!showProfilePopup);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    const authToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (!authToken || !userId) {
      setError('Authentication information missing');
      return;
    }

    try {
      const updatedProfile = await updateUserProfile(userId, authToken, formData);

      if (updatedProfile && updatedProfile.success) {
        // Update local state with new data
        setProfileData({
          ...profileData,
          name: `${updatedProfile.firstName} ${updatedProfile.lastName}`,
          phone: updatedProfile.phoneNumber,
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName
        });

        setEditMode(false);
      } else {
        setError('Failed to update profile');
      }
    } catch (err) {
      // Handle axios specific errors
      if (err.response) {
        console.error("Server update error:", err.response.status, err.response.data);
        setError(`Server error: ${err.response.data.message || err.response.status}`);
      } else if (err.request) {
        console.error("Network update error:", err.request);
        setError('Network error. Please check your connection.');
      } else {
        console.error("Update config error:", err.message);
        setError('Error updating profile');
      }
    }
  };
  const openProfileModal = () => {
    setShowProfilePopup(false);
    setShowProfileModal(true);

    // Reset form data based on current profile
    setFormData({
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      phoneNumber: profileData.phone
    });

    // Reset edit mode
    setEditMode(false);
  };

  // Calendar data for March 2021
  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);

  // Collection schedule data (for the calendar)
  const pickupDays = [2, 8, 12, 16, 19, 23, 26, 30];

  const mainContentAnimationClass = pageLoaded
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 translate-y-6';
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDayOfMonth = getFirstDayOfMonth(selectedMonth, selectedYear);
    const calendarDays = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="h-12 md:h-14"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const daySchedules = schedules.filter(schedule => schedule.pickupDate === currentDate);
      const hasSchedule = daySchedules.length > 0;

      calendarDays.push(
        <div
          key={day}
          className={`h-12 md:h-14 flex flex-col items-center justify-center rounded ${hasSchedule
            ? 'bg-green-100 text-green-700 font-medium relative cursor-pointer hover:bg-green-200 transition-colors'
            : ''
            }`}
          onClick={() => {
            if (hasSchedule) {
              setSelectedDay(day);
              setDaySchedules(daySchedules);
              setShowTimeModal(true);
            }
          }}
        >
          <span>{day}</span>
          {hasSchedule &&     <span className="text-xs absolute" style={{ bottom: '0.2rem' }}>Pickup</span>}
        </div>
      );
    }

    return calendarDays;
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Tips CRUD Functions
  const handleAddTip = () => {
    setTipFormData({
      title: '',
      description: '',
      status: 'active'
    });
    setShowAddTipModal(true);
  };

  const handleEditTip = (tip) => {
    setCurrentTip(tip);
    setTipFormData({
      title: tip.title,
      description: tip.description,
      status: tip.status
    });
    setShowEditTipModal(true);
  };

  const handleDeleteTipClick = (tip) => {
    setCurrentTip(tip);
    setShowDeleteConfirm(true);
  };

  const handleTipFormChange = (e) => {
    const { name, value } = e.target;
    setTipFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateTip = async (e) => {
    e.preventDefault();
    setTipLoadingState({ loading: true, error: null });

    try {
      const newTipData = {
        ...tipFormData,
        userId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await createTip(newTipData);
      setTips(prev => [...prev, result]);
      setShowAddTipModal(false);
      setTipLoadingState({ loading: false, error: null });
    } catch (err) {
      console.error('Error creating tip:', err);
      setTipLoadingState({ loading: false, error: 'Failed to create tip' });
    }
  };

  const handleUpdateTip = async (e) => {
    e.preventDefault();
    setTipLoadingState({ loading: true, error: null });

    try {
      const updatedTipData = {
        ...tipFormData,
        updatedAt: new Date().toISOString()
      };

      const result = await updateTip(currentTip.tipId, updatedTipData);

      setTips(prev => prev.map(tip =>
        tip.tipId === currentTip.tipId ? { ...tip, ...updatedTipData } : tip
      ));

      setShowEditTipModal(false);
      setTipLoadingState({ loading: false, error: null });
    } catch (err) {
      console.error('Error updating tip:', err);
      setTipLoadingState({ loading: false, error: 'Failed to update tip' });
    }
  };

  const handleDeleteTip = async () => {
    setTipLoadingState({ loading: true, error: null });

    try {
      await deleteTip(currentTip.tipId);
      setTips(prev => prev.filter(tip => tip.tipId !== currentTip.tipId));
      setShowDeleteConfirm(false);
      setTipLoadingState({ loading: false, error: null });
    } catch (err) {
      console.error('Error deleting tip:', err);
      setTipLoadingState({ loading: false, error: 'Failed to delete tip' });
    }
  };
  const getStatusClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWeekDates = (year, month, day) => {
    const selectedDate = new Date(year, month, day);
    const weekDates = [];

    // Start from current day and include the next 6 days (full week view)
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(selectedDate);
      currentDate.setDate(selectedDate.getDate() + i);
      weekDates.push({
        date: currentDate,
        dayName: dayNames[currentDate.getDay()],
        dayNumber: currentDate.getDate(),
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
        dateString: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
      });
    }

    return weekDates;
  };
  const getDayStatusClass = (daySchedules) => {
    if (!daySchedules || daySchedules.length === 0) return '';

    // If any schedule is cancelled, show as red
    if (daySchedules.some(s => s.status === 'CANCELLED')) {
      return 'bg-red-100 text-red-700';
    }
    // If any schedule is pending, show as yellow
    else if (daySchedules.some(s => s.status === 'PENDING')) {
      return 'bg-yellow-100 text-yellow-700';
    }
    // If all are completed, show as green
    else if (daySchedules.every(s => s.status === 'COMPLETED')) {
      return 'bg-green-100 text-green-700';
    }

    return 'bg-green-100 text-green-700'; // Default
  };
  const getLocationName = (locationId) => {
    if (!pickupLocations || !pickupLocations.locations) return 'Unknown Location';
    
    const location = pickupLocations.locations.find(loc => loc.locationId === locationId);
    return location ? location.siteName : 'Unknown Location';
  };
  
  const getLocationAddress = (locationId) => {
    if (!pickupLocations || !pickupLocations.locations) return 'Unknown Address';
    
    const location = pickupLocations.locations.find(loc => loc.locationId === locationId);
    return location ? location.address : 'Unknown Address';
  };
  
  return (
<div className="flex h-screen bg-gray-50">

      <style>
        {`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
                
                :root {
                  --primary-color: #5da646;
                  --primary-hover: #40752f;
                  --text-dark: #1e293b;
                  --text-light: #64748b;
                  --background-color: #f8fafc;
                  --card-background: #ffffff;
                  --border-color: #e2e8f0;
                  --chart-color: #4F46E5;
                  --success-color: #22c55e;
                  --error-color: #ef4444;
                }
                
                /* Animation for popup modal */
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
        
                @keyframes fadeOut {
                    from {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                }
        
                .profile-popup {
                    animation: fadeIn 0.3s forwards;
                }
        
                .profile-popup.fade-out {
                    animation: fadeOut 0.3s forwards;
                }
        
                .modal-container {
                    animation: fadeIn 0.3s forwards;
                }
        
                .modal-container.fade-out {
                    animation: fadeOut 0.3s forwards;
                }

                /* Calendar specific styling */
                .calendar-day.pickup {
                    background-color: rgba(93, 166, 70, 0.1);
                    color: var(--primary-color);
                    font-weight: 500;
                    position: relative;
                }
                
                .calendar-day.pickup:after {
                    content: 'Pickup Day';
                    position: absolute;
                    bottom: -0.1rem;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 0.65rem;
                    color: var(--primary-color);
                    white-space: nowrap;
                }
                `}
      </style>

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
            className="flex items-center px-4 py-2.5 text-green-600 font-medium bg-green-50 rounded-lg shadow-sm border-l-4 border-green-600 transition-all duration-200"
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
            className="flex items-center px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <div className="text-xs text-gray-400 mb-2">Vermigo © 2025</div>
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
        <span className="text-green-600 font-medium">Dashboard</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-500">Overview</span>
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
  
      <div className="flex-1 p-6 ml-60 bg-[#f8fafc]">
        {/* Header */}    <br></br>    <br></br>

      
 {/* Metrics Section */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
<div className="bg-white p-6 rounded-lg shadow-sm">
  <div className="text-sm text-gray-500 mb-2">Active Users</div>
  <div className="text-3xl font-bold">{isLoading ? '...' : activeUsers}</div>
</div>
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <div className="text-sm text-gray-500 mb-2">Pending Complaints</div>
    <div className="text-3xl font-bold">{isLoading ? '...' : pendingComplaints}</div>
  </div>
  <div className="bg-white p-6 rounded-lg shadow-sm">
  <div className="text-sm text-gray-500 mb-2">Total Collection Points</div>
  <div className="text-3xl font-bold">
    {isLoading ? '...' : countPickupLocations(pickupLocations)}
  </div>
  </div>
</div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Locations */}
      
              <div><HistoryWidget /></div>
            

        {/* Activity Chart */}
<div className="bg-white p-6 rounded-lg shadow-sm">
  <h3 className="text-lg font-semibold mb-4">Activity</h3>
  <div className="h-60">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={monthlyPickupCounts.length > 0 ? monthlyPickupCounts : chartData}>
        <XAxis dataKey="name" axisLine={false} tickLine={false} />
        <YAxis hide={true} />
        <Tooltip />
        <Bar dataKey="value" fill="var(--chart-color)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>
        </div>

        {showTimeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setShowTimeModal(false)}>
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-5 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Pickup Schedule for {monthNames[selectedMonth]} {selectedDay}, {selectedYear}</h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowTimeModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5">
                <div className="max-h-64 overflow-y-auto">
                  {daySchedules.length > 0 ? (
                    <div>
                {daySchedules.map((schedule, index) => (
  <div key={index} className="mb-4 p-4 border border-gray-100 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <Clock className="w-5 h-5 mr-2 text-green-600" />
        <span className="font-medium">{schedule.pickupTime}</span>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(schedule.status)}`}>
        {schedule.status}
      </span>
    </div>
    <div className="mt-2 flex items-center text-gray-500 text-sm">
      <MapPin className="w-4 h-4 mr-1" />
      <span>{getLocationAddress(schedule.locationId)}</span>
    </div>
  </div>
))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No pickups scheduled for this day.
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowTimeModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Calendar View */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <div className="text-xl font-semibold mr-2">{monthNames[selectedMonth]}</div>
              <div className="text-xl text-gray-500">{selectedYear}</div>
            </div>
            <div className="flex">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-700 ml-1"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {dayNames.map(day => (
              <div key={day} className="text-xs text-gray-500 text-center py-2 font-medium">{day}</div>
            ))}
            {generateCalendarDays()}
          </div>
        </div>
      </div>

      {/* Tips Management Section - Added below calendar */}
      <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
      <br></br>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Tips</h2>
          </div>
          <button
            onClick={handleAddTip}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <Plus size={18} className="mr-1" /> Add New Tip
          </button>
        </div>

        {/* Tips List */}
        {tipLoadingState.loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : tips.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No tips available. Add your first tip!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tips.map((tip) => (
              <div key={tip.tipId} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{tip.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                    <div className="flex items-center mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tip.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {tip.status}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        Updated: {formatDate(tip.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <button
                      onClick={() => handleEditTip(tip)}
                      className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600"
                      title="Edit tip"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTipClick(tip)}
                      className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600"
                      title="Delete tip"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error display */}
        {tipLoadingState.error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mt-4">
            {tipLoadingState.error}
          </div>
        )}
        {/* 
  {/* Add Tip Modal */}
        {showAddTipModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4 modal-container">
              <h2 className="text-xl font-semibold mb-4">Add New Tip</h2>
              <form onSubmit={handleCreateTip}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={tipFormData.title}
                    onChange={handleTipFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={tipFormData.description}
                    onChange={handleTipFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  ></textarea>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={tipFormData.status}
                    onChange={handleTipFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddTipModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={tipLoadingState.loading}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {tipLoadingState.loading ? (
                      <>
                        <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Tip'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Tip Modal */}
        {showEditTipModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4 modal-container">
              <h2 className="text-xl font-semibold mb-4">Edit Tip</h2>
              <form onSubmit={handleUpdateTip}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={tipFormData.title}
                    onChange={handleTipFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={tipFormData.description}
                    onChange={handleTipFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  ></textarea>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={tipFormData.status}
                    onChange={handleTipFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditTipModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={tipLoadingState.loading}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {tipLoadingState.loading ? (
                      <>
                        <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                        Updating...
                      </>
                    ) : (
                      'Update Tip'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4 modal-container">
              <h2 className="text-xl font-semibold mb-2">Delete Tip</h2>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this tip? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTip}
                  disabled={tipLoadingState.loading}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {tipLoadingState.loading ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
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
}

export default VermigoDashboard;