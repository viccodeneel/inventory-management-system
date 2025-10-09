import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

// Define user types
type UserRole = 'admin' | 'personnel';

// Define API response types
type LoginResponse = {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    role: UserRole;
  };
  token: string;
};

interface ApiError {
  message: string;
}

// Component for the loading screen
const LoadingScreen: React.FC<{ email: string; role: UserRole }> = ({ email, role }) => {
  // Admin icon - shield
  const AdminIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L4 6V10.5C4 15.5 7.5 20 12 21C16.5 20 20 15.5 20 10.5V6L12 2Z" fill="currentColor" />
    </svg>
  );

  // Personnel icon - user
  const PersonnelIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M12 12C8.7 12 6 14.7 6 18H18C18 14.7 15.3 12 12 12Z" fill="currentColor" />
    </svg>
  );

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-icon">
          {role === 'admin' ? <AdminIcon /> : <PersonnelIcon />}
        </div>
        <h2>Welcome!</h2>
        <p>Loading the {role} dashboard...</p>
        <div className="loading-spinner" />
      </div>
    </div>
  );
};

const Login: React.FC = () => {
  // State management
  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [authState, setAuthState] = useState({
    isLoading: false,
    error: '',
    fieldErrors: {
      email: false,
      password: false
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  
  const navigate = useNavigate();

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));

    // Clear field-specific errors when user starts typing
    if (authState.fieldErrors[id as keyof typeof authState.fieldErrors]) {
      setAuthState(prev => ({
        ...prev,
        fieldErrors: {
          ...prev.fieldErrors,
          [id]: false
        }
      }));
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // API call to authenticate user
  const authenticateUser = async (email: string, password: string): Promise<LoginResponse> => {
    try {
      console.log('🔵 Making login request to:', 'http://localhost:5000/api/auth/login');
      
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      // Get the response text first
      const responseText = await response.text();
      console.log('📄 Raw response:', responseText);

      // Check if response is empty
      if (!responseText) {
        throw new Error('Empty response from server');
      }

      // Try to parse JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error('Invalid response format from server');
      }

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      return responseData;
      
    } catch (error) {
      console.error('❌ Authentication error:', error);
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Reset error states
    setAuthState(prev => ({ 
      ...prev, 
      error: '',
      fieldErrors: { email: false, password: false }
    }));

    const { email, password } = form;
    
    // Validate inputs
    if (!email && !password) {
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Please enter both email and password',
        fieldErrors: { email: true, password: true }
      }));
      return;
    } else if (!email) {
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Please enter your email',
        fieldErrors: { ...prev.fieldErrors, email: true }
      }));
      return;
    } else if (!password) {
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Please enter your password',
        fieldErrors: { ...prev.fieldErrors, password: true }
      }));
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Please enter a valid email address',
        fieldErrors: { ...prev.fieldErrors, email: true }
      }));
      return;
    }

    try {
      // Authenticate with backend first (without loading state)
      const response = await authenticateUser(email, password);
      
      // Set the user role from the response
      setUserRole(response.user.role);
      
      // Only set loading state AFTER successful authentication
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Store auth data in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userToken', response.token);
      localStorage.setItem('userId', response.user.id);
      localStorage.setItem('userName', response.user.name);
      localStorage.setItem('userEmail', response.user.email);
      localStorage.setItem('userRole', response.user.role);
      localStorage.setItem('userPhone', response.user.phone);
      localStorage.setItem('userDepartment', response.user.department);
      
      // Optional: Store remember me preference
      if (form.rememberMe) {
        localStorage.setItem('rememberUser', email);
      } else {
        localStorage.removeItem('rememberUser');
      }
      
      // Simulate brief loading for UX - only on success
      setTimeout(() => {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        // Navigate based on role from database response
        navigate(response.user.role === 'admin' ? '/dashboard' : '/userdash');
      }, 1000);

    } catch (error) {
      console.error('❌ Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('fetch')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else if (error.message.includes('Invalid response format')) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('Empty response')) {
          errorMessage = 'Server is not responding. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: errorMessage,
        fieldErrors: { email: true, password: true }
      }));
    }
  };

  // Load remembered email on component mount
  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberUser');
    if (rememberedEmail) {
      setForm(prev => ({ ...prev, email: rememberedEmail, rememberMe: true }));
    }
  }, []);

  // Show loading screen if authentication is in progress
  if (authState.isLoading && userRole) {
    return <LoadingScreen email={form.email} role={userRole} />;
  }

  // Default user icon - will show a generic user icon since we don't know role beforehand
  const UserIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M12 12C8.7 12 6 14.7 6 18H18C18 14.7 15.3 12 12 12Z" fill="currentColor" />
    </svg>
  );

  // Eye icon components for password visibility
  const EyeOpenIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
      <path
        d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"
        fill="currentColor"
      />
    </svg>
  );

  const EyeClosedIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
      <path
        d="M12 6.5c-6.79 0-10.46 7.15-10.46 7.15s3.67 7.15 10.46 7.15 10.46-7.15 10.46-7.15S18.79 6.5 12 6.5zm0 11.84c-2.58 0-4.68-2.1-4.68-4.69S9.42 9 12 9s4.68 2.1 4.68 4.69-2.1 4.65-4.68 4.65z"
        fill="currentColor"
      />
      <path
        d="M12 10.42c-1.82 0-3.29 1.47-3.29 3.29s1.47 3.29 3.29 3.29 3.29-1.47 3.29-3.29-1.47-3.29-3.29-3.29zm0 0"
        fill="currentColor"
      />
      <path
        d="M4.2 3.45L19.95 19.2l1.4-1.4L2.85 2.05l1.35 1.4z"
        fill="currentColor"
      />
    </svg>
  );

  // Warning icon for error messages
  const WarningIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="#DC2626"/>
    </svg>
  );

  return (
    <>
      <div className="container">
        <div className="login-container">
          {/* Icon container */}
          <div className="icon-container">
            <div className="icon">
              <UserIcon />
            </div>
          </div>

          {/* Header */}
          <h1>Soko Aerial Robotics</h1>
          <p className="subheading">
            Inventory Management System
          </p>

          {/* Error message */}
          {authState.error && (
            <div className="error-message">
              <WarningIcon />
              {authState.error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="form-container">
            {/* Email field */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleInputChange}
                className={authState.fieldErrors.email ? 'input-error' : ''}
              />
            </div>

            {/* Password field */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleInputChange}
                  className={authState.fieldErrors.password ? 'input-error' : ''}
                />
                <button 
                  type="button" 
                  className="eye-button"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
            </div>

            {/* Remember me and forgot password */}
            <div className="remember-forgot">
              <div className="remember-me">
                <input 
                  type="checkbox" 
                  id="rememberMe" 
                  checked={form.rememberMe}
                  onChange={handleInputChange}
                />
                <label htmlFor="rememberMe">Remember me</label>
              </div>

              <button 
                onClick={() => navigate('/forget-password')} 
                className="forgot-link" 
                type="button"
              >
                Forgot password?
              </button>
            </div>
            
            <button 
              onClick={() => navigate('/register')} 
              className="register-link" 
              type="button"
            >
              Don't have an account? Register
            </button>

            {/* Sign in button */}
            <button
              type="submit"
              className="signin-button"
              disabled={authState.isLoading}
            >
              {authState.isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Security notice */}
          <div className="security-notice">
            <div className="divider">
              <span>Security Notice</span>
            </div>
            <p>
              This is a secure system for authorized users only. All activities are monitored and recorded. 
              Unauthorized access is strictly prohibited and may result in legal action.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;