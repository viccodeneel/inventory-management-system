import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyRequest.css';
import SuccessModal from '../UI/SuccessModal';
import { showConfirmationModal } from '../UI/ModalService';

interface EquipmentRequest {
  id: number;
  equipment_name: string;
  equipment_serial_number: string;
  equipment_category: string;
  request_date: string;
  expected_return_date: string;
  status: 'pending' | 'approved' | 'in_use' | 'rejected' | 'returned' | 'canceled';
  notes?: string;
  approval_code?: string;
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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EquipmentRequest | null>(null);

  // Profile states
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  // Data states
  const [currentRequests, setCurrentRequests] = useState<EquipmentRequest[]>([]);
  const [requestHistory, setRequestHistory] = useState<EquipmentRequest[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Profile Functions
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('userToken');
      
      if (!token) {
        console.error('No token found');
        navigate('/');
        return null;
      }

      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid token format');
        }
        
        const payload = JSON.parse(atob(parts[1]));
        const user = {
          name: payload.name,
          email: payload.email,
          role: payload.role
        };
        
        setCurrentUser(user);
        console.log('Current user set:', user.name);
        return user;
      } catch (decodeError) {
        console.error('Token decode error:', decodeError);
        localStorage.clear();
        navigate('/');
        return null;
      }
    } catch (error) {
      console.error('Error in fetchCurrentUser:', error);
      navigate('/');
      return null;
    }
  };

  
   // Success Modal State
const [successModal, setSuccessModal] = useState({
  isOpen: false,
  title: '',
  message: '',
  type: 'success' as 'success' | 'error'
});

//Helper 
// Success Modal Functions
const showSuccessModal = (title: string, message: string, type: 'success' | 'error' = 'success') => {
  setSuccessModal({
    isOpen: true,
    title,
    message,
    type
  });
};


