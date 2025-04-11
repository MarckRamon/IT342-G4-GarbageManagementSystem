import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment, IconButton, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';

function ForgotPassword() {
  const [step, setStep] = useState('email'); // 'email' or 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);
  
  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address');
      setAlertMessage('Please enter a valid email address');
      setAlertSeverity('error');
      setShowAlert(true);
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsLoading(false);
      setStep('reset');
      setAlertMessage('Email verified. Please set a new password.');
      setAlertSeverity('success');
      setShowAlert(true);
    }, 1000);
  };

  const handlePasswordReset = (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setAlertMessage('Password must be at least 8 characters long');
      setAlertSeverity('error');
      setShowAlert(true);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setAlertMessage('Passwords do not match');
      setAlertSeverity('error');
      setShowAlert(true);
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsLoading(false);
      setAlertMessage('Password reset successful! Redirecting to login page...');
      setAlertSeverity('success');
      setShowAlert(true);
      
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }, 1000);
  };

  const handleGoogleLogin = () => {
    window.location.href = '/signup';
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
            opacity: 0;
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
        
        .login-card {
          opacity: 0;
          transform: translateY(20px);
        }
        
        .login-card.animate-in {
          animation: fadeUp 0.8s ease-out forwards;
        }
        
        .back-link {
          animation: slideInFromLeft 0.6s ease-out 0.2s forwards;
          opacity: 0;
        }
        
        .brand-name {
          animation: slideInFromLeft 0.6s ease-out 0.3s forwards;
          opacity: 0;
        }
        
        .login-title {
          animation: slideInFromLeft 0.6s ease-out 0.4s forwards;
          opacity: 0;
        }
        
        .login-subtitle {
          animation: slideInFromLeft 0.6s ease-out 0.5s forwards;
          opacity: 0;
        }
        
        .form-group {
          animation: fadeUp 0.6s ease-out 0.6s forwards;
          opacity: 0;
        }
        
        .login-button {
          animation: fadeUp 0.6s ease-out 0.8s forwards, pulse 2s infinite;
          opacity: 0;
        }
        
        .or-divider {
          animation: fadeUp 0.6s ease-out 1s forwards;
          opacity: 0;
        }
        
        .google-login-button {
          animation: fadeUp 0.6s ease-out 1.1s forwards;
          opacity: 0;
        }
        
        .auth-image {
                  animation: float 10s ease-in-out infinite;
        }
        
        .input-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
      
      <div className="login-card flex w-full max-w-5xl bg-white/85 rounded-2xl overflow-hidden shadow-xl">
        <div className="login-form-container flex-1 p-10">
          <h1 className="brand-name text-2xl font-bold text-green-600 mb-8">Vermigo</h1>
          
          {step === 'email' ? (
            <>
              <a href="/login" className="back-link flex items-center text-slate-500 no-underline mb-4 text-sm hover:text-green-600">
                <ArrowBack style={{ fontSize: '0.9rem', marginRight: '0.5rem' }} />
                Back to login
              </a>
              <br></br><br></br><br></br>
              <h2 className="login-title text-2xl font-semibold mb-2">Forgot your password?</h2>
              <p className="login-subtitle text-slate-500 mb-8 text-sm">Don't worry, happens to all of us. Enter your email below to recover your password.</p>
              
              <form onSubmit={handleEmailSubmit}>
                <div className="form-group mb-6">
                  <TextField
                    label="Email"
                    variant="outlined"
                    fullWidth
                    value={email}
                    onChange={handleEmailChange}
                    error={error !== ''}
                    className={error !== '' ? 'input-shake' : ''}
                    placeholder="name@example.com"
                  />
                  {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>

                <button 
                  type="submit" 
                  className="login-button w-full py-3 bg-green-600 text-white border-none rounded-md font-medium text-sm cursor-pointer transition-all duration-300 relative overflow-hidden hover:bg-green-700 hover:-translate-y-0.5 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <div className="flex justify-center items-center">
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
                  </div>
                </button>
              </form>
              
              <div className="or-divider flex items-center my-6">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="px-4 text-slate-500 text-xs">Or login with</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>
              
              <button 
                className="google-login-button flex justify-center items-center w-full py-3 bg-white border border-slate-200 rounded-md cursor-pointer text-black transition-all duration-300 hover:bg-slate-100 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                onClick={handleGoogleLogin}
              >
                <img src="/google-icon.png" alt="Google" className="h-6 mr-2" />
                Google
              </button>
            </>
          ) : (
            <>
              <h2 className="login-title text-2xl font-semibold mb-2">Set a password</h2>
              <p className="login-subtitle text-slate-500 mb-8 text-sm">Your previous password has been resetted. Please set a new password for your account.</p>
              
              <form onSubmit={handlePasswordReset}>
                <div className="form-group mb-6">
                  <TextField
                    label="Create Password"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    fullWidth
                    value={password}
                    onChange={handlePasswordChange}
                    error={error !== '' && error.includes('Password must be')}
                    className={error !== '' && error.includes('Password must be') ? 'input-shake' : ''}
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
                </div>

                <div className="form-group mb-6">
                  <TextField
                    label="Re-enter Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    variant="outlined"
                    fullWidth
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    error={error !== '' && error.includes('Passwords do not match')}
                    className={error !== '' && error.includes('Passwords do not match') ? 'input-shake' : ''}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleClickShowConfirmPassword} edge="end">
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>
                
                <button 
                  type="submit" 
                  className="login-button w-full py-3 bg-green-600 text-white border-none rounded-md font-medium text-sm cursor-pointer transition-all duration-300 relative overflow-hidden hover:bg-green-700 hover:-translate-y-0.5 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <div className="flex justify-center items-center">
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Set password'}
                  </div>
                </button>
              </form>
            </>
          )}
        </div>
        
        <div className="login-image-container flex-1 bg-gradient-to-br from-indigo-100/40 to-indigo-200/40 flex justify-center items-center p-8 relative overflow-hidden">
          <div className="w-50 h-50 bg-indigo-500/20 rounded-full absolute -top-24 -right-24 animate-[float_6s_ease-in-out_infinite]"></div>
          <div className="w-36 h-36 bg-indigo-500/15 rounded-full absolute -bottom-16 -left-16 animate-[float_8s_ease-in-out_infinite_reverse]"></div>
          <img src="/forgotpw.png" alt="Authentication" className="auth-image max-w-full h-auto relative z-10" />
        </div>
        {/*           <img src="/signinimage.png" alt="Signup Illustration" className="hands-image max-w-full h-auto z-10" />
*/}
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

export default ForgotPassword;