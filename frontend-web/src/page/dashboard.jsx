import React, { useState,useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
const API_BASE_URL = 'http://localhost:8080/api';
import axios from 'axios';

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
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [pageLoaded, setPageLoaded] = useState(false);

 
    
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

    const [profileEmail, setProfileEmail]= useState({
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

    return (
        <div className="flex min-h-screen bg-gray-50">
         
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
            <div className="fixed top-0 left-0 w-60 h-full bg-white border-r border-gray-200 shadow-sm z-10">
                <div className="p-5 border-b border-gray-200">
                    <div className="text-2xl font-bold text-[#5da646]">Vermigo Admin</div>
                </div>
                <div className="py-5">
                    <ul className="list-none">
                    <li className="flex items-center px-5 py-3 text-green-600 font-medium cursor-pointer bg-green-50 hover:bg-green-50 transition-colors">
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
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 font-medium text-sm">{profileData.lastName.charAt(0).toUpperCase()}</div>
                    <div className="ml-3">
                        <div className="text-sm font-medium">{profileData.name}</div>
                        <div className="text-xs text-gray-500">{profileEmail.email}</div>
                    </div>
                </div>
                </div>
              {/* Profile Popup */}
        {/* Profile Popup */}
        {showProfilePopup && (
            <div className="absolute bottom-16 left-2.5 w-56 bg-white shadow-md rounded-lg z-30 border border-slate-200 overflow-hidden">
              <div className="p-3 flex items-center cursor-pointer hover:bg-green-50/20 transition-all duration-200" onClick={openProfileModal}>
                <div className="mr-3 text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div className="text-sm text-slate-800">View Profile</div>
              </div>
              <div className="h-px bg-slate-200"></div>
              <div className="p-3 flex items-center cursor-pointer hover:bg-green-50/20 transition-all duration-200" onClick={handleLogout}>
                <div className="mr-3 text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </div>
                <div className="text-sm text-slate-800">Logout</div>
              </div>
            </div>
          )}


            {/* Main Content */}
            <div className={`flex-1 p-3 ml-60 transition-all duration-700 ease-out ${mainContentAnimationClass}`}>

                {/* Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                    <h1 className="text-2xl font-semibold text-gray-800">Reports</h1>
                </div>

                {/* Timeline Filter */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <span className="text-gray-500 mr-2">Timeline:</span>
                        <select className="bg-white border border-gray-200 rounded px-3 py-2 pr-8 font-sans text-gray-800 cursor-pointer focus:outline-none focus:border-[#5da646] focus:ring-2 focus:ring-[rgba(93,166,70,0.2)] appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.25rem]">
                            <option>All-time</option>
                            <option>This year</option>
                            <option>This quarter</option>
                            <option>This month</option>
                            <option>This week</option>
                        </select>
                    </div>
                </div>

                {/* Metrics Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-500 mb-2">Active Users</div>
                        <div className="text-3xl font-bold">121</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-500 mb-2">Total Pickup Trash</div>
                        <div className="text-3xl font-bold">3,298</div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-500 mb-2">Total Collection Points</div>
                        <div className="text-3xl font-bold">10,689</div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Top Locations */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">Top Most Ordered Location Pickup</h3>
                        <div>
                            {topLocationsData.map((location, index) => (
                                <div key={index} className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-800">{location.name}</span>
                                        <span className="font-medium">{location.value.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-300"
                                            style={{
                                                width: `${(location.value / topLocationsData[0].value) * 100}%`,
                                                backgroundColor: location.color
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activity Chart */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">Activity</h3>
                        <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis hide={true} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="var(--chart-color)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Calendar Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                            <span className="text-xl font-semibold mr-2">{currentMonth}</span>
                            <span className="text-xl text-gray-500">{currentYear}</span>
                        </div>
                        <div className="flex">
                            <button className="bg-transparent border-none text-gray-500 cursor-pointer p-1 rounded hover:bg-gray-100 hover:text-gray-800 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <button className="bg-transparent border-none text-gray-500 cursor-pointer p-1 rounded hover:bg-gray-100 hover:text-gray-800 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {/* Day headers */}
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
                            <div key={`header-${index}`} className="text-xs text-gray-500 text-center py-2">
                                {day}
                            </div>
                        ))}

                        {/* Empty days before first day of month (Monday) */}
                        <div></div>

                        {/* Days of month */}
                        {calendarDays.map((day) => (
                            <div
                                key={`day-${day}`}
                                className={`h-10 flex items-center justify-center text-sm rounded ${pickupDays.includes(day) ? 'calendar-day pickup' : ''}`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>
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
}

export default VermigoDashboard;