const closeSuccessModal = () => {
  setSuccessModal({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });
};

  // Fetch user requests from backend
  const fetchUserRequests = async (userName: string) => {
    try {
      const API_BASE_URL = 'http://localhost:5000/api';
      
      // Fetch pending requests
      const pendingResponse = await fetch(`${API_BASE_URL}/equipment-requests/user/${encodeURIComponent(userName)}/pending`);
      if (!pendingResponse.ok) throw new Error('Failed to fetch pending requests');
      const pendingData = await pendingResponse.json();
      
      // Fetch approved requests (includes approved and in_use)
      const approvedResponse = await fetch(`${API_BASE_URL}/equipment-requests/user/${encodeURIComponent(userName)}/approved`);
      if (!approvedResponse.ok) throw new Error('Failed to fetch approved requests');
      const approvedData = await approvedResponse.json();
      
      // Fetch rejected requests
      const rejectedResponse = await fetch(`${API_BASE_URL}/equipment-requests/user/${encodeURIComponent(userName)}/rejected`);
      if (!rejectedResponse.ok) throw new Error('Failed to fetch rejected requests');
      const rejectedData = await rejectedResponse.json();
      
      // Fetch returned requests (completed)
      const returnedResponse = await fetch(`${API_BASE_URL}/equipment-requests/user/${encodeURIComponent(userName)}/returned`);
      if (!returnedResponse.ok) throw new Error('Failed to fetch returned requests');
      const returnedData = await returnedResponse.json();
      
      // Combine pending and approved for current requests
      setCurrentRequests([
        ...(pendingData.data || []),
        ...(approvedData.data || [])
      ].map(req => ({
        ...req,
        status: req.status === 'returned' ? 'completed' : req.status
      })));
      
      // Combine rejected and returned for history
      setRequestHistory([
        ...(rejectedData.data || []),
        ...(returnedData.data || [])
      ].map(req => ({
        ...req,
        status: req.status === 'returned' ? 'completed' : req.status
      })));
      
      // Collect unique categories
      const allRequests = [
        ...(pendingData.data || []),
        ...(approvedData.data || []),
        ...(rejectedData.data || []),
        ...(returnedData.data || [])
      ];
      const uniqueCategories = [...new Set(allRequests.map(req => req.equipment_category).filter(Boolean))];
      setCategories(uniqueCategories);
      
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const user = await fetchCurrentUser();
        if (user) {
          await fetchUserRequests(user.name);
        }
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
      admin: 'Administrator',
      personnel: 'Personnel',
      user: 'Team Member'
    };
    return roleMap[role.toLowerCase()] || 'Team Member';
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    localStorage.clear();
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  const handleViewDetails = (request: EquipmentRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedRequest(null);
  };

  const handleCancelRequest = async (requestId: number) => {
  // Ask for confirmation first
  const confirmed = await showConfirmationModal(
    'Cancel Request',
    'Are you sure you want to cancel this request?'
  );
  if (!confirmed) return;

  try {
    const API_BASE_URL = 'http://localhost:5000/api';

    const response = await fetch(`${API_BASE_URL}/equipment-requests/${requestId}/cancel`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to cancel request');
    }

    const result = await response.json();

    if (result.success) {
      await showSuccessModal('Request Canceled', 'Request canceled successfully.');
      if (currentUser) {
        await fetchUserRequests(currentUser.name);
      }
    } else {
      await showSuccessModal(
        'Request Canceled',
        result.message || 'Failed to cancel request.'
      );
    }
  } catch (error) {
    console.error('Error canceling request:', error);
    await showSuccessModal('Error', 'Error canceling request.');
  }
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
      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="ddmodal-overlay" onClick={closeDetailsModal}>
          <div className="ddetails-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ddmodal-header">
              <h2>Request Details</h2>
              <button className="cclose-ddmodal-btn" onClick={closeDetailsModal}>✕</button>
            </div>
            
            <div className="ddmodal-content">
              <div className="ddetail-section">
                <h3>Request Information</h3>
                <div className="ddetail-grid">
                  <div className="ddetail-item">
                    <span className="ddetail-label">Request ID:</span>
                    <span className="ddetail-value">REQ-{selectedRequest.id.toString().padStart(4, '0')}</span>
                  </div>
                  <div className="ddetail-item">
                    <span className="ddetail-label">Status:</span>
                    <span className={`state-indicator ${getStatusClass(selectedRequest.status)}`}>
                      {selectedRequest.status === 'in_use' ? 'In Use' : selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                    </span>
                  </div>
                  <div className="ddetail-item">
                    <span className="ddetail-label">Request Date:</span>
                    <span className="ddetail-value">{new Date(selectedRequest.request_date).toLocaleDateString()}</span>
                  </div>
                  <div className="ddetail-item">
                    <span className="ddetail-label">Expected Return:</span>
                    <span className="ddetail-value">{new Date(selectedRequest.expected_return_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="ddetail-section">
                <h3>Equipment Information</h3>
                <div className="ddetail-grid">
                  <div className="ddetail-item">
                    <span className="ddetail-label">Equipment Name:</span>
                    <span className="ddetail-value">{selectedRequest.equipment_name}</span>
                  </div>
                  <div className="ddetail-item">
                    <span className="ddetail-label">Serial Number:</span>
                    <span className="ddetail-value">{selectedRequest.equipment_serial_number}</span>
                  </div>
                  <div className="ddetail-item">
                    <span className="ddetail-label">Category:</span>
                    <span className="ddetail-value">{selectedRequest.equipment_category}</span>
                  </div>
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="ddetail-section">
                  <h3>Notes</h3>
                  <p className="ddetail-notes">{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.approval_code && (
                <div className="ddetail-section">
                  <h3>Approval Code</h3>
                  <p className="ddetail-approval-code">{selectedRequest.approval_code}</p>
                </div>
              )}

              {selectedRequest.rejection_reason && (
                <div className="ddetail-section">
                  <h3>Rejection Reason</h3>
                  <p className="ddetail-rejection">{selectedRequest.rejection_reason}</p>
                </div>
              )}

              {selectedRequest.return_notes && (
                <div className="ddetail-section">
                  <h3>Return Notes</h3>
                  <p className="ddetail-notes">{selectedRequest.return_notes}</p>
                </div>
              )}
            </div>

           
          </div>
        </div>
      )}

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
                    <th>Approval Code</th>
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
                        <td>
                          {(request.status === 'approved' || request.status === 'in_use')
                            ? request.approval_code || 'N/A'
                            : request.notes || 'N/A'}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn-view" 
                              title="View Details"
                              onClick={() => handleViewDetails(request)}
                            >
                              👁️
                            </button>
                            {request.status === 'pending' && (
                              <button
                                className="btn-cancel"
                                title="Cancel Request"
                                onClick={() => handleCancelRequest(request.id)}
                              >
                                ❌
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
                            : request.status === 'returned'
                            ? request.return_notes || 'Returned'
                            : request.notes || 'N/A'}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn-view" 
                              title="View Details"
                              onClick={() => handleViewDetails(request)}
                            >
                              👁️
                            </button>

                            {request.status === 'rejected' && (
                              <button
                                className="btn-request-again"
                                title="Request Again"
                                onClick={() => handleNavigation('/equipments')}
                              >
                                🔄️
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
                {currentRequests.length + requestHistory.length}
              </div>
            </div>
          </div>
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
                {requestHistory.filter(req => req.status === 'returned' || req.status === 'completed').length}
              </div>
            </div>
          </div>
          <div className="request-stat-tab request-purple-tab">
            <div className="request-stat-content">
              <div className="request-stat-title">Rejected/Canceled</div>
              <div className="request-stat-value">
                {requestHistory.filter(req => req.status === 'rejected' || req.status === 'canceled').length}
              </div>
            </div>
          </div>
        </div>
      </div>

 <SuccessModal
  isOpen={successModal.isOpen}
  onClose={closeSuccessModal}
  title={successModal.title}
  message={successModal.message}
  type={successModal.type}
/>

    </div>
    
  );
};

export default MyRequests;