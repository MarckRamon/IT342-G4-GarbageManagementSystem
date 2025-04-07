import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';

function VermigoComplaints() {
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();
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
  return (
    <div className="dashboard-container">
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
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
          /* for popup modal*/

         .profile-popup {
  position: absolute; /* Position relative to the parent */
  bottom: 70px; /* Position above the user info */
  left: 10px; /* Position from the left */
  width: 220px; /* Width of the popup */
  background-color: var(--card-background); /* Background color */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* Shadow for depth */
  border-radius: 0.5rem; /* Rounded corners */
  z-index: 30; /* Ensure it appears above other content */
  border: 1px solid var(--border-color); /* Border color */
  overflow: hidden; /* Hide overflow */
}

/* Popup Item Styles */
.popup-item {
  padding: 0.75rem 1rem; /* Padding around each item */
  display: flex; /* Flexbox for layout */
  align-items: center; /* Center items vertically */
  cursor: pointer; /* Pointer cursor on hover */
  transition: background-color 0.2s ease; /* Transition for hover effect */
}

.popup-item:hover {
  background-color: rgba(93, 166, 70, 0.05); /* Light background on hover */
}

/* Popup Item Icon Styles */
.popup-item-icon {
  margin-right: 0.75rem; /* Margin to the right of the icon */
  color: var(--text-light); /* Icon color */
}

/* Popup Item Text Styles */
.popup-item-text {
  font-size: 0.875rem; /* Font size for text */
  color: var(--text-dark); /* Text color */
}

/* Popup Divider Styles */
.popup-divider {
  height: 1px; /* Height of the divider */
  background-color: var(--border-color); /* Divider color */
  margin: 0; /* No margin */
}
        body {
          font-family: 'Poppins', sans-serif;
          background-color: var(--background-color);
          color: var(--text-dark);
          line-height: 1.6;
          margin:0;
        }
        
        .dashboard-container {
          display: flex;
          min-height: 100vh;
        }
         /*popup modal*/
         .modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent background */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100; /* Ensure it appears above other content */
}

.modal-container {
  background-color: var(--card-background); /* Background color of the modal */
  border-radius: 0.5rem; /* Rounded corners */
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); /* Shadow for depth */
  width: 90%; /* Responsive width */
  max-width: 500px; /* Maximum width */
  max-height: 80vh; /* Maximum height */
  overflow-y: auto; /* Scroll if content overflows */
  position: relative; /* For positioning child elements */
}

.modal-header {
  display: flex; /* Flexbox for layout */
  justify-content: space-between; /* Space between title and close button */
  align-items: center; /* Center vertically */
  padding: 1.25rem; /* Padding around header */
  border-bottom: 1px solid var(--border-color); /* Bottom border */
}

.modal-title {
  font-size: 1.25rem; /* Title font size */
  font-weight: 600; /* Bold title */
}

.modal-close {
  background: transparent; /* Transparent background */
  border: none; /* No border */
  cursor: pointer; /* Pointer cursor on hover */
  display: flex; /* Flexbox for centering */
  align-items: center; /* Center vertically */
  justify-content: center; /* Center horizontally */
  padding: 0.5rem; /* Padding around button */
  border-radius: 0.25rem; /* Rounded corners */
  color: var(--text-light); /* Text color */
}

.modal-close:hover {
  background-color: #f1f5f9; /* Light background on hover */
  color: var(--text-dark); /* Darker text on hover */
}

.modal-body {
  padding: 1.25rem; /* Padding around body */
}

.profile-header {
  display: flex; /* Flexbox for layout */
  align-items: center; /* Center vertically */
  margin-bottom: 1.5rem; /* Margin below header */
}

.profile-avatar {
  width: 4rem; /* Avatar size */
  height: 4rem; /* Avatar size */
  border-radius: 50%; /* Circular avatar */
  background-color: #f1f5f9; /* Background color */
  display: flex; /* Flexbox for centering */
  align-items: center; /* Center vertically */
  justify-content: center; /* Center horizontally */
  color: var(--text-dark); /* Text color */
  font-weight: 500; /* Font weight */
  font-size: 1.5rem; /* Font size */
  margin-right: 1rem; /* Margin to the right */
}

.profile-name {
  font-size: 1.25rem; /* Name font size */
  font-weight: 600; /* Bold name */
}

.profile-role {
  color: var(--text-light); /* Role text color */
  font-size: 0.875rem; /* Role font size */
}

.profile-info-group {
  margin-bottom: 1.5rem; /* Margin below group */
}

.profile-info-title {
  font-size: 0.875rem; /* Title font size */
  color: var(--text-light); /* Title text color */
  margin-bottom: 0.5rem; /* Margin below title */
}

.profile-info-item {
  display: flex; /* Flexbox for layout */
  margin-bottom: 0.75rem; /* Margin below item */
}

.profile-info-icon {
  color: var(--text-light); /* Icon color */
  margin-right: 0.75rem; /* Margin to the right */
  flex-shrink: 0; /* Prevent shrinking */
  display: flex; /* Flexbox for centering */
  align-items: center; /* Center vertically */
}

.profile-info-text {
  font-size: 0.875rem; /* Text font size */
}

.profile-footer {
  padding: 1.25rem; /* Padding around footer */
  border-top: 1px solid var(--border-color); /* Top border */
  display: flex; /* Flexbox for layout */
  justify-content: flex-end; /* Align buttons to the right */
}

.profile-button {
  padding: 0.5rem 1rem; /* Padding around button */
  border-radius: 0.375rem; /* Rounded corners */
  font-size: 0.875rem; /* Font size */
  font-weight: 500; /* Font weight */
  cursor: pointer; /* Pointer cursor on hover */
  transition: all 0.2s ease; /* Transition for hover effects */
}

.profile-button.primary {
  background-color: var(--primary-color); /* Primary button background */
  color: white; /* Primary button text color */
  border: none; /* No border */
}

.profile-button.primary:hover {
  background-color: var(--primary-hover); /* Darker background on hover */
}

.profile-button.secondary {
  background-color: transparent; /* Transparent background */
  color: var(--text-dark); /* Text color */
  border: 1px solid var(--border-color); /* Border */
  margin-right: 0.75rem; /* Margin to the right */
}

.profile-button.secondary:hover {
  background-color: #f1f5f9; /* Light background on hover */
}

        .sidebar {
  width: 240px;
  background-color: var(--card-background);
  border-right: 1px solid var(--border-color);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 0;
  position: fixed;
  height: 100vh;
  z-index: 10;
  left: 0; /* Position the sidebar to the very left */
  top: 0; /* Align the sidebar to the top */
}
        
        .logo-container {
          padding: 1.25rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary-color);
        }
        
        .sidebar-menu {
          padding: 1.25rem 0;
        }
        
        .sidebar-menu ul {
          list-style: none;
        }
        
        .menu-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.25rem;
          color: var(--text-light);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .menu-item.active {
          color: var(--primary-color);
          background-color: rgba(93, 166, 70, 0.08);
        }
        
        .menu-item:hover {
          background-color: rgba(93, 166, 70, 0.05);
        }
        
        .menu-item-icon {
          margin-right: 0.75rem;
        }
        
        .main-content {
  flex: 1;
  padding: 1.5rem;
  margin-left: 240px; /* Add margin to the left to accommodate the sidebar */
}
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .page-title {
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        .filter-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .filter-label {
          color: var(--text-light);
          margin-right: 0.5rem;
        }
        
        .filter-select {
          background-color: white;
          border: 1px solid var(--border-color);
          border-radius: 0.25rem;
          padding: 0.5rem 2rem 0.5rem 0.75rem;
          font-family: 'Poppins', sans-serif;
          color: var(--text-dark);
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2364748b'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          background-size: 1.25rem;
          cursor: pointer;
        }
        
        .filter-select:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px rgba(93, 166, 70, 0.2);
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .metric-card {
          background-color: var(--card-background);
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .metric-label {
          font-size: 0.875rem;
          color: var(--text-light);
          margin-bottom: 0.5rem;
        }
        
        .metric-value {
          font-size: 1.75rem;
          font-weight: 700;
        }
        
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .chart-card {
          background-color: var(--card-background);
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .chart-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        
        .chart-container {
          height: 240px;
        }
        
        .location-item {
          margin-bottom: 1rem;
        }
        
        .location-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }
        
        .location-name {
          color: var(--text-dark);
        }
        
        .location-value {
          font-weight: 500;
        }
        
        .progress-bar {
          width: 100%;
          height: 0.5rem;
          background-color: #f1f5f9;
          border-radius: 9999px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.3s ease;
        }
        
        .calendar-card {
          background-color: var(--card-background);
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .calendar-title {
          display: flex;
          align-items: center;
        }
        
        .month {
          font-size: 1.25rem;
          font-weight: 600;
          margin-right: 0.5rem;
        }
        
        .year {
          font-size: 1.25rem;
          color: var(--text-light);
        }
        
        .calendar-nav {
          display: flex;
        }
        
        .calendar-nav-button {
          background: transparent;
          border: none;
          color: var(--text-light);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .calendar-nav-button:hover {
          background-color: #f1f5f9;
          color: var(--text-dark);
        }
        
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.25rem;
        }
        
        .calendar-day-header {
          font-size: 0.75rem;
          color: var(--text-light);
          text-align: center;
          padding: 0.5rem 0;
        }
        
        .calendar-day {
          height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          border-radius: 0.25rem;
        }
        
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
        
        .avatar {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          background-color: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-dark);
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .user-info {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 240px;
          padding: 1rem;
          display: flex;
          align-items: center;
          border-top: 1px solid var(--border-color);
          background-color: var(--card-background);
        }
        
        .user-details {
          margin-left: 0.75rem;
        }
        
        .user-name {
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .user-email {
          font-size: 0.75rem;
          color: var(--text-light);
        }
        
        @media (max-width: 768px) {
          .sidebar {
            width: 0;
            overflow: hidden;
          }
          
          .main-content {
            margin-left: 0;
          }
          
          .metrics-grid, .charts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}
      </style>

      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-container">
          <div className="logo">Vermigo Admin</div>
        </div>
        <div className="sidebar-menu">
          <ul>
            <li className="menu-item">
            <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="menu-item-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </span>
              Dashboard
              </Link>
            </li>
            <li className="menu-item active">
                  <Link to="/complaints" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="menu-item-icon">
            
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </span>
              Complaints
              </Link>
            </li>
            <li className="menu-item">
            <Link to="/schedule" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="menu-item-icon">
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
          </ul>
        </div>
        <div className="user-info" onClick={toggleProfilePopup}>
          <div className="avatar">P</div>
          <div className="user-details">
            <div className="user-name">Primo Christian</div>
            <div className="user-email">primoMontejo@gmail.com</div>
          </div>
              {/* Profile Popup */}
         {showProfilePopup && (
                    <div className="profile-popup">
                        <div className="popup-item" onClick={openProfileModal}>
                            <div className="popup-item-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            <div className="popup-item-text">View Profile</div>
                        </div>
                        <div className="popup-divider"></div>
                        <div className="popup-item" onClick={handleLogout}>
                            <div className="popup-item-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                            </div>
                            <div className="popup-item-text">Logout</div>
                        </div>
                    </div>
                )}
        </div>
         {/* Profile Popup */}
         {showProfilePopup && (
                    <div className="profile-popup">
                        <div className="popup-item" onClick={openProfileModal}>
                            <div className="popup-item-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            <div className="popup-item-text">View Profile</div>
                        </div>
                        <div className="popup-divider"></div>
                        <div className="popup-item" onClick={handleLogout}>
                            <div className="popup-item-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                            </div>
                            <div className="popup-item-text">Logout</div>
                        </div>
                    </div>
                )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <h1 className="page-title">Complaints</h1>
        </div>

        

          {/* Activity Chart */}
     
        </div>

        

        
              {/* Profile Modal */}
            {showProfileModal && (
                <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Profile Information</h3>
                            <button className="modal-close" onClick={() => setShowProfileModal(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="profile-header">
                                <div className="profile-avatar">P</div>
                                <div>
                                    <div className="profile-name">{profileData.name}</div>
                                    <div className="profile-role">{profileData.role}</div>
                                </div>
                            </div>

                            <div className="profile-info-group">
                                <div className="profile-info-title">Contact Information</div>
                                <div className="profile-info-item">
                                    <div className="profile-info-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                        </svg>
                                    </div>
                                    <div className="profile-info-text">{profileData.phone}</div>
                                </div>
                                <div className="profile-info-item">
                                    <div className="profile-info-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                            <polyline points="22,6 12,13 2,6"></polyline>
                                        </svg>
                                    </div>
                                    <div className="profile-info-text">{profileData.email}</div>
                                </div>
                                <div className="profile-info-item">
                                    <div className="profile-info-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3"></circle>
                                        </svg>
                                    </div>
                                    <div className="profile-info-text">{profileData.address}</div>
                                </div>
                            </div>

                            <div className="profile-info-group">
                                <div className="profile-info-title">Work Information</div>
                                <div className="profile-info-item">
                                    <div className="profile-info-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                        </svg>
                                    </div>
                                    <div className="profile-info-text">{profileData.department}</div>
                                </div>
                                <div className="profile-info-item">
                                    <div className="profile-info-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                    </div>
                                    <div className="profile-info-text">Joined on {profileData.joinDate}</div>
                                </div>
                            </div>
                        </div>
                        <div className="profile-footer">
                            <button className="profile-button secondary" onClick={() => setShowProfileModal(false)}>Close</button>
                            <button className="profile-button primary">Edit Profile</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
   
      
    
   
  );
}

export default VermigoComplaints;