import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment, IconButton, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('error');

  // Basic password validation - can be expanded further

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      showSnackbar('Email and password are required', 'error');
      return;
    }

    if (password.length < 8) {
      showSnackbar('Password must be at least 8 characters', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        email,
        password
      });

      if (response.data && response.data.success) {
        const token = response.data.token || '';
        const userData = response.data.user || {};

        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('authToken', token);
        storage.setItem('userData', JSON.stringify(userData));

        showSnackbar('Login successful! Redirecting...', 'success');

        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 3000);
      } else {
        showSnackbar('Invalid login response', 'error');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      showSnackbar(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setShowAlert(true);
  };

  useEffect(() => {
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
      loginCard.classList.add('animate-in');
    }
  }, []);


  const handleClickShowPassword = () => setShowPassword((show) => !show);
  
  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleRememberMeChange = () => setRememberMe(!rememberMe);

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth endpoint or handle via library
    window.location.href = '/api/auth/google';
  };

  return (
    
<div className="flex justify-center items-center min-h-[100dvh] w-full p-0 bg-slate-50 bg-[url('/wallpaper.png')] bg-cover bg-center bg-no-repeat font-['Poppins'] fixed top-0 left-0">
{/* Tailwind Keyframes */}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        @keyframes slideInFromRight {
          0% { transform: translateX(50px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideInFromLeft {
          0% { transform: translateX(-50px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fadeUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
          100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
        
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        
        .animate-in { animation: fadeUp 0.8s ease-out forwards; }
        .animate-slide-left-1 { animation: slideInFromLeft 0.6s ease-out 0.3s forwards; opacity: 0; }
        .animate-slide-left-2 { animation: slideInFromLeft 0.6s ease-out 0.4s forwards; opacity: 0; }
        .animate-slide-left-3 { animation: slideInFromLeft 0.6s ease-out 0.5s forwards; opacity: 0; }
        .animate-fade-up-1 { animation: fadeUp 0.6s ease-out 0.6s forwards; opacity: 0; }
        .animate-fade-up-2 { animation: fadeUp 0.6s ease-out 0.7s forwards; opacity: 0; }
        .animate-fade-up-3 { animation: fadeUp 0.6s ease-out 0.8s forwards, pulse 2s infinite; opacity: 0; }
        .animate-fade-up-4 { animation: fadeUp 0.6s ease-out 0.9s forwards; opacity: 0; }
        .animate-fade-up-5 { animation: fadeUp 0.6s ease-out 1s forwards; opacity: 0; }
        .animate-fade-up-6 { animation: fadeUp 0.6s ease-out 1.1s forwards; opacity: 0; }
        .animate-slide-right { animation: slideInFromRight 0.8s ease-out 0.5s forwards; opacity: 0; }
        .animate-float-1 { animation: float 6s ease-in-out infinite; }
        .animate-float-2 { animation: float 8s ease-in-out infinite reverse; }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
      
      <div className="login-card flex w-full max-w-6xl bg-white/85 rounded-2xl overflow-hidden shadow-lg opacity-90 transform translate-y-5">
        <div className="flex-1 p-10">
          <h1 className="animate-slide-left-1 text-2xl font-bold text-green-700 mb-8">Vermigo</h1>
          <h2 className="animate-slide-left-2 text-2xl font-semibold mb-2">Login</h2>
          <p className="animate-slide-left-3 text-slate-500 mb-8 text-sm">Please enter your email and password</p>

          <form onSubmit={handleSubmit}>
            <div className="animate-fade-up-1 mb-6">
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                value={email}
                onChange={handleEmailChange}
                error={!!error}
                placeholder="Email"
                required
                type="email"
              />
            </div>

            <div className="animate-fade-up-1 mb-6">
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                value={password}
                onChange={handlePasswordChange}
                error={!!error}
                placeholder="Password"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleClickShowPassword} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>

            <div className="animate-fade-up-2 flex justify-between items-center mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                  className="mr-2"
                />
                <label htmlFor="remember-me" className="text-sm">Remember me</label>
              </div>
              <a href="/forgot-password" className="text-sm text-green-700 hover:text-green-800 hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="animate-fade-up-3 w-full py-3 bg-green-700 text-white rounded-md font-medium text-sm cursor-pointer hover:bg-green-800 hover:transform hover:-translate-y-1 transition-all duration-300 flex justify-center items-center"
              disabled={isLoading || !email || password.length < 3}
            >
              <div className="flex justify-center items-center">
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
              </div>
            </button>
          </form>
{/*
          <p className="animate-fade-up-4 text-center my-6 text-sm text-slate-500">
            Don't have an account? <a href="/signup" className="text-green-700 font-medium hover:text-green-800 hover:underline">Sign up</a>
          </p>

          <div className="animate-fade-up-5 flex items-center my-6">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="px-4 text-xs text-slate-500">or continue with</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>
*/}


{/*
          <button 
            className="animate-fade-up-6 flex justify-center items-center w-full py-3 bg-white border border-slate-200 rounded-md cursor-pointer text-black hover:bg-slate-100 hover:transform hover:-translate-y-1 hover:shadow-md transition-all duration-300"
            onClick={handleGoogleLogin} 
            disabled={isLoading}
          >
            <img src="/google-icon.png" alt="Google" className="h-6 mr-2" />
            Sign in with Google
          </button>*/}
        </div>

        <div className="flex-1 bg-gradient-to-br from-indigo-100/40 to-indigo-200/40 flex justify-center items-center p-8 relative overflow-hidden">
          <div className="absolute w-50 h-50 bg-indigo-500/20 rounded-full -top-24 -right-24 animate-float-1"></div>
          <div className="absolute w-36 h-36 bg-indigo-500/15 rounded-full -bottom-16 -left-16 animate-float-2"></div>
          <img src="/loginimage2.png" alt="Authentication" className="animate-slide-right max-w-full h-auto relative z-10" />
        </div>

        {/* Notification Alert */}
        <Snackbar
          open={showAlert}
          autoHideDuration={6000}
          onClose={() => setShowAlert(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setShowAlert(false)}
            severity={alertSeverity}
            sx={{ width: '100%' }}
          >
            {alertMessage}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
}

export default Login;