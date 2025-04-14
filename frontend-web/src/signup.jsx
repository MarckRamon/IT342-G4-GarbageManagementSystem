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
    
<div className="flex justify-center items-center h-[100dvh] min-h-[1100px] w-full p-0 bg-slate-50 bg-[url('/wallpaper.png')] bg-cover bg-center bg-no-repeat font-['Poppins'] absolute inset-0 overflow-auto">
<style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
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
        
        .animate-in {
          animation: fadeUp 0.8s ease-out forwards;
        }
        
        .brand-name {
          animation: slideInFromRight 0.6s ease-out 0.3s forwards;
          opacity: 0;
        }
        
        .signup-title {
          animation: slideInFromLeft 0.6s ease-out 0.4s forwards;
          opacity: 0;
        }
        
        .signup-subtitle {
          animation: slideInFromLeft 0.6s ease-out 0.5s forwards;
          opacity: 0;
        }
        
        .form-row {
          animation: fadeUp 0.6s ease-out 0.6s forwards;
          opacity: 0;
        }
        
        .form-group {
          animation: fadeUp 0.6s ease-out 0.7s forwards;
          opacity: 0;
        }
        
        .signup-button {
          animation: fadeUp 0.6s ease-out 0.8s forwards;
          opacity: 0;
        }
        
        .login-prompt {
          animation: fadeUp 0.6s ease-out 0.9s forwards;
          opacity: 0;
        }
        
        .or-divider {
          animation: fadeUp 0.6s ease-out 1s forwards;
          opacity: 0;
        }
        
        .google-signup-button {
          animation: fadeUp 0.6s ease-out 1.1s forwards;
          opacity: 0;
        }
        
        .hands-image {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      <div className="signup-card flex flex-col md:flex-row w-full max-w-[900px] bg-slate-50 bg-opacity-85 rounded-2xl overflow-hidden shadow-lg opacity-0 transform translate-y-5">
        <div className="signup-image-container md:flex-1 bg-slate-100 bg-opacity-85 flex justify-center items-center p-4 md:p-8 relative">
          <img src="/signinimage.png" alt="Signup Illustration" className="hands-image max-w-full h-auto z-10" />
        </div>

        <div className="signup-form-container md:flex-1 p-6 md:p-10">
          <h1 className="brand-name text-2xl font-bold text-slate-900 mb-6 text-right">Vermigone</h1>
          <h2 className="signup-title text-2xl font-semibold mb-2">Sign up</h2>
          <p className="signup-subtitle text-sm text-slate-500 mb-6">Let's get you all set up so you can access your personal account.</p>

          {error && <div className="bg-red-50 text-red-500 p-3 rounded mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row flex flex-col md:flex-row gap-4 mb-4">
              <div className="form-group flex-1 mb-4">
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
              
              <div className="form-group flex-1 mb-4">
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
            
            <div className="form-row flex flex-col md:flex-row gap-4 mb-4">
              <div className="form-group flex-1 mb-4">
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
              
              <div className="form-group flex-1 mb-4">
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
            
            <div className="form-group mb-4">
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

            <div className="form-group mb-4">
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

            <div className="form-group mb-4">
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
              <div className="mt-2.5 text-xs">
                <div className="flex items-center mb-1">
                  <span className="mr-2">
                    {passwordValidation.length ? 
                      <CheckCircle fontSize="small" className="text-green-500" /> : 
                      <Cancel fontSize="small" className="text-red-500" />
                    }
                  </span>
                  <span className="text-slate-500">At least 11 characters</span>
                </div>
                <div className="flex items-center mb-1">
                  <span className="mr-2">
                    {passwordValidation.capital ? 
                      <CheckCircle fontSize="small" className="text-green-500" /> : 
                      <Cancel fontSize="small" className="text-red-500" />
                    }
                  </span>
                  <span className="text-slate-500">At least one capital letter</span>
                </div>
                <div className="flex items-center mb-1">
                  <span className="mr-2">
                    {passwordValidation.number ? 
                      <CheckCircle fontSize="small" className="text-green-500" /> : 
                      <Cancel fontSize="small" className="text-red-500" />
                    }
                  </span>
                  <span className="text-slate-500">At least one number</span>
                </div>
                <div className="flex items-center mb-1">
                  <span className="mr-2">
                    {passwordValidation.symbol ? 
                      <CheckCircle fontSize="small" className="text-green-500" /> : 
                      <Cancel fontSize="small" className="text-red-500" />
                    }
                  </span>
                  <span className="text-slate-500">At least one symbol (!@#$%^&*())</span>
                </div>
              </div>
            </div>

            <div className="form-group mb-4">
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
              className="signup-button w-full py-3 bg-[#5da646] hover:bg-[#40752f] text-white border-none rounded-md font-medium text-sm cursor-pointer transition-colors mt-4 disabled:bg-[#90eb73] disabled:cursor-not-allowed"
              disabled={isLoading || !isPasswordValid() || password !== confirmPassword || !validateEmail(email)}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Create account'}
            </button>
          </form>

          <p className="login-prompt text-center my-6 text-sm text-slate-500">
            Already have an account? <a href="/login" className="text-[#5da646] font-medium hover:underline">Login</a>
          </p>

          <div className="or-divider flex items-center my-6">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="px-4 text-xs text-slate-500">or sign up with</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          <button
            className="google-signup-button flex justify-center items-center w-full py-3 bg-white border border-slate-200 rounded-md cursor-pointer text-black transition-all duration-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGoogleSignup}
            disabled={isLoading}
          >
            <img src="/google-icon.png" alt="Google" className="h-6 mr-2" />
            Sign up with Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default Signup;