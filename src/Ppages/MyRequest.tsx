import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyRequest.css';

const MyRequests = () => {
  // State for equipment category filter
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  
  // State for logout
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

  // Sample data for current requests
  const [currentRequests, setCurrentRequests] = useState([
    {
      id: 'REQ-2025-042',
      equipmentId: 'DRN-2024-001',
      equipmentName: 'Phantom Pro 4',
      category: 'Drones',
      requestDate: '2025-03-10',
      startDate: '2025-03-15',
      endDate: '2025-03-20',
      status: 'Approved',
      notes: 'Approved by Sarah Miller'
    },
    {
      id: 'REQ-2025-043',
      equipmentId: 'CAM-2024-015',
      equipmentName: 'Z6 II Camera',
      category: 'Cameras',
      requestDate: '2025-03-11',
      startDate: '2025-03-16',
      endDate: '2025-03-18',
      status: 'Pending',
      notes: 'Awaiting approval from department head'
    },
    {
      id: 'REQ-2025-044',
      equipmentId: 'SNS-2024-022',
      equipmentName: 'Thermal Sensor V2',
      category: 'Sensors',
      requestDate: '2025-03-11',
      startDate: '2025-03-17',
      endDate: '2025-03-19',
      status: 'Denied',
      notes: 'Equipment already booked for this period'
    }
  ]);

  // Sample data for request history
  const [requestHistory, setRequestHistory] = useState([
    {
      id: 'REQ-2025-021',
      equipmentId: 'DRN-2024-008',
      equipmentName: 'Mavic 3 Pro',
      category: 'Drones',
      requestDate: '2025-02-15',
      startDate: '2025-02-20',
      endDate: '2025-02-25',
      status: 'Completed',
      notes: 'Returned on time'
    },
    {
      id: 'REQ-2025-019',
      equipmentId: 'CAM-2024-019',
      equipmentName: 'X7 Camera',
      category: 'Cameras',
      requestDate: '2025-02-10',
      startDate: '2025-02-12',
      endDate: '2025-02-14',
      status: 'Completed',
      notes: 'Returned with minor damage, repair fee applied'
    },
    {
      id: 'REQ-2025-015',
      equipmentId: 'ACC-2024-045',
      equipmentName: 'Battery Pack Pro',
      category: 'Accessories',
      requestDate: '2025-02-05',
      startDate: '2025-02-08',
      endDate: '2025-02-10',
      status: 'Canceled',
      notes: 'Canceled by user'
    },
    {
      id: 'REQ-2025-010',
      equipmentId: 'SNS-2024-031',
      equipmentName: 'Multispectral Sensor',
      category: 'Sensors',
      requestDate: '2025-01-28',
      startDate: '2025-02-01',
      endDate: '2025-02-05',
      status: 'Completed',
      notes: 'Extended for 2 additional days'
    }
  ]);

  // Function to get status class for styling
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'pending':
        return 'status-pending';
      case 'denied':
        return 'status-denied';
      case 'completed':
        return 'status-completed';
      case 'canceled':
        return 'status-canceled';
      default:
        return '';
    }
  };

  // State for active tab
  const [activeTab, setActiveTab] = useState('current');

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
            className="nav-link current"
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
        <div className="top-bar">
          <h1><i>🔍</i> My Equipment Requests</h1>
          <div className="search-box">
            <input type="text" placeholder="Search requests..." />
            <button>🔍</button>
          </div>
        </div>

        <div className="quick-actions">
          <button 
            className="action-btn action-primary"
            onClick={() => handleNavigation('/equipments')}
          >
            <i>🛒</i> New Request
          </button>
        </div>

        <div className="tabss">
          <button 
            className={`tabb ${activeTab === 'current' ? 'active' : ''}`}
            onClick={() => setActiveTab('current')}
          >
            Current Requests
          </button>
          <button 
            className={`tabb ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Request History
          </button>
        </div>

        {activeTab === 'current' && (
          <div className="data-module">
            <div className="module-header">
              <div className="module-title">Current Requests ({currentRequests.length})</div>
              <div className="module-filter">
                <select>
                  <option>All Statuses</option>
                  <option>Approved</option>
                  <option>Pending</option>
                  <option>Denied</option>
                </select>
              </div>
            </div>

            <div className="requests-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Equipment</th>
                    <th>Category</th>
                    <th>Request Date</th>
                    <th>Usage Period</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRequests.map(request => (
                    <tr key={request.id}>
                      <td>{request.id}</td>
                      <td>
                        <div className="equipment-info">
                          <span className="equipment-name">{request.equipmentName}</span>
                          <span className="equipment-id">{request.equipmentId}</span>
                        </div>
                      </td>
                      <td>{request.category}</td>
                      <td>{request.requestDate}</td>
                      <td>{request.startDate} to {request.endDate}</td>
                      <td>
                        <span className={`state-indicator ${getStatusClass(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td>{request.notes}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="mini-btn action-secondary" title="View Details">
                            <i>👁️</i>
                          </button>
                          {request.status === 'Pending' && (
                            <button className="mini-btn action-secondary" title="Cancel Request">
                              <i>❌</i>
                            </button>
                          )}
                          {request.status === 'Approved' && (
                            <button className="mini-btn action-primary" title="Request Extension">
                              <i>📅</i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="data-module">
            <div className="module-header">
              <div className="module-title">Request History ({requestHistory.length})</div>
              <div className="module-filter">
                <select>
                  <option>All Time</option>
                  <option>Last 30 Days</option>
                  <option>Last 90 Days</option>
                  <option>This Year</option>
                </select>
              </div>
            </div>

            <div className="requests-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Equipment</th>
                    <th>Category</th>
                    <th>Request Date</th>
                    <th>Usage Period</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requestHistory.map(request => (
                    <tr key={request.id}>
                      <td>{request.id}</td>
                      <td>
                        <div className="equipment-info">
                          <span className="equipment-name">{request.equipmentName}</span>
                          <span className="equipment-id">{request.equipmentId}</span>
                        </div>
                      </td>
                      <td>{request.category}</td>
                      <td>{request.requestDate}</td>
                      <td>{request.startDate} to {request.endDate}</td>
                      <td>
                        <span className={`state-indicator ${getStatusClass(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td>{request.notes}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="mini-btn action-secondary" title="View Details">
                            <i>👁️</i>
                          </button>
                          {request.status === 'Completed' && (
                            <button className="mini-btn action-primary" title="Request Again">
                              <i>🔄</i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="metrics-row">
          <div className="metric-item">
            <div className="metric-name">Total Requests</div>
            <div className="metric-value">{currentRequests.length + requestHistory.length}</div>
          </div>
          <div className="metric-item">
            <div className="metric-name">Approved</div>
            <div className="metric-value">
              {currentRequests.filter(req => req.status === 'Approved').length}
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-name">Pending</div>
            <div className="metric-value">
              {currentRequests.filter(req => req.status === 'Pending').length}
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-name">Completed</div>
            <div className="metric-value">
              {requestHistory.filter(req => req.status === 'Completed').length}
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-name">Denied/Canceled</div>
            <div className="metric-value">
              {currentRequests.filter(req => req.status === 'Denied').length + 
               requestHistory.filter(req => req.status === 'Canceled').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyRequests;