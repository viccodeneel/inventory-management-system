import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, XCircle, Clock, User, Mail, Building, MessageSquare, Calendar, Pause, Ban, Search,
  // Navigation Icons
  Home, Package, Users, ClipboardCheck, FileText, Wrench, Settings, UserCheck, LogOut, Menu, X
} from 'lucide-react';
import './requests.css';
import './Sidebar.css';

interface PendingRequest {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  requested_role?: string | null;
  admin_notes?: string | null;
  submitted_at: string;
  action_date?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'blocked';
  approved_by?: number | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  emoji: string;
  path: string;
}

const AdminDashboard = () => {
const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // 🔥 FIXED: Separate state for each category
  const [allRequests, setAllRequests] = useState<PendingRequest[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<PendingRequest[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<PendingRequest[]>([]);
  const [suspendedUsers, setSuspendedUsers] = useState<PendingRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<PendingRequest[]>([]);
  
  const [filteredRequests, setFilteredRequests] = useState<PendingRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [activeFilter, setActiveFilter] = useState<'pending' | 'approved' | 'rejected' | 'suspended' | 'blocked'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('requests');
   const [, setCurrentView] = useState('dashboard');
   const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  // Navigation items
  const navigationItems: NavigationItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, emoji: '📊', path: '/dashboard' },
    { id: 'inventory', label: 'Inventory', icon: Package, emoji: '📦', path: '/inventory' },
    { id: 'users', label: 'Users', icon: Users, emoji: '👥', path: '/users' },
    { id: 'checkinout', label: 'Check In/Out', icon: ClipboardCheck, emoji: '✓', path: '/check' },
    { id: 'reports', label: 'Reports', icon: FileText, emoji: '📝', path: '/reports' },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, emoji: '🔧', path: '/main' },
    { id: 'settings', label: 'Settings', icon: Settings, emoji: '⚙️', path: '/settings' },
    { id: 'requests', label: 'Requests', icon: UserCheck, emoji: '⚙️', path: '/requests' },
    { id: 'equipment_requests', label: 'Equipment Requests', icon: UserCheck, emoji: '⚙️', path: '/equipment_requests' },
  ];

  // 🔥 FIXED: Fetch from all endpoints
const fetchAllData = async () => {
  try {
    setLoading(true);
    console.log("🔄 Fetching all data...");
    
    const [pending, approved, rejected, suspended, blocked] = await Promise.all([
      fetch("http://localhost:5000/api/admin/requests").then(res => res.json()),
      fetch("http://localhost:5000/api/admin/approved").then(res => res.json()),
      fetch("http://localhost:5000/api/admin/rejected").then(res => res.json()),
      fetch("http://localhost:5000/api/admin/suspended").then(res => res.json()),
      fetch("http://localhost:5000/api/admin/blocked").then(res => res.json())
    ]);

    console.log("📊 Data fetched:", {
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      suspended: suspended.length,
      blocked: blocked.length
    });

    setAllRequests(pending);
    setApprovedUsers(approved);
    setRejectedUsers(rejected);
    setSuspendedUsers(suspended);
    setBlockedUsers(blocked);
  } catch (error) {
    console.error("❌ Error fetching data:", error);
  } finally {
    setLoading(false);
  }
};

  // 🔥 FIXED: Get current data based on active tab
  const getCurrentData = () => {
    switch (activeFilter) {
      case 'pending': return allRequests;
      case 'approved': return approvedUsers;
      case 'rejected': return rejectedUsers;
      case 'suspended': return suspendedUsers;
      case 'blocked': return blockedUsers;
      default: return allRequests;
    }
  };

  // Handle approve function
