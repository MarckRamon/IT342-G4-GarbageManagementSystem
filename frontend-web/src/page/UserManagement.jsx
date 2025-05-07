import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Home, MapPin, User, Mail, Phone, Briefcase, LogOut, ChevronLeft, ChevronRight, Plus, X, Trash2, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

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
const fetchUsers = async (authToken) => {
    try {
        console.log('Making request with token:', authToken);
        const response = await api.get('/users', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        handleApiError(error); // Call your error handling function
        throw error;
    }
};
  
  const createUser = async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };
  
  const updateUser = async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  };
  
  const deleteUser = async (userId) => {
    try {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  };
export default function VermigoUser() {
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
  const [users, setUsers] = useState([]);

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilters, setUserFilters] = useState({
    role: 'ALL',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10
  });
  const [selectAll, setSelectAll] = useState(false);

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    username: '',
    password: '',
    role: 'USER',
    notificationsEnabled: true
  });
  const [formErrors, setFormErrors] = useState({});

  const [profileEmail, setProfileEmail] = useState({
    email: ""
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
  const loadUsers = async () => {
    try {
        const authToken = localStorage.getItem('authToken');
        setIsLoading(true);
        
        const response = await fetchUsers(authToken);
        console.log('Fetched Users:', response); // Log the fetched users

        // Assuming response is an array of users
        let filteredUsers = response || []; // Ensure it's an array

        // Filter by role if not 'ALL'
        if (userFilters.role !== 'ALL') {
            filteredUsers = filteredUsers.filter(user => user.role === userFilters.role);
        }

        // Filter by search term (search across multiple fields)
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filteredUsers = filteredUsers.filter(user => 
                user.firstName?.toLowerCase().includes(term) || 
                user.lastName?.toLowerCase().includes(term) || 
                user.email?.toLowerCase().includes(term) || 
                user.username?.toLowerCase().includes(term) || 
                user.phoneNumber?.includes(term)
            );
        }

        console.log('Filtered Users before sorting:', filteredUsers); // Log before sorting

        // Sort users
        filteredUsers.sort((a, b) => {
            const sortField = userFilters.sortBy;

            // Handle null values
            if (!a[sortField] && !b[sortField]) return 0;
            if (!a[sortField]) return 1;
            if (!b[sortField]) return -1;

            // Sort based on field type
            if (typeof a[sortField] === 'string') {
                return userFilters.sortOrder === 'asc' 
                    ? a[sortField].localeCompare(b[sortField])
                    : b[sortField].localeCompare(a[sortField]);
            } else {
                return userFilters.sortOrder === 'asc' 
                    ? a[sortField] - b[sortField]
                    : b[sortField] - a[sortField];
            }
        });

        // Pagination
        const totalPages = Math.ceil(filteredUsers.length / pagination.itemsPerPage);
        const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
        const paginatedUsers = filteredUsers.slice(
            startIndex, 
            startIndex + pagination.itemsPerPage
        );

        setUsers(paginatedUsers);
        setPagination(prev => ({
            ...prev,
            totalPages: Math.max(1, totalPages)
        }));

        setIsLoading(false);
    } catch (error) {
        console.error('Error loading users:', error);
        setIsLoading(false);
    }
};


  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAllUsers = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    if (newSelectAll) {
      setSelectedUsers(users.map(user => user.userId));
    } else {
      setSelectedUsers([]);
    }
  };

