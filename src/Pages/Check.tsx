import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CheckCircle, XCircle, Clock, User, Mail, Phone, Building, MessageSquare, Calendar, Pause, Ban, Filter, Search,
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

const Check = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeNavItem, setActiveNavItem] = useState('check');
    const [currentView, setCurrentView] = useState('check');

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
  
  // Sample data
  const [equipmentList, setEquipmentList] = useState([
    { id: "DRN-2024-005", name: "Camera Drone XR-6", status: "Checked Out", user: "Alex Johnson", checkTime: "08:30 AM", returnTime: "" },
    { id: "DRN-2024-012", name: "Survey Drone Pro", status: "Checked Out", user: "Morgan Chen", checkTime: "09:15 AM", returnTime: "" },
    { id: "DRN-2024-008", name: "Mapping Drone M2", status: "Checked Out", user: "Taylor Smith", checkTime: "07:45 AM", returnTime: "" },
    { id: "BAT-2024-023", name: "Battery Pack A-12", status: "Available", user: "", checkTime: "", returnTime: "Yesterday, 5:45 PM" },
    { id: "SEN-2024-017", name: "Thermal Sensor T3", status: "Available", user: "", checkTime: "", returnTime: "Yesterday, 6:20 PM" }
  ]);
  
  const [usersList, setUsersList] = useState([
    { id: 1, name: "Alex Johnson", role: "Field Technician", status: "Active", lastActive: "Now", equipment: ["DRN-2024-005"] },
    { id: 2, name: "Morgan Chen", role: "Pilot", status: "Active", lastActive: "5 min ago", equipment: ["DRN-2024-012"] },
    { id: 3, name: "Taylor Smith", role: "Survey Lead", status: "Active", lastActive: "15 min ago", equipment: ["DRN-2024-008"] },
    { id: 4, name: "Jamie Wilson", role: "Data Analyst", status: "Inactive", lastActive: "Yesterday", equipment: [] },
    { id: 5, name: "Casey Brown", role: "Maintenance Lead", status: "Inactive", lastActive: "2 days ago", equipment: [] }
  ]);
  
  const [activeTab, setActiveTab] = useState("equipment");
  const [searchInput, setSearchInput] = useState("");
  const [filteredEquipment, setFilteredEquipment] = useState(equipmentList);
  const [filteredUsers, setFilteredUsers] = useState(usersList);

  // Handle search functionality
  useEffect(() => {
    if (activeTab === "equipment") {
      setFilteredEquipment(
        equipmentList.filter(item => 
          item.id.toLowerCase().includes(searchInput.toLowerCase()) || 
          item.name.toLowerCase().includes(searchInput.toLowerCase()) ||
          (item.user && item.user.toLowerCase().includes(searchInput.toLowerCase()))
        )
      );
    } else {
      setFilteredUsers(
        usersList.filter(user => 
          user.name.toLowerCase().includes(searchInput.toLowerCase()) || 
          user.role.toLowerCase().includes(searchInput.toLowerCase()) ||
          user.equipment.some(eq => eq.toLowerCase().includes(searchInput.toLowerCase()))
        )
      );
    }
  }, [searchInput, activeTab, equipmentList, usersList]);

  // Handle check in/out functionality
  const handleEquipmentAction = (id: string) => {
    setEquipmentList(prevList => 
      prevList.map(item => {
        if (item.id === id) {
          if (item.status === "Available") {
            // Mock check out functionality
            return {
              ...item, 
              status: "Checked Out", 
              user: "Current User", 
              checkTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              returnTime: ""
            };
          } else {
            // Mock check in functionality
            return {
              ...item, 
              status: "Available", 
              user: "", 
              checkTime: "",
              returnTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
          }
        }
        return item;
      })
    );
  };

  const handleUserAction = (id: number): void => {
    setUsersList(prevList => 
      prevList.map(user => {
        if (user.id === id) {
          return {
            ...user,
            status: user.status === "Active" ? "Inactive" : "Active",
            lastActive: user.status === "Active" ? "Just now" : "Now"
          };
        }
        return user;
      })
    );
  };

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

  // Check if current location matches a specific path
  const isActive = (path: string): boolean => {
    return location.pathname === path;
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
      
      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Header */}
        <header className="header">
        </header>
        
        
        {/* Check In/Out Content */}
        <div className="page-content">
          <div className="page-header">
            <h2>✓ Check In/Out</h2>
            <p>Manage equipment and user check-ins and check-outs</p>
          </div>
          
          {/* Tabs and Content */}
          <div className="card">
            <div className="tab-navigation">
              <button 
                className={`tab-button ${activeTab === 'equipment' ? 'active' : ''}`}
                onClick={() => setActiveTab('equipment')}
              >
                Equipment
              </button>
              <button 
                className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                Users
              </button>
            </div>
            
            {/* Search and Actions Bar */}
            <div className="search-actions-bar">
              <div className="search-box">
                <i className="search-icon"></i>
                <input
                  type="text"
                  placeholder={activeTab === 'equipment' ? "Search by equipment ID or name" : "Search by user name or role"}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              
              <div className="action-controls">
                <button className="check-in-button">
                  {activeTab === 'equipment' ? 'Check In Equipment' : 'Check In User'}
                </button>
                <button className="check-out-button">
                  {activeTab === 'equipment' ? 'Check Out Equipment' : 'Check Out User'}
                </button>
              </div>
            </div>
            
            {/* Equipment Tab Content */}
            {activeTab === 'equipment' && (
              <div className="tab-content">
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Equipment Name</th>
                        <th>Status</th>
                        <th>Assigned To</th>
                        <th>Check Time</th>
                        <th>Return Time</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEquipment.map(item => (
                        <tr key={item.id}>
                          <td className="id-cell">{item.id}</td>
                          <td>{item.name}</td>
                          <td>
                            <span className={`status-badge ${item.status === 'Available' ? 'status-available' : 'status-checked-out'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td>{item.user || "—"}</td>
                          <td className="time-cell">{item.checkTime || "—"}</td>
                          <td className="time-cell">{item.returnTime || "—"}</td>
                          <td>
                            <button 
                              className={`action-button ${item.status === 'Checked Out' ? 'check-in' : 'check-out'}`}
                              onClick={() => handleEquipmentAction(item.id)}
                            >
                              {item.status === 'Checked Out' ? 'Check In' : 'Check Out'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Users Tab Content */}
            {activeTab === 'users' && (
              <div className="tab-content">
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Active</th>
                        <th>Equipment</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td>{user.role}</td>
                          <td>
                            <span className={`status-badge ${user.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="time-cell">{user.lastActive}</td>
                          <td>
                            {user.equipment.length > 0 ? (
                              <div className="equipment-tags">
                                {user.equipment.map(eq => (
                                  <span key={eq} className="equipment-tag">
                                    {eq}
                                  </span>
                                ))}
                              </div>
                            ) : "—"}
                          </td>
                          <td>
                            <button 
                              className={`action-button ${user.status === 'Active' ? 'check-out' : 'check-in'}`}
                              onClick={() => handleUserAction(user.id)}
                            >
                              {user.status === 'Active' ? 'Check Out' : 'Check In'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          {/* Activity Log */}
          <div className="card activity-log">
            <div className="activity-header">
              <h3>Recent Activity</h3>
              <button className="view-all-button">View All</button>
            </div>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon check-in-icon"></div>
                <div className="activity-details">
                  <p className="activity-description">
                    <span className="activity-type">Equipment Check In:</span> Alex Johnson returned <span className="equipment-id">DRN-2024-005</span>
                  </p>
                  <p className="activity-time">10 minutes ago</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon check-out-icon"></div>
                <div className="activity-details">
                  <p className="activity-description">
                    <span className="activity-type">Equipment Check Out:</span> Morgan Chen took <span className="equipment-id">DRN-2024-012</span>
                  </p>
                  <p className="activity-time">45 minutes ago</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon user-activity-icon"></div>
                <div className="activity-details">
                  <p className="activity-description">
                    <span className="activity-type">User Activity:</span> Taylor Smith checked in to the system
                  </p>
                  <p className="activity-time">2 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
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

export default Check;