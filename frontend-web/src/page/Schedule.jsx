import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Home, MapPin, User, Mail, Phone, Briefcase, LogOut, ChevronLeft, ChevronRight, Plus, X, Trash2, Edit } from 'lucide-react';
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

const addSchedule = async (scheduleData) => {
  try {
    const response = await api.post('/schedule', scheduleData);
    return response.data;
  } catch (error) {
    console.error('Error adding schedule:', error);
    throw error;
  }
};

const updateSchedule = async (scheduleId, scheduleData) => {
  try {
    const response = await api.put(`/schedule/${scheduleId}`, scheduleData); // Corrected the URL structure
    return response.data;
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw error;
  }
};

const deleteSchedule = async (scheduleId) => {
  try {
    const response = await api.delete(`/schedule/${scheduleId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw error;
  }
};

export default function VermigoSchedule() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    location: 'ALL',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filteredSchedules, setFilteredSchedules] = useState([]);  
  const [isLoading, setIsLoading] = useState(true);
  const [multipleSchedules, setMultipleSchedules] = useState([]);
  const [showMultipleSchedulesModal, setShowMultipleSchedulesModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [weekSchedules, setWeekSchedules] = useState([]);
  const [selectedWeekStart, setSelectedWeekStart] = useState(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [daySchedules, setDaySchedules] = useState([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isForNewSchedule, setIsForNewSchedule] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [error, setError] = useState(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [pageLoaded, setPageLoaded] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState({
    scheduleId: '',
    title: '',
    locationId: 'location-id-from-pickup-locations',
    pickupDate: '',
    pickupTime: '',
    status: ''
  });

  const [newSchedule, setNewSchedule] = useState({
    title: '',
    locationId: '',
    pickupDate: '',
    pickupTime: '',
    status: 'PENDING'
  });

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

    // Load all necessary data
    const loadAllData = async () => {
      try {
        setIsLoading(true);

        // Fetch user profile and email
        const profilePromise = fetchUserProfile(userId, authToken);
        const emailPromise = fetchUserEmail(userId, authToken);
        const schedulesPromise = fetchSchedules();
        const locationsPromise = fetchLocations();

        const [profileResponse, emailResponse, schedulesResponse, locationsResponse] = await Promise.all([
          profilePromise,
          emailPromise,
          schedulesPromise,
          locationsPromise
        ]);

        console.log('Profile data received:', profileResponse);
        console.log('Email data received:', emailResponse);
        console.log('Schedules data received:', schedulesResponse);
        console.log('Locations data received:', locationsResponse); // Log the full response

        // Update locations state correctly
        if (locationsResponse && locationsResponse.success) {
          setLocations(locationsResponse.locations); // Access the locations array directly
          console.log('Locations set in state:', locationsResponse.locations); // Log the locations being set
        } else {
          console.error('Invalid locations response:', locationsResponse);
        }

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
        if (schedulesResponse) {
          setSchedules(schedulesResponse);
        }

        setIsLoading(false);
      } catch (err) {
        handleApiError(err);
        setIsLoading(false);
      }
    };

    loadAllData();

    // Clean up interceptor when component unmounts
    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, []);

  // Add these handler functions
  const openLocationModal = (isNew = true) => {
    setShowLocationModal(true);

  };
  const handleSelectLocation = (location) => {

    setSelectedLocation(location);
    setEditingSchedule((prev) => ({
      ...prev,
      locationId: location.locationId // Update the locationId in editingSchedule
    }));
    if (isForNewSchedule) {
      setNewSchedule({
        ...newSchedule,
        locationId: location.locationId
      });
    } else {
      setEditingSchedule({
        ...editingSchedule,
        locationId: location.locationId
      });
    }
  };

  // Update the location display function
  const getLocationName = (locationId) => {
    const location = locations.find(loc => loc.locationId === locationId);
    return location ? location.siteName : locationId;
  };

  const getAddressName = (locationId) => {
    const location = locations.find(loc => loc.locationId === locationId);
    return location ? location.address : locationId;
  }
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

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
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

  // Get schedules for the week
  const getWeekSchedules = (weekDates) => {
    const weekSchedules = [];

    weekDates.forEach(dayInfo => {
      const daySchedules = schedules.filter(schedule => schedule.pickupDate === dayInfo.dateString);
      weekSchedules.push({
        ...dayInfo,
        schedules: daySchedules
      });
    });

    return weekSchedules;
  };
  const generateTimeSlots = () => {
    const timeSlots = [];

    // Generate slots from 5:00 to 22:00 (5AM to 10PM)
    for (let hour = 5; hour <= 22; hour++) {
      const formattedHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
      const period = hour >= 12 ? 'PM' : 'AM';

      timeSlots.push({
        hour: hour,
        displayTime: `${formattedHour}:00 ${period}`
      });
    }

    return timeSlots;
  };

  // Handle day click to show scheduler
  const handleDayClick = (day) => {
    const weekDates = getWeekDates(selectedYear, selectedMonth, day);
    const scheduleData = getWeekSchedules(weekDates);

    setSelectedDay(day);
    setSelectedWeekStart(weekDates[0].date);
    setWeekSchedules(scheduleData);
    setShowTimeModal(true);
  };

  // Find if there's a schedule for a specific day and hour
  const findSchedulesForTimeSlot = (dateInfo, hour) => {
    if (!dateInfo.schedules || dateInfo.schedules.length === 0) return [];

    return dateInfo.schedules.filter(schedule => {
      // Handle the new time format (e.g., "10:30 AM")
      const timeParts = schedule.pickupTime.split(' ');
      const hourMinuteParts = timeParts[0].split(':');
      const hourValue = parseInt(hourMinuteParts[0], 10);
      const isPM = timeParts[1] === 'PM' && hourValue !== 12;
      const is12AM = timeParts[1] === 'AM' && hourValue === 12;

      // Convert to 24-hour format for comparison
      let scheduleHour = is12AM ? 0 : isPM ? hourValue + 12 : hourValue;

      return scheduleHour === hour;
    });
  };
  const LocationSelectModal = ({ isOpen, onClose, onSelectLocation, locations }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredLocations, setFilteredLocations] = useState([]);

    useEffect(() => {
      if (isOpen) {
        // Set filteredLocations to all locations when the modal opens
        setFilteredLocations(locations);
        console.log('Filtered locations set:', locations); // Log the locations being set
      }
    }, [isOpen, locations]);

    useEffect(() => {
      if (Array.isArray(locations)) {
        setFilteredLocations(
          locations.filter(location =>
            location.siteName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            location.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            location.wasteType?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }
    }, [searchTerm, locations]);

    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-96 flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Select Location</h3>
            <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="overflow-y-auto flex-grow">
            {filteredLocations && filteredLocations.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredLocations.map(location => (
                  <div
                    key={location.locationId}
                    className="p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      onSelectLocation(location);
                      onClose();
                    }}
                  >
                    <div className="font-medium">{location.siteName}</div>
                    <div className="text-sm text-gray-500 truncate">{location.address}</div>
                    <div className="text-xs text-gray-400 mt-1">{location.wasteType}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">No locations found</div>
            )}
          </div>
        </div>
      </div>
    );
  };
  const handleMultipleSchedulesView = (schedules) => {
    setMultipleSchedules(schedules);
    setShowMultipleSchedulesModal(true);
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
      const statusClass = hasSchedule ? getDayStatusClass(daySchedules) : '';

      calendarDays.push(
        <div
          key={day}
          className={`h-12 md:h-14 flex flex-col items-center justify-center rounded ${hasSchedule
            ? `${statusClass} relative cursor-pointer hover:opacity-80 transition-opacity`
            : ''
            }`}
          onClick={() => {
            // Always allow clicking to show the scheduler, even if no schedules
            handleDayClick(day);
          }}
        >
          <span>{day}</span>
          {hasSchedule && (
            <span className="text-xs absolute" style={{ bottom: '0.2rem' }}>
              {daySchedules.length > 0 && daySchedules.some(s => s.status === 'CANCELLED') ? 'Cancelled' :
                daySchedules.length > 0 && daySchedules.some(s => s.status === 'PENDING') ? 'Pending' : 'Completed'}
            </span>
          )}
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSchedule({
      ...newSchedule,
      [name]: value
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const openProfileModal = () => {
    setShowProfilePopup(false);
    setShowProfileModal(true);
  };
  const toggleProfilePopup = () => {
    setShowProfilePopup(!showProfilePopup);
  };
  const handleAddSchedule = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('User not authenticated');
        return;
      }

      const scheduleData = {
        ...newSchedule,
        userId,
        title: newSchedule.title || 'New Collection',
        locationId: newSchedule.locationId
      };

      const response = await addSchedule(scheduleData);

      if (response) {
        // Fetch updated schedules
        const updatedSchedules = await fetchSchedules();
        setSchedules(updatedSchedules);

        // Reset form
        setNewSchedule({
          title: '',
          locationId: '',
          pickupDate: '',
          pickupTime: '',
          status: 'PENDING'
        });

        setShowAddScheduleModal(false);
      }
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await deleteSchedule(scheduleId);

      // Update local state
      setSchedules(schedules.filter(schedule => schedule.scheduleId !== scheduleId));
    } catch (err) {
      handleApiError(err);
    }
  };

  const getScheduleColors = (status) => {
    switch (status) {
      case 'PENDING':
        return {
          bg: 'bg-yellow-100',
          border: 'border-yellow-500',
          text: 'text-yellow-700'
        };
      case 'COMPLETED':
        return {
          bg: 'bg-green-100',
          border: 'border-green-500',
          text: 'text-green-700'
        };
      case 'CANCELLED':
        return {
          bg: 'bg-red-100',
          border: 'border-red-500',
          text: 'text-red-700'
        };
      default:
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-500',
          text: 'text-gray-700'
        };
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

  const mainContentAnimationClass = pageLoaded
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 translate-y-6';
  const handleEditSchedule = (schedule) => {
    setEditingSchedule({
      scheduleId: schedule.scheduleId,
      title: schedule.title || '',
      locationId: schedule.locationId,
      pickupDate: schedule.pickupDate,
      pickupTime: schedule.pickupTime,
      status: schedule.status
    });
    setShowEditScheduleModal(true);
  };
  // Add this function to handle the edit input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingSchedule({
      ...editingSchedule,
      [name]: value // This should correctly update the pickupTime
    });
  };

  // Add this function to handle the schedule update
  const handleUpdateSchedule = async () => {
    try {
      const updatedData = {
        ...editingSchedule,
        locationId: editingSchedule.locationId // Ensure the correct location ID is used
      };

      const response = await updateSchedule(editingSchedule.scheduleId, updatedData);

      if (response) {
        // Update local state
        setSchedules(
          schedules.map(schedule =>
            schedule.scheduleId === editingSchedule.scheduleId
              ? updatedData
              : schedule
          )
        );

        setShowEditScheduleModal(false);
      }
    } catch (err) {
      handleApiError(err);
    }
  };
  useEffect(() => {
    applyFilters();
  }, [schedules, filters]);
  
  // Add this function to handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Add this function to apply filters
  const applyFilters = () => {
    let result = [...schedules];
    
    // Apply search filter (case insensitive)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(schedule => 
        schedule.title?.toLowerCase().includes(searchLower) ||
        schedule.scheduleId?.toLowerCase().includes(searchLower) ||
        getLocationName(schedule.locationId).toLowerCase().includes(searchLower) ||
        getAddressName(schedule.locationId).toLowerCase().includes(searchLower) 
      );
    }
    
    // Apply status filter
    if (filters.status !== 'ALL') {
      result = result.filter(schedule => schedule.status === filters.status);
    }
    
    // Apply location filter
    if (filters.location !== 'ALL') {
      result = result.filter(schedule => schedule.locationId === filters.location);
    }
    
    // Apply date range filter
    if (filters.dateFrom) {
      result = result.filter(schedule => new Date(schedule.pickupDate) >= new Date(filters.dateFrom));
    }
    
    if (filters.dateTo) {
      result = result.filter(schedule => new Date(schedule.pickupDate) <= new Date(filters.dateTo));
    }
    
    setFilteredSchedules(result);
  };
  
  // Add this function to reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      location: 'ALL',
      dateFrom: '',
      dateTo: ''
    });
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
            className="flex items-center px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-all duration-200"
>            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            className="flex items-center px-4 py-2.5 text-green-600 font-medium bg-green-50 rounded-lg shadow-sm border-l-4 border-green-600 transition-all duration-200"                   >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <span className="text-green-600 font-medium">Schedule</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-500">Calendar Viewer</span>
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
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        
        </div>

        {/* Scheduler Modal */}
        {showTimeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setShowTimeModal(false)}>
            <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl h-3/4 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">
                  Pickup Schedule for Week of {selectedWeekStart ? selectedWeekStart.toLocaleDateString() : ''}
                </h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowTimeModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 h-full overflow-auto">
                {/* Scheduler Header - Days */}
                <div className="flex border-b border-gray-200">
                  <div className="w-24 flex-shrink-0"></div> {/* Time column */}
                  {weekSchedules.map((dayInfo, index) => (
                    <div key={index} className="flex-1 text-center p-2 min-w-24">
                      <div className="font-medium">{dayInfo.dayName}</div>
                      <div className="text-sm text-gray-500">{dayInfo.dayNumber}</div>
                    </div>
                  ))}
                </div>

                {showMultipleSchedulesModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setShowMultipleSchedulesModal(false)}>
    <div className="bg-white rounded-lg shadow-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center p-5 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Multiple Pickups</h3>
        <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowMultipleSchedulesModal(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5">
        <div className="mb-4">
          <h4 className="text-md font-medium mb-2">Scheduled Pickups</h4>
          <div className="space-y-3">
            {multipleSchedules.map((schedule, index) => (
              <div key={index} className={`p-3 rounded border-l-4 ${getScheduleColors(schedule.status).border}`}>
                <div className="flex justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(schedule.status)}`}>
                    {schedule.status}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => {
                        setShowMultipleSchedulesModal(false);
                        handleEditSchedule(schedule);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => {
                        handleDeleteSchedule(schedule.scheduleId);
                        if (multipleSchedules.length <= 2) {
                          setShowMultipleSchedulesModal(false);
                        }
                        setMultipleSchedules(multipleSchedules.filter(s => s.scheduleId !== schedule.scheduleId));
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="font-medium text-sm">{schedule.title || 'Untitled Collection'}</div>
                  <div className="text-sm">Time: {schedule.pickupTime}</div>
                  <div className="text-sm">Location: {getLocationName(schedule.locationId)}</div>
                  <div className="text-sm">Address: {getAddressName(schedule.locationId)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => setShowMultipleSchedulesModal(false)}
          >
            Close
          </button>
          <button
            className="px-4 py-2 bg-green-600 rounded-md text-sm font-medium text-white hover:bg-green-700"
            onClick={() => {
              setShowMultipleSchedulesModal(false);
              setShowAddScheduleModal(true);
            }}
          >
            Add Another
          </button>
        </div>
      </div>
    </div>
  </div>
)}
                {/* Scheduler Body - Time Slots */}
                <div className="relative">
                  {generateTimeSlots().map((timeSlot, timeIndex) => (
                    <div key={timeIndex} className="flex border-b border-gray-100">
                      <div className="w-24 p-2 text-right text-sm text-gray-500 border-r border-gray-200 flex-shrink-0">
                        {timeSlot.displayTime}
                      </div>

                      {weekSchedules.map((dayInfo, dayIndex) => {
                        const schedulesForTimeSlot = findSchedulesForTimeSlot(dayInfo, timeSlot.hour);
                        const hasMultipleSchedules = schedulesForTimeSlot.length > 1;
                        const singleSchedule = schedulesForTimeSlot[0];
                        const colors = schedulesForTimeSlot.length > 0 ?
                          (hasMultipleSchedules ?
                            { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-700' } :
                            getScheduleColors(singleSchedule.status)) :
                          null;

                        return (
                          <div key={dayIndex} className="flex-1 p-1 min-h-16 min-w-24 relative border-r border-gray-100">
                            {schedulesForTimeSlot.length > 0 && (
                              <div
                                className={`absolute inset-0 m-1 ${colors.bg} border-l-4 ${colors.border} rounded p-2 cursor-pointer hover:opacity-90 transition-opacity`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (hasMultipleSchedules) {
                                    handleMultipleSchedulesView(schedulesForTimeSlot);
                                  } else {
                                    handleEditSchedule(singleSchedule);
                                  }
                                }}
                              >
                                <div className={`text-xs font-medium ${colors.text}`}>{timeSlot.displayTime}</div>
                                <div className="text-xs text-gray-600 truncate">
                                  {hasMultipleSchedules ?
                                    `${schedulesForTimeSlot.length} Pickups` :
                                    `${singleSchedule.locationId.substring(0, 8)}...`}
                                </div>
                                <div className="mt-1">
                                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${hasMultipleSchedules ?
                                    'bg-purple-100 text-purple-700' :
                                    getStatusClass(singleSchedule.status)
                                    }`}>
                                    {hasMultipleSchedules ? 'Multiple' : singleSchedule.status}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <button
                    className="px-4 py-2 bg-green-600 rounded-md text-sm font-medium text-white hover:bg-green-700 flex items-center"
                    onClick={() => {
                      setShowTimeModal(false);
                      setShowAddScheduleModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Pickup
                  </button>
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

        <br></br>
        {/* Schedule List */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-semibold">Upcoming Collections</h2>
    <div className="flex items-center space-x-2">
      <div className="relative">
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search..."
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 absolute right-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <button 
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filter
        {(filters.status !== 'ALL' || filters.location !== 'ALL' || filters.dateFrom || filters.dateTo) && (
          <span className="ml-1 w-2 h-2 bg-green-500 rounded-full"></span>
        )}
      </button>
      <button
            onClick={() => setShowAddScheduleModal(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </button> 
    </div>
  </div>
  {/* Advanced Filters */}
  {showFilters && (
    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 transition-all duration-300">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <select
            name="location"
            value={filters.location}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="ALL">All Locations</option>
            {locations.map(location => (
              <option key={location.locationId} value={location.locationId}>
                {location.siteName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 mr-2"
        >
          Reset
        </button>
        <button
          onClick={() => setShowFilters(false)}
          className="px-4 py-2 bg-green-600 rounded-md text-sm font-medium text-white hover:bg-green-700"
        >
          Apply Filters
        </button>
      </div>
    </div>
  )}
  
  {/* Filter Stats */}
  {(filters.status !== 'ALL' || filters.location !== 'ALL' || filters.dateFrom || filters.dateTo || filters.search) && (
    <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-md flex justify-between items-center">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-600">Showing {filteredSchedules.length} of {schedules.length} collections</span>
        
        {filters.search && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center">
            Search: {filters.search}
            <button className="ml-1 text-green-600 hover:text-green-800" onClick={() => setFilters({...filters, search: ''})}>
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        
        {filters.status !== 'ALL' && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center">
            Status: {filters.status}
            <button className="ml-1 text-green-600 hover:text-green-800" onClick={() => setFilters({...filters, status: 'ALL'})}>
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        
        {filters.location !== 'ALL' && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center">
            Location: {getLocationName(filters.location)}
            
            <button className="ml-1 text-green-600 hover:text-green-800" onClick={() => setFilters({...filters, location: 'ALL'})}>
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        
        {(filters.dateFrom || filters.dateTo) && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center">
            Date Range: {filters.dateFrom ? new Date(filters.dateFrom).toLocaleDateString() : 'Any'} - {filters.dateTo ? new Date(filters.dateTo).toLocaleDateString() : 'Any'}
            <button className="ml-1 text-green-600 hover:text-green-800" onClick={() => setFilters({...filters, dateFrom: '', dateTo: ''})}>
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
      </div>
      
      <button
        onClick={resetFilters}
        className="text-sm text-gray-600 hover:text-gray-800"
      >
        Clear All
      </button>
    </div>
  )}

  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-3 px-4 text-gray-500 font-medium">Title</th>
          <th className="text-left py-3 px-4 text-gray-500 font-medium">Site Name</th>
          <th className="text-left py-3 px-4 text-gray-500 font-medium">Address</th>
          <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
          <th className="text-left py-3 px-4 text-gray-500 font-medium">Time</th>
          <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
          <th className="text-right py-3 px-4 text-gray-500 font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredSchedules.length > 0 ? (
          filteredSchedules.map(schedule => (
            <tr key={schedule.scheduleId} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">{schedule.title}</td>
              <td className="py-3 px-4">{getLocationName(schedule.locationId)}</td>
              <td className="py-3 px-4 text-xs">{getAddressName(schedule.locationId)}</td>
              <td className="py-3 px-4">{new Date(schedule.pickupDate).toLocaleDateString()}</td>
              <td className="py-3 px-4">{schedule.pickupTime}</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(schedule.status)}`}>
                  {schedule.status}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <button className="text-gray-500 hover:text-gray-700 mr-2"
                  onClick={() => handleEditSchedule(schedule)}>
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleDeleteSchedule(schedule.scheduleId)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="py-8 text-center text-gray-500">
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium">No collections found</p>
                <p className="text-sm mt-1">Try adjusting your filters or adding a new collection.</p>
                <button 
                  onClick={resetFilters}
                  className="mt-3 px-4 py-2 bg-green-600 rounded-md text-sm font-medium text-white hover:bg-green-700"
                >
                  Reset Filters
                </button>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

      </div>

      {/* Edit Schedule Modal */}
      {showEditScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setShowEditScheduleModal(false)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Edit Collection Schedule</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowEditScheduleModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={editingSchedule.title}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Collection title"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="pickupDate"
                  value={editingSchedule.pickupDate}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="text"
                  name="pickupTime"
                  value={editingSchedule.pickupTime}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <div className="text-xs text-gray-500 mt-1">Format: HH:MM AM/PM (e.g., 10:30 AM)</div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <div className="flex">
                  <button
                    onClick={() => openLocationModal(false)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {locations.find(loc => loc.locationId === editingSchedule.locationId) ?
                      getLocationName(editingSchedule.locationId) :
                      "Select location..."}
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                {locations.find(loc => loc.locationId === editingSchedule.locationId) && (
                  <div className="mt-2 text-xs text-gray-500">
                    <div>{locations.find(loc => loc.locationId === editingSchedule.locationId)?.address}</div>
                    <div className="mt-1">Waste Type: {locations.find(loc => loc.locationId === editingSchedule.locationId)?.wasteType}</div>
                  </div>
                )}
                <LocationSelectModal
                  isOpen={showLocationModal}
                  onClose={() => setShowLocationModal(false)}
                  onSelectLocation={handleSelectLocation}
                  locations={locations} // Ensure this is the correct state
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={editingSchedule.status}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowEditScheduleModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-green-600 rounded-md text-sm font-medium text-white hover:bg-green-700"
                  onClick={handleUpdateSchedule}
                  disabled={!editingSchedule.pickupDate || !editingSchedule.pickupTime || !editingSchedule.locationId}
                >
                  Update Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Schedule Modal */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setShowAddScheduleModal(false)}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Add Collection Schedule</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowAddScheduleModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={newSchedule.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Collection title"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="pickupDate"
                  value={newSchedule.pickupDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="text"
                  name="pickupTime"
                  value={newSchedule.pickupTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 10:30 AM"
                />
                <div className="text-xs text-gray-500 mt-1">Format: HH:MM AM/PM (e.g., 10:30 AM)</div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <div className="flex">
                  <button
                    onClick={() => openLocationModal(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {selectedLocation && newSchedule.locationId === selectedLocation.locationId ?
                      selectedLocation.siteName :
                      newSchedule.locationId ?
                        getLocationName(newSchedule.locationId) :
                        "Select location..."}
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                {selectedLocation && newSchedule.locationId === selectedLocation.locationId && (
                  <div className="mt-2 text-xs text-gray-500">
                    <div>{selectedLocation.address}</div>
                    <div className="mt-1">Waste Type: {selectedLocation.wasteType}</div>
                  </div>
                )}
                <LocationSelectModal
                  isOpen={showLocationModal}
                  onClose={() => setShowLocationModal(false)}
                  onSelectLocation={handleSelectLocation}
                  locations={locations} // Ensure this is the correct state
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status </label>
                <select
                  name="status"
                  value={newSchedule.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowAddScheduleModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-green-600 rounded-md text-sm font-medium text-white hover:bg-green-700"
                  onClick={handleAddSchedule}
                  disabled={!newSchedule.pickupDate || !newSchedule.pickupTime || !newSchedule.locationId}
                >
                  Add Schedule
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
    </div>
  );
}