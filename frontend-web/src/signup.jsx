import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle, Cancel } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import for navigation

function Signup() {
  const navigate = useNavigate(); // Hook for navigation
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role] = useState('USER'); // Default role
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    capital: false,
    number: false,
    symbol: false
  });

  // Animation effect on component mount
  useEffect(() => {
    document.querySelector('.signup-card').classList.add('animate-in');
  }, []);

  const handleLocationChange = (e) => {
    let newLocation = e.target.value;
    
    // Optional: Check if newLocation is a URL and handle it accordingly
    if (newLocation && !newLocation.startsWith('http')) {
      setLocation(newLocation);  // Only set if it's not an invalid URL
    }
  };

  // Validate email format
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Handle email change with validation
  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    if (newEmail && !validateEmail(newEmail)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  // Check password strength and update validation state
  const checkPassword = (password) => {
    setPasswordValidation({
      length: password.length >= 11,
      capital: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    });
  };

  // Handle password change with validation
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPassword(newPassword);
  };

  const handleShowPassword = () => setShowPassword((show) => !show);
  const handleShowConfirmPassword = () => setShowConfirmPassword((show) => !show);

  // Check if all password requirements are met
  const isPasswordValid = () => {
    return Object.values(passwordValidation).every(value => value === true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the page reload
  
    // Check for form validation before submission
    if (!isPasswordValid() || password !== confirmPassword || !validateEmail(email)) {
      setError('Please fix the form errors before submitting.');
      return;
    }
  
    // Create registration request object based on backend expectations
    const registerRequest = {
      firstName,
      lastName,
      email,
      phoneNumber,
      username,
      location,
      password,
      role // Include role from state
    };

    setIsLoading(true);
    setError('');
    
    try {
      // Call the backend registration endpoint
      const response = await axios.post('http://localhost:8080/api/auth/register', registerRequest);
      
      if (response.data && response.data.token) {
        // Store the authentication token in localStorage
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userId', response.data.userId);
        localStorage.setItem('userEmail', response.data.email);
        localStorage.setItem('userRole', response.data.role);
        
        // Show success message and redirect to login
        alert('Registration successful! Please login with your credentials.');
        navigate('/login');
      } else if (response.data && response.data.error) {
        // Handle specific error from backend
        setError(response.data.error);
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (error) {
      // Handle error responses
      if (error.response && error.response.data) {
        setError(error.response.data.error || 'Registration failed: ' + error.response.data);
      } else {
        setError('Registration failed: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    try {
      // This is a placeholder for Firebase Google authentication
      // You'll need to implement this based on your Firebase configuration
      
      // Example Google auth flow:
      // 1. Import Firebase auth: import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
      // 2. Initialize provider: const provider = new GoogleAuthProvider();
      // 3. Authenticate: const result = await signInWithPopup(getAuth(), provider);
      // 4. Get the Firebase token: const token = await result.user.getIdToken();
      // 5. Send token to backend for verification

      // For now, show an alert that this feature is not yet implemented
      alert('Google signup is not yet implemented');
    } catch (error) {
      setError('Google signup failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <style>
      {`
      /* Signup.css */
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

      :root {
        --primary-color: #5da646;
        --primary-hover: #40752f;
        --primary-light: #4f46e5;
        --text-dark: #1e293b;
        --text-light: #64748b;
        --background-color: rgba(248, 250, 252, 0.8); /* 80% opacity */
        --card-background: rgba(248, 250, 252, 0.85); /* 85s% opacity */  
        --border-color: #e2e8f0;
        --error-color: #ef4444;
        --success-color: #22c55e;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: 'Poppins', sans-serif;
        background-color: var(--background-color);
        background-image: url('/wallpaper.png');
        color: var(--text-dark);
        line-height: 1.6;
      }

      .signup-container {
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

      @keyframes float {
        0% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
        }
        100% {
          transform: translateY(0);
        }
      }

      .signup-card {
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

      .signup-card.animate-in {
        animation: fadeUp 0.8s ease-out forwards;
      }

      .signup-image-container {
        flex: 1;
     background-color: rgba(241, 245, 249, 0.85); /* 85% opaque */
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 2rem;
        position: relative;
      }

      .hands-image {
        max-width: 100%;
        height: auto;
        animation: float 6s ease-in-out infinite;
        z-index: 1;
      }

      .signup-form-container {
        flex: 1;
        padding: 2.5rem;
      }

      .brand-name {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-dark);
        margin-bottom: 1.5rem;
        text-align: right;
        animation: slideInFromRight 0.6s ease-out 0.3s forwards;
        opacity: 0;
      }

      .signup-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        animation: slideInFromLeft 0.6s ease-out 0.4s forwards;
        opacity: 0;
      }

      .signup-subtitle {
        color: var(--text-light);
        margin-bottom: 1.5rem;
        font-size: 0.875rem;
        animation: slideInFromLeft 0.6s ease-out 0.5s forwards;
        opacity: 0;
      }

      .form-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        animation: fadeUp 0.6s ease-out 0.6s forwards;
        opacity: 0;
      }

      .form-group {
        flex: 1;
        margin-bottom: 1rem;
        animation: fadeUp 0.6s ease-out 0.7s forwards;
        opacity: 0;
      }

      .input-field {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: 0.375rem;
        font-size: 0.875rem;
        transition: border-color 0.2s;
      }

      .input-field:focus {
        outline: none;
        border-color: var(--primary-color);
      }

      .password-field {
        position: relative;
      }

      .visibility-toggle {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
      }

      .signup-button {
        width: 100%;
        padding: 0.75rem;
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 0.375rem;
        font-weight: 500;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background-color 0.2s;
        margin-top: 1rem;
        animation: fadeUp 0.6s ease-out 0.8s forwards;
        opacity: 0;
      }

      .signup-button:hover {
        background-color: var(--primary-hover);
      }

      .signup-button:disabled {
        background-color: #90eb73;
        cursor: not-allowed;
      }

      .login-prompt {
        text-align: center;
        margin: 1.5rem 0;
        font-size: 0.875rem;
        color: var(--text-light);
        animation: fadeUp 0.6s ease-out 0.9s forwards;
        opacity: 0;
      }

      .login-prompt a {
        color: var(--primary-color);
        font-weight: 500;
        text-decoration: none;
      }

      .login-prompt a:hover {
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

      .google-signup-button {
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

      .google-signup-button:hover {
        background-color: #f1f5f9;
      }

      .google-icon {
        height: 1.5rem;
        margin-right: 0.5rem;
      }

      .error-text {
        color: var(--error-color);
        font-size: 0.8rem;
        margin-top: 0.5rem;
      }

      /* Password Requirements */
      .password-requirements {
        margin-top: 10px;
        font-size: 0.8rem;
      }

      .requirement-item {
        display: flex;
        align-items: center;
        margin-bottom: 4px;
      }

      .requirement-icon {
        margin-right: 8px;
        font-size: 1rem;
      }

      .requirement-valid {
        color: var(--success-color);
      }

      .requirement-invalid {
        color: var(--error-color);
      }

      .requirement-text {
        color: var(--text-light);
      }

      /* Responsive styles */
      @media (max-width: 768px) {
        .signup-card {
          flex-direction: column;
        }
        
        .signup-image-container {
          padding: 2rem 2rem 0;
        }
        
        .hands-image {
          max-height: 200px;
        }
        
        .form-row {
          flex-direction: column;
          gap: 0;
        }
      }
      `}
      </style>
      <div className="signup-card">
        <div className="signup-image-container">
          <img src="/signinimage.png" alt="Signup Illustration" className="hands-image" />
        </div>

        <div className="signup-form-container">
          <h1 className="brand-name">Vermigone</h1>
          <h2 className="signup-title">Sign up</h2>
          <p className="signup-subtitle">Let's get you all set up so you can access your personal account.</p>

          {error && <div className="error-alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <TextField
                  label="First Name"
                  variant="outlined"
                  fullWidth
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  required
                />
              </div>
              
              <div className="form-group">
                <TextField
                  label="Last Name"
                  variant="outlined"
                  fullWidth
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <TextField
                  label="Email"
                  variant="outlined"
                  fullWidth
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Email"
                  required
                  error={!!emailError}
                  helperText={emailError}
                />
              </div>
              
              <div className="form-group">
                <TextField
                  label="Phone Number"
                  variant="outlined"
                  fullWidth
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Phone Number"
                />
              </div>
            </div>
            
            <div className="form-group">
              <TextField
                label="Username"
                variant="outlined"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
              />
            </div>

            <div className="form-group">
              <TextField
                label="Location"
                variant="outlined"
                fullWidth
                value={location}
                onChange={handleLocationChange}
                placeholder="Enter your location"
                required
                name="location"
                autoComplete="off"
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
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleShowPassword} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <div className="password-requirements">
                <div className="requirement-item">
                  <span className="requirement-icon">
                    {passwordValidation.length ? 
                      <CheckCircle fontSize="small" className="requirement-valid" /> : 
                      <Cancel fontSize="small" className="requirement-invalid" />
                    }
                  </span>
                  <span className="requirement-text">At least 11 characters</span>
                </div>
                <div className="requirement-item">
                  <span className="requirement-icon">
                    {passwordValidation.capital ? 
                      <CheckCircle fontSize="small" className="requirement-valid" /> : 
                      <Cancel fontSize="small" className="requirement-invalid" />
                    }
                  </span>
                  <span className="requirement-text">At least one capital letter</span>
                </div>
                <div className="requirement-item">
                  <span className="requirement-icon">
                    {passwordValidation.number ? 
                      <CheckCircle fontSize="small" className="requirement-valid" /> : 
                      <Cancel fontSize="small" className="requirement-invalid" />
                    }
                  </span>
                  <span className="requirement-text">At least one number</span>
                </div>
                <div className="requirement-item">
                  <span className="requirement-icon">
                    {passwordValidation.symbol ? 
                      <CheckCircle fontSize="small" className="requirement-valid" /> : 
                      <Cancel fontSize="small" className="requirement-invalid" />
                    }
                  </span>
                  <span className="requirement-text">At least one symbol (!@#$%^&*())</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <TextField
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                error={password !== confirmPassword && confirmPassword !== ''}
                helperText={password !== confirmPassword && confirmPassword !== '' ? 'Passwords do not match' : ''}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleShowConfirmPassword} edge="end">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </div>
            
            <button 
              type="submit" 
              className="signup-button"
              disabled={isLoading || !isPasswordValid() || password !== confirmPassword || !validateEmail(email)}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Create account'}
            </button>
          </form>

          <p className="login-prompt">
            Already have an account? <a href="/login">Login</a>
          </p>

          <div className="or-divider">
            <span>or sign up with</span>
          </div>

          <button
            className="google-signup-button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
          >
            <img src="/google-icon.png" alt="Google" className="google-icon" />
            Sign up with Google
          </button>
        </div>
      </div>
    </div>
  );
}


export default Signup;