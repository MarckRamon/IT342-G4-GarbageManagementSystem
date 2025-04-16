import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css'
import Login from './login.jsx'
import Signup from './signup.jsx'
import ForgotPassword from './forgotpw.jsx';
import VermigoDashboard from './page/dashboard.jsx';
import VermigoSchedule from './page/Schedule.jsx';
import VermigoComplaints from './page/complaints.jsx';
import MapPage from './page/MapPage.jsx';

import { useEffect } from 'react';

function RequireAuth({ children }) {
  const isAuthenticated = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  const location = useLocation();

  if (!isAuthenticated) {
    // Not logged in, send to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated, show children
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
   
        {/* Private routes */}
        <Route path="/dashboard" element={
          <RequireAuth>
            <VermigoDashboard />
          </RequireAuth>
        } />
        <Route path="/schedule" element={
          <RequireAuth>
            <VermigoSchedule />
          </RequireAuth>
        } />
        <Route path="/complaints" element={
          <RequireAuth>
            <VermigoComplaints />
          </RequireAuth>
        } />
      
<Route path="/map" element={
          <RequireAuth>
            <MapPage />
          </RequireAuth>
        } />
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