useEffect(() => {
    loadUsers();
  }, [userFilters, pagination.currentPage, searchTerm]);
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



        const [profileResponse, emailResponse, schedulesResponse, locationsResponse] = await Promise.all([
          profilePromise,
          emailPromise,

       
        ]);

        console.log('Profile data received:', profileResponse);
        console.log('Email data received:', emailResponse);
  
        // Update locations state correctly
      

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


  const mainContentAnimationClass = pageLoaded
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 translate-y-6';
   
    
     
      const handleAddUser = async () => {
        // Validate form
        const errors = {};
        if (!newUser.firstName.trim()) errors.firstName = 'First name is required';
        if (!newUser.lastName.trim()) errors.lastName = 'Last name is required';
        if (!newUser.email.trim()) errors.email = 'Email is required';
        if (!newUser.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.email = 'Invalid email format';
        if (!newUser.username.trim()) errors.username = 'Username is required';
        if (!newUser.password.trim()) errors.password = 'Password is required';
        if (newUser.password.length < 6) errors.password = 'Password must be at least 6 characters';
        
        if (Object.keys(errors).length > 0) {
          setFormErrors(errors);
          return;
        }
        
        try {
          await createUser(newUser);
          setShowAddUserModal(false);
          setNewUser({
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            username: '',
            password: '',
            role: 'USER',
            notificationsEnabled: true
          });
          setFormErrors({});
          loadUsers();
        } catch (error) {
          // Handle specific API errors
          if (error.response && error.response.data && error.response.data.message) {
            if (error.response.data.message.includes('email')) {
              setFormErrors(prev => ({ ...prev, email: 'Email already in use' }));
            } else if (error.response.data.message.includes('username')) {
              setFormErrors(prev => ({ ...prev, username: 'Username already taken' }));
            } else {
              setFormErrors(prev => ({ ...prev, general: error.response.data.message }));
            }
          } else {
            setFormErrors(prev => ({ ...prev, general: 'Error creating user. Please try again.' }));
          }
        }
      };
    
      const handleEditUser = (user) => {
        setCurrentUser({
          ...user,
          password: '' // Don't populate password for security reasons
        });
        setShowEditUserModal(true);
      };
    
      const handleUpdateUser = async () => {
        // Validate form
        const errors = {};
        if (!currentUser.firstName.trim()) errors.firstName = 'First name is required';
        if (!currentUser.lastName.trim()) errors.lastName = 'Last name is required';
        if (!currentUser.email.trim()) errors.email = 'Email is required';
        if (!currentUser.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.email = 'Invalid email format';
        if (!currentUser.username.trim()) errors.username = 'Username is required';
        
        if (Object.keys(errors).length > 0) {
          setFormErrors(errors);
          return;
        }
        
        try {
          const userData = { ...currentUser };
          // Only include password if it was changed
          if (!userData.password) {
            delete userData.password;
          }
          
          await updateUser(currentUser.userId, userData);
          setShowEditUserModal(false);
          setCurrentUser(null);
          setFormErrors({});
          loadUsers();
        } catch (error) {
          // Handle specific API errors
          if (error.response && error.response.data && error.response.data.message) {
            setFormErrors(prev => ({ ...prev, general: error.response.data.message }));
          } else {
            setFormErrors(prev => ({ ...prev, general: 'Error updating user. Please try again.' }));
          }
        }
      };
    
      const handleDeleteUser = (user) => {
        setCurrentUser(user);
        setShowDeleteConfirmModal(true);
      };
    
      const confirmDeleteUser = async () => {
        try {
          await deleteUser(currentUser.userId);
          setShowDeleteConfirmModal(false);
          setCurrentUser(null);
          loadUsers();
        } catch (error) {
          console.error('Error deleting user:', error);
        }
      };
    
      const handleBulkAction = (action) => {
        setBulkAction(action);
        setShowBulkActionModal(true);
      };
    
      const confirmBulkAction = async () => {
        try {
          if (bulkAction === 'delete') {
            // Process all selected users
            for (const userId of selectedUsers) {
              await deleteUser(userId);
            }
          } else if (bulkAction === 'makeAdmin') {
            // Make all selected users admin
            for (const userId of selectedUsers) {
              const user = users.find(u => u.userId === userId);
              if (user) {
                await updateUser(userId, { ...user, role: 'ADMIN' });
              }
            }
          } else if (bulkAction === 'makeUser') {
            // Make all selected users regular users
            for (const userId of selectedUsers) {
              const user = users.find(u => u.userId === userId);
              if (user) {
                await updateUser(userId, { ...user, role: 'USER' });
              }
            }
          }
          
          setShowBulkActionModal(false);
          setSelectedUsers([]);
          setSelectAll(false);
          loadUsers();
        } catch (error) {
          console.error('Error performing bulk action:', error);
        }
      };
    
      const handleMakeAdmin = async (userId) => {
        try {
          const user = users.find(u => u.userId === userId);
          if (user) {
            await updateUser(userId, { ...user, role: 'ADMIN' });
            loadUsers();
          }
        } catch (error) {
          console.error('Error making user admin:', error);
        }
      };
    
      const handleChangeRole = async (userId, newRole) => {
        try {
          const user = users.find(u => u.userId === userId);
          if (user) {
            await updateUser(userId, { ...user, role: newRole });
            loadUsers();
          }
        } catch (error) {
          console.error(`Error changing user role to ${newRole}:`, error);
        }
      };
    
      const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        
        try {
          // Check if timestamp is in the format with nanos and seconds
          if (timestamp.seconds && timestamp.nanos !== undefined) {
            // Convert seconds to milliseconds and add nanoseconds converted to milliseconds
            const milliseconds = (timestamp.seconds * 1000) + (timestamp.nanos / 1000000);
            const date = new Date(milliseconds);
            
            return date.toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
          
          // Fall back to original behavior for other timestamp formats
          const date = new Date(timestamp);
          return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (error) {
          console.error('Error formatting date:', error);
          return 'Invalid Date';
        }
      };
    
      const changePage = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
          setPagination(prev => ({
            ...prev,
            currentPage: newPage
          }));
        }
      };

      const handleFetchUsers = async () => {
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
            try {
                const users = await fetchUsers(authToken);
                console.log('Fetched Users:', users); // Log the fetched users
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        } else {
            console.log('No Auth Token found. Cannot fetch users.');
        }
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
            className="flex items-center px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-all duration-200"
>            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            className="flex items-center px-4 py-2.5 text-green-600 font-medium bg-green-50 rounded-lg shadow-sm border-l-4 border-green-600 transition-all duration-200"                   >

<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <span className="text-green-600 font-medium">User Management</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-500">Manage</span>
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
  

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-4 lg:mb-0">User Management</h1>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search users..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </div>
            
            <button 
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center transition-colors duration-200"
              onClick={() => setShowFilters(!showFilters)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              Filters
            </button>
            
            <button 
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center transition-colors duration-200"
              onClick={() => setShowAddUserModal(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add User
            </button>
          </div>
        </div>
        
        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-slideDown">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={userFilters.role}
                  onChange={(e) => setUserFilters(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="ALL">All Roles</option>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={userFilters.sortBy}
                  onChange={(e) => setUserFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                >
                  <option value="createdAt">Date Created</option>
                  <option value="firstName">First Name</option>
                  <option value="lastName">Last Name</option>
                  <option value="email">Email</option>
                  <option value="role">Role</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={userFilters.sortOrder}
                  onChange={(e) => setUserFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg mr-2 hover:bg-gray-300 transition-colors duration-200"
                onClick={() => {
                  setUserFilters({
                    role: 'ALL',
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                  });
                  setSearchTerm('');
                }}
              >
                Reset
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                onClick={() => setShowFilters(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
        
        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-wrap items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">{selectedUsers.length} users selected</span>
              <button
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={() => {
                  setSelectedUsers([]);
                  setSelectAll(false);
                }}
              >
                Clear selection
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
              <button 
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors duration-200 flex items-center"
                onClick={() => handleBulkAction('makeAdmin')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <polyline points="17 11 19 13 23 9"></polyline>
                </svg>
                Make Admin
              </button>
              <button 
                className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors duration-200 flex items-center"
                onClick={() => handleBulkAction('makeUser')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Make User
              </button>
              <button 
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors duration-200 flex items-center"
                onClick={() => handleBulkAction('delete')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete
              </button>
            </div>
          </div>
        )}
        
        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4 text-left">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      checked={selectAll}
                      onChange={handleSelectAllUsers}
                    />
                    <span>User</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-left">Contact Info</th>
                <th className="py-3 px-4 text-left">Role</th>
                <th className="py-3 px-4 text-left">Date Created</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                // Loading state
                Array(5).fill(0).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-6 bg-gray-200 rounded"></div></td>
                    <td className="py-3 px-4"><div className="h-6 bg-gray-200 rounded"></div></td>
                    <td className="py-3 px-4"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
                    <td className="py-3 px-4"><div className="h-6 bg-gray-200 rounded w-32"></div></td>
                    <td className="py-3 px-4"><div className="h-6 bg-gray-200 rounded w-20"></div></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan="5" className="py-6 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="7" r="4"></circle>
                        <path d="M12 11v8"></path>
                        <line x1="8" y1="19" x2="16" y2="19"></line>
                      </svg>
                      <span>No users found</span>
                      <button 
                        className="mt-2 text-sm text-green-600 hover:text-green-800 hover:underline"
                        onClick={() => {
                          setUserFilters({
                            role: 'ALL',
                            sortBy: 'createdAt',
                            sortOrder: 'desc'
                          });
                          setSearchTerm('');
                        }}
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                // User data
                users.map(user => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="mr-3 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          checked={selectedUsers.includes(user.userId)}
                          onChange={() => handleSelectUser(user.userId)}
                        />
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium mr-3">
                            {user.firstName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{`${user.firstName || ''} ${user.lastName || ''}`}</div>
                            <div className="text-sm text-gray-500">{user.username || 'No username'}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-800 text-sm">{user.email || 'No email'}</div>
                      <div className="text-gray-500 text-sm">{user.phoneNumber || 'No phone'}</div>
                    </td>
                    <td className="py-3 px-4">
                      {user.role === 'ADMIN' ? (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Admin</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">User</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleEditUser(user)}
                          title="Edit User"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        {user.role !== 'ADMIN' && (
                          <button 
                            className="text-green-600 hover:text-green-800"
                            onClick={() => handleMakeAdmin(user.userId)}
                            title="Make Admin"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                              <circle cx="8.5" cy="7" r="4"></circle>
                              <polyline points="17 11 19 13 23 9"></polyline>
                            </svg>
                          </button>
                        )}
                        {user.role === 'ADMIN' && (
                          <button 
                            className="text-gray-600 hover:text-gray-800"
                            onClick={() => handleChangeRole(user.userId, 'USER')}
                            title="Make User"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
  <circle cx="12" cy="7" r="4"></circle>
</svg>
</button>
                        )}
                        <button 
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteUser(user)}
                          title="Delete User"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {users.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6">
            <div className="text-sm text-gray-500 mb-4 sm:mb-0">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, users.length)} of {users.length} users
            </div>
            <div className="flex items-center">
              <button
                className="px-3 py-1 border border-gray-300 rounded-l-md bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => changePage(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`px-3 py-1 border-t border-b border-gray-300 ${
                    pagination.currentPage === page
                      ? 'bg-green-600 text-white font-medium'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => changePage(page)}
                >
                  {page}
                </button>
              ))}
              
              <button
                className="px-3 py-1 border border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => changePage(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Add New User</h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setShowAddUserModal(false);
                  setFormErrors({});
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {formErrors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-md text-sm">
                {formErrors.general}
              </div>
            )}
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddUser();
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border ${formErrors.firstName ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                    value={newUser.firstName}
                    onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                  {formErrors.firstName && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.firstName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border ${formErrors.lastName ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                    value={newUser.lastName}
                    onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                  {formErrors.lastName && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.lastName}</p>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                <input
                  type="email"
                  className={`w-full px-3 py-2 border ${formErrors.email ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                />
                {formErrors.email && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newUser.phoneNumber}
                  onChange={(e) => setNewUser(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username*</label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border ${formErrors.username ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                    value={newUser.username}
                    onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                  />
                  {formErrors.username && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.username}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password*</label>
                  <input
                    type="password"
                    className={`w-full px-3 py-2 border ${formErrors.password ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notifications"
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 mr-2"
                    checked={newUser.notificationsEnabled}
                    onChange={(e) => setNewUser(prev => ({ ...prev, notificationsEnabled: e.target.checked }))}
                  />
                  <label htmlFor="notifications" className="text-sm text-gray-700">Enable notifications</label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg mr-2 hover:bg-gray-300 transition-colors duration-200"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setFormErrors({});
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      
      {/* Bulk Action Confirmation Modal */}
      {showBulkActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Confirm Bulk Action</h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowBulkActionModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                {bulkAction === 'delete' && (
                  <>Are you sure you want to delete <span className="font-semibold">{selectedUsers.length}</span> users? This action cannot be undone.</>
                )}
                {bulkAction === 'makeAdmin' && (
                  <>Are you sure you want to give admin privileges to <span className="font-semibold">{selectedUsers.length}</span> users?</>
                )}
                {bulkAction === 'makeUser' && (
                  <>Are you sure you want to change <span className="font-semibold">{selectedUsers.length}</span> users to regular users?</>
                )}
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg mr-2 hover:bg-gray-300 transition-colors duration-200"
                onClick={() => setShowBulkActionModal(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 ${
                  bulkAction === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white rounded-lg transition-colors duration-200`}
                onClick={confirmBulkAction}
              >
                {bulkAction === 'delete' ? 'Delete' : 'Confirm'}
              </button>
              </div>
          </div>
        </div>
            )}     </div>

                  {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Confirm Delete</h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setCurrentUser(null);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete user <span className="font-semibold">{`${currentUser.firstName || ''} ${currentUser.lastName || ''}`}</span>? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg mr-2 hover:bg-gray-300 transition-colors duration-200"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setCurrentUser(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                onClick={confirmDeleteUser}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

        
      {/* Edit User Modal */}
      {showEditUserModal && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Edit User</h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setShowEditUserModal(false);
                  setCurrentUser(null);
                  setFormErrors({});
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {formErrors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-md text-sm">
                {formErrors.general}
              </div>
            )}
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateUser();
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border ${formErrors.firstName ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                    value={currentUser.firstName || ''}
                    onChange={(e) => setCurrentUser(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                  {formErrors.firstName && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.firstName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border ${formErrors.lastName ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                    value={currentUser.lastName || ''}
                    onChange={(e) => setCurrentUser(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                  {formErrors.lastName && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.lastName}</p>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                <input
                  type="email"
                  className={`w-full px-3 py-2 border ${formErrors.email ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                  value={currentUser.email || ''}
                  onChange={(e) => setCurrentUser(prev => ({ ...prev, email: e.target.value }))}
                />
                {formErrors.email && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={currentUser.phoneNumber || ''}
                  onChange={(e) => setCurrentUser(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username*</label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border ${formErrors.username ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                    value={currentUser.username || ''}
                    onChange={(e) => setCurrentUser(prev => ({ ...prev, username: e.target.value }))}
                  />
                  {formErrors.username && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.username}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    className={`w-full px-3 py-2 border ${formErrors.password ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                    value={currentUser.password || ''}
                    onChange={(e) => setCurrentUser(prev => ({ ...prev, password: e.target.value }))}
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={currentUser.role || 'USER'}
                  onChange={(e) => setCurrentUser(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit-notifications"
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 mr-2"
                    checked={currentUser.notificationsEnabled || false}
                    onChange={(e) => setCurrentUser(prev => ({ ...prev, notificationsEnabled: e.target.checked }))}
                  />
                  <label htmlFor="edit-notifications" className="text-sm text-gray-700">Enable notifications</label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg mr-2 hover:bg-gray-300 transition-colors duration-200"
                  onClick={() => {
                    setShowEditUserModal(false);
                    setCurrentUser(null);
                    setFormErrors({});
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  Update User
                </button>
              </div>
            </form>
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