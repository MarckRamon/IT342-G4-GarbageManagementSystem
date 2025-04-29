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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed w-60 h-full bg-white border-r border-gray-200 shadow-sm z-0">
        <div className="p-5 border-b border-gray-200">
          <div className="text-2xl font-bold text-[#5da646]">Vermigo Admin</div>
        </div>
        <div className="py-5">
          <ul className="list-none">
            <li className="flex items-center px-5 py-3 text-slate-500 font-medium cursor-pointer transition-all duration-300 hover:bg-green-50/20">
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
            <li className="flex items-center px-5 py-3 text-green-600 font-medium cursor-pointer transition-all duration-300 bg-green-50/30">
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
            <li className="flex items-center px-5 py-3 text-slate-500 font-medium cursor-pointer transition-all duration-300 hover:bg-green-50/20">
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
            <li className="flex items-center px-5 py-3 text-slate-500 font-medium cursor-pointer transition-all duration-300 hover:bg-green-50/20">
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
        <div className="fixed bottom-0 left-0 w-60 p-4 flex items-center border-t border-slate-200 bg-white cursor-pointer" onClick={toggleProfilePopup}>
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
            <div className="absolute bottom-16 left-2.5 w-56 bg-white shadow-md rounded-lg z-10 border border-slate-200 overflow-hidden">
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
        </div>
      </div>

      {/* Main Content with animation */}
      <div className={`flex-1 p-3 ml-60 transition-all duration-700 ease-out ${mainContentAnimationClass}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
          <h1 className="text-2xl font-semibold">Complaints Management</h1>
          <div className="flex space-x-2">

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
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-10">
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
                  {profileData.lastName && profileData.lastName.charAt(0).toUpperCase()}
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

export default VermigoComplaints;