import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyRequest.css';

interface EquipmentRequest {
  id: number;
  equipment_name: string;
  equipment_serial_number: string;
  equipment_category: string;
  request_date: string;
  expected_return_date: string;
  status: 'pending' | 'approved' | 'in_use' | 'rejected' | 'completed' | 'canceled';
  notes?: string;
  approval_notes?: string;
  rejection_reason?: string;
  return_notes?: string;
}

const MyRequests = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedTime, setSelectedTime] = useState('All Time');
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // API INTEGRATION POINT: Replace empty arrays with actual data from API
  const currentRequests: EquipmentRequest[] = [];
  const requestHistory: EquipmentRequest[] = [];
  const categories: string[] = [];

  // API INTEGRATION POINT: Fetch user requests from backend
  // const fetchUserRequests = async () => {
  //   try {
  //     const API_BASE_URL = 'http://localhost:5000/api';
  //     
  //     // Fetch pending requests
  //     const pendingResponse = await fetch(`${API_BASE_URL}/equipment-requests/user/${encodeURIComponent(userName)}/pending`);
  //     const pendingData = await pendingResponse.json();
  //     
  //     // Fetch approved requests
  //     const approvedResponse = await fetch(`${API_BASE_URL}/equipment-requests/user/${encodeURIComponent(userName)}/approved`);
  //     const approvedData = await approvedResponse.json();
  //     
  //     // Fetch rejected requests
  //     const rejectedResponse = await fetch(`${API_BASE_URL}/equipment-requests/user/${encodeURIComponent(userName)}/rejected`);
  //     const rejectedData = await rejectedResponse.json();
  //     
  //     // Fetch returned requests
  //     const returnedResponse = await fetch(`${API_BASE_URL}/equipment-requests/user/${encodeURIComponent(userName)}/returned`);
  //     const returnedData = await returnedResponse.json();
  //     
  //     // Combine and set state
  //     setCurrentRequests([...pendingData.data, ...approvedData.data]);
  //     setRequestHistory([...rejectedData.data, ...returnedData.data]);
  //   } catch (error) {
  //     console.error('Error fetching requests:', error);
  //   }
  // };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  const handleCancelRequest = async (requestId: number) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    
    // API INTEGRATION POINT: Cancel request
    // try {
    //   const API_BASE_URL = 'http://localhost:5000/api';
    //   const response = await fetch(`${API_BASE_URL}/equipment-requests/${requestId}/cancel`, {
    //     method: 'DELETE',
    //     headers: { 'Content-Type': 'application/json' }
    //   });
    //   const result = await response.json();
    //   if (result.success) {
    //     alert('Request canceled successfully.');
    //     fetchUserRequests(); // Refresh data
    //   }
    // } catch (error) {
    //   console.error('Error canceling request:', error);
    // }
    
    alert(`Request ${requestId} canceled successfully.`);
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'in_use':
        return 'status-approved';
      case 'pending':
        return 'status-pending';
      case 'rejected':
      case 'denied':
        return 'status-denied';
      case 'completed':
        return 'status-completed';
      case 'canceled':
        return 'status-canceled';
      default:
        return 'status-unknown';
    }
  };

  const filteredCurrentRequests = currentRequests.filter(req => {
    const categoryMatch = selectedCategory === 'All Categories' || req.equipment_category === selectedCategory;
    const statusMatch = selectedStatus === 'All Statuses' || 
      (selectedStatus === 'Approved' && (req.status === 'approved' || req.status === 'in_use')) ||
      req.status === selectedStatus.toLowerCase();
    return categoryMatch && statusMatch;
  });

  const filteredHistoryRequests = requestHistory.filter(req => {
    const categoryMatch = selectedCategory === 'All Categories' || req.equipment_category === selectedCategory;
    let timeMatch = true;
    if (selectedTime !== 'All Time') {
      const requestDate = new Date(req.request_date);
      const now = new Date();
      const daysDiff = (now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24);
      switch (selectedTime) {
        case 'Last 30 Days':
          timeMatch = daysDiff <= 30;
          break;
        case 'Last 90 Days':
          timeMatch = daysDiff <= 90;
          break;
        case 'This Year':
          timeMatch = requestDate.getFullYear() === now.getFullYear();
          break;
      }
    }
    return categoryMatch && timeMatch;
  });

  return (
    <div className="app-container">
      {/* Logout Loading Overlay */}
      {isLoggingOut && (
        <div className="dashboard-logout-overlay">
          <div className="dashboard-logout-modal">
            <div className="dashboard-logout-spinner"></div>
            <p>Logging Out...</p>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
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
          <div className="nav-link current" onClick={() => handleNavigation('/myrequest')}>
            <i>🔍</i> My Requests
          </div>
          <div className="nav-link" onClick={() => handleNavigation('/updates')}>
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
    

      {/* Main Content Area */}
      <div className="content-area">
        {/* Top Bar */}
        <div className="top-bar">
          <h1><i>🔍</i> My Equipment Requests</h1>
          <div className="search-box">
            <input type="text" placeholder="Search requests..." />
            <button>🔍</button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="action-btn action-primary" onClick={() => handleNavigation('/equipments')}>
            <i>🛒</i> New Request
          </button>
        </div>

        {/* Tabs */}
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

        {/* Current Requests Tab */}
        {activeTab === 'current' && (
          <div className="data-module">
            <div className="module-header">
              <div className="module-title">Current Requests ({filteredCurrentRequests.length})</div>
              <div className="module-filter">
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option>All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option>All Statuses</option>
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>In Use</option>
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
                  {filteredCurrentRequests.length > 0 ? (
                    filteredCurrentRequests.map(request => (
                      <tr key={request.id}>
                        <td>REQ-{request.id.toString().padStart(4, '0')}</td>
                        <td>
                          <div className="equipment-info">
                            <span className="equipment-name">{request.equipment_name || 'Unknown'}</span>
                            <span className="equipment-id">{request.equipment_serial_number || 'N/A'}</span>
                          </div>
                        </td>
                        <td>{request.equipment_category || 'Unknown'}</td>
                        <td>{request.request_date ? new Date(request.request_date).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          {request.request_date && request.expected_return_date
                            ? `${new Date(request.request_date).toLocaleDateString()} to ${new Date(request.expected_return_date).toLocaleDateString()}`
                            : 'N/A'}
                        </td>
                        <td>
                          <span className={`state-indicator ${getStatusClass(request.status)}`}>
                            {request.status === 'in_use' ? 'In Use' : request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </td>
                        <td>{request.notes || request.approval_notes || 'N/A'}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="mini-btn action-secondary view-btn" title="View Details">
                              <i>👁️</i>
                            </button>
                            {request.status === 'pending' && (
                              <button
                                className="mini-btn action-secondary cancel-btn"
                                title="Cancel Request"
                                onClick={() => handleCancelRequest(request.id)}
                              >
                                <i>❌</i>
                              </button>
                            )}
                            {request.status === 'approved' && (
                              <button className="mini-btn action-primary extend-btn" title="Request Extension">
                                <i>📅</i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                        <div className="no-data-icon">📭</div>
                        <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '10px' }}>No current requests found</div>
                        <div className="no-data-subtext" style={{ fontSize: '14px', color: '#888', marginTop: '5px' }}>
                          Try adjusting your filters or submit a new request
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Request History Tab */}
        {activeTab === 'history' && (
          <div className="data-module">
            <div className="module-header">
              <div className="module-title">Request History ({filteredHistoryRequests.length})</div>
              <div className="module-filter">
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option>All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
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
                  {filteredHistoryRequests.length > 0 ? (
                    filteredHistoryRequests.map(request => (
                      <tr key={request.id}>
                        <td>REQ-{request.id.toString().padStart(4, '0')}</td>
                        <td>
                          <div className="equipment-info">
                            <span className="equipment-name">{request.equipment_name || 'Unknown'}</span>
                            <span className="equipment-id">{request.equipment_serial_number || 'N/A'}</span>
                          </div>
                        </td>
                        <td>{request.equipment_category || 'Unknown'}</td>
                        <td>{request.request_date ? new Date(request.request_date).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          {request.request_date && request.expected_return_date
                            ? `${new Date(request.request_date).toLocaleDateString()} to ${new Date(request.expected_return_date).toLocaleDateString()}`
                            : 'N/A'}
                        </td>
                        <td>
                          <span className={`state-indicator ${getStatusClass(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          {request.status === 'rejected'
                            ? request.rejection_reason || 'N/A'
                            : request.status === 'completed'
                            ? request.return_notes || 'Returned'
                            : request.notes || 'N/A'}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="mini-btn action-secondary view-btn" title="View Details">
                              <i>👁️</i>
                            </button>
                            {request.status === 'completed' && (
                              <button
                                className="mini-btn action-primary request-again-btn"
                                title="Request Again"
                                onClick={() => handleNavigation('/equipments')}
                              >
                                <i>🔄</i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                        <div className="no-data-icon">📭</div>
                        <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '10px' }}>No request history found</div>
                        <div className="no-data-subtext" style={{ fontSize: '14px', color: '#888', marginTop: '5px' }}>
                          Try adjusting your filters
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Metrics Row */}
        <div className="request-stats-tabs">
        <div className="request-stat-tab request-blue-tab">
          <div className="request-stat-content">
            <div className="request-stat-title">Total Requests</div>
            <div className="request-stat-value">
              {currentRequests.length + requestHistory.length}</div>
          </div></div>
          <div className="request-stat-tab request-green-tab">
          <div className="request-stat-content">
              <div className="request-stat-title">Approved</div>
              <div className="request-stat-value">
                {currentRequests.filter(req => req.status === 'approved' || req.status === 'in_use').length}
              </div>
            </div>
          </div>
          <div className="request-stat-tab request-yellow-tab">
            <div className="request-stat-content">
              <div className="request-stat-title">Pending</div>
              <div className="request-stat-value">
                {currentRequests.filter(req => req.status === 'pending').length}
              </div>
            </div>
          </div>
          <div className="request-stat-tab request-red-tab">
            <div className="request-stat-content">
              <div className="request-stat-title">Completed</div>
              <div className="request-stat-value">
                {requestHistory.filter(req => req.status === 'completed').length}
              </div>
            </div>
          </div>
          <div className="request-stat-tab request-purple-tab">
            <div className="request-stat-content">
              <div className="request-stat-title">Denied/Canceled</div>
              <div className="request-stat-value">
                {requestHistory.filter(req => req.status === 'rejected' || req.status === 'canceled').length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyRequests;