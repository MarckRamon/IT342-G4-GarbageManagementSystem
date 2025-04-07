import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

function VermigoComplaints() {
 
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
          <div className="logo">Vermigo</div>
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
        <div className="user-info">
          <div className="avatar">P</div>
          <div className="user-details">
            <div className="user-name">Primo Christian</div>
            <div className="user-email">primoMontejo@gmail.com</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <h1 className="page-title">Complaints</h1>
        </div>

        

          {/* Activity Chart */}
     
        </div>

        

        
            {/* Empty days before first day of month (Monday) */}
            <div></div>
            
          </div>
      
    
   
  );
}

export default VermigoComplaints;