import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Psettings.css';

const ProfileSettings = () => {
  // State for form data
  const [formData, setFormData] = useState({
    firstName: 'Thomas',
    lastName: 'K.',
    email: 'thomas.k@sokoaerial.com',
    role: 'Team Member',
    username: 'thomas.k',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notificationPreferences: {
      emailAlerts: true,
      equipmentRequests: true,
      maintenanceAlerts: true,
      systemUpdates: false
    },
    theme: 'dark',
    language: 'english'
  });

  // State for showing success message
  const [showSuccess, setShowSuccess] = useState(false);
  
  // State for password visibility
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // State for logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // State for active tab
  const [activeTab,] = useState('settings');
  const [loading, setLoading] = useState(true);
  
  // Initialize navigate from react-router-dom
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        notificationPreferences: {
          ...prev.notificationPreferences,
          [name]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Password validation
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      alert("New passwords don't match");
      return;
    }
    
    // Here you would typically send the data to your API
    console.log('Saving profile data:', formData);
    
    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  // Handle navigation when menu items are clicked
  const handleNavigation = (path: string) => {
    navigate(path);
  };
  
  // Handle logout with loading screen
  const handleLogout = () => {
    setIsLoggingOut(true);
    
    // After 2 seconds, navigate to login page
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  //Profile states
  const [currentUser, setCurrentUser] = useState<{
  name: string;
  email: string;
  role: string;
} | null>(null);

//Profile Funcetions
const fetchCurrentUser = async () => {
  try {
    const token = localStorage.getItem('userToken');
    
    console.log('📍 fetchCurrentUser - Token:', !!token);
    
    if (!token) {
      console.error('No token in fetchCurrentUser');
      navigate('/');
      return;
    }

    try {
      // Split and decode the JWT
      const parts = token.split('.');
      console.log('Token parts:', parts.length);
      
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const payload = JSON.parse(atob(parts[1]));
      console.log('✅ Decoded payload:', payload);
      
      setCurrentUser({
        name: payload.name,
        email: payload.email,
        role: payload.role
      });
      
      console.log('✅ Current user set:', payload.name);
      
    } catch (decodeError) {
      console.error('❌ Token decode error:', decodeError);
      localStorage.clear();
      navigate('/');
    }
    
  } catch (error) {
    console.error('❌ Error in fetchCurrentUser:', error);
    navigate('/');
  }
};

// Update your useEffect to include fetchCurrentUser
useEffect(() => {
  const initializeData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCurrentUser(), // Add this line
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  };

  initializeData();
}, []);

// Helper function to get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Helper function to format role for display
const formatRole = (role: string): string => {
  const roleMap: { [key: string]: string } = {
    'admin': 'Administrator',
    'personnel': 'Personnel',
    'user': 'Team Member'
  };
  return roleMap[role.toLowerCase()] || 'Team Member';
};


  return (
    <div className="app-container">
      {/* Logout loading overlay */}
      {isLoggingOut && (
        <div className="dashboard-logout-overlay">
          <div className="dashboard-logout-modal">
            <div className="dashboard-logout-spinner"></div>
            <p>Logging Out...</p>
          </div>
        </div>
      )}
      
      <div className="app-nav">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <span>🚁</span>
          </div>
          <div className="brand-name">Soko Aerial</div>
        </div>
        <div className="nav-links">
          <div 
            className="nav-link"
            onClick={() => handleNavigation('/userdash')}
          >
            <i>📊</i> Dashboard
          </div>
          <div 
            className="nav-link"
            onClick={() => handleNavigation('/equipments')}
          >
            <i>📦</i> Equipment
          </div>
          <div 
            className="nav-link"
            onClick={() => handleNavigation('/myrequest')}
          >
            <i>🔍</i> My Requests
          </div>
          <div 
            className="nav-link"
            onClick={() => handleNavigation('/updates')}
          >
            <i>📝</i> Updates
          </div>
          <div 
            className="nav-link"
            onClick={() => handleNavigation('/help')}
          >
            <i>❓</i> Help
          </div>
          <div 
            className={`nav-link ${activeTab === 'settings' ? 'current' : ''}`}
            onClick={() => handleNavigation('/psettings')}
          >
            <i>⚙️</i> Profile Settings
          </div>
          <div 
            className="nav-link"
            onClick={handleLogout}
          >
            <i>🚪</i> Logout
          </div>
        </div>
        <div className="profile-box">
  <div className="profile-avatar">
    {currentUser ? getInitials(currentUser.name) : 'U'}
  </div>
  <div className="profile-details">
    <div className="profile-name">
      {currentUser ? currentUser.name : 'Loading...'}
    </div>
    <div className="profile-position">
      {currentUser ? formatRole(currentUser.role) : '...'}
    </div>
  </div>
</div>
      </div>
      
      <div className="content-area">
        <div className="profile-settings-container">
          <div className="profile-settings-header">
            <h1>Profile Settings</h1>
            <p>Manage your account details and preferences</p>
          </div>

          {showSuccess && (
            <div className="success-message">
              <i className="success-icon">✓</i> Profile settings updated successfully
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="settings-section">
              <h2>Personal Information</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">Full Name</label>
                  <input 
                    type="text" 
                    id="firstName" 
                    name="firstName" 
                    value={currentUser ? currentUser.name : 'Loading...'} 
                    onChange={handleChange} 
                  />
                </div>

              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={currentUser ? currentUser.email : 'Loading...'} 
                  onChange={handleChange} 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <input 
                  type="text" 
                  id="role" 
                  name="role" 
                  value={currentUser ? formatRole(currentUser.role) : 'Loading...'} 
                  readOnly 
                  className="readonly-input"
                />
                <small>Contact administrator to change role</small>
              </div>
            </div>

            <div className="settings-section">
              <h2>Account Security</h2>
              
              <div className="form-group password-group">
                <label htmlFor="currentPassword">Current Password</label>
                <div className="password-input-container">
                  <input 
                    type={showPassword.current ? "text" : "password"} 
                    id="currentPassword" 
                    name="currentPassword" 
                    value={formData.currentPassword} 
                    onChange={handleChange} 
                  />
                  <button 
                    type="button" 
                    className="toggle-password" 
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPassword.current ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              
              <div className="form-group password-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="password-input-container">
                  <input 
                    type={showPassword.new ? "text" : "password"} 
                    id="newPassword" 
                    name="newPassword" 
                    value={formData.newPassword} 
                    onChange={handleChange} 
                  />
                  <button 
                    type="button" 
                    className="toggle-password" 
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPassword.new ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              
              <div className="form-group password-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="password-input-container">
                  <input 
                    type={showPassword.confirm ? "text" : "password"} 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                  />
                  <button 
                    type="button" 
                    className="toggle-password" 
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPassword.confirm ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              
              <div className="password-requirements">
                <p>Password must:</p>
                <ul>
                  <li>Be at least 8 characters long</li>
                  <li>Include at least one uppercase letter</li>
                  <li>Include at least one number</li>
                  <li>Include at least one special character</li>
                </ul>
              </div>
            </div>

            <div className="settings-section">
              <h2>Notification Preferences</h2>
              
              <div className="checkbox-group">
                <input 
                  type="checkbox" 
                  id="emailAlerts" 
                  name="emailAlerts" 
                  checked={formData.notificationPreferences.emailAlerts} 
                  onChange={handleChange} 
                />
                <label htmlFor="emailAlerts">Email Alerts</label>
              </div>
              
              <div className="checkbox-group">
                <input 
                  type="checkbox" 
                  id="equipmentRequests" 
                  name="equipmentRequests" 
                  checked={formData.notificationPreferences.equipmentRequests} 
                  onChange={handleChange} 
                />
                <label htmlFor="equipmentRequests">Equipment Request Updates</label>
              </div>
              
              <div className="checkbox-group">
                <input 
                  type="checkbox" 
                  id="maintenanceAlerts" 
                  name="maintenanceAlerts" 
                  checked={formData.notificationPreferences.maintenanceAlerts} 
                  onChange={handleChange} 
                />
                <label htmlFor="maintenanceAlerts">Maintenance Alerts</label>
              </div>
              
              <div className="checkbox-group">
                <input 
                  type="checkbox" 
                  id="systemUpdates" 
                  name="systemUpdates" 
                  checked={formData.notificationPreferences.systemUpdates} 
                  onChange={handleChange} 
                />
                <label htmlFor="systemUpdates">System Updates</label>
              </div>
            </div>

            <div className="settings-section">
              <h2>Interface Preferences</h2>
              
              <div className="form-group">
                <label htmlFor="theme">Theme</label>
                <select 
                  id="theme" 
                  name="theme" 
                  value={formData.theme} 
                  onChange={handleChange}
                >
                  <option value="dark">Dark (Default)</option>
                  <option value="light">Light</option>
                  <option value="system">Match System</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="language">Language</label>
                <select 
                  id="language" 
                  name="language" 
                  value={formData.language} 
                  onChange={handleChange}
                >
                  <option value="english">English</option>
                  <option value="spanish">Spanish</option>
                  <option value="french">French</option>
                  <option value="german">German</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-button">Cancel</button>
              <button type="submit" className="save-button">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;