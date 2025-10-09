import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Package, Users, ClipboardCheck, FileText, Wrench, Settings, UserCheck, LogOut, Menu, X
} from 'lucide-react';
import './Reports.css';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  emoji: string;
  path: string;
}

const Reports = () => {
  const [activeTab, setActiveTab] = useState('monthly');
  const [dateRange, setDateRange] = useState('last30');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [currentView, setCurrentView] = useState('reports');
    const [activeNavItem, setActiveNavItem] = useState('reports');

    
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

  // Sample report data
  const monthlyReports = [
    { id: 'RPT-2025-001', name: 'Monthly Equipment Usage', date: '2025-03-01', type: 'System Generated', format: 'PDF', size: '2.4 MB' },
    { id: 'RPT-2025-002', name: 'Maintenance Summary', date: '2025-03-01', type: 'System Generated', format: 'XLSX', size: '1.8 MB' },
    { id: 'RPT-2025-003', name: 'Inventory Status Report', date: '2025-03-01', type: 'System Generated', format: 'PDF', size: '3.2 MB' },
    { id: 'RPT-2025-004', name: 'User Activity Log', date: '2025-03-01', type: 'System Generated', format: 'CSV', size: '4.5 MB' },
  ];

  const customReports = [
    { id: 'CRPT-2025-001', name: 'Q1 Drone Fleet Performance', date: '2025-03-10', type: 'Custom', format: 'PDF', size: '5.7 MB', creator: 'Admin Console' },
    { id: 'CRPT-2025-002', name: 'Maintenance Cost Analysis', date: '2025-03-08', type: 'Custom', format: 'XLSX', size: '3.2 MB', creator: 'Sarah Johnson' },
    { id: 'CRPT-2025-003', name: 'Equipment Utilization by Team', date: '2025-03-05', type: 'Custom', format: 'PDF', size: '4.1 MB', creator: 'James Wilson' },
  ];

  // Sample analytics data
  const analyticsData = {
    equipmentUsage: [
      { category: 'DJI Drones', percentage: 45 },
      { category: 'Autel Drones', percentage: 28 },
      { category: 'Skydio Drones', percentage: 17 },
      { category: 'Other Equipment', percentage: 10 },
    ],
    maintenanceMetrics: {
      averageRepairTime: '3.2 days',
      mostCommonIssue: 'Battery charging problems',
      repairSuccessRate: '94%',
      scheduledMaintenances: 8
    }
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

      <div className="reports-container">
        <div className="reports-header">
          <h1>📝 Reports & Analytics</h1>
          <div className="header-actions">
            <button className="btn-primary">
              <span>➕</span> Create New Report
            </button>
            <button className="btn-outline">
              <span>⚙️</span> Report Settings
            </button>
          </div>
        </div>
        
        <div className="reports-summary-cards">
          <div className="summary-card">
            <div className="card-icon document-icon">
              <span>📄</span>
            </div>
            <div className="card-content">
              <h3>Total Reports</h3>
              <p className="card-value">42</p>
              <p className="card-subtext">Last generated: Today, 9:45 AM</p>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="card-icon download-icon">
              <span>⬇️</span>
            </div>
            <div className="card-content">
              <h3>Downloads</h3>
              <p className="card-value">124</p>
              <p className="card-subtext">This month</p>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="card-icon schedule-icon">
              <span>📅</span>
            </div>
            <div className="card-content">
              <h3>Scheduled</h3>
              <p className="card-value">8</p>
              <p className="card-subtext">Next: Inventory Status (Tomorrow)</p>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="card-icon storage-icon">
              <span>💾</span>
            </div>
            <div className="card-content">
              <h3>Storage Used</h3>
              <p className="card-value">256 MB</p>
              <p className="card-subtext">25% of allocated space</p>
            </div>
          </div>
        </div>
        
        <div className="reports-main-content">
          <div className="reports-section">
            <div className="section-header">
              <h2>Available Reports</h2>
              <div className="section-controls">
                <div className="tabs">
                  <button 
                    className={`tab-button ${activeTab === 'monthly' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('monthly')}
                  >
                    <span>📆</span> Monthly
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'custom' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('custom')}
                  >
                    <span>🔧</span> Custom
                  </button>
                </div>
                
                <div className="date-filter">
                  <select 
                    value={dateRange} 
                    onChange={(e) => setDateRange(e.target.value)}
                    className="date-select"
                  >
                    <option value="last30">Last 30 Days</option>
                    <option value="last60">Last 60 Days</option>
                    <option value="last90">Last 90 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="reports-table-container">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th><span className="th-icon">#️⃣</span> ID</th>
                    <th><span className="th-icon">📄</span> Report Name</th>
                    <th><span className="th-icon">📅</span> Date</th>
                    <th><span className="th-icon">🏷️</span> Type</th>
                    {activeTab === 'custom' && <th><span className="th-icon">👤</span> Created By</th>}
                    <th><span className="th-icon">📂</span> Format</th>
                    <th><span className="th-icon">📊</span> Size</th>
                    <th><span className="th-icon">⚙️</span> Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTab === 'monthly' ? 
                    monthlyReports.map(report => (
                      <tr key={report.id}>
                        <td>{report.id}</td>
                        <td>{report.name}</td>
                        <td>{report.date}</td>
                        <td><span className="system-tag tag">{report.type}</span></td>
                        <td><span className="format-badge">{report.format}</span></td>
                        <td>{report.size}</td>
                        <td>
                          <div className="actions">
                            <button className="view-btn action-btn" title="View Report">
                              <span>👁️</span>
                            </button>
                            <button className="action-btn download-btn" title="Download">
                              <span>⬇️</span>
                            </button>
                            <button className="action-btn share-btn" title="Share">
                              <span>🔗</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : 
                    customReports.map(report => (
                      <tr key={report.id}>
                        <td>{report.id}</td>
                        <td>{report.name}</td>
                        <td>{report.date}</td>
                        <td><span className="custom-tag tag">{report.type}</span></td>
                        <td>{report.creator}</td>
                        <td><span className="format-badge">{report.format}</span></td>
                        <td>{report.size}</td>
                        <td>
                          <div className="actions">
                            <button className="view-btn action-btn" title="View Report">
                              <span>👁️</span>
                            </button>
                            <button className="action-btn download-btn" title="Download">
                              <span>⬇️</span>
                            </button>
                            <button className="action-btn edit-btn" title="Edit">
                              <span>✏️</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="analytics-section">
            <div className="section-header">
              <h2>Key Analytics</h2>
              <button className="btn-text">
                <span>🔍</span> View Full Dashboard
              </button>
            </div>
            
            <div className="analytics-cards">
              <div className="analytics-card usage-chart">
                <h3>Equipment Usage Distribution</h3>
                <div className="chart-container">
                  {analyticsData.equipmentUsage.map(item => (
                    <div key={item.category} className="chart-item">
                      <div className="chart-label">{item.category}</div>
                      <div className="chart-bar-container">
                        <div 
                          className="chart-bar" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                        <span className="chart-value">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="analytics-card maintenance-metrics">
                <h3>Maintenance Metrics</h3>
                <div className="metrics-grid">
                  <div className="metric">
                    <div className="metric-label">Avg. Repair Time</div>
                    <div className="metric-value">{analyticsData.maintenanceMetrics.averageRepairTime}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Common Issue</div>
                    <div className="metric-value">{analyticsData.maintenanceMetrics.mostCommonIssue}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Success Rate</div>
                    <div className="metric-value">{analyticsData.maintenanceMetrics.repairSuccessRate}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Scheduled</div>
                    <div className="metric-value">{analyticsData.maintenanceMetrics.scheduledMaintenances}</div>
                  </div>
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

export default Reports;