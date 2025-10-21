import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Package, Users, ClipboardCheck, FileText, Wrench, Settings, UserCheck, LogOut, Menu, X
} from 'lucide-react';
import './equipment_requests.css';
import { showConfirmationModal } from '../UI/ModalService';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  emoji: string;
  path: string;
}

interface EquipmentRequest {
  id: number;
  user_id?: number;
  user_name: string;
  user_email?: string;
  equipment_id: number;
  equipment_name: string;
  equipment_model: string;
  equipment_brand: string;
  equipment_category: string;
  equipment_serial_number: string;
  equipment_location: string;
  request_date: string;
  expected_return_date: string;
  actual_return_date?: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'in_use';
  priority?: string;
  purpose?: string;
  notes?: string;
  equipment_quantity: number; 
  approval_code?: string;
  approved_date?: string;
  approved_by?: string;
  approved_by_user_id?: number;
  approval_notes?: string;
  rejection_reason?: string;
  rejected_date?: string;
  rejected_by?: string;
  rejected_by_user_id?: number;
  return_condition?: string;
  return_notes?: string;
  created_at: string;
  updated_at: string;
}

interface RequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  returned: number;
  in_use: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

const EquipmentRequests = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'returned' | 'in_use'>('pending');
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Sidebar and navigation states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('equipment_requests');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Data states
  const [pendingRequests, setPendingRequests] = useState<EquipmentRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<EquipmentRequest[]>([]);
  const [rejectedRequests, setRejectedRequests] = useState<EquipmentRequest[]>([]);
  const [requestStats, setRequestStats] = useState<RequestStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    returned: 0,
    in_use: 0
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EquipmentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [returnCondition, setReturnCondition] = useState('good');
  const [returnNotes, setReturnNotes] = useState('');
  
  // Initialize navigate from react-router-dom
  const navigate = useNavigate();
  
  // API Base URL
  const API_BASE_URL: string = 'http://localhost:5000/api';
  
  // Navigation items
  const navigationItems: NavigationItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, emoji: '📊', path: '/dashboard' },
    { id: 'inventory', label: 'Inventory', icon: Package, emoji: '📦', path: '/inventory' },
    { id: 'users', label: 'Users', icon: Users, emoji: '👥', path: '/users' },
    { id: 'check', label: 'Check In/Out', icon: ClipboardCheck, emoji: '✓', path: '/check' },
    { id: 'reports', label: 'Reports', icon: FileText, emoji: '📝', path: '/reports' },
    { id: 'main', label: 'Maintenance', icon: Wrench, emoji: '🔧', path: '/main' },
    { id: 'settings', label: 'Settings', icon: Settings, emoji: '⚙️', path: '/settings' },
    { id: 'requests', label: 'Requests', icon: UserCheck, emoji: '📋', path: '/requests' },
    { id: 'equipment_requests', label: 'Equipment Requests', icon: ClipboardCheck, emoji: '📋', path: '/equipment_requests' },
  ];

    // Success Modal State
const [successModal, setSuccessModal] = useState({
  isOpen: false,
  title: '',
  message: '',
  type: 'success' as 'success' | 'error'
});

//Helper 
// Success Modal Functions
const showSuccessModal = (title: string, message: string, type: 'success' | 'error' = 'success') => {
  setSuccessModal({
    isOpen: true,
    title,
    message,
    type
  });
};

  // Fetch pending requests from API
  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/equipment-requests`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch pending requests`);
      }

      const result: ApiResponse<EquipmentRequest[]> = await response.json();
      
      if (result.success && result.data) {
        setPendingRequests(result.data);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to load pending requests');
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      setPendingRequests([]);
      return [];
    }
  };

  // Fetch approved requests from API
  const fetchApprovedRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/approved-requests`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch approved requests`);
      }

      const result: ApiResponse<EquipmentRequest[]> = await response.json();
      
      if (result.success && result.data) {
        setApprovedRequests(result.data);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to load approved requests');
      }
    } catch (error) {
      console.error('Error fetching approved requests:', error);
      setApprovedRequests([]);
      return [];
    }
  };

  // Fetch rejected requests from API
  const fetchRejectedRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/rejected-requests`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch rejected requests`);
      }

      const result: ApiResponse<EquipmentRequest[]> = await response.json();
      
      if (result.success && result.data) {
        setRejectedRequests(result.data);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to load rejected requests');
      }
    } catch (error) {
      console.error('Error fetching rejected requests:', error);
      setRejectedRequests([]);
      return [];
    }
  };

  // Fetch all requests and calculate stats
  const fetchAllRequests = async () => {
    try {
      setError('');
      const [pending, approved, rejected] = await Promise.all([
        fetchPendingRequests(),
        fetchApprovedRequests(),
        fetchRejectedRequests()
      ]);

      // Combine and calculate stats
      const allRequests = [...pending, ...approved, ...rejected];
      const stats = {
        total: allRequests.length,
        pending: pending.filter((req: EquipmentRequest) => req.status === 'pending').length,
        approved: approved.filter((req: EquipmentRequest) => req.status === 'approved').length,
        in_use: approved.filter((req: EquipmentRequest) => req.status === 'in_use').length,
        rejected: rejected.length,
        returned: approved.filter((req: EquipmentRequest) => req.status === 'returned').length,
      };
      setRequestStats(stats);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError(error instanceof Error ? error.message : 'Failed to load requests');
      setRequestStats({ total: 0, pending: 0, approved: 0, rejected: 0, returned: 0, in_use: 0 });
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await fetchAllRequests();
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);
  
  // Handle navigation when menu items are clicked
  const handleNavigation = (item: NavigationItem) => {
    setActiveNavItem(item.id);
    navigate(item.path);
  };
  
  // Handle logout with loading screen
  const handleLogout = () => {
    setIsLoggingOut(true);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Get current requests based on active tab
  const getCurrentRequests = () => {
    if (activeTab === 'pending') {
      return pendingRequests;
    } else if (activeTab === 'rejected') {
      return rejectedRequests;
    } else {
      return approvedRequests.filter(req => req.status === activeTab);
    }
  };

  // Filter requests based on active tab, search term, and date filter
  const filteredRequests = getCurrentRequests().filter(request => {
    const matchesSearch = searchTerm === '' || 
      request.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.equipment_serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.user_email && request.user_email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const requestDate = new Date(request.request_date);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
      }
    }
    
    return matchesSearch && matchesDate;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  // Reset current page when tab, search term, or date filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, dateFilter]);

  // Handle approval
  const handleApprove = (request: EquipmentRequest) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  const confirmApproval = async () => {
    if (!selectedRequest) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      const approvalData = {
        approved_by: 'Current Admin User',
        approval_notes: approvalNotes.trim() || null
      };

      const response = await fetch(`${API_BASE_URL}/admin/equipment-requests/${selectedRequest.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to approve request`);
      }

      const result: ApiResponse<EquipmentRequest> = await response.json();
      
      if (result.success && result.data) {
        showSuccessModal('Success', `Request approved successfully! Approval code: ${result.data.approval_code || 'N/A'}`);
        await fetchAllRequests(); // Refresh all data
      } else {
        throw new Error(result.message || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve request';
      setError(errorMessage);
      showSuccessModal('Error', errorMessage);
    } finally {
      setSubmitting(false);
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setApprovalNotes('');
    }
  };

  // Handle rejection
  const confirmRejection = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      showSuccessModal('Error', 'Please provide a rejection reason.'); 
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const rejectionData = {
        rejection_reason: rejectionReason.trim(),
        rejected_by: 'Current Admin User'
      };

      const response = await fetch(`${API_BASE_URL}/admin/equipment-requests/${selectedRequest.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rejectionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to reject request`);
      }

      const result: ApiResponse<EquipmentRequest> = await response.json();
      
      if (result.success && result.data) {
        // Close rejection modal and clear state BEFORE showing success modal
        setShowRejectionModal(false);
        setSelectedRequest(null);
        setRejectionReason('');
        setSubmitting(false);
        
        // Show success modal
        showSuccessModal('Success', 'Request rejected successfully.');
        
        // Refresh data
        await fetchAllRequests();
      } else {
        throw new Error(result.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject request';
      setError(errorMessage);
      showSuccessModal('Error', errorMessage);
      
      // Clean up on error
      setSubmitting(false);
      setShowRejectionModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
    }
  };

  // Handle pickup (mark as in use)
  const handlePickup = async (request: EquipmentRequest) => {
    const confirmed = await showConfirmationModal(
      'Mark as Picked Up',
      'Are you sure you want to mark this equipment as picked up?'
    );
    if (!confirmed) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/equipment-requests/${request.id}/pickup`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to mark equipment as picked up`);
      }

      const result: ApiResponse<EquipmentRequest> = await response.json();
      
      if (result.success) {
        showSuccessModal('Success', 'Equipment marked as picked up successfully.');
        await fetchAllRequests(); // Refresh all data
      } else {
        throw new Error(result.message || 'Failed to mark equipment as picked up');
      }
    } catch (error) {
      console.error('Error marking equipment as picked up:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark equipment as picked up';
      setError(errorMessage);
      showSuccessModal('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle return
  const handleReturn = (request: EquipmentRequest) => {
    setSelectedRequest(request);
    setShowReturnModal(true);
  };

  const confirmReturn = async () => {
    if (!selectedRequest) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      const returnData = {
        return_condition: returnCondition,
        return_notes: returnNotes.trim() || null
      };

      const response = await fetch(`${API_BASE_URL}/admin/equipment-requests/${selectedRequest.id}/return`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(returnData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to mark equipment as returned`);
      }

      const result: ApiResponse<EquipmentRequest> = await response.json();
      
      if (result.success) {
        showSuccessModal('Success', 'Equipment marked as returned successfully.');
        await fetchAllRequests(); // Refresh all data
      } else {
        throw new Error(result.message || 'Failed to mark equipment as returned');
      }
    } catch (error) {
      console.error('Error marking equipment as returned:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark equipment as returned';
      setError(errorMessage);
      showSuccessModal('Error', errorMessage);
    } finally {
      setSubmitting(false);
      setShowReturnModal(false);
      setSelectedRequest(null);
      setReturnCondition('good');
      setReturnNotes('');
    }
  };

  // Copy approval code to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        alert('Approval code copied to clipboard!');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Approval code copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy to clipboard. Please copy manually: ' + text);
    }
  };

  // Refresh data
  const refreshData = async () => {
    setLoading(true);
    await fetchAllRequests();
    setLoading(false);
  };

  // Pagination component
  const PaginationComponent = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} requests
        </div>
        <div className="pagination-controls">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNumber;
            if (totalPages <= 5) {
              pageNumber = i + 1;
            } else if (currentPage <= 3) {
              pageNumber = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNumber = totalPages - 4 + i;
            } else {
              pageNumber = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`pagination-btn ${currentPage === pageNumber ? 'active' : ''}`}
              >
                {pageNumber}
              </button>
            );
          })}
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
        
        <div className="items-per-page">
          <select 
            value={itemsPerPage} 
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>
    );
  };

  // Error display component
  const ErrorDisplay = () => {
    if (!error) return null;
    
    return (
      <div className="error-banner">
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button className="error-retry" onClick={refreshData}>
            Retry
          </button>
          <button className="error-dismiss" onClick={() => setError('')}>
            ×
          </button>
        </div>
      </div>
    );
  };

  // Success Modal Component
  const SuccessModal = () => {
    if (!successModal.isOpen) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="modal-header">
            <h3>{successModal.title}</h3>
            <button
              className="modal-close"
              onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <p>{successModal.message}</p>
          </div>
          <div className="modal-actions">
            <button
              className={`modal-btn ${successModal.type === 'success' ? 'approve-btn' : 'reject-btn'}`}
              onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-containerr">
      {/* Success Modal */}
      <SuccessModal />

      {/* Logout loading overlay */}
      {isLoggingOut && (
        <div className="dashboard-logout-overlay">
          <div className="dashboard-logout-modal">
            <div className="dashboard-logout-spinner"></div>
            <p>Logging Out...</p>
          </div>
        </div>
      )}
      
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
        <div className="dashboard-main-content">
          <div className="requests-page">
            <div className="page-header">
              <h1><i>📋</i> Equipment Requests</h1>
              <div className="header-controls">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                  <button type="button">🔍</button>
                </div>
                
                <select 
                  className="date-filter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                
                <button 
                  className="refresh-btn"
                  onClick={refreshData}
                  disabled={loading}
                  title="Refresh data"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            {/* Error Display */}
            <ErrorDisplay />

            {/* Request Stats */}
            <div className="request-stats-tabs">
              <div className="request-stat-tab request-blue-tab">
                <div className="request-stat-content">
                  <div className="request-stat-title">TOTAL REQUESTS</div>
                  <div className="request-stat-value">{requestStats.total}</div>
                </div>
                <div className="request-stat-icon">
                  <i>📋</i>
                </div>
              </div>
              
              <div className="request-stat-tab request-yellow-tab">
                <div className="request-stat-content">
                  <div className="request-stat-title">PENDING</div>
                  <div className="request-stat-value">{requestStats.pending}</div>
                </div>
                <div className="request-stat-icon">
                  <i>⏳</i>
                </div>
              </div>
              
              <div className="request-stat-tab request-green-tab">
                <div className="request-stat-content">
                  <div className="request-stat-title">APPROVED</div>
                  <div className="request-stat-value">{requestStats.approved}</div>
                </div>
                <div className="request-stat-icon">
                  <i>✅</i>
                </div>
              </div>
              
              <div className="request-stat-tab request-purple-tab">
                <div className="request-stat-content">
                  <div className="request-stat-title">IN USE</div>
                  <div className="request-stat-value">{requestStats.in_use}</div>
                </div>
                <div className="request-stat-icon">
                  <i>🔧</i>
                </div>
              </div>
              
              <div className="request-stat-tab request-red-tab">
                <div className="request-stat-content">
                  <div className="request-stat-title">REJECTED</div>
                  <div className="request-stat-value">{requestStats.rejected}</div>
                </div>
                <div className="request-stat-icon">
                  <i>❌</i>
                </div>
              </div>
            </div>

            {/* Sub Tabs */}
            <div className="sub-tabs">
              <button 
                className={`sub-tab ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending Requests ({requestStats.pending})
              </button>
              <button 
                className={`sub-tab ${activeTab === 'approved' ? 'active' : ''}`}
                onClick={() => setActiveTab('approved')}
              >
                Approved Requests ({requestStats.approved})
              </button>
              <button 
                className={`sub-tab ${activeTab === 'in_use' ? 'active' : ''}`}
                onClick={() => setActiveTab('in_use')}
              >
                In Use ({requestStats.in_use})
              </button>
              <button 
                className={`sub-tab ${activeTab === 'rejected' ? 'active' : ''}`}
                onClick={() => setActiveTab('rejected')}
              >
                Rejected Requests ({requestStats.rejected})
              </button>
              <button 
                className={`sub-tab ${activeTab === 'returned' ? 'active' : ''}`}
                onClick={() => setActiveTab('returned')}
              >
                Returned Equipment ({requestStats.returned})
              </button>
            </div>

            {/* Requests Table */}
            <div className="requests-table-container">
              <div className="table-header">
                <h2>
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('_', ' ')} Requests 
                  ({filteredRequests.length} total, showing {currentRequests.length})
                </h2>
              </div>

              <div className="table-responsive">
                <table className="requests-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>User</th>
                      <th>Equipment</th>
                      <th>Quantity</th>
                      <th>Request Date</th>
                      <th>Return Date</th>
                      {(activeTab === 'approved' || activeTab === 'in_use') && <th>Approval Code</th>}
                      {activeTab === 'rejected' && <th>Rejection Reason</th>}
                      {activeTab === 'returned' && <th>Return Date</th>}
                      {activeTab === 'returned' && <th>Condition</th>}
                      <th>Status</th>
                      {(activeTab === 'pending' || activeTab === 'approved' || activeTab === 'in_use') && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {currentRequests.length > 0 ? (
                      currentRequests.map((request) => (
                        <tr key={request.id}>
                          <td>REQ-{request.id.toString().padStart(4, '0')}</td>
                          <td>
                            <div className="user-info">
                              <div className="user-name">{request.user_name}</div>
                            </div>
                          </td>
                          <td>
                            <div className="equipment-info">
                              <div className="equipment-name">{request.equipment_name}</div>
                              <div className="equipment-serial">{request.equipment_serial_number}</div>
                            </div>
                          </td>
                          <td>{request.equipment_quantity}</td>
                          <td>{new Date(request.request_date).toLocaleDateString()}</td>
                          <td>{new Date(request.expected_return_date).toLocaleDateString()}</td>
                          {(activeTab === 'approved' || activeTab === 'in_use') && (
                            <td>
                              <div className="approval-code-container">
                                <code className="approval-code">{request.approval_code}</code>
                                <button 
                                  className="copy-btn"
                                  onClick={() => copyToClipboard(request.approval_code!)}
                                  title="Copy code"
                                >
                                  📋
                                </button>
                              </div>
                            </td>
                          )}
                          {activeTab === 'rejected' && (
                            <td className="rejection-reason">{request.rejection_reason}</td>
                          )}
                          {activeTab === 'returned' && (
                            <td>
                              {request.actual_return_date 
                                ? new Date(request.actual_return_date).toLocaleDateString()
                                : 'N/A'
                              }
                            </td>
                          )}
                          {activeTab === 'returned' && (
                            <td>
                              <span className={`condition-badge condition-${request.return_condition}`}>
                                {request.return_condition || 'N/A'}
                              </span>
                            </td>
                          )}
                          <td>
                            <span className={`request-status status-${request.status}`}>
                              {request.status === 'in_use' ? 'IN USE' : request.status.toUpperCase()}
                            </span>
                          </td>
                          {activeTab === 'pending' && (
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="approve-btn"
                                  onClick={() => handleApprove(request)}
                                  disabled={submitting}
                                  title="Approve request"
                                >
                                  ✅ 
                                </button>
                                <button 
                                  className="reject-btn"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowRejectionModal(true);
                                  }}
                                  disabled={submitting}
                                  title="Reject request"
                                >
                                  ❌ 
                                </button>
                              </div>
                            </td>
                          )}
                          {activeTab === 'approved' && (
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="pickup-btn"
                                  onClick={() => handlePickup(request)}
                                  disabled={submitting}
                                  title="Mark as picked up"
                                >
                                  📦 
                                </button>
                              </div>
                            </td>
                          )}
                          {activeTab === 'in_use' && (
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="return-btn"
                                  onClick={() => handleReturn(request)}
                                  disabled={submitting}
                                  title="Mark as returned"
                                >
                                  ↩️ 
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={
                          activeTab === 'pending' ? 7 : 
                          activeTab === 'approved' ? 7 : 
                          activeTab === 'in_use' ? 7 :
                          activeTab === 'returned' ? 9 : 
                          7
                        } style={{ textAlign: 'center', padding: '20px' }}>
                          {getCurrentRequests().length === 0 && !error ? (
                            <>
                              <div className="no-data-icon">📭</div>
                              <div>No equipment requests found</div>
                              <div className="no-data-subtext">
                                Requests will appear here once they reach this status
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="no-data-icon">🔍</div>
                              <div>No {activeTab.replace('_', ' ')} requests found</div>
                              <div className="no-data-subtext">
                                Try adjusting your search or filter criteria
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <PaginationComponent />
            </div>
          </div>
        </div>
      </main>

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Approve Request</h3>
              <button 
                className="modal-close"
                onClick={() => setShowApprovalModal(false)}
                disabled={submitting}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to approve this request?</p>
              <div className="request-detaills">
                <p><strong>Request ID:</strong> REQ-{selectedRequest.id.toString().padStart(4, '0')}</p>
                <p><strong>User:</strong> {selectedRequest.user_name}</p>
                <p><strong>Equipment:</strong> {selectedRequest.equipment_name}</p>
                <p><strong>Quantity:</strong> {selectedRequest.equipment_quantity}</p>  
                <p><strong>Serial Number:</strong> {selectedRequest.equipment_serial_number}</p>
                <p><strong>Return Date:</strong> {new Date(selectedRequest.expected_return_date).toLocaleDateString()}</p>
                  <p><strong>Purpose:</strong> {selectedRequest.notes}</p>
                
              </div>
              <textarea
                placeholder="Add approval notes (optional)"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="modal-textarea"
                disabled={submitting}
              />
            </div>
            <div className="modal-actions">
              <button 
                className="modal-btn cancel-btn"
                onClick={() => setShowApprovalModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                className="modal-btn approve-btn"
                onClick={confirmApproval}
                disabled={submitting}
              >
                {submitting ? 'Approving...' : 'Approve Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Reject Request</h3>
              <button 
                className="modal-close"
                onClick={() => setShowRejectionModal(false)}
                disabled={submitting}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Please provide a reason for rejecting this request:</p>
              <div className="request-detaills">
                <p><strong>Request ID:</strong> REQ-{selectedRequest.id.toString().padStart(4, '0')}</p>
                <p><strong>User:</strong> {selectedRequest.user_name}</p>
                <p><strong>Equipment:</strong> {selectedRequest.equipment_name}</p>
                <p><strong>Quantity:</strong> {selectedRequest.equipment_quantity}</p>
                <p><strong>Serial Number:</strong> {selectedRequest.equipment_serial_number}</p>
                  <p><strong>Purpose:</strong> {selectedRequest.notes}</p>
        
              </div>
              <textarea
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="modal-textarea"
                required
                disabled={submitting}
              />
            </div>
            <div className="modal-actions">
              <button 
                className="modal-btn cancel-btn"
                onClick={() => setShowRejectionModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                className="modal-btn reject-btn"
                onClick={confirmRejection}
                disabled={submitting || !rejectionReason.trim()}
              >
                {submitting ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Mark Equipment as Returned</h3>
              <button 
                className="modal-close"
                onClick={() => setShowReturnModal(false)}
                disabled={submitting}
              >
                ×
              </button>
            </div>
            <div className="modal-boooody">
              <p>Please confirm the return of this equipment:</p>
              <div className="request-detaillls">
                <p><strong>Request ID:</strong> REQ-{selectedRequest.id.toString().padStart(4, '0')}</p>
                <p><strong>User:</strong> {selectedRequest.user_name}</p>
                <p><strong>Equipment:</strong> {selectedRequest.equipment_name}</p>
                <p><strong>Quantity:</strong> {selectedRequest.equipment_quantity}</p>
                <p><strong>Serial Number:</strong> {selectedRequest.equipment_serial_number}</p>
                <p><strong>Expected Return:</strong> {new Date(selectedRequest.expected_return_date).toLocaleDateString()}</p>
              </div>
              
              <div className="form-group">
                <label htmlFor="returnCondition">Equipment Condition:</label>
                <select
                  id="returnCondition"
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="modal-select"
                  disabled={submitting}
                >
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>

              <textarea
                placeholder="Add return notes (optional)"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="modal-textarea"
                disabled={submitting}
              />
            </div>
            <div className="modal-actions">
              <button 
                className="modal-btn cancel-btn"
                onClick={() => setShowReturnModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                className="modal-btn return-btn"
                onClick={confirmReturn}
                disabled={submitting}
              >
                {submitting ? 'Processing...' : 'Confirm Return'}
              </button>
            </div>
          </div>

     
        </div>
      )}
    </div>
  );
};

export default EquipmentRequests;