import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Psettings.css';

interface User {
  id: number;
  name: string;
  generated_email: string;
  requested_role: string;
  profile_picture?: string;
  notification_Preferences?: {
    emailAlerts: boolean;
    equipmentRequests: boolean;
    maintenanceAlerts: boolean;
    systemUpdates: boolean;
  };
  theme?: string;
  language?: string;
}

const ProfileSettings = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for form data
  const [formData, setFormData] = useState({
    fullName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notification_Preferences: {
      emailAlerts: true,
      equipmentRequests: true,
      maintenanceAlerts: true,
      systemUpdates: false
    },
    theme: 'dark',
    language: 'english'
  });

  // State for profile picture
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // State for current user
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // State for modals and errors
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error'
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loading, setLoading] = useState(true);

  // State for password visibility
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // State for active tab
  const [activeTab] = useState('settings');

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5000/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('fetchCurrentUser response:', response.status, response.headers.get('content-type'));

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const data = await response.json();
      console.log('fetchCurrentUser data:', data);

      setCurrentUser(data);
      setFormData(prev => ({
        ...prev,
        fullName: data.name || '',
        notification_Preferences: data.notification_Preferences || prev.notification_Preferences,
        theme: data.theme || 'dark',
        language: data.language || 'english'
      }));
      setProfilePicture(data.profile_picture || null);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      setSuccessModal({
        isOpen: true,
        title: 'Authentication Error',
        message: 'Failed to load user data. Please log in again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        notification_Preferences: {
          ...prev.notification_Preferences,
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

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSuccessModal({
          isOpen: true,
          title: 'Invalid File',
          message: 'Please upload a valid image file (e.g., JPG, PNG).',
          type: 'error'
        });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setSuccessModal({
          isOpen: true,
          title: 'File Too Large',
          message: 'Image size must be less than 2MB.',
          type: 'error'
        });
        return;
      }
      setSelectedFile(file);
      setProfilePicture(URL.createObjectURL(file));
      setImageError(null);
    }
  };

  // Handle image load error
  const handleImageError = () => {
    setImageError('Failed to load profile picture');
    console.error('Image failed to load:', profilePicture);
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Password validation
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setSuccessModal({
        isOpen: true,
        title: 'Password Error',
        message: "New passwords don't match",
        type: 'error'
      });
      return;
    }

    // Validate password requirements
    if (formData.newPassword) {
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
      if (!passwordRegex.test(formData.newPassword)) {
        setSuccessModal({
          isOpen: true,
          title: 'Password Error',
          message: 'Password must be at least 8 characters long, include one uppercase letter, one number, and one special character.',
          type: 'error'
        });
        return;
      }
    }

    const token = localStorage.getItem('userToken');
    if (!token) {
      setSuccessModal({
        isOpen: true,
        title: 'Authentication Error',
        message: 'No authentication token found. Please log in again.',
        type: 'error'
      });
      return;
    }

    try {
      let pictureUrl = profilePicture;

      // Upload profile picture if selected
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('picture', selectedFile);

        const uploadRes = await fetch('http://localhost:5000/api/users/upload-picture', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: uploadFormData
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload profile picture: ${uploadRes.status}`);
        }

        const uploadData = await uploadRes.json();
        console.log('Upload response:', uploadData);
        pictureUrl = uploadData.url;
      }

      // Prepare update data
      const updateData: any = {
        name: formData.fullName,
        profile_picture: pictureUrl,
        notification_Preferences: formData.notification_Preferences,
        theme: formData.theme,
        language: formData.language
      };

      if (formData.newPassword) {
        updateData.current_password = formData.currentPassword;
        updateData.new_password = formData.newPassword;
      }

      // Send update request
      const updateRes = await fetch('http://localhost:5000/api/users/update', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (updateRes.ok) {
        setSuccessModal({
          isOpen: true,
          title: 'Success',
          message: 'Profile updated successfully',
          type: 'success'
        });
        setSelectedFile(null);
        setImageError(null);
        await fetchCurrentUser(); // Refresh user data
      } else {
        const errorData = await updateRes.json();
        setSuccessModal({
          isOpen: true,
          title: 'Error',
          message: errorData.error || 'Failed to update profile',
          type: 'error'
        });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setSuccessModal({
        isOpen: true,
        title: 'Error',
        message: `An error occurred while updating your profile: ${error.message}`,
        type: 'error'
      });
    }
  };

  // Handle navigation
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggingOut(true);
    localStorage.removeItem('userToken');
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

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
      admin: 'Administrator',
      personnel: 'Personnel',
      user: 'Team Member'
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

      {/* Success/Error Modal */}
      {successModal.isOpen && (
        <div className="modal-overlay" onClick={() => setSuccessModal({ ...successModal, isOpen: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{successModal.title}</h3>
              <button
                className="modal-close"
                onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
                style={{
                  position: 'absolute',
                  right: '15px',
                  top: '15px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>{successModal.message}</p>
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn"
                onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Navbar */}
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
  {currentUser?.profile_picture ? (
    <img
      src={
        currentUser.profile_picture.startsWith('http')
          ? currentUser.profile_picture
          : `http://localhost:5000${currentUser.profile_picture}`
      }
      alt="Profile"
      onError={(e) => (e.currentTarget.style.display = 'none')}
      className="profile-avatar-img"
    />
  ) : (
    <span>{getInitials(currentUser?.name || 'U')}</span>
  )}
