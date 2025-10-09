import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Package, Users, ClipboardCheck, FileText, Wrench, Settings as UserCheck, LogOut, Menu, X
} from 'lucide-react';
import './Settings.css';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  emoji: string;
  path: string;
}

// Reusable icons
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2" className="settings-icon">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const Settings = () => {
  const navigate = useNavigate();
   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [currentView, setCurrentView] = useState('settings');
    const [activeNavItem, setActiveNavItem] = useState('settings');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [settingSections] = useState([
    { id: 1, title: 'General Settings', description: 'System name, timezone, date format, and language preferences' },
    { id: 2, title: 'User Permissions', description: 'Role management and access control settings' },
    { id: 3, title: 'Notification Settings', description: 'Email alerts, system notifications, and reminder preferences' },
    { id: 4, title: 'API Integration', description: 'API keys, webhooks, and third-party service connections' },
    { id: 5, title: 'System Backup', description: 'Automated backup schedule and data retention policies' },
    { id: 6, title: 'Appearance', description: 'Theme settings, dashboard layout, and display preferences' }
  ]);

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

  const handleEdit = (id: number) => {
    console.log(`Edit settings section ${id}`);
    // This would open the specific settings editor for the selected section
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
      
      <div className="main-content">
        <div className="header">
        <h1><span className="header-icon">⚙️</span> Settings</h1>
        <div className="search-box">
            <input
              type="text"
              placeholder="Search dashboard..."
              value=""
              onChange={(e) => {
                // Add searchTerm state before using setSearchTerm
// Move useState hook to component level
// Add searchTerm state before using it
console.log(e.target.value); // Temporary logging until search functionality is implemented
console.log(e.target.value); // Temporary logging until search functionality is implemented
              }}
            />
            <button>🔍</button>
          </div>
        </div>

        <div className="settings-container">
          {settingSections.map((section) => (
            <div className="settings-section" key={section.id}>
              <div className="settings-icon-wrapper">
                <SettingsIcon />
              </div>
              <div className="settings-content">
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </div>
              <button 
                className="edit-button"
                onClick={() => handleEdit(section.id)}
              >
                Edit
              </button>
            </div>
          ))}
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

export default Settings;