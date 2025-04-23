import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Home, MapPin, User, Mail, Phone, Briefcase, LogOut, ChevronLeft, ChevronRight, Plus, X, Trash2, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

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
    const response = await api.put(`/schedule/${scheduleId}`, scheduleData);
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
  const [error, setError] = useState(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [pageLoaded, setPageLoaded] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState({
    scheduleId: '',
    locationId: 'location-id-from-pickup-locations',
    pickupDate: '',
    pickupTime: '',
    status: ''
  });
  
  const [newSchedule, setNewSchedule] = useState({
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
        
        const [profileResponse, emailResponse, schedulesResponse] = await Promise.all([
          profilePromise,
          emailPromise,
          schedulesPromise
        ]);
        
        console.log('Profile data received:', profileResponse);
        console.log('Email data received:', emailResponse);
        console.log('Schedules data received:', schedulesResponse);
        
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
      calendarDays.push(<div key={`empty-${i}`} className="h-10 md:h-12"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasSchedule = schedules.some(schedule => schedule.pickupDate === currentDate);
      
      calendarDays.push(
        <div key={day} className={`h-10 md:h-12 flex flex-col items-center justify-center rounded ${hasSchedule ? 'bg-green-100 text-green-700 font-medium relative' : ''}`}>
          <span>{day}</span>
          {hasSchedule && <span className="text-s text-green-700 absolute -bottom-1">Pickup</span>}
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
        setError('User  not authenticated');
        return;
      }
      
      const scheduleData = {
        ...newSchedule,
        userId,
        locationId: newSchedule.locationId || 'location-id-from-pickup-locations' // Use dummy ID
      };
      
      const response = await addSchedule(scheduleData);
      
      if (response) {
        // Fetch updated schedules
        const updatedSchedules = await fetchSchedules();
        setSchedules(updatedSchedules);
        
        // Reset form
        setNewSchedule({
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
        locationId: schedule.locationId,
        pickupDate: schedule.pickupDate,
        pickupTime: schedule.pickupTime, // Ensure this is set
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
          locationId: editingSchedule.locationId || 'location-id-from-pickup-locations' // Use dummy ID
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
            <Link to="/schedule" className="flex items-center no-underline text-inherit">
            <li className="flex items-center px-5 py-3 text-green-600 font-medium cursor-pointer bg-green-50 hover:bg-green-50 transition-colors">
              <Calendar className="mr-3 w-5 h-5" />
              Collection Schedule
            </li>
            </Link>
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
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </button>
        </div>

        {/* Schedule List */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Collections</h2>
      
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
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
              <div key={day} className="text-xs text-gray-500 text-center py-2">{day}</div>
            ))}
            {generateCalendarDays()}
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
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <select 
            name="locationId"
            value={editingSchedule.locationId}
            onChange={handleEditInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="dummy-location-id">Dummy Location</option>
            {/* Add more options as needed */}
          </select>
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
                    disabled={!editingSchedule.pickupDate || !editingSchedule.pickupTime}
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
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <select 
            name="locationId"
            value={newSchedule.locationId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="dummy-location-id">Dummy Location</option>
            {/* Add more options as needed */}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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
            disabled={!newSchedule.pickupDate || !newSchedule.pickupTime}
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
}