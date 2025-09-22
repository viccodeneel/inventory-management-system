import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, XCircle, Clock, User, Mail, Phone, Building, MessageSquare, Calendar, Pause, Ban, Filter, Search,
  Home, Package, Users, ClipboardCheck, FileText, Wrench, Settings, UserCheck, LogOut, Menu, X
} from 'lucide-react';
import './Main.css';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  emoji: string;
  path: string;
}

const Maintenance = () => {
  const [activeTab, setActiveTab] = useState('inProgress');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [currentView, setCurrentView] = useState('main');
    const [activeNavItem, setActiveNavItem] = useState('main');

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
  
  // Demo data for equipment being repaired
  const inProgressItems = [
    { id: 'DR-2024-001', name: 'DJI Mavic 3 Pro', issue: 'Camera stabilization failure', startDate: '2025-03-01', estimatedCompletion: '2025-03-15', technician: 'Alex Rivera', priority: 'High' },
    { id: 'DR-2024-002', name: 'Autel EVO II', issue: 'Battery charging issue', startDate: '2025-03-05', estimatedCompletion: '2025-03-12', technician: 'Maria Chen', priority: 'Medium' },
    { id: 'DR-2024-003', name: 'Skydio 2+', issue: 'Propeller replacement', startDate: '2025-03-07', estimatedCompletion: '2025-03-10', technician: 'James Wilson', priority: 'Low' },
    { id: '20240312-XJ554', name: 'DJI Matrice 300 RTK', issue: 'Sensor calibration needed', startDate: '2025-03-09', estimatedCompletion: '2025-03-14', technician: 'Alex Rivera', priority: 'Critical' },
    { id: 'DR-2024-005', name: 'Autel Dragonfish', issue: 'Flight controller malfunction', startDate: '2025-03-08', estimatedCompletion: '2025-03-20', technician: 'Sarah Johnson', priority: 'High' },
  ];
  
  // Demo data for repaired equipment
  const completedItems = [
    { id: 'DR-2024-006', name: 'DJI Phantom 4 Pro', issue: 'GPS module replacement', startDate: '2025-02-15', completionDate: '2025-02-28', technician: 'James Wilson', notes: 'Replaced with new module, all systems functional' },
    { id: 'DR-2024-007', name: 'Parrot Anafi', issue: 'Camera lens crack', startDate: '2025-02-20', completionDate: '2025-02-25', technician: 'Maria Chen', notes: 'Replaced lens and recalibrated' },
    { id: 'DR-2024-008', name: 'DJI Mini 3 Pro', issue: 'Controller connection issues', startDate: '2025-02-22', completionDate: '2025-03-01', technician: 'Alex Rivera', notes: 'Firmware updated, connection stable' },
    { id: 'DR-2024-009', name: 'Skydio X10', issue: 'Power board failure', startDate: '2025-02-10', completionDate: '2025-03-05', technician: 'Sarah Johnson', notes: 'Board replaced and tested for 24 hours' },
    { id: 'DR-2024-010', name: 'DJI Inspire 3', issue: 'Gimbal calibration', startDate: '2025-02-28', completionDate: '2025-03-07', technician: 'James Wilson', notes: 'Calibrated and tested in field conditions' },
    { id: 'DR-2024-011', name: 'Autel EVO Lite+', issue: 'Software update failure', startDate: '2025-03-01', completionDate: '2025-03-08', technician: 'Alex Rivera', notes: 'Reset firmware and successfully updated' },
  ];
  
  // Status badge component with appropriate colors
  const PriorityBadge = ({ priority }: { priority: 'Critical' | 'High' | 'Medium' | 'Low' }): React.ReactElement => {
    const getClass = () => {
      switch(priority) {
        case 'Critical': return 'badge-critical';
        case 'High': return 'badge-high';
        case 'Medium': return 'badge-medium';
        case 'Low': return 'badge-low';
        default: return 'badge-medium';
      }
    };
    
    return <span className={`status-badge ${getClass()}`}>{priority}</span>;
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

    <div className="maintenance-container">
      <div className="maintenance-header">
        <h1>🔧 Maintenance Management</h1>
        <div className="header-actions">
          <button className="btn-primary">
            <i className="fas fa-plus"></i> Schedule Maintenance
          </button>
          <button className="btn-outline">
            <i className="fas fa-download"></i> Export Report
          </button>
        </div>
      </div>
      
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon critical">
            <i className="fas fa-tools">💾</i>
          </div>
          <div className="stat-content">
            <h3>In Progress</h3>
            <p className="stat-value">{inProgressItems.length}</p>
            <p className="stat-change">+2 from last week</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon success">
            <i className="fas fa-check-circle">✅</i>
          </div>
          <div className="stat-content">
            <h3>Completed</h3>
            <p className="stat-value">{completedItems.length}</p>
            <p className="stat-change">+4 from last week</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon warning">
            <i className="fas fa-clock">⏳</i>
          </div>
          <div className="stat-content">
            <h3>Average Time</h3>
            <p className="stat-value">3.2 days</p>
            <p className="stat-change negative">+0.5 days from last week</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon info">
            <i className="fas fa-calendar-check">📅</i>
          </div>
          <div className="stat-content">
            <h3>Scheduled</h3>
            <p className="stat-value">8</p>
            <p className="stat-change">+2 from last week</p>
          </div>
        </div>
      </div>
      
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'inProgress' ? 'active' : ''}`} 
            onClick={() => setActiveTab('inProgress')}
          >
            <i className="fas fa-spinner fa-spin tab-icon"></i> In Progress ({inProgressItems.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`} 
            onClick={() => setActiveTab('completed')}
          >
            <i className="fas fa-check-circle tab-icon"></i> Completed ({completedItems.length})
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'inProgress' ? (
            <div className="table-container">
              <table className="maintenance-table">
                <thead>
                  <tr>
                    <th><i className="th-icon fas fa-hashtag"></i>#️⃣ ID</th>
                    <th><i className="th-icon fas fa-drone"></i>🚁 Equipment</th>
                    <th><i className="th-icon fas fa-exclamation-triangle"></i>⚠️ Issue</th>
                    <th><i className="th-icon fas fa-calendar-day"></i>📅 Start Date</th>
                    <th><i className="th-icon fas fa-calendar-check"></i>⏳ Est. Completion</th>
                    <th><i className="th-icon fas fa-user-cog"></i>🧑‍🔧 Technician</th>
                    <th><i className="th-icon fas fa-flag"></i>🚦 Priority</th>
                    <th><i className="th-icon fas fa-cogs"></i>⚙️ Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inProgressItems.map(item => (
                    <tr key={item.id} className={item.id === '20240312-XJ554' ? 'highlight-row' : ''}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.issue}</td>
                      <td>{item.startDate}</td>
                      <td>{item.estimatedCompletion}</td>
                      <td>{item.technician}</td>
                      <td><PriorityBadge priority={item.priority as 'Critical' | 'High' | 'Medium' | 'Low'} /></td>
                      <td>
                        <div className="actions">
                          <button className="action-btn edit-btn" title="Edit">
                            <i className="fas fa-edit"> ✏️ </i>
                          </button>
                          <button className="action-btn complete-btn" title="Mark as Complete">
                            <i className="fas fa-check"> ✔️ </i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-container">
              <table className="maintenance-table">
                <thead>
                  <tr>
                    <th><i className="th-icon fas fa-hashtag"></i>#️⃣ ID</th>
                    <th><i className="th-icon fas fa-drone"></i>🚁 Equipment</th>
                    <th><i className="th-icon fas fa-exclamation-triangle"></i>⚠️ Issue</th>
                    <th><i className="th-icon fas fa-calendar-day"></i>📅 Start Date</th>
                    <th><i className="th-icon fas fa-calendar-check"></i>✅ Completion Date</th>
                    <th><i className="th-icon fas fa-user-cog"></i>🧑‍🔧 Technician</th>
                    <th><i className="th-icon fas fa-clipboard-list"></i>📄 Notes</th>
                    <th><i className="th-icon fas fa-cogs"></i>⚙️ Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {completedItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.issue}</td>
                      <td>{item.startDate}</td>
                      <td>{item.completionDate}</td>
                      <td>{item.technician}</td>
                      <td className="notes-cell">{item.notes}</td>
                      <td>
                        <div className="actions">
                          <button className="view-btn action-btn" title="View Details">
                            <i className="fas fa-eye"> 👁️ </i>
                          </button>
                          <button className="action-btn report-btn" title="Generate Report">
                            <i className="fas fa-file-alt"> ⬇️ </i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

export default Maintenance;