import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { auth, signup } from '@/services/api';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    surname: '',
    address: '',
    phone: '',
    lineId: '',
    confirmPassword: ''
  });
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);

  // Auto-fill username if remembered
  useEffect(() => {
    const remembered = localStorage.getItem('rememberMe');
    const savedUsername = localStorage.getItem('userUsername');
    if (remembered === 'true' && savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLocked && lockoutTime > 0) {
      timer = setInterval(() => {
        setLockoutTime((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLocked, lockoutTime]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await auth.login({ email: username, password });
      
      if (response.success && response.token) {
        // Login successful
        localStorage.setItem('token', response.token);
        localStorage.setItem('userUsername', username);
        localStorage.setItem('isGuest', 'false');
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }

        // Reset error states
        setError('');
        setRemainingAttempts(3);
        setIsLocked(false);
        
        navigate('/home');
      } else {
        // Login failed - handle different error scenarios
        if (response.error) {
          setError(response.error);
          
          // Handle lockout scenario
          if (response.lockoutTime) {
            setIsLocked(true);
            setLockoutTime(response.lockoutTime);
          }
          
          // Handle remaining attempts
          if (response.remainingAttempts !== undefined) {
            setRemainingAttempts(response.remainingAttempts);
          }
        } else {
          setError('Login failed. Please check your credentials.');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    localStorage.setItem('isGuest', 'true');
    navigate('/home');
  };

  const handleLineLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Line Login Configuration
      const LINE_CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID || 'your_line_channel_id';
      const REDIRECT_URI = `${window.location.origin}/line-callback`;
      
      // Line OAuth URL
      const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CHANNEL_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${Math.random().toString(36).substring(7)}&scope=profile%20openid%20email`;
      
      // Open Line OAuth popup
      const popup = window.open(
        lineAuthUrl,
        'lineLogin',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      // Listen for message from popup
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'LINE_LOGIN_SUCCESS') {
          const { code, state } = event.data;
          
          try {
            // Send code to backend for verification
            // TODO: Implement Line Login API
            const response = { 
              success: false, 
              error: 'Line Login not implemented yet',
              data: { user: { username: 'line_user' } }
            };
            
            if (response.success && response.data) {
              // Login successful
              localStorage.setItem('userUsername', response.data.user.username || 'line_user');
              localStorage.setItem('isGuest', 'false');
              localStorage.setItem('lineUserId', response.data.user.username || '');
              
              // Reset error states
              setError('');
              setRemainingAttempts(3);
              setIsLocked(false);
              
              navigate('/home');
            } else {
              setError(response.error || 'Line login failed. Please try again.');
            }
          } catch (error: any) {
            console.error('Line login error:', error);
            setError('Line login failed. Please try again.');
          } finally {
            setIsLoading(false);
          }
          
          // Clean up
          window.removeEventListener('message', handleMessage);
          if (popup) popup.close();
        }
        
        if (event.data.type === 'LINE_LOGIN_ERROR') {
          setError('Line login was cancelled or failed.');
          setIsLoading(false);
          window.removeEventListener('message', handleMessage);
          if (popup) popup.close();
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Fallback: check if popup was closed
      const checkClosed = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('Line login error:', error);
      setError('Line login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    // In a real implementation, you would use Google OAuth here
    // For now, we'll simulate the process
    
    // Simulate Google OAuth response with user data
    const googleUserData = {
      email: 'user@example.com',
      name: 'John',
      surname: 'Doe'
    };
    
    // Pre-fill the registration form with Google data
    setRegisterData(prev => ({
      ...prev,
      email: googleUserData.email,
      name: googleUserData.name,
      surname: googleUserData.surname,
      confirmPassword: ''
    }));
    
    // Show the registration form
    setShowRegister(true);
    
    // In a real implementation, you would also:
    // 1. Authenticate with Google OAuth
    // 2. Get user's access token
    // 3. Send email verification to the user's email
    console.log('Google signup initiated with email:', googleUserData.email);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.username.trim() || !registerData.email.trim() || !registerData.password.trim()) {
      alert('Please fill all required fields');
      return;
    }
    
    // If phone number is provided but OTP hasn't been verified yet
    if (registerData.phone && !showOTP) {
      // Send OTP to the phone number
      try {
        const otpResponse = await signup.sendOtp(registerData.phone);
        if (otpResponse.success) {
          setShowOTP(true);
          return;
        } else {
          alert('Failed to send OTP: ' + otpResponse.error);
          return;
        }
      } catch (error) {
        console.error('Error sending OTP:', error);
        alert('Failed to send OTP. Please try again.');
        return;
      }
    }
    
    // If OTP is required but not verified
    if (showOTP && registerData.phone && otp.length !== 6) {
      alert('Please enter the 6-digit OTP sent to your phone');
      return;
    }
    
    // If OTP is provided, verify it
    if (showOTP && registerData.phone) {
      try {
        const verifyResponse = await signup.verifyOtp(registerData.phone, otp);
        if (!verifyResponse.success) {
          alert('Invalid OTP. Please try again.');
          return;
        }
      } catch (error) {
        console.error('Error verifying OTP:', error);
        alert('Failed to verify OTP. Please try again.');
        return;
      }
    }
    
    // Register the user
    setIsLoading(true);
    try {
              const response = await signup.register({
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
        name: registerData.name,
        surname: registerData.surname,
        address: registerData.address,
        phone: registerData.phone,
        lineId: registerData.lineId
      });
      
      if (response.success) {
        alert(`Registration successful!\nUsername: ${registerData.username}\nEmail: ${registerData.email}`);
        setShowRegister(false);
        setShowOTP(false);
        setOtp('');
        setRegisterData({
          username: '',
          email: '',
          password: '',
          name: '',
          surname: '',
          address: '',
          phone: '',
          lineId: '',
          confirmPassword: ''
        });
        setUsername(registerData.username);
      } else {
        alert('Registration failed: ' + response.error);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Promotion Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-white via-primary/10 to-primary/20 relative overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0">
          {/* Minimal floating elements */}
          <div className="absolute top-24 left-20 w-16 h-16 bg-blue-200/20 rounded-full"></div>
          <div className="absolute bottom-36 right-24 w-12 h-12 bg-cyan-200/20 rounded-full"></div>
          
          {/* Very subtle grid pattern */}
          <div className="absolute inset-0 opacity-2">
            <div className="w-full h-full" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)`,
              backgroundSize: '80px 80px'
            }}></div>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center px-16 text-gray-800 min-h-screen">
          {/* Logo & Title */}
          <div className="mb-10 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-center mb-5">
              <div className="relative">
                <img src="/icon_webmeter.svg" alt="WebMeter" className="w-20 h-20 mr-5 drop-shadow-lg" />
                <div className="absolute -inset-2 bg-white/10 rounded-full blur-lg"></div>
              </div>
              <h1 className="text-5xl font-bold text-gray-800">
                WebMeter
              </h1>
            </div>
            <p className="text-xl font-medium text-gray-600 tracking-wide">
              Energy Management System
            </p>
          </div>
          
          {/* Main Message */}
          <div className="mb-10 max-w-lg">
            <h2 className="text-2xl font-bold mb-4 leading-tight">
              Simplify management with our{' '}
              <span className="text-primary underline decoration-2 underline-offset-4">
                intelligent dashboard
              </span>
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Transform your energy management with our cutting-edge monitoring platform designed for modern businesses.
            </p>
          </div>
          
          {/* Features */}
          <div className="space-y-4 max-w-md">
            <div className="flex items-center space-x-3 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-all duration-300 border border-white/30">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-base font-medium text-gray-700">Real-time energy monitoring</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-all duration-300 border border-white/30">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-base font-medium text-gray-700">Advanced analytics & reports</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-all duration-300 border border-white/30">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-base font-medium text-gray-700">Smart meter integration</span>
            </div>
          </div>
          
          {/* Bottom decorative element */}
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img src="/icon_webmeter.svg" alt="WebMeter" className="w-16 h-16 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">WebMeter</h1>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 backdrop-blur-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Please login to your account</p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50 text-red-800">
                <AlertDescription className="text-sm">
                  {error}
                  {isLocked && lockoutTime > 0 && (
                    <div className="mt-2 font-medium">
                      Account locked. Please wait {lockoutTime} seconds before trying again.
                    </div>
                  )}
                  {!isLocked && remainingAttempts < 3 && remainingAttempts > 0 && (
                    <div className="mt-1 text-xs">
                      {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining before account lockout.
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {showRegister ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="reg-username" className="text-sm font-semibold text-gray-700">
                        Username *
                      </Label>
                      <Input
                        id="reg-username"
                        type="text"
                        placeholder="Choose a unique username"
                        value={registerData.username}
                        onChange={e => setRegisterData(d => ({ ...d, username: e.target.value }))}
                        className="h-11 bg-gray-50 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-lg transition-all duration-300"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-email" className="text-sm font-semibold text-gray-700">
                        Email Address *
                      </Label>
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="Enter your email address"
                        value={registerData.email}
                        onChange={e => setRegisterData(d => ({ ...d, email: e.target.value }))}
                        className="h-11 bg-gray-50 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-lg transition-all duration-300"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-password" className="text-sm font-semibold text-gray-700">
                        Password *
                      </Label>
                      <div className="relative">
                                               <Input
                         id="reg-password"
                         type={showPassword ? 'text' : 'password'}
                         placeholder="Create a strong password"
                         value={registerData.password}
                         onChange={e => setRegisterData(d => ({ ...d, password: e.target.value }))}
                         className="h-11 bg-gray-50 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-lg pr-12 transition-all duration-300"
                         required
                       />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100 rounded-md transition-all duration-200"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-name" className="text-sm font-semibold text-gray-700">
                        First Name *
                      </Label>
                                             <Input
                         id="reg-name"
                         type="text"
                         placeholder="Enter your first name"
                         value={registerData.name}
                         onChange={e => setRegisterData(d => ({ ...d, name: e.target.value }))}
                         className="h-11 bg-gray-50 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-lg transition-all duration-300"
                         required
                       />
                    </div>
                  </div>
                  
                  {/* Right Column */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="reg-surname" className="text-sm font-semibold text-gray-700">
                        Last Name *
                      </Label>
                                             <Input
                         id="reg-surname"
                         type="text"
                         placeholder="Enter your last name"
                         value={registerData.surname}
                         onChange={e => setRegisterData(d => ({ ...d, surname: e.target.value }))}
                         className="h-11 bg-gray-50 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-lg transition-all duration-300"
                         required
                       />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-address" className="text-sm font-semibold text-gray-700">
                        Address
                      </Label>
                                             <Input
                         id="reg-address"
                         type="text"
                         placeholder="Enter your address"
                         value={registerData.address}
                         onChange={e => setRegisterData(d => ({ ...d, address: e.target.value }))}
                         className="h-11 bg-gray-50 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-lg transition-all duration-300"
                       />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-phone" className="text-sm font-semibold text-gray-700">
                        Phone Number
                      </Label>
                                             <Input
                         id="reg-phone"
                         type="tel"
                         placeholder="Enter your phone number"
                         value={registerData.phone}
                         onChange={e => setRegisterData(d => ({ ...d, phone: e.target.value }))}
                         className="h-11 bg-gray-50 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-lg transition-all duration-300"
                       />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-line" className="text-sm font-semibold text-gray-700">
                        Line ID
                      </Label>
                                             <Input
                         id="reg-line"
                         type="text"
                         placeholder="Enter your Line ID"
                         value={registerData.lineId}
                         onChange={e => setRegisterData(d => ({ ...d, lineId: e.target.value }))}
                         className="h-11 bg-gray-50 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-lg transition-all duration-300"
                       />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm-password" className="text-sm font-semibold text-gray-700">
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="reg-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={registerData.confirmPassword}
                      onChange={e => setRegisterData(d => ({ ...d, confirmPassword: e.target.value }))}
                                             className="h-11 bg-gray-50 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-lg pr-12 transition-all duration-300"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100 rounded-md transition-all duration-200"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {showOTP && registerData.phone && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Enter OTP
                    </Label>
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSeparator />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                    <p className="text-xs text-gray-500">
                      We've sent a 6-digit code to {registerData.phone}
                    </p>
                  </div>
                )}
                
                {/* Buttons */}
                <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    type="submit"
                    disabled={isLoading}
                                         className="h-11 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>{showOTP && registerData.phone ? 'Verifying...' : 'Creating...'}</span>
                      </div>
                    ) : (
                      showOTP && registerData.phone ? 'Verify & Create' : 'Create Account'
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 text-gray-700 hover:bg-gray-50 font-semibold transition-all duration-300"
                    onClick={() => {
                      setShowRegister(false);
                      setShowOTP(false);
                      setOtp('');
                    }}
                  >
                    ← Back to Sign In
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-semibold text-gray-700">
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                                             className="h-12 bg-gray-50 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-lg transition-all duration-300"
                      disabled={isLocked || isLoading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                                                 className="h-12 bg-gray-50 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-lg pr-12 transition-all duration-300"
                        disabled={isLocked || isLoading}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-md transition-all duration-200"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                                             className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors">
                      Remember me
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                                         className="px-0 text-sm text-cyan-500 hover:text-cyan-600 font-semibold transition-colors"
                  >
                    Forgot password?
                  </Button>
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoading || isLocked}
                                     className="w-full h-12 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLocked ? (
                    <div className="flex items-center space-x-2">
                      <span>Account Locked ({lockoutTime}s)</span>
                    </div>
                  ) : isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    'Login'
                  )}
                </Button>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLocked}
                    className="h-12 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleGuestLogin}
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Guest Login
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold rounded-lg transition-all duration-300"
                    onClick={() => setShowRegister(true)}
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                    Create New Account
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold rounded-lg transition-all duration-300"
                    onClick={handleGoogleSignup}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign up with Google
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    className="h-12 border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleLineLogin}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                    </svg>
                    {isLoading ? 'Signing in...' : 'Sign in with Line'}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
                             © 2025 WebMeter • <span className="text-cyan-500 font-medium">Amptron Instrument Thailand</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;