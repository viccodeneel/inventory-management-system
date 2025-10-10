import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Package, Users, FileText, Wrench, Settings, UserCheck, LogOut, Menu, X
} from 'lucide-react';
import './Users.css';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  emoji: string;
  path: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  status: 'checked-in' | 'checked-out' | 'using' | 'inactive';
  equipment: string[];
  lastActivity: string;
  avatar: string;
}

const UsersPage = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('users');
  
  // State for users data
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 7;

  // Navigation items
  const navigationItems: NavigationItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, emoji: '📊', path: '/dashboard' },
    { id: 'inventory', label: 'Inventory', icon: Package, emoji: '📦', path: '/inventory' },
    { id: 'users', label: 'Users', icon: Users, emoji: '👥', path: '/users' },
    { id: 'check', label: 'Check In/Out', icon: UserCheck, emoji: '✓', path: '/check' },
    { id: 'reports', label: 'Reports', icon: FileText, emoji: '📝', path: '/reports' },
    { id: 'main', label: 'Maintenance', icon: Wrench, emoji: '🔧', path: '/main' },
    { id: 'settings', label: 'Settings', icon: Settings, emoji: '⚙️', path: '/settings' },
    { id: 'requests', label: 'Requests', icon: UserCheck, emoji: '📋', path: '/requests' },
    { id: 'equipment_requests', label: 'Equipment Requests', icon: UserCheck, emoji: '📦', path: '/equipment_requests' },
  ];

  // ============================================
  // 🔌 API CALL: Fetch all users on component mount
  // ============================================
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/users');
        // if (!response.ok) throw new Error('Failed to fetch users');
        // const data = await response.json();
        // setUsers(data);
        
        // Temporary: Set empty array until API is connected
        setUsers([]);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Handle search and filtering
  useEffect(() => {
    let result = [...users];

    // Filter by search term
    if (searchTerm) {
      result = result.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by active tab
    if (activeTab !== 'all') {
      result = result.filter(user => user.status === activeTab);
    }

    setFilteredUsers(result);
    setCurrentPage(1);
  }, [searchTerm, activeTab, users]);

  // Calculate stats from actual user data
  const stats = {
    total: users.length,
    checkedIn: users.filter(user => user.status === 'checked-in').length,
    checkedOut: users.filter(user => user.status === 'checked-out').length,
    usingEquipment: users.filter(user => user.status === 'using').length,
    inactive: users.filter(user => user.status === 'inactive').length,
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleNavigation = (item: NavigationItem) => {
    setActiveNavItem(item.id);
    navigate(item.path);
  };
  
  const handleLogout = () => {
    setIsLoggingOut(true);
    
    // ============================================
    // 🔌 API CALL: Logout user session
    // ============================================
    // TODO: Add logout API call here
    // await fetch('/api/auth/logout', { method: 'POST' });
    
    setTimeout(() => {
      setIsLoggingOut(false);
      navigate("/");
    }, 1500);
  };

  // ============================================
  // 🔌 API CALL: Update user status
  // ============================================
  const handleStatusChange = async (userId: string) => {
    try {
      // TODO: Replace with actual API endpoint
      // const response = await fetch(`/api/users/${userId}/status`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus })
      // });
      // if (!response.ok) throw new Error('Failed to update status');
      // const updatedUser = await response.json();
      
      // Refresh users list after update
      // setUsers(prevUsers => prevUsers.map(u => u.id === userId ? updatedUser : u));
      
      console.log('Status change for user:', userId);
    } catch (err) {
      console.error('Error updating user status:', err);
    }
  };

  // ============================================
  // 🔌 API CALL: View user details
  // ============================================
  const handleViewUser = async (userId: string) => {
    try {
      // TODO: Replace with actual API endpoint
      // const response = await fetch(`/api/users/${userId}`);
      // if (!response.ok) throw new Error('Failed to fetch user details');
      // const userDetails = await response.json();
      
      // Navigate to user detail page or open modal
      navigate(`/users/${userId}`);
    } catch (err) {
      console.error('Error fetching user details:', err);
    }
  };

  // ============================================
  // 🔌 API CALL: Edit user information
  // ============================================
  const handleEditUser = async (userId: string) => {
    try {
      // TODO: Navigate to edit page or open edit modal
      navigate(`/users/${userId}/edit`);
    } catch (err) {
      console.error('Error navigating to edit user:', err);
    }
  };

  // Render status with icons
  const renderStatus = (status: string) => {
    const statusConfig = {
      'checked-in': { text: 'Checked In', icon: '✅' },
      'checked-out': { text: 'Checked Out', icon: '🔴' },
      'using': { text: 'Using Equipment', icon: '🔄' },
      'inactive': { text: 'Inactive', icon: '⚪' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { text: status, icon: '❓' };
    
    return (
      <span className={`status ${status}`}>
        <span className="status-icon">{config.icon}</span> {config.text}
      </span>
    );
  };

  return (
    <div className="dashboard-containerr">
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

        {/* Navigation Items */}
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

        {/* Admin Info & Logout */}
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
        <div className="content">
          {/* Page Header */}
          <div className="page-header">
            <h1><span className="header-icon">👥</span> Users</h1>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search users by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button>🔍</button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="number">{stats.total}</div>
                <div className="label">Total Users</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="number">{stats.checkedIn}</div>
                <div className="label">Checked In</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔴</div>
              <div className="stat-content">
                <div className="number">{stats.checkedOut}</div>
                <div className="label">Checked Out</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔄</div>
              <div className="stat-content">
                <div className="number">{stats.usingEquipment}</div>
                <div className="label">Using Equipment</div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="tabs">
            <div 
              className={`tab-button ${activeTab === 'all' ? 'active' : ''}`} 
              onClick={() => setActiveTab('all')}
            >
              <span className="tab-icon">📋</span> All ({stats.total})
            </div>
            <div 
              className={`tab-button ${activeTab === 'checked-in' ? 'active' : ''}`} 
              onClick={() => setActiveTab('checked-in')}
            >
              <span className="tab-icon">✅</span> Checked In ({stats.checkedIn})
            </div>
            <div 
              className={`tab-button ${activeTab === 'checked-out' ? 'active' : ''}`} 
              onClick={() => setActiveTab('checked-out')}
            >
              <span className="tab-icon">🔴</span> Checked Out ({stats.checkedOut})
            </div>
            <div 
              className={`tab-button ${activeTab === 'using' ? 'active' : ''}`} 
              onClick={() => setActiveTab('using')}
            >
              <span className="tab-icon">🔄</span> Using Equipment ({stats.usingEquipment})
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <p>Loading users...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="error-state">
              <p>⚠️ {error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {/* Users Table */}
          {!loading && !error && (
            <>
              <div className="user-table">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>ID</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Equipment</th>
                      <th>Last Activity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.length > 0 ? (
                      currentUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar">{user.avatar}</div>
                              <div>
                                <div>{user.name}</div>
                                <div className="user-email">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>{user.id}</td>
                          <td>{user.department}</td>
                          <td>{renderStatus(user.status)}</td>
                          <td>
                            {user.equipment.length > 0 
                              ? user.equipment.map((eq, idx) => (
                                  <span key={idx} className="equipment-tag">{eq}</span>
                                ))
                              : '-'
                            }
                          </td>
                          <td>{user.lastActivity}</td>
                          <td className="actions">
                            <button 
                              onClick={() => handleViewUser(user.id)}
                              title="View User"
                            >
                              👁️
                            </button>
                            <button 
                              onClick={() => handleEditUser(user.id)}
                              title="Edit User"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => handleStatusChange(user.id)}
                              title="Change Status"
                            >
                              🔄
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (

                    //   <tr>
                    //   <td colSpan={7} className="no-results" style={{ textAlign: 'center', padding: '40px' }}>
                    //     <div className="no-data-icon">📭</div>
                    //     <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '10px' }}>No users found matching your criteria</div>
                    //     <div className="no-data-subtext" style={{ fontSize: '14px', color: '#888', marginTop: '5px' }}>
                    //       No users available. Add users to get started.
                    //     </div>
                    //   </td>
                    // </tr>

                      <tr>
                        <td colSpan={7} className="no-results">
                          {searchTerm || activeTab !== 'all' 
                            ? 'No users found matching your criteria' 
                            : 'No users available. Add users to get started.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredUsers.length > usersPerPage && (
                <div className="pagination">
                  <button 
                    className="pagination-button pagination-nav" 
                    onClick={() => paginate(currentPage - 1)} 
                    disabled={currentPage === 1}
                  >
                    «
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => paginate(i + 1)} 
                      className={`pagination-button ${currentPage === i + 1 ? 'pagination-active' : ''}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    className="pagination-button pagination-nav" 
                    onClick={() => paginate(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                  >
                    »
                  </button>
                </div>
              )}
            </>
          )}
        </div>

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

export default UsersPage;