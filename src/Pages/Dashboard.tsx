import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle, XCircle, Clock, User, Mail, Phone, Building, MessageSquare, Calendar, Pause, Ban, Filter,
  Home, Package, Users, ClipboardCheck, FileText, Wrench, Settings, UserCheck, LogOut, Menu, X
} from 'lucide-react';
import './Dashboard.css';

interface DashboardIcon {
  color?: string;
}

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
  category: string;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  location: string;
  created_at: string;
  updated_at: string;
}

interface EquipmentStats {
  total: number;
  available: number;
  in_use: number;
  maintenance: number;
}

interface SystemAlert {
  id: number;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  created_at: string;
  status: 'pending' | 'in_progress' | 'resolved';
}

// SVG Icon Components
const BoxIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2" className="dashboard-icon">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const ListIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" className="dashboard-icon">
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
);

const UserIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2" className="dashboard-icon">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const MaintenanceIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#FF5722" strokeWidth="2" className="dashboard-icon">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M12 6v6l4 2"></path>
  </svg>
);

const AlertIcon: React.FC<DashboardIcon> = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className="dashboard-small-icon">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const MenuIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="dashboard-menu-icon">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="dashboard-menu-icon">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeNavItem, setActiveNavItem] = useState('dashboard');
  const [timeframe, setTimeframe] = useState<string>('Last 7 Days');
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Database state
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStats>({
    total: 0,
    available: 0,
    in_use: 0,
    maintenance: 0
  });
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  useEffect(() => {
    const handleResize = (): void => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
  fetchDashboardData();
}, []);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const fetchDashboardData = async () => {
  setLoading(true);
  try {
    const statsResponse = await fetch(`${API_BASE_URL}/equipment/stats`);
    const stats = await statsResponse.json();

    const alertsResponse = await fetch(`${API_BASE_URL}/equipment/alerts`);
    const alerts = await alertsResponse.json();

    setEquipmentStats(stats);
    setSystemAlerts(alerts);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  } finally {
    setLoading(false);
  }
};



  const handleNavigation = (item: NavigationItem) => {
    setActiveNavItem(item.id);
    setCurrentView(item.id);
    navigate(item.path);
  };

  const handleLogout = () => {
    setIsLoggingOut(true);

    setTimeout(() => {
      setIsLoggingOut(false);
      navigate("/");
    }, 1500);
  };

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getAlertBadgeStyle = (type: string) => {
    switch (type) {
      case 'critical':
        return 'dashboard-status-maintenance';
      case 'warning':
        return 'dashboard-status-in-use';
      case 'info':
        return 'dashboard-status-available';
      default:
        return 'dashboard-status-available';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <div className="loading-text">Loading Dashboard...</div>
          <div className="loading-subtext">Please wait while we fetch dashboard data</div>
        </div>
      </div>
    );
  }

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

      {isMobileMenuOpen && isMobile && (
        <div className="dashboard-mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <main className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="dashboard-main-content">
          <div className="dashboard-header">
            <h1><span className="dashboard-header-icon">📊</span> Dashboard</h1>
          </div>
          
          <div className="dashboard-stat-tabs">
            <div className="dashboard-stat-tab dashboard-blue-tab">
              <div className="dashboard-stat-content">
                <div className="dashboard-stat-title">TOTAL EQUIPMENT</div>
                <div className="dashboard-stat-value">
                  {loading ? '...' : equipmentStats.total}
                </div>
                <div className="dashboard-stat-change dashboard-positive">
                  {loading ? 'Loading...' : 'Real-time data'}
                </div>
              </div>
              <div className="dashboard-stat-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
              </div>
            </div>
            
            <div className="dashboard-stat-tab dashboard-green-tab">
              <div className="dashboard-stat-content">
                <div className="dashboard-stat-title">AVAILABLE</div>
                <div className="dashboard-stat-value">
                  {loading ? '...' : equipmentStats.available}
                </div>
                <div className="dashboard-stat-change dashboard-positive">
                  {loading ? 'Loading...' : 'Ready for use'}
                </div>
              </div>
              <div className="dashboard-stat-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none">
                  <path d="M4 21v-7m0 0V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9m-4 0H4m16 0v7"></path>
                  <path d="M12 12H4"></path>
                  <path d="M12 16H4"></path>
                  <path d="M12 8H4"></path>
                </svg>
              </div>
            </div>
            
            <div className="dashboard-yellow-tab dashboard-stat-tab">
              <div className="dashboard-stat-content">
                <div className="dashboard-stat-title">IN USE</div>
                <div className="dashboard-stat-value">
                  {loading ? '...' : equipmentStats.in_use}
                </div>
                <div className="dashboard-stat-change dashboard-negative">
                  {loading ? 'Loading...' : 'Currently deployed'}
                </div>
              </div>
              <div className="dashboard-stat-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="10" r="3"></circle>
                  <path d="M7 20.662V19c0-1.5 1.5-3 5-3s5 1.5 5 3v1.662"></path>
                </svg>
              </div>
            </div>
            
            <div className="dashboard-stat-tab dashboard-red-tab">
              <div className="dashboard-stat-content">
                <div className="dashboard-stat-title">MAINTENANCE</div>
                <div className="dashboard-stat-value">
                  {loading ? '...' : equipmentStats.maintenance}
                </div>
                <div className="dashboard-stat-change dashboard-positive">
                  {loading ? 'Loading...' : 'Needs attention'}
                </div>
              </div>
              <div className="dashboard-stat-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="dashboard-content-card">
            <div className="dashboard-card-header">
              <div className="dashboard-card-title">Inventory Activity</div>
              <select 
                className="dashboard-filter-dropdown"
                value={timeframe} 
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
              </select>
            </div>
            
            <div className="dashboard-chart-container">
              <div className="dashboard-chart-placeholder">
                <p>{loading ? 'Loading activity data...' : 'No activity data available'}</p>
              </div>
            </div>
          </div>
          
          <div className="dashboard-content-card">
            <div className="dashboard-card-header">
              <div className="dashboard-card-title">System Alerts</div>
            </div>
            
            <div className="dashboard-table-responsive">
              {loading ? (
                <div className="dashboard-loading">Loading alerts...</div>
              ) : systemAlerts.length === 0 ? (
                <div className="dashboard-empty-state">
                  <p>No system alerts at this time</p>
                </div>
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Alert Type</th>
                      <th>Description</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemAlerts.map((alert) => (
                      <tr key={alert.id}>
                        <td>
                          <span className={`dashboard-status-badge ${getAlertBadgeStyle(alert.type)}`}>
                            {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                          </span>
                        </td>
                        <td>{alert.description}</td>
                        <td>{formatTimeAgo(alert.created_at)}</td>
                        <td>{alert.status.charAt(0).toUpperCase() + alert.status.slice(1).replace('_', ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

export default Dashboard;