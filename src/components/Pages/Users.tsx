import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Package, Users, FileText, Wrench, Settings, UserCheck, LogOut, Menu, X
} from 'lucide-react';
import './Users.css';
import type { PendingRequest } from 'postgres';

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
  phone: string | null;
  department: string;
  requested_role: string;
  status: 'using' | 'inactive';
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

  // New states for approved, suspended, and blocked users
  const [approvedUsers, setApprovedUsers] = useState<PendingRequest[]>([]);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 7;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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

  // Fetch data for approved, suspended, and blocked users
  const fetchAllData = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching all data...");
      
      const [approved] = await Promise.all([
        fetch("http://localhost:5000/api/admin/approved").then(res => res.json())
      ]);

      console.log("📊 Data fetched:", {
        approved: approved.length
      });

      // Map approved, suspended, and blocked users to the User interface
      const mappedApprovedUsers: User[] = approved.map((user: PendingRequest) => ({
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        department: user.department || 'N/A',
        requested_role: user.requested_role || 'N/A',
        status: 'using' as 'using' | 'inactive',
        equipment: [], // Assuming equipment is not provided in the API response
        lastActivity: user.approved_at ? new Date(user.approved_at).toLocaleString() : new Date(user.created_at).toLocaleString(),
        avatar: user.name.charAt(0).toUpperCase()
      }));

      setApprovedUsers(approved);
      setUsers([...mappedApprovedUsers]);
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      setError("Failed to fetch user data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'all': return users;
      default: return users;
    }
  };

  // API CALL: Update user status
  const handleStatusChange = async (userId: string) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        throw new Error('User not found');
      }

      const newStatus = user.status === 'using' ? 'inactive' : 'using';

      const response = await fetch(`/api/admin/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Status update failed:', {
          status: response.status,
          statusText: response.statusText,
          responseText: text.slice(0, 500),
          headers: Object.fromEntries(response.headers.entries()),
        });
        throw new Error(`Failed to update user status: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', {
          contentType: contentType || 'none',
          responseText: text.slice(0, 500),
          headers: Object.fromEntries(response.headers.entries()),
        });
        throw new Error(`Received non-JSON response from server: Content-Type=${contentType || 'none'}`);
      }

      const updatedUser = await response.json();

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === userId
            ? {
                ...u,
                status: updatedUser.status,
                lastActivity: updatedUser.approved_at
                  ? new Date(updatedUser.approved_at).toLocaleString()
                  : u.lastActivity,
              }
            : u
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user status';
      setError(errorMessage);
      console.error('Error updating user status:', err);
    }
  };

  // API CALL: Edit user navigation
  const handleEditUser = (userId: string) => {
    navigate(`/admin/users/edit/${userId}`);
  };

  // API CALL: Logout user session
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Logout failed:', {
          status: response.status,
          statusText: response.statusText,
          responseText: text.slice(0, 500),
          headers: Object.fromEntries(response.headers.entries()),
        });
        throw new Error(`Failed to log out: ${response.status} ${response.statusText}`);
      }

      navigate('/');
    } catch (err) {
      console.error('Error logging out:', err);
      setError(err instanceof Error ? err.message : 'Failed to log out');
      setTimeout(() => {
        setIsLoggingOut(false);
        navigate('/');
      }, 1500);
    }
  };

  // Handle search and filtering
  useEffect(() => {
    let result = getCurrentData();

    // Filter by search term
    if (searchTerm) {
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(result);
    setCurrentPage(1);
  }, [searchTerm, activeTab, users]);

  // Calculate stats from actual user data
  const stats = {
    total: users.length,
    usingEquipment: users.filter((user) => user.status === 'using').length,
    inactive: users.filter((user) => user.status === 'inactive').length,
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

  // View user details in modal
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  // Render status with icons
  const renderStatus = (status: string) => {
    const statusConfig = {
      using: { text: 'Using Equipment', icon: '🔄' },
      inactive: { text: 'Inactive', icon: '⚪' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      text: status,
      icon: '❓',
    };

    return (
      <span className={`status ${status}`}>
        <span className="status-icon">{config.icon}</span> {config.text}
      </span>
    );
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

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
            <h1>
              <span className="header-icon">👥</span> Users
            </h1>
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
              <div className="stat-icon">🔄</div>
              <div className="stat-content">
                <div className="number">{stats.usingEquipment}</div>
                <div className="label">Using Equipment</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚪</div>
              <div className="stat-content">
                <div className="number">{stats.inactive}</div>
                <div className="label">Inactive</div>
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
              className={`tab-button ${activeTab === 'using' ? 'active' : ''}`}
              onClick={() => setActiveTab('using')}
            >
              <span className="tab-icon">🔄</span> Using Equipment ({stats.usingEquipment})
            </div>
            <div
              className={`tab-button ${activeTab === 'inactive' ? 'active' : ''}`}
              onClick={() => setActiveTab('inactive')}
            >
              <span className="tab-icon">⚪</span> Inactive ({stats.inactive})
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
                         
                          <td>{user.lastActivity}</td>
                          <td className="actions">
                            <button onClick={() => handleViewUser(user)} title="View User">
                              👁️
                            </button>

                            <button
                              onClick={() => handleStatusChange(user.id)}
                              title={user.status === 'using' ? 'Deactivate' : 'Activate'}
                            >
                              {user.status === 'using' ? '⛔' : '✅'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
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

        {/* User Details Modal */}
        {showModal && selectedUser && (
          <div className="moddal-ovverlay" onClick={() => setShowModal(false)}>
            <div className="moddal-coontent" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
              <div className="user-header">
                <div className="user-avatar large">{selectedUser.avatar}</div>
                <div>
                  <h2>{selectedUser.name}</h2>
                  <p>{selectedUser.email}</p>
                  <p>{selectedUser.department}</p>
                </div>
              </div>
              <div className="details-grid">
                <div>
                  <strong>ID:</strong> {selectedUser.id}
                </div>
                <div>
                  <strong>Phone:</strong> {selectedUser.phone || 'N/A'}
                </div>
                <div>
                  <strong>Role:</strong> {selectedUser.requested_role}
                </div>
                <div>
                  <strong>Status:</strong> {renderStatus(selectedUser.status)}
                </div>
                <div>
                  <strong>Last Activity:</strong> {selectedUser.lastActivity}
                </div>
               
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

export default UsersPage;