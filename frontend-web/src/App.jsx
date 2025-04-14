import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import './App.css'
import Login from './login.jsx'
import Signup from './signup.jsx'
import ForgotPassword from './forgotpw.jsx';
import VermigoDashboard from './page/dashboard.jsx';
import VermigoSchedule from './page/Schedule.jsx';
import VermigoComplaints from './page/complaints.jsx';
import MapPage from './page/MapPage.jsx';

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
        <Route path="/map" element={<MapPage />} />
        <Route path="/" element={<Navigate to="/login" />} />

      </Routes>
    </BrowserRouter>
  );
}


export default App;