const handleApprove = async (requestId: number): Promise<void> => {
  setActionLoading(true);
  try {
    const adminNotes = prompt("Admin notes (optional):");
    
    // ❌ Check if user cancelled the prompt
    if (adminNotes === null) {
      console.log("User cancelled approval");
      return; // Exit early if cancelled
    }
    
    // Use the notes or default if empty string
    const notes = adminNotes.trim() || "Approved by admin";

    const response = await fetch(
      `http://localhost:5000/api/admin/approve-user/${requestId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: notes }),
      }
    );

    if (!response.ok) throw new Error("Failed to approve user");

    // 🔥 FIXED: Refetch all data
    await fetchAllData();
    setSelectedRequest(null);
    alert("✅ User approved successfully! Credentials sent via email.");
  } catch (error) {
    console.error("Error approving user:", error);
    alert("Error approving user. Please try again.");
  } finally {
    setActionLoading(false);
  }
};

// Handle reject function
const handleReject = async (requestId: number): Promise<void> => {
  setActionLoading(true);
  try {
    const rejectionReason = prompt("Reason for rejection:");
    
    // ❌ Check if user cancelled the prompt
    if (rejectionReason === null) {
      console.log("User cancelled rejection");
      return; // Exit early if cancelled
    }
    
    // Use the reason or default if empty string
    const reason = rejectionReason.trim() || "Rejected by admin";

    const response = await fetch(
      `http://localhost:5000/api/admin/reject-user/${requestId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: reason }),
      }
    );

    if (!response.ok) throw new Error("Failed to reject user");

    // 🔥 FIXED: Refetch all data
    await fetchAllData();
    setSelectedRequest(null);
    alert("🚫 User request rejected. Notification sent via email.");
  } catch (error) {
    console.error("Error rejecting user:", error);
    alert("Error rejecting user. Please try again.");
  } finally {
    setActionLoading(false);
  }
};

