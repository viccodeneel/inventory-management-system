import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Updates.css';

const Updates = () => {
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('updates');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [updatesData, setUpdatesData] = useState([]);
  const [selectedUpdates, setSelectedUpdates] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  
  // TODO: Fetch updates from backend API
  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        // const response = await fetch('YOUR_API_ENDPOINT/updates');
        // const data = await response.json();
        // setUpdatesData(data);
        
        // For now, set empty array
        setUpdatesData([]);
      } catch (error) {
        console.error('Error fetching updates:', error);
      }
    };
    
    fetchUpdates();
  }, []);
  
  const handleNavigation = (path) => {
    navigate(path);
  };
  
  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };
  
  // Filter updates based on selected type
  const filteredUpdates = filter === 'all' 
    ? updatesData 
    : updatesData.filter(update => update.type === filter);
  
  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUpdates = filteredUpdates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUpdates.length / itemsPerPage);
  
  // Handle select all checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUpdates(currentUpdates.map(update => update.id));
    } else {
      setSelectedUpdates([]);
    }
  };
  
  // Handle individual checkbox
  const handleSelectUpdate = (updateId) => {
    setSelectedUpdates(prev => {
      if (prev.includes(updateId)) {
        return prev.filter(id => id !== updateId);
      } else {
        return [...prev, updateId];
      }
    });
  };
  
  // TODO: Mark updates as read
  const handleMarkAsRead = async () => {
    try {
      // const response = await fetch('YOUR_API_ENDPOINT/updates/mark-read', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ updateIds: selectedUpdates })
      // });
      
      console.log('Marking as read:', selectedUpdates);
      setSelectedUpdates([]);
    } catch (error) {
      console.error('Error marking updates as read:', error);
    }
  };
  
  // TODO: Delete updates
  const handleDeleteUpdates = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedUpdates.length} update(s)?`)) {
      try {
        // const response = await fetch('YOUR_API_ENDPOINT/updates/delete', {
        //   method: 'DELETE',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ updateIds: selectedUpdates })
        // });
        
        console.log('Deleting updates:', selectedUpdates);
        setUpdatesData(prev => prev.filter(update => !selectedUpdates.includes(update.id)));
        setSelectedUpdates([]);
      } catch (error) {
        console.error('Error deleting updates:', error);
      }
    }
  };
  
  const getUpdateIcon = (type) => {
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
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setSelectedUpdates([]);
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
          <div className="nav-link" onClick={() => handleNavigation('/userdash')}>
            <i>📊</i> Dashboard
          </div>
          <div className="nav-link" onClick={() => handleNavigation('/equipments')}>
            <i>📦</i> Equipment
          </div>
          <div className="nav-link" onClick={() => handleNavigation('/myrequest')}>
            <i>🔍</i> My Requests
          </div>
          <div 
            className={`nav-link ${activeTab === 'updates' ? 'current' : ''}`}
            onClick={() => handleNavigation('/updates')}
          >
            <i>📝</i> Updates
          </div>
          <div className="nav-link" onClick={() => handleNavigation('/help')}>
            <i>❓</i> Help
          </div>
          <div className="nav-link" onClick={() => handleNavigation('/psettings')}>
            <i>⚙️</i> Profile Settings
          </div>
          <div className="nav-link" onClick={handleLogout}>
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
        <div className="updates-container">
          <div className="updates-header">
            <h1><i>📝</i> System Updates</h1>
            <div className="updates-filter">
              <span>Filter by: </span>
              <select 
                value={filter} 
                onChange={(e) => {
                  setFilter(e.target.value);
                  setCurrentPage(1);
                  setSelectedUpdates([]);
                }}
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

          {selectedUpdates.length > 0 && (
            <div className="updates-actions">
              <button className="action-btn-updates mark-read" onClick={handleMarkAsRead}>
                <i>✓</i> Mark as Read ({selectedUpdates.length})
              </button>
              <button className="action-btn-updates delete" onClick={handleDeleteUpdates}>
                <i>🗑️</i> Delete ({selectedUpdates.length})
              </button>
            </div>
          )}

          <div className="updates-timeline">
            {currentUpdates.length > 0 ? (
              <>
                <div className="updates-table-header">
                  <input
                    type="checkbox"
                    checked={selectedUpdates.length === currentUpdates.length && currentUpdates.length > 0}
                    onChange={handleSelectAll}
                    className="update-checkbox"
                  />
                  <span>Select All</span>
                </div>
                {currentUpdates.map(update => (
                  <div key={update.id} className={`update-item ${update.type}`}>
                    <input
                      type="checkbox"
                      checked={selectedUpdates.includes(update.id)}
                      onChange={() => handleSelectUpdate(update.id)}
                      className="update-checkbox"
                    />
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
                ))}
              </>
            ) : (
              <div className="no-updates">
                <p>😕 No updates available.</p>
              </div>
            )}
          </div>

          <div className="updates-footer">
            <button className="subscribe-button">
              <i className="fas fa-bell">🔔</i> Subscribe to Updates
            </button>
            <div className="updates-pagination">
              <button 
                className="pagination-button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="fa-chevron-left fas">◀️</i>
              </button>
              <span>Page {currentPage} of {totalPages || 1}</span>
              <button 
                className="pagination-button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <i className="fa-chevron-right fas">▶️</i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Updates;