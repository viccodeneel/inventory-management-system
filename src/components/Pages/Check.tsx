import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Package, Users, ClipboardCheck, FileText, Wrench, Settings, UserCheck, LogOut, Menu, X
} from 'lucide-react';
import './Check.css';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  emoji: string;
  path: string;
}

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
  created_at: string;
  updated_at: string;
  quantity: number; // total quantity
  available_quantity: number; // available (what's left)
}

interface Activity {
  id: number;
  equipment_name: string;
  equipment_id: string;
  action: string;
  user_name: string;
  department: string;
  timestamp: string;
  quantity: number;
}

interface ActiveCheckout {
  id: number;
  equipment_id: number;
  equipment_name: string;
  serial_number: string;
  user_name: string;
  department: string;
  quantity: number;
  checkout_timestamp: string;
}

interface User {
  id: number;
  name: string;
  department: string;
}

const Check = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('check');
  
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Pagination for equipment
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Modals
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedActiveCheckout, setSelectedActiveCheckout] = useState<ActiveCheckout | null>(null);
  
  // Check out form
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [approvedUsers, setApprovedUsers] = useState<User[]>([]);
  const [userFetchError, setUserFetchError] = useState<string | null>(null);
  const [checkOutQuantity, setCheckOutQuantity] = useState(1);
  
  // Check in form
  const [checkInCondition, setCheckInCondition] = useState('good');
  const [checkInQuantity, setCheckInQuantity] = useState(1);
  
  // Recent activity
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  
  // Checked Out tab
  const [activeTab, setActiveTab] = useState<'equipment' | 'checked_out'>('equipment');
  const [activeCheckouts, setActiveCheckouts] = useState<ActiveCheckout[]>([]);
  const [filteredActiveCheckouts, setFilteredActiveCheckouts] = useState<ActiveCheckout[]>([]);
  const [activeSearchInput, setActiveSearchInput] = useState("");

  // Success Modal State
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error'
  });

  // Navigation items
  const navigationItems: NavigationItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, emoji: '📊', path: '/dashboard' },
    { id: 'inventory', label: 'Inventory', icon: Package, emoji: '📦', path: '/inventory' },
    { id: 'users', label: 'Users', icon: Users, emoji: '👥', path: '/users' },
    { id: 'check', label: 'Check In/Out', icon: ClipboardCheck, emoji: '✓', path: '/check' },
    { id: 'reports', label: 'Reports', icon: FileText, emoji: '📝', path: '/reports' },
    { id: 'main', label: 'Maintenance', icon: Wrench, emoji: '🔧', path: '/main' },
    { id: 'settings', label: 'Settings', icon: Settings, emoji: '⚙️', path: '/settings' },
    { id: 'requests', label: 'Requests', icon: UserCheck, emoji: '⚙️', path: '/requests' },
    { id: 'equipment_requests', label: 'Equipment Requests', icon: UserCheck, emoji: '⚙️', path: '/equipment_requests' },
  ];

  // Success Modal Functions
  const showSuccessModal = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setSuccessModal({
      isOpen: true,
      title,
      message,
      type
    });
  };

  // Fetch data
  useEffect(() => {
    fetchEquipment();
    fetchRecentActivity();
    fetchApprovedUsers();
    fetchActiveCheckouts();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/equipment/list');
      if (!response.ok) throw new Error('Failed to fetch equipment');
      const data = await response.json();
      setEquipmentList(data);
      setFilteredEquipment(data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      showSuccessModal('Error', 'Failed to load equipment list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedUsers = async () => {
    try {
      setUserFetchError(null);
      const response = await fetch('http://localhost:5000/api/checkout/approved');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from server');
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Expected an array of users');
      }
      setApprovedUsers(data);
    } catch (error) {
      console.error('Error fetching approved users:', error);
      setUserFetchError('Failed to load approved users. Please try again.');
      showSuccessModal('Error', 'Failed to load approved users', 'error');
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/checkout/history?limit=10');
      if (!response.ok) throw new Error('Failed to fetch recent activity');
      const data = await response.json();
      setRecentActivity(data);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      showSuccessModal('Error', 'Failed to load recent activity', 'error');
    }
  };

  const fetchActiveCheckouts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/checkout/active');
      if (!response.ok) throw new Error('Failed to fetch active checkouts');
      const data = await response.json();
      setActiveCheckouts(data);
      setFilteredActiveCheckouts(data);
    } catch (error) {
      console.error('Error fetching active checkouts:', error);
      showSuccessModal('Error', 'Failed to load active checkouts', 'error');
    }
  };

  // Search for equipment
  useEffect(() => {
    const filtered = equipmentList.filter(item => 
      item.serial_number.toLowerCase().includes(searchInput.toLowerCase()) || 
      item.name.toLowerCase().includes(searchInput.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchInput.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchInput.toLowerCase()) ||
      (item.assigned_to && item.assigned_to.toLowerCase().includes(searchInput.toLowerCase()))
    );
    setFilteredEquipment(filtered);
    setCurrentPage(1);
  }, [searchInput, equipmentList]);

  // Search for active checkouts
  useEffect(() => {
    const filtered = activeCheckouts.filter(item => 
      item.serial_number.toLowerCase().includes(activeSearchInput.toLowerCase()) ||
      item.equipment_name.toLowerCase().includes(activeSearchInput.toLowerCase()) ||
      item.user_name.toLowerCase().includes(activeSearchInput.toLowerCase()) ||
      item.department?.toLowerCase().includes(activeSearchInput.toLowerCase())
    );
    setFilteredActiveCheckouts(filtered);
  }, [activeSearchInput, activeCheckouts]);

  // Pagination for equipment
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEquipment.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Check out handler
  const handleCheckOutClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setUserSearch('');
    setSelectedUser(null);
    setShowUserDropdown(false);
    setCheckOutQuantity(1);
    setShowCheckOutModal(true);
  };

  const handleCheckOutSubmit = async () => {
    if (!selectedEquipment || !selectedUser) {
      showSuccessModal('Error', 'Please select a user', 'error');
      return;
    }
    if (checkOutQuantity < 1 || checkOutQuantity > selectedEquipment.available_quantity) {
      showSuccessModal('Error', 'Invalid quantity', 'error');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/checkout/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipment_id: selectedEquipment.id,
          user_id: selectedUser.id,
          quantity: checkOutQuantity
        })
      });

      if (response.ok) {
        await fetchEquipment();
        await fetchRecentActivity();
        await fetchActiveCheckouts();
        setShowCheckOutModal(false);
        showSuccessModal('Success', 'Equipment checked out successfully!');
      } else {
        const errorData = await response.json();
        showSuccessModal('Error', errorData.error || 'Failed to check out equipment', 'error');
      }
    } catch (error) {
      console.error('Error checking out equipment:', error);
      showSuccessModal('Error', 'Error checking out equipment', 'error');
    }
  };

  // Check in handlers
  const handleCheckInClick = async (equipment: Equipment) => {
    try {
      const response = await fetch(`http://localhost:5000/api/checkout/active/${equipment.id}`);
      if (!response.ok) throw new Error('Failed to fetch active checkouts for equipment');
      const data = await response.json();
      if (data.length > 1) {
        showSuccessModal('Info', 'Multiple assignments detected. Please use the Checked Out tab to check in.', 'error');
        return;
      } else if (data.length === 1) {
        setSelectedActiveCheckout(data[0]);
      } else {
        showSuccessModal('Error', 'No active checkout found', 'error');
        return;
      }
    } catch (error) {
      console.error('Error fetching active checkouts:', error);
      showSuccessModal('Error', 'Failed to prepare check-in', 'error');
      return;
    }

    setSelectedEquipment(equipment);
    setCheckInCondition('good');
    setCheckInQuantity(1);
    setShowCheckInModal(true);
  };

  const handleCheckInClickActive = (active: ActiveCheckout) => {
    setSelectedActiveCheckout(active);
    setCheckInCondition('good');
    setCheckInQuantity(1);
    setShowCheckInModal(true);
  };

  const handleCheckInSubmit = async () => {
    if (!selectedActiveCheckout) {
      showSuccessModal('Error', 'No active checkout selected', 'error');
      return;
    }

    if (checkInQuantity < 1 || checkInQuantity > selectedActiveCheckout.quantity) {
      showSuccessModal('Error', 'Invalid quantity', 'error');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/checkout/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active_checkout_id: selectedActiveCheckout.id,
          condition: checkInCondition,
          quantity: checkInQuantity
        })
      });

      if (response.ok) {
        await fetchEquipment();
        await fetchRecentActivity();
        await fetchActiveCheckouts();
        setShowCheckInModal(false);
        setSelectedActiveCheckout(null);
        showSuccessModal('Success', 'Equipment checked in successfully!');
      } else {
        const errorData = await response.json();
        showSuccessModal('Error', errorData.error || 'Failed to check in equipment', 'error');
      }
    } catch (error) {
      console.error('Error checking in equipment:', error);
      showSuccessModal('Error', 'Error checking in equipment', 'error');
    }
  };

  const handleNavigation = (item: NavigationItem) => {
    setActiveNavItem(item.id);
    navigate(item.path);
  };
  
  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      setIsLoggingOut(false);
      navigate("/");
    }, 1500);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const filteredUsers = approvedUsers.filter(user => 
    user.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="dashboard-containerr">

      {/* Success Modal */}
      {successModal.isOpen && (
        <div className="modal-ovverlay" onClick={() => setSuccessModal({ ...successModal, isOpen: false })}>
          <div className="modal-coontent" onClick={(e) => e.stopPropagation()}>
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

      {/* Sidebar Navigation */}
      <nav className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <span className="logo-emoji">🚁</span>
            {!sidebarCollapsed && (
              <div className="logo-text">
                <h2>Soko Aerial</h2>
                <p>Admin Console</p>
              </div>
            )}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        {navigationItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeNavItem === item.id ? 'active' : ''}`}
            onClick={() => handleNavigation(item)}
            title={sidebarCollapsed ? item.label : ''}
          >
            <span className="nav-emoji">{item.emoji}</span>
            {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
          </button>
        ))}

        <div className="sidebar-footer">
          {!sidebarCollapsed && (
            <div className="admin-info">
              <div className="admin-avatar">A</div>
              <div className="admin-details">
                <p className="admin-name">Admin Console</p>
                <p className="admin-role">System Administrator</p>
              </div>
            </div>
          )}
          
          <button 
            className="logout-btn"
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Logout' : ''}
          >
            <LogOut size={18} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </nav>

      <main className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="main-content">
          <header className="header"></header>
          
          <div className="page-content">
            <div className="page-header">
              <h2>✓ Check In/Out</h2>
              <p>Manage equipment check-ins and check-outs</p>
            </div>
            
            {/* Tab Navigation */}
            <div className="card">
              <div className="tab-navigation">
                <button 
                  className={`tab-button ${activeTab === 'equipment' ? 'active' : ''}`}
                  onClick={() => setActiveTab('equipment')}
                >
                  Equipment
                </button>
                <button 
                  className={`tab-button ${activeTab === 'checked_out' ? 'active' : ''}`}
                  onClick={() => setActiveTab('checked_out')}
                >
                  Checked Out
                </button>
              </div>
              
              {activeTab === 'equipment' ? (
                <>
                  {/* Search Bar for Equipment */}
                  <div className="search-actions-bar">
                    <div className="search-box">
                      <i className="search-icon"></i>
                      <input
                        type="text"
                        placeholder="Search by ID, name, brand, model, or assigned person"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Equipment Table */}
                  <div className="tab-content">
                    {loading ? (
                      <div style={{ padding: '40px', textAlign: 'center' }}>Loading equipment...</div>
                    ) : (
                      <>
                        <div className="table-container">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Serial Number</th>
                                <th>Equipment Name</th>
                                <th>Brand/Model</th>
                                <th>Status</th>
                                <th>Condition</th>
                                <th>Assigned To</th>
                                <th>Available Quantity</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentItems.length === 0 ? (
                                <tr>
                                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                                    No equipment found
                                  </td>
                                </tr>
                              ) : (
                                currentItems.map(item => (
                                  <tr key={item.id}>
                                    <td className="id-cell">{item.serial_number}</td>
                                    <td>{item.name}</td>
                                    <td>{item.brand} {item.model}</td>
                                    <td>
                                      <span className={`status-badge ${
                                        item.status === 'available' ? 'status-available' : 
                                        item.status === 'in_use' ? 'status-checked-out' :
                                        'status-inactive'
                                      }`}>
                                        {item.status === 'available' ? 'Available' :
                                         item.status === 'in_use' ? 'Checked Out' :
                                         item.status}
                                      </span>
                                    </td>
                                    <td>
                                      <span className={`status-badge ${
                                        item.condition === 'good' || item.condition === 'excellent' ? 'status-active' : 
                                        item.condition === 'fair' ? 'status-checked-out' :
                                        'status-inactive'
                                      }`}>
                                        {item.condition}
                                      </span>
                                    </td>
                                    <td>{item.assigned_to || "—"}</td>
                                    <td>{item.available_quantity}</td>
                                    
                                    <td>
                                      {item.status === 'available' && item.available_quantity > 0 ? (
                                        <button 
                                          className="action-button check-out"
                                          onClick={() => handleCheckOutClick(item)}
                                        >
                                          Check Out
                                        </button>
                                      ) : item.status === 'in_use' && item.assigned_to !== 'Multiple' ? (
                                        <button 
                                          className="action-button check-in"
                                          onClick={() => handleCheckInClick(item)}
                                        >
                                          Check In
                                        </button>
                                      ) : (
                                        <span style={{ color: '#999' }}>—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="pagination">
                            <button
                              className="pagination-btn"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </button>
                            
                            <div className="pagination-numbers">
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                                <button
                                  key={pageNum}
                                  className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                                  onClick={() => handlePageChange(pageNum)}
                                >
                                  {pageNum}
                                </button>
                              ))}
                            </div>
                            
                            <button
                              className="pagination-btn"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Search Bar for Checked Out */}
                  <div className="search-actions-bar">
                    <div className="search-box">
                      <i className="search-icon"></i>
                      <input
                        type="text"
                        placeholder="Search by ID, equipment name, user, or department"
                        value={activeSearchInput}
                        onChange={(e) => setActiveSearchInput(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Checked Out Table */}
                  <div className="tab-content">
                    {loading ? (
                      <div style={{ padding: '40px', textAlign: 'center' }}>Loading checked out items...</div>
                    ) : (
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Serial Number</th>
                              <th>Equipment Name</th>
                              <th>User</th>
                              <th>Department</th>
                              <th>Quantity</th>
                              <th>Checked Out</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredActiveCheckouts.length === 0 ? (
                              <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                                  No checked out items
                                </td>
                              </tr>
                            ) : (
                              filteredActiveCheckouts.map(item => (
                                <tr key={item.id}>
                                  <td className="id-cell">{item.serial_number}</td>
                                  <td>{item.equipment_name}</td>
                                  <td>{item.user_name}</td>
                                  <td>{item.department || '—'}</td>
                                  <td>{item.quantity}</td>
                                  <td>{formatTimestamp(item.checkout_timestamp)}</td>
                                  <td>
                                    <button 
                                      className="action-button check-in"
                                      onClick={() => handleCheckInClickActive(item)}
                                    >
                                      Check In
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Activity Log */}
            <div className="card activity-log">
              <div className="activity-header">
                <h3>Recent Activity</h3>
              </div>
              <div className="activity-list">
                {recentActivity.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    No recent activity
                  </div>
                ) : (
                  recentActivity.map(activity => (
                    <div key={activity.id} className="activity-item">
                      <div className={`activity-icon ${activity.action === 'check_in' ? 'check-in-icon' : 'check-out-icon'}`}></div>
                      <div className="activity-details">
                        <p className="activity-description">
                          <span className="activity-type">
                            {activity.action === 'check_in' ? 'Equipment Check In:' : 'Equipment Check Out:'}
                          </span>
                          {' '}{activity.user_name} {activity.action === 'check_in' ? 'returned' : 'took'}{' '}
                          {activity.quantity} of <span className="equipment-id">{activity.equipment_id}</span>
                          {activity.department && ` (${activity.department})`}
                        </p>
                        <p className="activity-time">{formatTimestamp(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Check Out Modal */}
        {showCheckOutModal && (
          <div className="modal-ovverlay" onClick={() => setShowCheckOutModal(false)}>
            <div className="modal-coontent" onClick={(e) => e.stopPropagation()}>
              <h3>Check Out Equipment</h3>
              <p className="modal-subtitle">
                {selectedEquipment?.name} ({selectedEquipment?.serial_number})
              </p>
              
              <div className="form-group">
                <label>User *</label>
                <input
                  type="text"
                  placeholder="Type to search approved users..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setShowUserDropdown(true);
                    if (selectedUser) setSelectedUser(null);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                />
                {userFetchError && (
                  <p style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>
                    {userFetchError}
                  </p>
                )}
                {showUserDropdown && userSearch && (
                  <ul className="user-dropdown" style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: '#fff',
                    position: 'absolute',
                    width: '91%',
                    zIndex: 1000,
                    listStyle: 'none',
                    padding: 0,
                    margin: '80px',
                    marginLeft: '0px',
                  }}>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <li
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user);
                            setUserSearch(user.name);
                            setShowUserDropdown(false);
                          }}
                          style={{
                            padding: '8px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                        >
                          {user.name} - {user.department}
                        </li>
                      ))
                    ) : (
                      <li style={{ padding: '8px', color: '#999' }}>
                        No matching users found
                      </li>
                    )}
                  </ul>
                )}
              </div>

              {selectedEquipment && selectedEquipment.available_quantity > 1 && (
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedEquipment.available_quantity}
                    value={checkOutQuantity}
                    onChange={(e) => setCheckOutQuantity(Number(e.target.value))}
                  />
                </div>
              )}
              
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowCheckOutModal(false)}>
                  Cancel
                </button>
                <button className="btn-submit" onClick={handleCheckOutSubmit}>
                  Check Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Check In Modal */}
        {showCheckInModal && (
          <div className="modal-ovverlay" onClick={() => setShowCheckInModal(false)}>
            <div className="modal-coontent" onClick={(e) => e.stopPropagation()}>
              <h3>Check In Equipment</h3>
              <p className="modal-subtitle">
                {selectedActiveCheckout?.equipment_name || selectedEquipment?.name} ({selectedActiveCheckout?.serial_number || selectedEquipment?.serial_number})
              </p>
              <p className="modal-info">
                Checked out to: <strong>{selectedActiveCheckout?.user_name || selectedEquipment?.assigned_to}</strong>
              </p>
              
              <div className="form-group">
                <label>Equipment Condition *</label>
                <select
                  value={checkInCondition}
                  onChange={(e) => setCheckInCondition(e.target.value)}
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="needs_repair">Needs Repair</option>
                </select>
              </div>

              {selectedActiveCheckout && selectedActiveCheckout.quantity > 1 && (
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedActiveCheckout.quantity}
                    value={checkInQuantity}
                    onChange={(e) => setCheckInQuantity(Number(e.target.value))}
                  />
                </div>
              )}
              
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowCheckInModal(false)}>
                  Cancel
                </button>
                <button className="btn-submit" onClick={handleCheckInSubmit}>
                  Check In
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logout Loading Overlay */}
        {isLoggingOut && (
          <div className="dashboard-logout-overlay">
            <div className="dashboard-logout-modal">
              <p>Logging out...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Check;