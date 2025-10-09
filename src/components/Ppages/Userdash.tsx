import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Userdash.css';

interface Equipment {
  id: number;
  serial_number: string;
  name: string;
  model: string;
  brand: string;
  status: string;
  condition: string;
  category: string;
  location: string;
  assigned_to: string | null;
}

interface EquipmentStats {
  total: number;
  available: number;
  in_use: number;
  maintenance: number;
}

interface UserRequest {
  id: number;
  equipment_name: string;
  request_date: string;
  expected_return_date: string;
  status: string;
  equipment_id: number;
}

const Pages2 = () => {
  // State for equipment category filter
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  
  // State for active tab (Dashboard or My Requests)
  const [activeTab,] = useState('dashboard');
  
  // State for logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Data states
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStats>({
    total: 0,
    available: 0,
    in_use: 0,
    maintenance: 0
  });
  const [userRequests, setUserRequests] = useState<UserRequest[]>([]);
  const [categories, setCategories] = useState<string[]>(['All Categories']);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Initialize navigate from react-router-dom
  const navigate = useNavigate();
  
  // API Base URL - adjust this to match your backend
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  
  // Fetch equipment stats
  const fetchEquipmentStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/equipment/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const stats = await response.json();
      setEquipmentStats(stats);
    } catch (error) {
      console.error('Error fetching equipment stats:', error);
    }
  };

  //Profile View
  // Add this to your state declarations (near the top with other useState calls)
const [currentUser, setCurrentUser] = useState<{
  name: string;
  email: string;
  role: string;
} | null>(null);

