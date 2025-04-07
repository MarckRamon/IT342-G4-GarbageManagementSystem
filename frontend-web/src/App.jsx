import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import './App.css'
import Login from './login.jsx'
import Signup from './signup.jsx'
import ForgotPassword from './forgotpw.jsx';
import VermigoDashboard from './dashboard.jsx';
import VermigoSchedule from './Schedule.jsx';
import VermigoComplaints from './complaints.jsx';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<VermigoDashboard />} />
        <Route path="/schedule" element={<VermigoSchedule />} />
        <Route path="/complaints" element={<VermigoComplaints />} />
        <Route path="/" element={<Navigate to="/login" />} />

      </Routes>
    </BrowserRouter>
  );
}


function Dashboard() {
  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      fontFamily: 'Poppins, sans-serif' 
    }}>
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard!</p>
    </div>
  );
}

export default App;

