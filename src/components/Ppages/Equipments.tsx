import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Equipments.css';
import SuccessModal from '../UI/SuccessModal';

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
  quantity: number;
  available_quantity: number;
  assigned_to: string | null;
}

interface EquipmentStats {
  total: number;
  available: number;
  in_use: number;
  maintenance: number;
}

const Equipment = () => {
  // State for filters and search
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // State for logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Modal states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [returnDate, setReturnDate] = useState('');
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestReason, setRequestReason] = useState('');
  
  // Data states
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStats>({
    total: 0,
    available: 0,
    in_use: 0,
    maintenance: 0
  });
  const [categories, setCategories] = useState<string[]>(['All Categories']);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Initialize navigate from react-router-dom
  const navigate = useNavigate();
  
  // API Base URL - adjust this to match your backend
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  
  // Get today's date in YYYY-MM-DD format for min date
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get current date and time for request date display
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
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

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchEquipmentStats(),
          fetchEquipmentList()
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

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Open request modal
  const openRequestModal = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setReturnDate(''); // Reset return date
    setRequestQuantity(1); // Reset quantity
    setRequestReason(''); // Reset reason
    setIsRequestModalOpen(true);
  };

  // Close request modal
  const closeRequestModal = () => {
    setIsRequestModalOpen(false);
    setSelectedEquipment(null);
    setReturnDate('');
    setRequestQuantity(1);
    setRequestReason('');
  };

  // Filter equipment based on category and search term
  const filteredEquipment = equipmentList.filter(item => {
    const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

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
  }, [searchTerm, categoryFilter]);

  // Handle equipment request submission
  const handleSubmitRequest = async () => {
    if (!selectedEquipment || !returnDate || !requestReason.trim() || submitting) return;
    
    // Validate return date
    if (new Date(returnDate) <= new Date()) {
      showSuccessModal('Invalid Date', 'Return date must be in the future', 'error');
      return;
    }

    // Validate quantity
    if (requestQuantity < 1 || requestQuantity > (selectedEquipment.available_quantity || 0)) {
      showSuccessModal('Invalid Quantity', `Quantity must be between 1 and ${selectedEquipment.available_quantity}`, 'error');
      return;
    }

    // Validate reason
    if (!requestReason.trim()) {
      showSuccessModal('Reason Required', 'Please provide a reason for your request', 'error');
      return;
    }
    
    setSubmitting(true);
    try {
      const requestBody = {
        equipment_id: selectedEquipment.id,
        equipment_name: selectedEquipment.name,
        equipment_model: selectedEquipment.model,
        equipment_brand: selectedEquipment.brand,
        equipment_category: selectedEquipment.category,
        equipment_serial_number: selectedEquipment.serial_number,
        equipment_location: selectedEquipment.location,
        equipment_quantity: requestQuantity,
        request_date: new Date().toISOString(),
        expected_return_date: returnDate,
        user_name: currentUser ? currentUser.name : 'Unknown User',
        status: 'pending',
        notes: requestReason
      };

      console.log('📤 Submitting request to:', `${API_BASE_URL}/pending-requests`);
      console.log('📦 Request body:', requestBody);

      const response = await fetch(`${API_BASE_URL}/pending-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', response.headers.get('content-type'));

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Non-JSON response:', text);
        throw new Error('Server returned an invalid response. Please check if the API endpoint exists.');
      }

      const data = await response.json();
      console.log('📥 Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit request');
      }

      showSuccessModal('Success', 'Equipment request submitted successfully! Your request is now pending approval.');
      closeRequestModal();
      
      // Refresh data
      await Promise.all([
        fetchEquipmentList(),
        fetchEquipmentStats()
      ]);
    } catch (error: any) {
      console.error('❌ Error requesting equipment:', error);
      showSuccessModal('Error', error.message || 'Failed to submit request. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle equipment request (opens modal)
  const handleRequest = (equipment: Equipment) => {
    openRequestModal(equipment);
  };

  // Check if equipment is requestable
  const isRequestable = (status: string): boolean => {
    return status.toLowerCase() === 'available';
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
        fetchCurrentUser(),
        fetchEquipmentStats(),
        fetchEquipmentList()
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

      {/* Request Modal */}
      {isRequestModalOpen && selectedEquipment && (
        <div className="modal-overlay" onClick={closeRequestModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Equipment</h2>
              <button className="modal-close" onClick={closeRequestModal}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="equipment-details-section">
                <h3>Equipment Details</h3>
                <div className="equipment-details-grid">
                  <div className="detail-item">
                    <label>Equipment Name:</label>
                    <span>{selectedEquipment.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Serial Number:</label>
                    <span>{selectedEquipment.serial_number}</span>
                  </div>
                  <div className="detail-item">
                    <label>Model:</label>
                    <span>{selectedEquipment.model}</span>
                  </div>
                  <div className="detail-item">
                    <label>Brand:</label>
                    <span>{selectedEquipment.brand}</span>
                  </div>
                  <div className="detail-item">
                    <label>Category:</label>
                    <span>{selectedEquipment.category}</span>
                  </div>
                  <div className="detail-item">
                    <label>Condition:</label>
                    <span>{selectedEquipment.condition}</span>
                  </div>
                  <div className="detail-item">
                    <label>Current Location:</label>
                    <span>{selectedEquipment.location}</span>
                  </div>
                   <div className="detail-item">
                    <label>Available Quantity:</label>
                    <span>{selectedEquipment.available_quantity || 0}</span>
                  </div>

                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`equipment-status status-${selectedEquipment.status.toLowerCase().replace(' ', '-')}`}>
                      {selectedEquipment.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="request-details-section">
                <h3>Request Details</h3>
                <div className="request-details-grid">
                  <div className="detail-item">
                    <label>Request Date:</label>
                    <span>{getCurrentDateTime()}</span>
                  </div>

                  <div className="detail-item">
                    <label>Expected Return Date: <span className="required">*</span></label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={getTodayDate()}
                      className="date-input"
                      required
                    />
                  </div>
               
                  <div className="detail-item">
                    <label>Equipment Quantity: <span className="required">*</span></label>
                    <input
                      type="number"
                      value={requestQuantity}
                      onChange={(e) => {
                        const newQuantity = Number(e.target.value);
                        const maxQuantity = selectedEquipment?.available_quantity || 0;
                        if (newQuantity >= 1 && newQuantity <= maxQuantity) {
                          setRequestQuantity(newQuantity);
                        }
                      }}
                      min={1}
                      max={selectedEquipment?.available_quantity || 0}
                      className="number-input"
                      required
                    />
                    <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
                      Max available: {selectedEquipment?.available_quantity || 0}
                    </small>
                  </div>

                  <div className="detail-item full-width">
                    <label>Requested By:</label>
                   <h4> {currentUser ? currentUser.name : 'Loading...'}  ({currentUser ? formatRole(currentUser.role) : 'Loading...'})</h4>
                  </div>

                  <div className="detail-item full-width">
                    <label>Reason for Request: <span className="required">*</span></label>
                    <textarea
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      placeholder="Please provide a reason for requesting this equipment..."
                      className="reason-textarea"
                      rows={4}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                    />
                    <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
                      {requestReason.length}/500 characters
                    </small>
                  </div>
                </div>
              </div>

              <div className="request-guidelines">
                <h4>📋 Request Guidelines</h4>
                <ul>
                  <li>Ensure you return the equipment by the specified date</li>
                  <li>Report any damages immediately after use</li>
                  <li>Keep the equipment in good condition during use</li>
                  <li>Contact support if you need to extend the return date</li>
                </ul>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="modal-btn secondary" 
                onClick={closeRequestModal}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                className="modal-btn primary" 
                onClick={handleSubmitRequest}
                disabled={!returnDate || !requestReason.trim() || submitting}
              >
                {submitting ? 'Submitting Request...' : 'Submit Request'}
              </button>
            </div>
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
            className="nav-link current"
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
        <div className="equipment-page">
          <div className="page-header">
            <h1><i>📦</i> Equipment</h1>
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

          {/* Inventory-style Stat Cards */}
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

          <div className="equipment-table-container">
            <div className="table-header">
              <h2>All Equipment ({filteredEquipment.length} total, showing {currentEquipment.length})</h2>
              <select 
                className="category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="table-responsive">
              <table className="equipment-table">
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
                    <th>Available Quantity</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEquipment.length > 0 ? (
                    currentEquipment.map((item) => (
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
                         <td>{item.available_quantity || 0}</td>

                        <td>
                          <button 
                            className={`request-button ${!isRequestable(item.status) ? 'disabled' : ''}`}
                            onClick={() => handleRequest(item)}
                            disabled={!isRequestable(item.status)}
                          >
                            Request
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '20px' }}>
                        {searchTerm || categoryFilter !== 'All Categories' ? 
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

          <div className="equipment-guidelines">
            <h3>Equipment Usage Guidelines</h3>
            <ul>
              <li>All equipment requests must be submitted at least 24 hours in advance.</li>
              <li>Return all equipment by the specified deadline.</li>
              <li>Report any damages or issues immediately after use.</li>
              <li>Check battery levels before taking equipment.</li>
              <li>Complete required training before requesting specialized equipment.</li>
            </ul>
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


export default Equipment;