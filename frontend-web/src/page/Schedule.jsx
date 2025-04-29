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

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed w-60 h-full bg-white border-r border-gray-200 shadow-sm z-10">
        <div className="p-5 border-b border-gray-200">
          <div className="text-2xl font-bold text-[#5da646]">Vermigo Admin</div>
        </div>

        <div className="py-5">
          <ul>  <Link to="/dashboard" className="flex items-center no-underline text-inherit">
            <li className="flex items-center px-5 py-3 text-gray-500 font-medium cursor-pointer hover:bg-green-50 transition-colors">

              <Home className="mr-3 w-5 h-5" />
              Dashboard

            </li>    </Link>
            <Link to="/complaints" className="flex items-center no-underline text-inherit">
              <li className="flex items-center px-5 py-3 text-gray-500 font-medium cursor-pointer transition duration-300 hover:bg-[rgba(93,166,70,0.05)]">
                <Link to="/complaints" className="flex items-center no-underline text-inherit">
                  <span className="mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </span>
                  Complaints
                </Link>
              </li></Link>
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
            <Link to="/schedule" className="flex items-center no-underline text-inherit">
              <li className="flex items-center px-5 py-3 text-green-600 font-medium cursor-pointer bg-green-50 hover:bg-green-50 transition-colors">
                <Calendar className="mr-3 w-5 h-5" />
                Collection Schedule
              </li>
            </Link>
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
            <Link to="/map" className="flex items-center no-underline text-inherit">
              <li className="flex items-center px-5 py-3 text-gray-500 font-medium cursor-pointer hover:bg-green-50 transition-colors">
                <span className="mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </span>
                Collection Sites Map
              </li>
            </Link>
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
      <div className="flex-1 ml-60 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800">Collection Schedule</h1>
          <button
            onClick={() => setShowAddScheduleModal(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </button>
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
          <h2 className="text-lg font-semibold mb-4">Upcoming Collections</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Title</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Schedule ID</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Location ID</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Time</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(schedule => (
                  <tr key={schedule.scheduleId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{schedule.title}</td>
                    <td className="py-3 px-4">{schedule.scheduleId}</td>
                    <td className="py-3 px-4">{schedule.locationId}</td>
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
                ))}
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
            
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}