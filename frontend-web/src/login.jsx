import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment, IconButton, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

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

  // Animation effect on component mount
  useEffect(() => {
    document.querySelector('.login-card').classList.add('animate-in');
  }, []);

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  
  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleRememberMeChange = () => setRememberMe(!rememberMe);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Dummy login account check
      if (email === 'admin@example.com' && password === 'password123') {
        console.log('Login successful:', { email, password });
        // Store login state if "Remember me" is checked
        if (rememberMe) {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userEmail', email);
        } else {
          sessionStorage.setItem('isLoggedIn', 'true');
          sessionStorage.setItem('userEmail', email);
        }
        
        setAlertMessage('Login successful! Redirecting to dashboard...');
        setAlertSeverity('success');
        setShowAlert(true);
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        setError('Invalid email or password');
        setAlertMessage('Invalid email or password');
        setAlertSeverity('error');
        setShowAlert(true);
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleGoogleLogin = () => {
    // Redirect to signup page instead of Google login
    window.location.href = '/signup';
  };

  return (
    <div className="login-container">
      <style>
      {`
      /* Login.css */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

:root {
  --primary-color: #6366f1;
  --primary-hover: #4f46e5;
  --text-dark: #1e293b;
  --text-light: #64748b;
  --background-color: #f8fafc;
  --card-background: #ffffff;
  --border-color: #e2e8f0;
  --success-color: #22c55e;
  --error-color: #ef4444;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.checkbox-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  animation: fadeUp 0.6s ease-out 0.7s forwards;
  opacity: 0;
}
body {
  font-family: 'Poppins', sans-serif;
  background-color: var(--background-color);
  color: var(--text-dark);
  line-height: 1.6;
}

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
}

/* Keyframe Animations */
@keyframes slideInFromRight {
  0% {
    transform: translateX(50px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInFromLeft {
  0% {
    transform: translateX(-50px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeUp {
  0% {
    transform: translateY(20px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
}

.login-card {
  display: flex;
  width: 100%;
  max-width: 900px;
  background-color: var(--card-background);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transform: translateY(20px);
}

.login-card.animate-in {
  animation: fadeUp 0.8s ease-out forwards;
}

.login-form-container {
  flex: 1;
  padding: 2.5rem;
}

.brand-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 2rem;
  animation: slideInFromLeft 0.6s ease-out 0.3s forwards;
  opacity: 0;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  animation: slideInFromLeft 0.6s ease-out 0.4s forwards;
  opacity: 0;
}

.login-subtitle {
  color: var(--text-light);
  margin-bottom: 2rem;
  font-size: 0.875rem;
  animation: slideInFromLeft 0.6s ease-out 0.5s forwards;
  opacity: 0;
}

.form-group {
  margin-bottom: 1.5rem;
  animation: fadeUp 0.6s ease-out 0.6s forwards;
  opacity: 0;
}

.checkbox-group {
  display: flex;
  align-items: center;
  animation: fadeUp 0.6s ease-out 0.7s forwards;
  opacity: 0;
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: fadeUp 0.6s ease-out 0.8s forwards, pulse 2s infinite;
  opacity: 0;
}

.login-button:hover {
  background-color: var(--primary-hover);
  transform: translateY(-2px);
}

.login-button:disabled {
  background-color: #a5a6f6;
  cursor: not-allowed;
  animation: none;
}

.login-button .button-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.signup-prompt {
  text-align: center;
  margin: 1.5rem 0;
  font-size: 0.875rem;
  color: var(--text-light);
  animation: fadeUp 0.6s ease-out 0.9s forwards;
  opacity: 0;
}

.signup-prompt a {
  color: var(--primary-color);
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
}

.signup-prompt a:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

.or-divider {
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  animation: fadeUp 0.6s ease-out 1s forwards;
  opacity: 0;
}

.or-divider::before,
.or-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background-color: var(--border-color);
}

.or-divider span {
  padding: 0 1rem;
  color: var(--text-light);
  font-size: 0.75rem;
}

.google-login-button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 0.75rem;
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  cursor: pointer;
  color: black;
  transition: all 0.3s ease;
  animation: fadeUp 0.6s ease-out 1.1s forwards;
  opacity: 0;
}

.google-login-button:hover {
  background-color: #f1f5f9;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px -3px rgba(0, 0, 0, 0.1);
}

.google-login-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.google-icon {
  height: 1.5rem;
  margin-right: 0.5rem;
}

.login-image-container {
  flex: 1;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.auth-image {
  max-width: 100%;
  height: auto;
  animation: slideInFromRight 0.8s ease-out 0.5s forwards;
  opacity: 0;
  position: relative;
  z-index: 1;
}

.login-image-container::before {
  content: '';
  position: absolute;
  width: 200px;
  height: 200px;
  background: rgba(99, 102, 241, 0.2);
  border-radius: 50%;
  top: -100px;
  right: -100px;
  animation: float 6s ease-in-out infinite;
}

.login-image-container::after {
  content: '';
  position: absolute;
  width: 150px;
  height: 150px;
  background: rgba(99, 102, 241, 0.15);
  border-radius: 50%;
  bottom: -75px;
  left: -75px;
  animation: float 8s ease-in-out infinite reverse;
}

@keyframes float {
  0% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
  100% {
    transform: translateY(0) rotate(0deg);
  }
}

.error-text {
  color: var(--error-color);
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.input-shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% {
    transform: translateX(-1px);
  }
  20%, 80% {
    transform: translateX(2px);
  }
  30%, 50%, 70% {
    transform: translateX(-4px);
  }
  40%, 60% {
    transform: translateX(4px);
  }
}

/* Responsive styles */
@media (max-width: 768px) {
  .login-card {
    flex-direction: column-reverse;
  }
  
  .login-image-container {
    padding: 2rem 2rem 0;
  }
  
  .auth-image {
    max-height: 200px;
  }
}
      `}
      </style>
      <div className="login-card">
        <div className="login-form-container">
          <h1 className="brand-name">Vermigo</h1>
          
          <h2 className="login-title">Login</h2>
          <p className="login-subtitle">Please enter your email and password</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                value={email}
                onChange={handleEmailChange}
                error={error !== ''}
                className={error !== '' ? 'input-shake' : ''}
                placeholder="admin@example.com"
              />
            </div>

            <div className="form-group">
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                value={password}
                onChange={handlePasswordChange}
                error={error !== ''}
                className={error !== '' ? 'input-shake' : ''}
                placeholder="password123"
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
              {error && <p className="error-text">{error}</p>}
            </div>
            
            <div className="checkbox-container">
              <div className="checkbox-group">
                <input 
                  type="checkbox" 
                  id="remember-me" 
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                />
                <label htmlFor="remember-me">Remember me</label>
              </div>
              <a href="/forgot-password" className="forgot-password-link">Forgot Password?</a>
            </div>
            
            <button 
              type="submit" 
              className="login-button" 
              disabled={isLoading}
            >
              <div className="button-content">
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
              </div>
            </button>
          </form>
          
          <p className="signup-prompt">
            Don't have an account? <a href="/signup">Sign up</a>
          </p>
          
          <div className="or-divider">
            <span>or continue with</span>
          </div>
          
          <button 
            className="google-login-button" 
            onClick={handleGoogleLogin}
          >
            <img src="/google-icon.png" alt="Google" className="google-icon" />
            Sign in with Google
          </button>
        </div>
        
        <div className="login-image-container">
          <img src="/loginimage-removebg.png" alt="Authentication" className="auth-image" />
        </div>
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
  );
}

export default Login;