// Handle suspend function
const handleSuspend = async (requestId: number): Promise<void> => {
  setActionLoading(true);
  try {
    const suspensionReason = prompt("Reason for suspension:");
    
    // ❌ Check if user cancelled the prompt
    if (suspensionReason === null) {
      console.log("User cancelled suspension");
      return; // Exit early if cancelled
    }
    
    // Use the reason or default if empty string
    const reason = suspensionReason.trim() || "Suspended by admin";

    const response = await fetch(
      `http://localhost:5000/api/admin/suspend-user/${requestId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: reason }),
      }
    );

    if (!response.ok) throw new Error("Failed to suspend user");

    // 🔥 FIXED: Refetch all data
    await fetchAllData();
    setSelectedRequest(null);
    alert("⏸ User suspended successfully. Notification sent via email.");
  } catch (error) {
    console.error("Error suspending user:", error);
    alert("Error suspending user. Please try again.");
  } finally {
    setActionLoading(false);
  }
};

// Handle block function
const handleBlock = async (requestId: number): Promise<void> => {
  setActionLoading(true);
  try {
    const blockReason = prompt("Reason for blocking:");
    
    // ❌ Check if user cancelled the prompt
    if (blockReason === null) {
      console.log("User cancelled blocking");
      return; // Exit early if cancelled
    }
    
    // Use the reason or default if empty string
    const reason = blockReason.trim() || "Blocked by admin";

    const response = await fetch(
      `http://localhost:5000/api/admin/block-user/${requestId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: reason }),
      }
    );

    if (!response.ok) throw new Error("Failed to block user");

    // 🔥 FIXED: Refetch all data
    await fetchAllData();
    setSelectedRequest(null);
    alert("🚫 User blocked successfully. Notification sent via email.");
  } catch (error) {
    console.error("Error blocking user:", error);
    alert("Error blocking user. Please try again.");
  } finally {
    setActionLoading(false);
  }
};

  // 🔥 FIXED: Filter and search functions now work on current data
  const filterRequests = (status: string, search: string = '') => {
    let currentData = getCurrentData();
    
    if (search.trim()) {
      currentData = currentData.filter(request =>
        request.name.toLowerCase().includes(search.toLowerCase()) ||
        request.email.toLowerCase().includes(search.toLowerCase()) ||
        request.department?.toLowerCase().includes(search.toLowerCase())||
        request.requested_role?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setFilteredRequests(currentData);
  };

  const handleFilterChange = (status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'blocked') => {
    setActiveFilter(status);
    setSelectedRequest(null); // Clear selection when switching tabs
    filterRequests(status, searchTerm);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterRequests(activeFilter, term);
  };

  const getStatusConfig = (
    status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'blocked'
  ) => {
    const configs = {
      pending: { icon: Clock, color: 'warning', label: 'Pending' },
      approved: { icon: CheckCircle, color: 'success', label: 'Approved' },
      rejected: { icon: XCircle, color: 'danger', label: 'Rejected' },
      suspended: { icon: Pause, color: 'info', label: 'Suspended' },
      blocked: { icon: Ban, color: 'dark', label: 'Blocked' }
    };
    return configs[status] || configs.pending;
  };

  // 🔥 FIXED: Get accurate counts from separate arrays
  const getRequestCounts = () => {
    return {
      pending: allRequests.length,
      approved: approvedUsers.length,
      rejected: rejectedUsers.length,
      suspended: suspendedUsers.length,
      blocked: blockedUsers.length
    };
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

  // 🔥 FIXED: Use fetchAllData instead of fetchAllRequests
  useEffect(() => {
    fetchAllData();
  }, []);

  // 🔥 FIXED: Update filtering when data changes
  useEffect(() => {
    filterRequests(activeFilter, searchTerm);
  }, [allRequests, approvedUsers, rejectedUsers, suspendedUsers, blockedUsers, activeFilter, searchTerm]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <div className="loading-text">Loading pending requests...</div>
          <div className="loading-subtext">Please wait while we fetch pending request data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
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

      {/* Main Content Area */}
      <main className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Filter Tabs */}
        <div className="filter-tabs">
          {(['pending', 'approved', 'rejected', 'suspended', 'blocked'] as const).map((status) => {
            const config = getStatusConfig(status);
            const count = getRequestCounts()[status];
            return (
              <button
                key={status}
                className={`filter-tab ${activeFilter === status ? 'active' : ''}`}
                onClick={() => handleFilterChange(status)}
              >
                <config.icon className="tab-icon" />
                <span>{config.label}</span>
                <span className="tab-count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="search-container">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="empty-state">
            <Clock className="empty-icon" />
            <h3>No {getStatusConfig(activeFilter).label} Requests</h3>
            <p>No requests found for the current filter.</p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {/* Requests List */}
            <section className="requests-list">
              <h2>{getStatusConfig(activeFilter).label} Requests ({filteredRequests.length})</h2>
              
              <div className="requests-scroll-container">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`request-card ${selectedRequest?.id === request.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="request-info">
                      <div className="request-main">
                        <h3>{request.name}</h3>
                        <span className={`status-badge ${request.status}`}>
                          {React.createElement(getStatusConfig(request.status).icon, { className: "status-icon" })}
                          {getStatusConfig(request.status).label}
                        </span>
                      </div>
                      <div className="request-meta">
                        <p><Mail className="meta-icon" /> {request.email}</p>
                        {request.department && <p><Building className="meta-icon" /> {request.department}</p>}
                        {request.requested_role && <p><User className="meta-icon" /> Role: {request.requested_role}</p>}
                        <p><Calendar className="meta-icon" /> {formatDate(request.submitted_at)}</p>
                        {request.action_date && <p><Calendar className="meta-icon" /> Action: {formatDate(request.action_date)}</p>}
                      </div>
                    </div>
                    {request.status === 'pending' && (
                      <div className="request-actions">
                        <button onClick={(e) => { e.stopPropagation(); handleApprove(request.id); }} disabled={actionLoading} className="btn approve">
                          <CheckCircle className="btn-icon" /> Approve
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleReject(request.id); }} disabled={actionLoading} className="btn reject">
                          <XCircle className="btn-icon" /> Reject
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleSuspend(request.id); }} disabled={actionLoading} className="btn suspend">
                          <Pause className="btn-icon" /> Suspend
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleBlock(request.id); }} disabled={actionLoading} className="btn block">
                          <Ban className="btn-icon" /> Block
                        </button>
                      </div>
                    )}

                    {/* Approve Action Buttons */}
                    {request.status === 'approved' && (
                      <div className="request-actions">
                        <button onClick={(e) => { e.stopPropagation(); handleSuspend(request.id); }} disabled={actionLoading} className="btn suspend">
                          <Pause className="btn-icon" /> Suspend
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleBlock(request.id); }} disabled={actionLoading} className="btn block">
                          <Ban className="btn-icon" /> Block
                        </button>
                      </div>
                    )}

                    {/* Suspend Action Buttons */}
                    {request.status === 'suspended' && (
                      <div className="request-actions">
                        <button onClick={(e) => { e.stopPropagation(); handleApprove(request.id); }} disabled={actionLoading} className="btn approve">
                          <CheckCircle className="btn-icon" /> Approve
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleBlock(request.id); }} disabled={actionLoading} className="btn block">
                          <Ban className="btn-icon" /> Block
                        </button>
                      </div>
                    )}

                    {/* Block Action Buttons */}
                    {request.status === 'blocked' && (
                      <div className="request-actions">
                        <button onClick={(e) => { e.stopPropagation(); handleApprove(request.id); }} disabled={actionLoading} className="btn approve">
                          <CheckCircle className="btn-icon" /> Approve
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleSuspend(request.id); }} disabled={actionLoading} className="btn suspend">
                          <Pause className="btn-icon" /> Suspend
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
            
            {/* Request Details */}
            <aside className="request-detailss">
  {selectedRequest ? (
    <div className="details-card">
      <h3>Request Details</h3>
      
      <div className="details-content">
        <div className="detail-itemm">
          <strong>Full Name:</strong> 
          <span>{selectedRequest.name || 'N/A'}</span>
        </div>
        
        <div className="detail-itemm">
          <strong>Email:</strong> 
          <span>{selectedRequest.email || 'N/A'}</span>
        </div>
        
        {selectedRequest.phone && selectedRequest.phone !== 'N/A' && (
          <div className="detail-itemm">
            <strong>Phone:</strong> 
            <span>{selectedRequest.phone}</span>
          </div>
        )}
        
        {selectedRequest.department && (
          <div className="detail-itemm">
            <strong>Department:</strong> 
            <span>{selectedRequest.department}</span>
          </div>
        )}
        
        {selectedRequest.requested_role && (
          <div className="detail-itemm">
            <strong>Requested Role:</strong> 
            <span>{selectedRequest.requested_role}</span>
          </div>
        )}
        
        <div className="detail-itemm">
          <strong>Status:</strong>
          <span className={`status-badge ${selectedRequest.status}`}>
            {React.createElement(getStatusConfig(selectedRequest.status).icon, { className: "status-icon" })}
            {getStatusConfig(selectedRequest.status).label}
          </span>
        </div>
        
        <div className="detail-itemm">
          <strong>Submitted:</strong> 
          <span>{formatDate(selectedRequest.submitted_at)}</span>
        </div>
        
        {selectedRequest.action_date && (
          <div className="detail-itemm">
            <strong>Action Date:</strong> 
            <span>{formatDate(selectedRequest.action_date)}</span>
          </div>
        )}
        
        {selectedRequest.admin_notes && selectedRequest.admin_notes !== 'N/A' && (
          <div className="detail-itemm">
            <strong>Admin Notes:</strong> 
            <span>{selectedRequest.admin_notes}</span>
          </div>
        )}
        
        {selectedRequest.rejection_reason && selectedRequest.rejection_reason !== 'N/A' && (
          <div className="detail-itemm">
            <strong>Rejection Reason:</strong> 
            <span>{selectedRequest.rejection_reason}</span>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="empty-details">
      <MessageSquare className="empty-icon" />
      <h4>Select a Request</h4>
      <p>Click on a request to view details</p>
    </div>
  )}
</aside>
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

export default AdminDashboard;