// Add this function to fetch current user data
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
        fetchEquipmentStats(),
        fetchEquipmentList(),
        fetchUserRequests()
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


  // Fetch equipment list
  const fetchEquipmentList = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/equipment/list`);
      if (!response.ok) throw new Error('Failed to fetch equipment');
      const equipment = await response.json();
      setEquipmentList(equipment);
      
      // Extract unique categories
      const uniqueCategories = ['All Categories', ...new Set(equipment.map((item: Equipment) => item.category))];
      setCategories(uniqueCategories as string[]);
    } catch (error) {
      console.error('Error fetching equipment list:', error);
    }
  };

  // Fetch user's requests (you'll need to implement this endpoint)
  const fetchUserRequests = async () => {
    try {
      // Note: You'll need to implement user authentication and pass user ID
      // const userId = getCurrentUserId(); // Implement this function
      const response = await fetch(`${API_BASE_URL}/requests/user`); // Add user ID when auth is ready
      if (!response.ok) throw new Error('Failed to fetch user requests');
      const requests = await response.json();
      setUserRequests(requests);
    } catch (error) {
      console.error('Error fetching user requests:', error);
      // For now, set empty array if endpoint doesn't exist
      setUserRequests([]);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchEquipmentStats(),
          fetchEquipmentList(),
          fetchUserRequests()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);
  
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
  
  // Filter equipment based on selected category and search term
  const filteredEquipment = equipmentList.filter(item => {
    const matchesCategory = selectedCategory === 'All Categories' || item.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });
  
  // Handle equipment request
  const handleRequestEquipment = async (equipmentId: number) => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      // Note: You'll need to implement this endpoint and pass user authentication
      const response = await fetch(`${API_BASE_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header when auth is implemented
          // 'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          equipment_id: equipmentId,
          // user_id: getCurrentUserId(), // Add when auth is ready
          request_date: new Date().toISOString().split('T')[0],
          expected_return_date: '', // You might want to add a date picker for this
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      alert('Equipment request submitted successfully!');
      // Refresh data
      await Promise.all([
        fetchEquipmentList(),
        fetchUserRequests(),
        fetchEquipmentStats()
      ]);
    } catch (error) {
      console.error('Error requesting equipment:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Determine if equipment is requestable based on status
  const isRequestable = (status: string): boolean => status.toLowerCase() === 'available';
  
  // Get status tag class based on status
  const getStatusClass = (status: string): string => {
    switch(status.toLowerCase()) {
      case 'available': return 'state-ready';
      case 'in_use': 
      case 'in use': return 'state-busy';
      case 'maintenance': return 'state-repair';
      case 'approved': return 'state-busy';
      case 'completed': return 'state-ready';
      case 'denied': return 'state-repair';
      case 'pending': return 'state-waiting';
      case 'out_of_service': 
      case 'out of service': return 'state-repair';
      default: return '';
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEquipment = filteredEquipment.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Reset current page when search term or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  // Calculate request stats from user requests
  const getRequestStats = () => {
    const total = userRequests.length;
    const approved = userRequests.filter(req => req.status.toLowerCase() === 'approved').length;
    const pending = userRequests.filter(req => req.status.toLowerCase() === 'pending').length;
    const completed = userRequests.filter(req => req.status.toLowerCase() === 'completed').length;
    const denied = userRequests.filter(req => req.status.toLowerCase() === 'denied').length;
    
    return { total, approved, pending, completed, denied };
  };

  const requestStats = getRequestStats();

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <div className="loading-text">Loading dashboard data...</div>
          <div className="loading-subtext">Please wait while we fetch your equipment information</div>
        </div>
      </div>
    );
  }
  
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
            className={`nav-link ${activeTab === 'dashboard' ? 'current' : ''}`}
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
            className={`nav-link ${activeTab === 'requests' ? 'current' : ''}`}
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
        <div className="top-bar">
          <h1><i>📊</i> {activeTab === 'dashboard' ? 'Dashboard' : 'My Equipment Requests'}</h1>
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <button>🔍</button>
          </div>
        </div>
        
        <div className="quick-actions">
          <button 
            className="action-btn action-primary"
            onClick={() => handleNavigation('/equipments')}
          >
            <i>🛒</i> Request Equipment
          </button>
          <button 
            className={`action-btn ${activeTab === 'requests' ? 'action-primary' : 'action-secondary'}`}
            onClick={() => handleNavigation('/myrequest')}
          >
            <i>📊</i> View My Requests
          </button>
        </div>
        
        {activeTab === 'dashboard' && (
          <>
            <div className="inventory-stat-tabs">
              <div className="inventory-stat-tab inventory-blue-tab">
                <div className="inventory-stat-content">
                  <div className="inventory-stat-title">TOTAL EQUIPMENT</div>
                  <div className="inventory-stat-value">{equipmentStats.total}</div>
                </div>
                <div className="inventory-stat-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                </div>
              </div>
              
              <div className="inventory-stat-tab inventory-green-tab">
                <div className="inventory-stat-content">
                  <div className="inventory-stat-title">AVAILABLE</div>
                  <div className="inventory-stat-value">{equipmentStats.available}</div>
                </div>
                <div className="inventory-stat-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none">
                    <path d="M4 21v-7m0 0V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9m-4 0H4m16 0v7"></path>
                    <path d="M12 12H4"></path>
                    <path d="M12 16H4"></path>
                    <path d="M12 8H4"></path>
                  </svg>
                </div>
              </div>
              
              <div className="inventory-yellow-tab inventory-stat-tab">
                <div className="inventory-stat-content">
                  <div className="inventory-stat-title">IN USE</div>
                  <div className="inventory-stat-value">{equipmentStats.in_use}</div>
                </div>
                <div className="inventory-stat-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="10" r="3"></circle>
                    <path d="M7 20.662V19c0-1.5 1.5-3 5-3s5 1.5 5 3v1.662"></path>
                  </svg>
                </div>
              </div>
              
              <div className="inventory-stat-tab inventory-red-tab">
                <div className="inventory-stat-content">
                  <div className="inventory-stat-title">MAINTENANCE</div>
                  <div className="inventory-stat-value">{equipmentStats.maintenance}</div>
                </div>
                <div className="inventory-stat-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="section-layout">
              <div className="equipment-section">
                <div className="data-module equipment-card">
                  <div className="module-header">
                    <div className="module-title">Equipments ({filteredEquipment.length} total, showing {currentEquipment.length})</div>
                    <div className="module-filter">
                      <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="equipment-table-responsive">
                    <table className="data-table equipment-table">
                      <thead>
                        <tr>
                          <th>Equipment ID</th>
                          <th>Name</th>
                          <th>Model</th>
                          <th>Brand</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Condition</th>
                          <th>Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentEquipment.length > 0 ? (
                          currentEquipment.map(item => (
                            <tr key={item.id}>
                              <td>{item.serial_number}</td>
                              <td>{item.name}</td>
                              <td>{item.model}</td>
                              <td>{item.brand}</td>
                              <td>{item.category}</td>
                              <td>
                                <span className={`equipment-status status-${item.status.toLowerCase().replace(' ', '-')}`}>
                                  {item.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td>{item.condition}</td>
                              <td>{item.location}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                              {searchTerm || selectedCategory !== 'All Categories' ? 
                                'No equipment matches your search criteria' : 
                                'No equipment available'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {filteredEquipment.length > 0 && (
                    <div className="pagination-container">
                      <div className="pagination-info">
                        <span>
                          Showing {startIndex + 1} to {Math.min(endIndex, filteredEquipment.length)} of {filteredEquipment.length} entries
                        </span>
                        <div className="items-per-page">
                          <label>Show: </label>
                          <select 
                            value={itemsPerPage} 
                            onChange={handleItemsPerPageChange}
                            className="items-per-page-select"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                          <label> per page</label>
                        </div>
                      </div>

                      <div className="pagination-controls">
                        <button 
                          className="pagination-btn"
                          onClick={handlePrevPage}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </button>

                        <div className="pagination-numbers">
                          {getPageNumbers().map((page, index) => (
                            <span key={index}>
                              {page === '...' ? (
                                <span className="pagination-dots">...</span>
                              ) : (
                                <button
                                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                  onClick={() => handlePageChange(page as number)}
                                >
                                  {page}
                                </button>
                              )}
                            </span>
                          ))}
                        </div>

                        <button 
                          className="pagination-btn"
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <div className="data-module">
                  <div className="module-header">
                    <div className="module-title">System Alerts</div>
                  </div>
                  <ul className="notice-list">
                    <li className="notice-item">
                      <div className="notice-icon notice-red">!</div>
                      <div className="notice-content">
                        <h4>Low inventory alert ({equipmentStats.available} items available)</h4>
                        <div className="notice-time">System generated</div>
                      </div>
                    </li>
                    <li className="notice-item">
                      <div className="notice-icon notice-yellow">!</div>
                      <div className="notice-content">
                        <h4>{equipmentStats.maintenance} items currently in maintenance</h4>
                        <div className="notice-time">System status</div>
                      </div>
                    </li>
                    <li className="notice-item">
                      <div className="notice-icon notice-blue">i</div>
                      <div className="notice-content">
                        <h4>{equipmentStats.in_use} items currently in use</h4>
                        <div className="notice-time">Current status</div>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="data-module">
                  <div className="module-header">
                    <div className="module-title">Equipment Usage Guidelines</div>
                  </div>
                  <ul className="rules-list">
                    <li>All equipment requests must be submitted at least 24 hours in advance.</li>
                    <li>Return all equipment by the specified deadline.</li>
                    <li>Report any damages or issues immediately after use.</li>
                    <li>Check battery levels before taking equipment.</li>
                    <li>Complete required training before requesting specialized equipment.</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'requests' && (
          <div className="data-module request-module">
            <div className="module-header">
              <div className="module-title">My Equipment Requests</div>
              <div className="module-filter">
                <select>
                  <option>All Statuses</option>
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Denied</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Equipment</th>
                  <th>Requested Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {userRequests.length > 0 ? (
                  userRequests.map(request => (
                    <tr key={request.id}>
                      <td>REQ-{request.id}</td>
                      <td>{request.equipment_name}</td>
                      <td>{new Date(request.request_date).toLocaleDateString()}</td>
                      <td>{request.expected_return_date ? new Date(request.expected_return_date).toLocaleDateString() : '--'}</td>
                      <td>
                        <span className={`state-indicator ${getStatusClass(request.status)}`}>
                          {request.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {request.status.toLowerCase() === 'approved' && (
                          <button 
                            className="mini-btn action-primary"
                            onClick={() => handleNavigation(`/return/${request.id}`)}
                          >
                            Return
                          </button>
                        )}
                        {request.status.toLowerCase() === 'pending' && (
                          <button 
                            className="mini-btn action-secondary"
                            onClick={() => handleNavigation(`/cancel/${request.id}`)}
                          >
                            Cancel
                          </button>
                        )}
                        {(request.status.toLowerCase() === 'completed' || request.status.toLowerCase() === 'denied') && (
                          <button 
                            className="mini-btn action-primary"
                            onClick={() => handleNavigation(`/request-again/${request.id}`)}
                          >
                            Request Again
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                      No requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <div className="metrics-row">
              <div className="metric-item">
                <div className="metric-name">Total Requests</div>
                <div className="metric-value">{requestStats.total}</div>
              </div>
              <div className="metric-item">
                <div className="metric-name">Approved</div>
                <div className="metric-value">{requestStats.approved}</div>
              </div>
              <div className="metric-item">
                <div className="metric-name">Pending</div>
                <div className="metric-value">{requestStats.pending}</div>
              </div>
              <div className="metric-item">
                <div className="metric-name">Completed</div>
                <div className="metric-value">{requestStats.completed}</div>
              </div>
              <div className="metric-item">
                <div className="metric-name">Denied</div>
                <div className="metric-value">{requestStats.denied}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pages2;