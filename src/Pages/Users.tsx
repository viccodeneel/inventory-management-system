import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, XCircle, Clock, User, Mail, Phone, Building, MessageSquare, Calendar, Pause, Ban, Filter, Search,
  Home, Package, Users as UsersIcon, ClipboardCheck, FileText, Wrench, Settings, UserCheck, LogOut, Menu, X
} from 'lucide-react';
import './Users.css';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  emoji: string;
  path: string;
}

const Users = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeNavItem, setActiveNavItem] = useState('users');
    const [currentView, setCurrentView] = useState('users');


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

  const handleNavigation = (item: NavigationItem) => {
  setActiveNavItem(item.id);
  setCurrentView(item.id);
  navigate(item.path);  // <-- this makes it go to the correct route
};
  
  const handleLogout = () => {
  setIsLoggingOut(true);

  setTimeout(() => {
    setIsLoggingOut(false);
    navigate("/");  // ✅ redirect to login page after logout
  }, 1500);
};

  // Sample user data
  const initialUsers = [
    {
      id: 'USR-2024-001',
      name: 'John Doe',
      email: 'john.doe@sokoaerial.com',
      department: 'Field Operations',
      status: 'checked-in',
      equipment: ['Drone DJI-X55', 'Battery Pack B12'],
      lastActivity: 'Today, 10:15 AM',
      avatar: 'JD'
    },
    {
      id: 'USR-2024-015',
      name: 'Alice Smith',
      email: 'alice.smith@sokoaerial.com',
      department: 'Drone Pilot',
      status: 'using',
      equipment: ['Drone XJ-554', 'Camera Kit C45', 'Battery Pack B10', 'Transmitter T22'],
      lastActivity: 'Today, 09:24 AM',
      avatar: 'AS'
    },
    {
      id: 'USR-2024-021',
      name: 'Michael Johnson',
      email: 'michael.johnson@sokoaerial.com',
      department: 'Technician',
      status: 'checked-out',
      equipment: ['Tool Kit T100', 'Battery Pack B20'],
      lastActivity: 'Yesterday, 5:30 PM',
      avatar: 'MJ'
    },
    {
      id: 'USR-2024-034',
      name: 'Emily Davis',
      email: 'emily.davis@sokoaerial.com',
      department: 'Field Operations',
      status: 'inactive',
      equipment: [],
      lastActivity: 'Last week',
      avatar: 'ED'
    },
    {
      id: 'USR-2024-045',
      name: 'David Wilson',
      email: 'david.wilson@sokoaerial.com',
      department: 'Drone Engineer',
      status: 'using',
      equipment: ['Drone Model Z', 'Battery Pack B30'],
      lastActivity: 'Today, 2:45 PM',
      avatar: 'DW'
    },
    {
      id: 'USR-2024-056',
      name: 'Sarah Brown',
      email: 'sarah.brown@sokoaerial.com',
      department: 'Quality Assurance',
      status: 'checked-in',
      equipment: ['Inspection Kit I-99'],
      lastActivity: 'Today, 11:10 AM',
      avatar: 'SB'
    },
    {
      id: 'USR-2024-062',
      name: 'James Anderson',
      email: 'james.anderson@sokoaerial.com',
      department: 'Field Operations',
      status: 'using',
      equipment: ['Drone Mavic-3', 'Battery Pack B15'],
      lastActivity: 'Today, 1:30 PM',
      avatar: 'JA'
    },
    {
      id: 'USR-2024-073',
      name: 'Olivia Martinez',
      email: 'olivia.martinez@sokoaerial.com',
      department: 'Logistics',
      status: 'checked-in',
      equipment: [],
      lastActivity: 'Today, 8:50 AM',
      avatar: 'OM'
    },
    {
      id: 'USR-2024-084',
      name: 'Daniel Lee',
      email: 'daniel.lee@sokoaerial.com',
      department: 'Drone Technician',
      status: 'inactive',
      equipment: [],
      lastActivity: 'Last month',
      avatar: 'DL'
    },
    {
      id: 'USR-2024-095',
      name: 'Sophia Hernandez',
      email: 'sophia.hernandez@sokoaerial.com',
      department: 'Drone Engineer',
      status: 'checked-out',
      equipment: ['Repair Kit R-55'],
      lastActivity: 'Yesterday, 6:15 PM',
      avatar: 'SH'
    }
  ];
  
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [filteredUsers, setFilteredUsers] = useState(initialUsers);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 7;

  // Stats calculations
  const stats = {
    total: initialUsers.length,
    checkedIn: initialUsers.filter(user => user.status === 'checked-in').length,
    checkedOut: initialUsers.filter(user => user.status === 'checked-out').length,
    usingEquipment: initialUsers.filter(user => user.status === 'using').length,
    inactive: initialUsers.filter(user => user.status === 'inactive').length,
  };

  // Handle search and filtering
  useEffect(() => {
    let result = [...initialUsers];

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
  }, [searchTerm, activeTab]);

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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
            {/* Logo/Header */}
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
    
    
            {/* Admin Info */}
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
              
              {/* Logout Button */}
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
        <div className="page-header">
          <h1><span className="header-icon">👥</span> Users</h1>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button>🔍</button>
          </div>
        </div>

        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="number">{stats.total}</div>
            <div className="label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="number">{stats.checkedIn}</div>
            <div className="label">Checked In</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔴</div>
            <div className="number">{stats.checkedOut}</div>
            <div className="label">Checked Out</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔄</div>
            <div className="number">{stats.usingEquipment}</div>
            <div className="label">Using Equipment</div>
          </div>
        </div>

        <div className="tabs">
          <div className={`tab-button ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            <span className="tab-icon">📋</span> All ({stats.total})
          </div>
          <div className={`tab-button ${activeTab === 'checked-in' ? 'active' : ''}`} onClick={() => setActiveTab('checked-in')}>
            <span className="tab-icon">✅</span> Checked In ({stats.checkedIn})
          </div>
          <div className={`tab-button ${activeTab === 'checked-out' ? 'active' : ''}`} onClick={() => setActiveTab('checked-out')}>
            <span className="tab-icon">🔴</span> Checked Out ({stats.checkedOut})
          </div>
          <div className={`tab-button ${activeTab === 'using' ? 'active' : ''}`} onClick={() => setActiveTab('using')}>
            <span className="tab-icon">🔄</span> Using Equipment ({stats.usingEquipment})
          </div>
        </div>

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
                        {user.name}
                      </div>
                    </td>
                    <td>{user.id}</td>
                    <td>{user.department}</td>
                    <td>{renderStatus(user.status)}</td>
                    <td>{user.equipment.length > 0 ? user.equipment.join(', ') : '-'}</td>
                    <td>{user.lastActivity}</td>
                    <td className="actions">
                      <button title="View User">👁️</button>
                      <button title="Edit User">✏️</button>
                      <button title="Change Status">🔄</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredUsers.length > 0 && (
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

export default Users;