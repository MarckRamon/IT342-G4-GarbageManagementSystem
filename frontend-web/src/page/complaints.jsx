import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';

function VermigoComplaints() {
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');

  const handleLogout = () => {
    // Here you would normally clear authentication tokens, etc.
    navigate('/login');
  };

  const toggleProfilePopup = () => {
    setShowProfilePopup(!showProfilePopup);
  };

  const openProfileModal = () => {
    setShowProfilePopup(false);
    setShowProfileModal(true);
  };

  const profileData = {
    name: "Primo Christian",
    email: "primoMontejo@gmail.com",
    role: "Waste Collection Manager",
    phone: "+1 (555) 123-4567",
    address: "123 Green Street, Eco City, EC 12345",
    joinDate: "January 15, 2021",
    department: "Field Operations"
  };
  const complaintsData = [
    {
      id: 1,
      user: "Maria Garcia",
      userAddress: "456 Pine Street, Apt 7B",
      date: "2025-04-10",
      subject: "Missed Garbage Collection",
      message: "The garbage truck didn't come to our street this Tuesday as scheduled. This is the second time this month. Please look into this issue.",
      status: "pending",
      urgency: "high",
      avatar: "M"
    },
    {
      id: 2,
      user: "John Smith",
      userAddress: "789 Oak Avenue",
      date: "2025-04-09",
      subject: "Recycling Bin Damaged",
      message: "The recycling bin provided by the city was damaged during collection. The lid is broken and there's a crack on the side. Can I get a replacement?",
      status: "in-progress",
      urgency: "medium",
      avatar: "J"
    },
    {
      id: 3,
      user: "Sarah Johnson",
      userAddress: "123 Maple Road",
      date: "2025-04-08",
      subject: "Waste Sorting Question",
      message: "I'm confused about which bin I should put compostable plastics in. The guidelines aren't clear. Can you provide more information?",
      status: "resolved",
      urgency: "low",
      avatar: "S"
    },
    {
      id: 4,
      user: "David Kim",
      userAddress: "567 Birch Lane",
      date: "2025-04-07",
      subject: "Garbage Truck Noise",
      message: "The garbage trucks have been coming at 5 AM lately, which is much earlier than usual. This has been waking up my entire family. Is there a schedule change we weren't notified about?",
      status: "pending",
      urgency: "medium",
      avatar: "D"
    },
    {
      id: 5,
      user: "Lisa Wong",
      userAddress: "890 Cedar Court",
      date: "2025-04-06",
      subject: "Missed Recycling Pickup",
      message: "Our recycling wasn't collected last Thursday. We had it out by 7 AM as required. Please schedule a pickup as soon as possible as our bin is full.",
      status: "resolved",
      urgency: "high",
      avatar: "L"
    }
  ];
  
  // Data for complaints overview chart
  const complaintsChartData = [
    { name: 'Missed Collection', count: 12 },
    { name: 'Damaged Bins', count: 8 },
    { name: 'Schedule Issues', count: 6 },
    { name: 'Sorting Questions', count: 14 },
    { name: 'Other', count: 5 },
  ];

  // Sample related schedules data
  const relatedSchedules = [
    {
      id: 1,
      area: "Pine Street District",
      type: "Regular Waste",
      day: "Tuesday",
      time: "7:00 AM - 10:00 AM",
      truck: "Truck #103",
      driver: "Michael Wilson"
    },
    {
      id: 2,
      area: "Pine Street District",
      type: "Recycling",
      day: "Thursday",
      time: "8:00 AM - 11:00 AM",
      truck: "Truck #205",
      driver: "Jessica Chen"
    }
  ];

  // Sample response templates
  const responseTemplates = [
    {
      id: 1,
      title: "Missed Collection Apology",
      text: "Dear resident, we sincerely apologize for the missed collection. We've notified our collection team and scheduled a pickup for tomorrow. Thank you for bringing this to our attention."
    },
    {
      id: 2,
      title: "Bin Replacement Confirmation",
      text: "Dear resident, we're sorry about the damaged bin. We've scheduled a replacement bin to be delivered within the next 2 business days. The old bin will be collected at the same time."
    },
    {
      id: 3,
      title: "General Inquiry Response",
      text: "Thank you for your inquiry. We appreciate your interest in proper waste management. Our team will review this matter and provide you with detailed information shortly."
    }
  ];

   
  const filterComplaints = () => {
    if (activeTab === 'all') return complaintsData;
    if (activeTab === 'pending') return complaintsData.filter(c => c.status === 'pending');
    if (activeTab === 'in-progress') return complaintsData.filter(c => c.status === 'in-progress');
    if (activeTab === 'resolved') return complaintsData.filter(c => c.status === 'resolved');
    return complaintsData;
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
  
  const getUrgencyBadgeClass = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
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
  
  const handleStatusChange = (e) => {
    if (selectedComplaint) {
      setSelectedComplaint({
        ...selectedComplaint,
        status: e.target.value
      });
    }
  };
  
  const handleSendResponse = () => {
    if (!responseText.trim()) return;
    
    // Here you would send the response to the backend
    alert(`Response sent to ${selectedComplaint.user}: "${responseText}"`);
    
    // Update the complaint status to in-progress if it was pending
    if (selectedComplaint.status === 'pending') {
      setSelectedComplaint({
        ...selectedComplaint,
        status: 'in-progress'
      });
    }
    
    setResponseText('');
  };

  const applyResponseTemplate = (template) => {
    setResponseText(template.text);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="fixed w-60 h-screen bg-white border-r border-slate-200 shadow-sm z-10 left-0 top-0">
        <div className="px-5 py-5 border-b border-slate-200">
          <div className="text-2xl font-bold text-green-600">Vermigo Admin</div>
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
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 font-medium text-sm">P</div>
          <div className="ml-3">
            <div className="text-sm font-medium">Primo Christian</div>
            <div className="text-xs text-slate-500">primoMontejo@gmail.com</div>
          </div>
          
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
        </div>
      </div>
  
      {/* Main Content */}
      <div className="flex-1 p-6 ml-60">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
          <h1 className="text-2xl font-semibold">Complaints Management</h1>
          <div className="flex space-x-2">
            <button className="py-2 px-4 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Export
            </button>
            <button className="py-2 px-4 bg-green-600 rounded-md text-sm font-medium text-white hover:bg-green-700 transition-all duration-200 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Complaint
            </button>
          </div>
        </div>
  
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
            <div className="text-sm text-slate-500 mb-2">Total Complaints</div>
            <div className="text-2xl font-semibold">45</div>
            <div className="text-xs text-green-600 mt-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
              12% from last month
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
            <div className="text-sm text-slate-500 mb-2">Pending</div>
            <div className="text-2xl font-semibold">18</div>
            <div className="text-xs text-yellow-600 mt-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              Needs attention
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
            <div className="text-sm text-slate-500 mb-2">In Progress</div>
            <div className="text-2xl font-semibold">12</div>
            <div className="text-xs text-blue-600 mt-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M20 6L9 17l-5-5"></path>
              </svg>
              Being handled
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
            <div className="text-sm text-slate-500 mb-2">Resolved</div>
            <div className="text-2xl font-semibold">15</div>
            <div className="text-xs text-green-600 mt-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Completed successfully
            </div>
          </div>
        </div>
  
        {/* Chart and List View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Chart */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 lg:col-span-1">
            <div className="text-base font-medium mb-4">Complaints by Category</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={complaintsChartData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4ade80" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
  
          {/* Complaints Section */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-4">
              <button 
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'all' ? 'text-green-600 border-b-2 border-green-600' : 'text-slate-600 hover:text-slate-800'}`}
                onClick={() => setActiveTab('all')}
              >
                All
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'pending' ? 'text-green-600 border-b-2 border-green-600' : 'text-slate-600 hover:text-slate-800'}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'in-progress' ? 'text-green-600 border-b-2 border-green-600' : 'text-slate-600 hover:text-slate-800'}`}
                onClick={() => setActiveTab('in-progress')}
              >
                In Progress
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'resolved' ? 'text-green-600 border-b-2 border-green-600' : 'text-slate-600 hover:text-slate-800'}`}
                onClick={() => setActiveTab('resolved')}
              >
                Resolved
              </button>
            </div>
  
            {/* Search Bar */}
            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Search complaints..." 
                className="w-full px-4 py-2 pl-10 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-2.5 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            </div>
  
            {/* Complaints List */}
            <div className="overflow-hidden bg-white rounded-lg shadow-sm border border-slate-200">
              {filterComplaints().map((complaint) => (
                <div 
                  key={complaint.id} 
                  className="p-4 border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-all duration-200"
                  onClick={() => handleComplaintClick(complaint)}
                >
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 font-medium text-sm mr-3">
                      {complaint.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-base font-medium">{complaint.subject}</div>
                          <div className="text-sm text-slate-500 mb-1">{complaint.user} • {new Date(complaint.date).toLocaleDateString()}</div>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(complaint.status)}`}>
                            {complaint.status === 'in-progress' ? 'In Progress' : complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyBadgeClass(complaint.urgency)}`}>
                            {complaint.urgency.charAt(0).toUpperCase() + complaint.urgency.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {complaint.message}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filterComplaints().length === 0 && (
                <div className="p-6 text-center text-slate-500">
                  No complaints found in this category.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  
      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-40 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-slate-200">
              <h3 className="text-xl font-semibold">Complaint Details</h3>
              <button className="bg-transparent border-none cursor-pointer flex items-center justify-center p-2 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800" onClick={handleCloseComplaintDetail}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="p-5">
              {/* User Info */}
              <div className="flex items-start mb-6">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 font-medium text-lg mr-4">
                  {selectedComplaint.avatar}
                </div>
                <div>
                  <div className="text-lg font-semibold">{selectedComplaint.user}</div>
                  <div className="text-sm text-slate-500">{selectedComplaint.userAddress}</div>
                  <div className="text-xs text-slate-400 mt-1">Submitted on {new Date(selectedComplaint.date).toLocaleDateString()} at {new Date(selectedComplaint.date).toLocaleTimeString()}</div>
                </div>
              </div>
              
              {/* Complaint Info */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-lg font-medium">{selectedComplaint.subject}</h4>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyBadgeClass(selectedComplaint.urgency)}`}>
                      {selectedComplaint.urgency.charAt(0).toUpperCase() + selectedComplaint.urgency.slice(1)} Priority
                    </span>
                    <select 
                      value={selectedComplaint.status} 
                      onChange={handleStatusChange}
                      className="px-2 py-1 rounded text-xs font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg text-slate-700">
                  {selectedComplaint.message}
                </div>
              </div>
              
              {/* Location Map Placeholder */}
              <div className="mb-6">
                <h4 className="text-base font-medium mb-3">Location</h4>
                <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                  <div className="text-slate-400 flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span className="mt-2">Map view would display here</span>
                  </div>
                </div>
              </div>
              
              {/* Response Area */}
              <div className="mb-4">
                <h4 className="text-base font-medium mb-3">Response</h4>
                <textarea 
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                  placeholder="Type your response here..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                ></textarea>
              </div>
  
              {/* Related Collection Schedule */}
              <div className="mb-6">
                <h4 className="text-base font-medium mb-3">Related Collection Schedule</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-slate-600 font-medium">Day</th>
                        <th className="px-4 py-2 text-left text-slate-600 font-medium">Time</th>
                        <th className="px-4 py-2 text-left text-slate-600 font-medium">Type</th>
                        <th className="px-4 py-2 text-left text-slate-600 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-slate-200">
                        <td className="px-4 py-3">Tuesday</td>
                        <td className="px-4 py-3">7:00 AM - 11:00 AM</td>
                        <td className="px-4 py-3">Garbage Collection</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>
                        </td>
                      </tr>
                      <tr className="border-t border-slate-200">
                        <td className="px-4 py-3">Thursday</td>
                        <td className="px-4 py-3">7:00 AM - 11:00 AM</td>
                        <td className="px-4 py-3">Recycling Collection</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Scheduled</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button 
                  className="px-4 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={handleCloseComplaintDetail}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 bg-green-600 rounded-md text-sm font-medium text-white hover:bg-green-700"
                  onClick={handleSendResponse}
                  disabled={!responseText.trim()}
                >
                  Send Response
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
                  P
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
                  <div className="text-sm">{profileData.email}</div>
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
  );}

export default VermigoComplaints;