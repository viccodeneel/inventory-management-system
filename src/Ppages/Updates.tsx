import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Updates.css';

const Updates = () => {
  const [filter, setFilter] = useState('all');
  // Add state for active tab and logout
  const [activeTab, setActiveTab] = useState('updates');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Initialize navigate from react-router-dom
  const navigate = useNavigate();
  
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
  
  // Sample data for updates with emojis added to descriptions
  const updatesData = [
    {
      id: 1,
      type: 'system',
      title: 'System Maintenance Completed',
      description: '🚀 Database optimization and ⚡ performance improvements',
      date: '2025-03-10',
      time: '14:30'
    },
    {
      id: 2,
      type: 'addition',
      title: 'New Equipment Batch Added',
      description: '📦 20 new items including 🚁 Phantom Pro 5 drones and 📸 Z8 cameras',
      date: '2025-03-08',
      time: '09:15'
    },
    {
      id: 3,
      type: 'removal',
      title: 'Outdated Equipment Removed',
      description: '🗑️ 5 Legacy Mavic 2 drones have been decommissioned ⏰',
      date: '2025-03-05',
      time: '11:45'
    },
    {
      id: 4,
      type: 'system',
      title: 'Dashboard UI Updates',
      description: '🎨 Improved equipment request workflow and 🔔 notification system',
      date: '2025-03-02',
      time: '16:20'
    },
    {
      id: 5,
      type: 'addition',
      title: 'New Sensor Equipment',
      description: '🌡️ Added 8 new Thermal Sensor V3 units to inventory 📊',
      date: '2025-02-28',
      time: '10:00'
    },
    {
      id: 6,
      type: 'maintenance',
      title: 'Scheduled Maintenance',
      description: '🔧 Inspire 2 drones undergoing firmware updates and 📏 calibration',
      date: '2025-02-25',
      time: '13:45'
    },
    {
      id: 7,
      type: 'removal',
      title: 'Damaged Equipment Removed',
      description: '⚠️ 3 damaged Battery Pack Pro units sent for ♻️ recycling',
      date: '2025-02-22',
      time: '15:30'
    },
    {
      id: 8,
      type: 'system',
      title: 'New Tracking Feature',
      description: '📍 Equipment usage history and 📈 analytics now available',
      date: '2025-02-20',
      time: '09:30'
    }
  ];

  // Filter updates based on selected type
  const filteredUpdates = filter === 'all' 
    ? updatesData 
    : updatesData.filter(update => update.type === filter);

  // Function to get appropriate icon based on update type
  const getUpdateIcon = (type: string) => {
    switch(type) {
      case 'system':
        return <i className="fas fa-cog update-icon system"></i>;
      case 'addition':
        return <i className="fas fa-plus-circle update-icon addition"></i>;
      case 'removal':
        return <i className="fas fa-minus-circle update-icon removal"></i>;
      case 'maintenance':
        return <i className="fas fa-tools update-icon maintenance"></i>;
      default:
        return <i className="fas fa-info-circle update-icon"></i>;
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
            className={`nav-link ${activeTab === 'updates' ? 'current' : ''}`}
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
            className="nav-link"
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
          <div className="profile-avatar">T</div>
          <div className="profile-details">
            <div className="profile-name">Thomas K.</div>
            <div className="profile-position">Team Member</div>
          </div>
        </div>
      </div>
      
      <div className="content-area">
        <div className="updates-container">
          <div className="updates-header">
            <h1><i>📝</i> System Updates</h1>
            <div className="updates-filter">
              <span>Filter by: </span>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="filter-dropdown"
              >
                <option value="all">All Updates</option>
                <option value="system">System Updates</option>
                <option value="addition">Equipment Additions</option>
                <option value="removal">Equipment Removals</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="updates-summary">
            <div className="summary-card">
              <div className="summary-icon system">
                <i className="fas fa-cog">⚙️</i>
              </div>
              <div className="summary-content">
                <h3>System Updates</h3>
                <p>{updatesData.filter(update => update.type === 'system').length}</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon addition">
                <i className="fas fa-plus-circle">➕</i>
              </div>
              <div className="summary-content">
                <h3>Added Equipment</h3>
                <p>{updatesData.filter(update => update.type === 'addition').length}</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon removal">
                <i className="fas fa-minus-circle">➖</i>
              </div>
              <div className="summary-content">
                <h3>Removed Equipment</h3>
                <p>{updatesData.filter(update => update.type === 'removal').length}</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon maintenance">
                <i className="fas fa-tools">🔧</i>
              </div>
              <div className="summary-content">
                <h3>Maintenance</h3>
                <p>{updatesData.filter(update => update.type === 'maintenance').length}</p>
              </div>
            </div>
          </div>

          <div className="updates-timeline">
            {filteredUpdates.length > 0 ? (
              filteredUpdates.map(update => (
                <div key={update.id} className={`update-item ${update.type}`}>
                  <div className="update-time">
                    <span className="update-date">{formatDate(update.date)}</span>
                    <span className="update-hour">⏰ {update.time}</span>
                  </div>
                  <div className="update-icon-container">
                    {getUpdateIcon(update.type)}
                  </div>
                  <div className="update-content">
                    <h3 className="update-title">{update.title}</h3>
                    <p className="update-description">{update.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-updates">
                <p>😕 No updates matching the selected filter.</p>
              </div>
            )}
          </div>

          <div className="updates-footer">
            <button className="subscribe-button">
              <i className="fas fa-bell">🔔</i> Subscribe to Updates
            </button>
            <div className="updates-pagination">
              <button className="pagination-button"><i className="fa-chevron-left fas">◀️</i></button>
              <span>Page 1 of 1</span>
              <button className="pagination-button"><i className="fa-chevron-right fas">▶️</i></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Updates;