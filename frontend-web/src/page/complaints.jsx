import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
    console.error('Error fetching profile email:', error);
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

// New APIs for complaints management
const fetchComplaints = async (authToken) => {
  try {
    const response = await api.get('/feedback', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    // Transform the data to match our frontend structure
    const transformedData = response.data.map(item => ({
      id: item.feedbackId,
      user: item.userEmail,
      userAddress: item.userId,
      subject: item.title,
      message: item.description,
      status: item.status.toLowerCase(),
      urgency: item.urgency || 'medium'
    }));

    return transformedData;
  } catch (error) {
    console.error('Error fetching complaints:', error);
    throw error;
  }
};

const createComplaint = async (authToken, complaintData) => {
  try {
    // Transform data to match backend structure
    const transformedData = {
      title: complaintData.subject,
      description: complaintData.message,
      userEmail: complaintData.user,
      userId: complaintData.userAddress,
      status: complaintData.status.toUpperCase()
    };

    const response = await api.post('/feedback', transformedData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating complaint:', error);
    throw error;
  }
};

const updateComplaint = async (authToken, complaintId, complaintData) => {
  try {
    // Transform data to match backend structure
    const transformedData = {
      feedbackId: complaintId,
      title: complaintData.subject,
      description: complaintData.message,
      userEmail: complaintData.user,
      userId: complaintData.userAddress,
      status: complaintData.status.toUpperCase()
    };

    const response = await api.put(`/feedback/${complaintId}`, transformedData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating complaint:', error);
    throw error;
  }
};

const deleteComplaint = async (authToken, complaintId) => {
  try {
    const response = await api.delete(`/feedback/${complaintId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting complaint:', error);
    throw error;
  }
};

function VermigoComplaints() {
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  const [pageLoaded, setPageLoaded] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });
  const [showNewComplaintModal, setShowNewComplaintModal] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    subject: '',
    message: '',
    status: 'pending',
    urgency: 'medium'
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Set page as loaded after a small delay to trigger animations
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

      // Load sample data for development
      loadSampleData();
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
        console.error('Error loading user email:', err);
      }
    };

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
      } catch (err) {
        // Handle axios specific errors
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
      }
    };

    const loadComplaints = async () => {
      try {
        const complaintsData = await fetchComplaints(authToken);
        setComplaints(complaintsData);

        // Calculate stats
        const total = complaintsData.length;
        const pending = complaintsData.filter(c => c.status === 'pending').length;
        const inProgress = complaintsData.filter(c => c.status === 'in-progress').length;
        const resolved = complaintsData.filter(c => c.status === 'resolved').length;

        setStats({
          total,
          pending,
          inProgress,
          resolved
        });

      } catch (err) {
        console.error("Error loading complaints:", err);
        setError('Failed to load complaints');

        // Load sample data for development
        loadSampleData();
      } finally {
        setIsLoading(false);
      }
    };

    // Load data if auth token and user ID are available
    if (authToken && userId) {
      loadUserProfile();
      loadUserEmail();
      loadComplaints();
    } else {
      setIsLoading(false);
      // Load sample data for development
      loadSampleData();
    }

    // Clean up interceptor when component unmounts
    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, []);

  // Load sample data for development
  const loadSampleData = () => {
    // Sample complaints data based on the provided JSON
    const sampleComplaints = [
      {
        id: "H3QQeCgb9VVaPR0po7eu",
        user: "mrcparadise@gmail.com",
        userAddress: "Poqko9DZMge5GNQeGHYUfdH6Ivk2",
        subject: "Barangay Cat",
        message: "The Orange cat is dirty and now looks grey",
        status: "pending",
        urgency: "high"
      },
      {
        id: "J4BBdCfb8UUaOQ9qn6dt",
        user: "resident123@gmail.com",
        userAddress: "Rnakp8EYLgd4FMPdGGZTfvH7Juk1",
        subject: "Missed Collection",
        message: "Waste was not collected from our street for the second week in a row",
        status: "in-progress",
        urgency: "medium"
      },
      {
        id: "K5CCeFg7TTbNP8ro5me3",
        user: "eco_citizen@gmail.com",
        userAddress: "Slbkq9FZMfd5HNQfHHYVgeI8Kvl3",
        subject: "Incorrect Sorting",
        message: "Recyclables are being mixed with general waste during collection",
        status: "resolved",
        urgency: "low"
      }
    ];

    setComplaints(sampleComplaints);

    // Calculate stats
    const total = sampleComplaints.length;
    const pending = sampleComplaints.filter(c => c.status === 'pending').length;
    const inProgress = sampleComplaints.filter(c => c.status === 'in-progress').length;
    const resolved = sampleComplaints.filter(c => c.status === 'resolved').length;

    setStats({
      total,
      pending,
      inProgress,
      resolved
    });

    setIsLoading(false);
  };

  const handleLogout = () => {
    // Here you would normally clear authentication tokens, etc.
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const toggleProfilePopup = () => {
    setShowProfilePopup(!showProfilePopup);
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

  // Generate complaint statistics based on categories
  const generateComplaintStatistics = () => {
    const categories = {};

    // Count complaints by subject/title (as categories)
    complaints.forEach(complaint => {
      const category = complaint.subject;
      if (!categories[category]) {
        categories[category] = 1;
      } else {
        categories[category]++;
      }
    });

    // Convert to array format for chart
    return Object.keys(categories).map(key => ({
      name: key,
      count: categories[key]
    }));
  };

  const complaintsChartData = generateComplaintStatistics();

  const filterComplaints = () => {
    let filteredData = complaints;

    // Filter by tab/status
    if (activeTab !== 'all') {
      filteredData = filteredData.filter(c => c.status === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter(c =>
        c.subject.toLowerCase().includes(query) ||
        c.message.toLowerCase().includes(query) ||
        c.user.toLowerCase().includes(query)
      );
    }

    return filteredData;
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

  const handleComplaintClick = (complaint) => {
    setSelectedComplaint(complaint);
  };

  const handleCloseComplaintDetail = () => {
    setSelectedComplaint(null);
    setResponseText('');
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;

    if (selectedComplaint) {
      const updatedComplaint = {
        ...selectedComplaint,
        status: newStatus
      };

      setSelectedComplaint(updatedComplaint);

      // Get auth token
      const authToken = localStorage.getItem('authToken');

      try {
        // Update in backend
        await updateComplaint(authToken, updatedComplaint.id, updatedComplaint);

        // Update in local state
        setComplaints(prev =>
          prev.map(c => c.id === updatedComplaint.id ? updatedComplaint : c)
        );

        // Update stats
        const total = complaints.length;
        const pending = complaints.filter(c => c.id !== updatedComplaint.id && c.status === 'pending').length + (newStatus === 'pending' ? 1 : 0);
        const inProgress = complaints.filter(c => c.id !== updatedComplaint.id && c.status === 'in-progress').length + (newStatus === 'in-progress' ? 1 : 0);
        const resolved = complaints.filter(c => c.id !== updatedComplaint.id && c.status === 'resolved').length + (newStatus === 'resolved' ? 1 : 0);

        setStats({
          total,
          pending,
          inProgress,
          resolved
        });
      } catch (err) {
        console.error("Error updating complaint status:", err);
        // Revert the change in UI
        setSelectedComplaint({
          ...selectedComplaint
        });
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleNewComplaintChange = (e) => {
    const { name, value } = e.target;
    setNewComplaint(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddComplaint = async () => {
    // Get auth token and user ID
    const authToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    const complaintData = {
      ...newComplaint,
      user: profileEmail.email || 'user@example.com',
      userAddress: userId || 'user-id',
    };

    try {
      const response = await createComplaint(authToken, complaintData);

      // Add the new complaint to the list with the generated ID
      const newComplaintWithId = {
        ...complaintData,
        id: response.feedbackId || `temp-${Date.now()}`
      };

      setComplaints(prev => [newComplaintWithId, ...prev]);

      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        pending: complaintData.status === 'pending' ? prev.pending + 1 : prev.pending,
        inProgress: complaintData.status === 'in-progress' ? prev.inProgress + 1 : prev.inProgress,
        resolved: complaintData.status === 'resolved' ? prev.resolved + 1 : prev.resolved
      }));

      // Close modal and reset form
      setShowNewComplaintModal(false);
      setNewComplaint({
        subject: '',
        message: '',
        status: 'pending',
        urgency: 'medium'
      });
    } catch (err) {
      console.error("Error adding complaint:", err);
      // For development, still add the complaint locally
      const tempId = `temp-${Date.now()}`;
      const newComplaintWithId = {
        ...complaintData,
        id: tempId
      };

      setComplaints(prev => [newComplaintWithId, ...prev]);

      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        pending: complaintData.status === 'pending' ? prev.pending + 1 : prev.pending,
        inProgress: complaintData.status === 'in-progress' ? prev.inProgress + 1 : prev.inProgress,
        resolved: complaintData.status === 'resolved' ? prev.resolved + 1 : prev.resolved
      }));

      // Close modal and reset form
      setShowNewComplaintModal(false);
      setNewComplaint({
        subject: '',
        message: '',
        status: 'pending',
        urgency: 'medium'
      });
    }
  };

  const handleDeleteComplaint = async () => {
    if (!selectedComplaint) return;

    // Get auth token
    const authToken = localStorage.getItem('authToken');

    try {
      // Delete from backend
      await deleteComplaint(authToken, selectedComplaint.id);

      // Update local state
      setComplaints(prev => prev.filter(c => c.id !== selectedComplaint.id));

      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        pending: selectedComplaint.status === 'pending' ? prev.pending - 1 : prev.pending,
        inProgress: selectedComplaint.status === 'in-progress' ? prev.inProgress - 1 : prev.inProgress,
        resolved: selectedComplaint.status === 'resolved' ? prev.resolved - 1 : prev.resolved
      }));

      // Close modal
      setSelectedComplaint(null);
    } catch (err) {
      console.error("Error deleting complaint:", err);
      // Optionally, you can show an error message to the user
    }
  };

  // CSS for animations
  const mainContentAnimationClass = pageLoaded
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 translate-y-6';

  return (
<div className="flex h-screen bg-gray-50">
      
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
            className="flex items-center px-4 py-2.5 text-green-600 font-medium bg-green-50 rounded-lg shadow-sm border-l-4 border-green-600 transition-all duration-200"          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            to="/schedule" 
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
        <span className="text-green-600 font-medium">Feedback</span>
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

      {/* Main Content with animation */}
      <div className={`flex-1 ml-60 p-6 transition-all duration-700 ease-out z-10${mainContentAnimationClass}`}>
        {/* Header */}<br></br><br></br><br></br>
       

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Complaints</p>
                <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
              </div>
              <div className="bg-blue-50 p-2 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium">Pending</p>
                <h3 className="text-2xl font-bold mt-1">{stats.pending}</h3>
              </div>
              <div className="bg-yellow-50 p-2 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium">In Progress</p>
                <h3 className="text-2xl font-bold mt-1">{stats.inProgress}</h3>
              </div>
              <div className="bg-blue-50 p-2 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <polyline points="23 20 23 14 17 14"></polyline>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium">Resolved</p>
                <h3 className="text-2xl font-bold mt-1">{stats.resolved}</h3>
              </div>
              <div className="bg-green-50 p-2 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Complaints List and Chart Section */}

          <div className="col-span-2">
            {/* Filters and Search */}
            {/* Complaints Chart */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 mt-4">
              <h2 className="text-lg font-semibold mb-4">Complaint Categories</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={complaintsChartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-4">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div className="flex space-x-2 mb-3 md:mb-0">
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${activeTab === 'all' ? 'bg-green-50 text-green-700' : 'bg-white text-slate-700'}`}
                    onClick={() => setActiveTab('all')}
                  >
                    All
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${activeTab === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-white text-slate-700'}`}
                    onClick={() => setActiveTab('pending')}
                  >
                    Pending
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${activeTab === 'in-progress' ? 'bg-blue-50 text-blue-700' : 'bg-white text-slate-700'}`}
                    onClick={() => setActiveTab('in-progress')}
                  >
                    In Progress
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${activeTab === 'resolved' ? 'bg-green-50 text-green-700' : 'bg-white text-slate-700'}`}
                    onClick={() => setActiveTab('resolved')}
                  >
                    Resolved
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search complaints..."
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-md w-full md:w-64 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-2.5 text-slate-400">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  
                </div>
                <button
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              onClick={() => setShowNewComplaintModal(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Complaint
            </button>
              </div>
            </div>

            {/* Complaints List */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold">Recent Complaints</h2>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                </div>
              ) : filterComplaints().length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <p className="mt-4 text-slate-500">No complaints found</p>
                  <button
                    className="mt-3 px-4 py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium"
                    onClick={() => setShowNewComplaintModal(true)}
                  >
                    Add New Complaint
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filterComplaints().map((complaint) => (
                    <li
                      key={complaint.id}
                      className="p-4 transition-colors duration-200 hover:bg-slate-50 cursor-pointer"
                      onClick={() => handleComplaintClick(complaint)}
                    >
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <h3 className="font-medium text-slate-900">{complaint.subject}</h3>
                            <span className={`ml-2 px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeClass(complaint.status)}`}>
                              {complaint.status === 'in-progress' ? 'In Progress' : complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                            </span>
                            {complaint.urgency === 'high' && (
                              <span className="ml-2 px-2.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                High Priority
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 line-clamp-2">{complaint.message}</p>
                        </div>
                        <div className="flex items-center mt-2 md:mt-0">
                          <div className="text-xs text-slate-500 mr-6">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                              </svg>
                              {complaint.user}
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
            {selectedComplaint ? (
              <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden sticky top-4">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Complaint Details</h2>
                  <button
                    className="text-slate-400 hover:text-slate-600"
                    onClick={handleCloseComplaintDetail}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                      className="w-full p-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={selectedComplaint.status}
                      onChange={handleStatusChange}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                    <div className="p-2 bg-slate-50 rounded-md text-slate-800">
                      {selectedComplaint.subject}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <div className="p-2 bg-slate-50 rounded-md text-slate-800 h-32 overflow-y-auto">
                      {selectedComplaint.message}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Submitted By</label>
                    <div className="p-2 bg-slate-50 rounded-md text-slate-800">
                      {selectedComplaint.user}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">User ID</label>
                    <div className="p-2 bg-slate-50 rounded-md text-slate-800">
                      {selectedComplaint.userAddress}
                    </div>
                  </div>
                  {/*
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Response</label>
                    <textarea
                      className="w-full p-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent h-24"
                      placeholder="Enter your response..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                    ></textarea>
                  </div>*/}
                  <div className="flex space-x-2">
                    <button
                      className="flex-1 py-2 px-4 bg-green-600 rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                      disabled
                    >

                    </button>
                    <button
                      className="py-2 px-4 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100 transition-all duration-200"
                      onClick={handleDeleteComplaint}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h2 className="text-lg font-semibold">Status Overview</h2>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-700">Pending</span>

                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-700">In Progress</span>

                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-700">Resolved</span>

                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border-t border-slate-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <p className="mt-2 text-slate-500 text-sm">Select a complaint to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
      {/* Add New Complaint Modal */}
      {showNewComplaintModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-20">
          <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-slate-200">
              <h3 className="text-lg font-semibold">Add New Complaint</h3>
              <button
                className="text-slate-400 hover:text-slate-600"
                onClick={() => setShowNewComplaintModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  name="subject"
                  placeholder="Enter complaint subject"
                  className="w-full p-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={newComplaint.subject}
                  onChange={handleNewComplaintChange}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  name="message"
                  placeholder="Enter complaint description"
                  className="w-full p-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent h-32"
                  value={newComplaint.message}
                  onChange={handleNewComplaintChange}
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    name="status"
                    className="w-full p-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newComplaint.status}
                    onChange={handleNewComplaintChange}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

              </div>
              <div className="flex space-x-2">
                <button
                  className="flex-1 py-2 px-4 bg-slate-100 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-200 transition-all duration-200"
                  onClick={() => setShowNewComplaintModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  onClick={handleAddComplaint}
                >
                  Add Complaint
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

export default VermigoComplaints;