</div>


          <div className="profile-details">
            <div className="profile-name">
              {currentUser ? currentUser.name : 'Loading...'}
            </div>
            <div className="profile-position">
              {currentUser ? formatRole(currentUser.requested_role) : '...'}
            </div>
          </div>
        </div>
      </div>

      <div className="content-area profile-content">
        <div className="profile-settings-header">
          <h1>Profile Settings</h1>
          <p>Manage your account details and preferences</p>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading profile...</div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="profile-side">
              <div className="profile-picture-section">
                {profilePicture && !imageError ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="profile-img"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="profile-avatar-large">
                    {currentUser ? getInitials(currentUser.name) : 'U'}
                  </div>
                )}
                {imageError && (
                  <p className="image-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                    {imageError}
                  </p>
                )}
                <button type="button" className="upload-button" onClick={handleUploadClick}>
                  Upload Passport Photo
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={currentUser?.generated_email || 'Loading...'}
                  readOnly
                  className="readonly-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={currentUser ? formatRole(currentUser.requested_role) : 'Loading...'}
                  readOnly
                  className="readonly-input"
                />
                <small>Contact administrator to change role</small>
              </div>
            </div>

            <div className="settings-side">
              <div className="settings-section">
                <h2>Account Security</h2>
                <div className="form-group password-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <div className="password-input-container">
                    <input
                      type={showPassword.current ? 'text' : 'password'}
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
                      {showPassword.current ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div className="form-group password-group">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showPassword.new ? 'text' : 'password'}
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
                      {showPassword.new ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div className="form-group password-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
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
                      {showPassword.confirm ? 'Hide' : 'Show'}
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
                    checked={formData.notification_Preferences.emailAlerts}
                    onChange={handleChange}
                  />
                  <label htmlFor="emailAlerts">Email Alerts</label>
                </div>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="equipmentRequests"
                    name="equipmentRequests"
                    checked={formData.notification_Preferences.equipmentRequests}
                    onChange={handleChange}
                  />
                  <label htmlFor="equipmentRequests">Equipment Request Updates</label>
                </div>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="maintenanceAlerts"
                    name="maintenanceAlerts"
                    checked={formData.notification_Preferences.maintenanceAlerts}
                    onChange={handleChange}
                  />
                  <label htmlFor="maintenanceAlerts">Maintenance Alerts</label>
                </div>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="systemUpdates"
                    name="systemUpdates"
                    checked={formData.notification_Preferences.systemUpdates}
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
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-button" onClick={() => navigate('/userdash')}>
                Cancel
              </button>
              <button type="submit" className="save-button">Save Changes</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;