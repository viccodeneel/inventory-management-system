import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Package, Users, ClipboardCheck, FileText, Wrench, Settings, UserCheck, LogOut, Menu, X
} from 'lucide-react';
import './Inventory.css';
import SuccessModal from '../UI/SuccessModal';

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
  brand: string;
  status: string;
  condition: string;
  category: string;
  location: string;
   quantity: number;
   available_quantity: number;
  assigned_to: string | null;
}

interface EquipmentStats {
  total: number;
  available: number;
  in_use: number;
  maintenance: number;
}

interface CategoryData {
  name: string;
  count: number;
}

interface AddEquipmentForm {
  name: string;
  model: string;
  brand: string;
  serial_number: string;
  category_id: string;
  location_id: string;
  condition: string;
  status: string;
  purchase_date: string;
  warranty_expiry: string;
  notes: string;
  quantity: number;  // New: For adding multiple units
}

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  

  // Navigation and UI states
  const [currentView, setCurrentView] = useState('inventory');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('inventory');
  const [activeNav, setActiveNav] = useState('inventory');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Data states
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStats>({
    total: 0,
    available: 0,
    in_use: 0,
    maintenance: 0
  });
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  
  // Filter and search states
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

 const [addForm, setAddForm] = useState<AddEquipmentForm>({
    name: '',
    model: '',
    brand: '',
    serial_number: '',
    category_id: '',
    location_id: '',
    condition: 'excellent',
    status: 'available',
    purchase_date: '',
    warranty_expiry: '',
    notes: '',
    quantity: 1  // New: Default to 1
  });

  const [editForm, setEditForm] = useState<AddEquipmentForm>({
    name: '',
    model: '',
    brand: '',
    serial_number: '',
    category_id: '',
    location_id: '',
    condition: 'excellent',
    status: 'available',
    purchase_date: '',
    warranty_expiry: '',
    notes: '',
    quantity: 1  // New: Default to 1
  });
  const [newStatus, setNewStatus] = useState('');

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

const closeSuccessModal = () => {
  setSuccessModal({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });
};
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  // API Base URL - adjust this to match your backend
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Fetch equipment stats
  const fetchEquipmentStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/equipment/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const stats = await response.json();
      setEquipmentStats(stats);
    } catch (error) {
      console.error('Error fetching equipment stats:', error);
    }
  };

  // Fetch equipment list
  const fetchEquipmentList = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/equipment/list`);
      if (!response.ok) throw new Error('Failed to fetch equipment');
      const equipment = await response.json();
      setEquipmentList(equipment);
      
      // Calculate category data from equipment list
      const categoryCount = equipment.reduce((acc: {[key: string]: number}, item: Equipment) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {});
      
      const categoryDataArray = Object.entries(categoryCount).map(([name, count]) => ({
        name,
        count: count as number
      }));
      
      setCategoryData(categoryDataArray);
    } catch (error) {
      console.error('Error fetching equipment list:', error);
    }
  };

  // Fetch categories 
  const fetchCategories = async () => {
    try {
      // Hardcoded categories
      const hardcodedCategories = [
        { id: '1', name: 'Drones' },
        { id: '2', name: 'Cameras' },
        { id: '3', name: 'Batteries' },
        { id: '4', name: 'Controllers' },
        { id: '5', name: 'Accessories' },
        { id: '6', name: 'Tools' },
        { id: '7', name: 'Storage' }
      ];
      
      console.log("Using hardcoded categories:", hardcodedCategories);
      setCategories(hardcodedCategories);
    } catch (error) {
      console.error("Error setting categories:", error);
    }
  };

  // Fetch locations for dropdown
  const fetchLocations = async () => {
    try {
      // Hardcoded locations 
      const hardcodedLocations = [
        { id: '1', name: 'Main Warehouse' },
        { id: '2', name: 'Field Office A' },
        { id: '3', name: 'Field Office B' },
        { id: '4', name: 'Maintenance Shop' },
        { id: '5', name: 'Mobile Unit 1' },
        { id: '6', name: 'Training Center' }
      ];
      
      console.log("Using hardcoded locations:", hardcodedLocations);
      setLocations(hardcodedLocations);
    } catch (error) {
      console.error('Error setting locations:', error);
    }
  };

  // Add new equipment
const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...addForm,
        quantity: addForm.quantity  // Include quantity
      };

      console.log('Sending payload:', payload);

      const response = await fetch(`${API_BASE_URL}/equipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add equipment');
      }

      const addedEquipment = await response.json();  // Single item now

     // Reset form and close modal
      setAddForm({
        name: '',
        model: '',
        brand: '',
        serial_number: '',
        category_id: '',
        location_id: '',
        condition: 'excellent',
        status: 'available',
        purchase_date: '',
        warranty_expiry: '',
        notes: '',
        quantity: 1
      });
      setShowAddModal(false);

      // Refresh data
      await Promise.all([
        fetchEquipmentList(),
        fetchEquipmentStats()
      ]);

     showSuccessModal('Success', `Equipment added successfully with quantity: ${addedEquipment.quantity}`);
    } catch (error) {
      console.error('Error adding equipment:', error);
      showSuccessModal('Error', `Failed to add equipment: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchEquipmentStats(),
          fetchEquipmentList(),
          fetchCategories(),
          fetchLocations()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Set active nav based on current route
  useEffect(() => {
    const path = location.pathname;
    const route = path.split('/')[1] || 'dashboard';
    setActiveNav(route);
  }, [location]);

  // Check if screen size is mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAddForm(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value  // Handle quantity as number
    }));
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value
    }));
  };

  // Three-dot menu handlers
  const handleDropdownToggle = (equipmentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === equipmentId ? null : equipmentId);
  };

  const handleEditEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    // Find the category and location IDs based on names
    const categoryId = categories.find(cat => cat.name === equipment.category)?.id || '';
    const locationId = locations.find(loc => loc.name === equipment.location)?.id || '';
    
    setEditForm({
      name: equipment.name,
      model: equipment.model,
      brand: equipment.brand,
      serial_number: equipment.serial_number,
      category_id: categoryId,
      location_id: locationId,
      condition: equipment.condition,
      status: equipment.status,
      purchase_date: '',
      warranty_expiry: '',
      notes: '',
       quantity: equipment.quantity || 1
    });
    setShowEditModal(true);
    setOpenDropdown(null);
  };

  const handleDeleteEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowDeleteModal(true);
    setOpenDropdown(null);
  };

  const handleChangeStatus = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setNewStatus(equipment.status);
    setShowStatusModal(true);
    setOpenDropdown(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
    
    if (openDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  // Update equipment
  const handleUpdateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipment) return;
    
    setSubmitting(true);
    try {
      const payload = {
        name: editForm.name,
        model: editForm.model,
        brand: editForm.brand,
        serial_number: editForm.serial_number,
        category_id: editForm.category_id,
        location_id: editForm.location_id,
        condition: editForm.condition,
        status: editForm.status,
        quantity: editForm.quantity || 1,
        available_quantity: editForm.status === 'available' ? editForm.quantity : 0,
        ...(editForm.purchase_date && { purchase_date: editForm.purchase_date }),
        ...(editForm.warranty_expiry && { warranty_expiry: editForm.warranty_expiry }),
        ...(editForm.notes && { notes: editForm.notes })
      };

      const response = await fetch(`${API_BASE_URL}/equipment/${selectedEquipment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update equipment');
      }

      setShowEditModal(false);
      await Promise.all([
        fetchEquipmentList(),
        fetchEquipmentStats()
      ]);
      
      showSuccessModal('Success', 'Equipment updated successfully!');
    } catch (error) {
      console.error('Error updating equipment:', error);
      showSuccessModal('Error', 'Failed to update equipment. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete equipment
  const confirmDelete = async () => {
    if (!selectedEquipment) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/equipment/${selectedEquipment.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete equipment');
      }

      setShowDeleteModal(false);
      await Promise.all([
        fetchEquipmentList(),
        fetchEquipmentStats()
      ]);
      
      showSuccessModal('Success', 'Equipment deleted successfully!');
    } catch (error) {
      console.error('Error deleting equipment:', error);
      showSuccessModal('Error', 'Failed to delete equipment. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Update status
  const confirmStatusChange = async () => {
    if (!selectedEquipment) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/equipment/${selectedEquipment.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setShowStatusModal(false);
      await Promise.all([
        fetchEquipmentList(),
        fetchEquipmentStats()
      ]);
      
      showSuccessModal('Success', 'Equipment status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      showSuccessModal('Error', 'Failed to update status. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter equipment based on category and search term
  const filteredEquipment = equipmentList.filter(item => {
    const matchesCategory = selectedCategory === 'All Categories' || item.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEquipment = filteredEquipment.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Reset current page when search term or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const exportData = () => {
    const csvContent = [
      ['ID', 'Serial Number', 'Name', 'Model', 'Brand', 'Category', 'Status', 'Condition', 'Location', 'Quantity', 'Assigned To'],
      ...filteredEquipment.map(item => [
        item.id,
        item.serial_number,
        item.name,
        item.model,
        item.brand,
        item.category,
        item.status,
        item.condition,
        item.location,
        item.quantity || 1,
        item.assigned_to || '--'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
          <div className="loading-text">Loading equipment requests...</div>
          <div className="loading-subtext">Please wait while we fetch request data</div>
        </div>
      </div>
    );
  }

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
      
      {/* Mobile overlay */}
      {isMobileMenuOpen && isMobile && (
        <div className="inventory-mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
      
      <main className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="inventory-main-content">
          <div className="inventory-header">
            <h1><span className="inventory-header-icon">📦</span> Inventory</h1>
            
            <div className="search-box">
              <input
                type="text"
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <button type="button">🔍</button>
            </div>
          </div>
          
          <div className="inventory-action-buttons">
            <button 
              className="inventory-btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <span className="inventory-btn-icon">+</span>
              Add Equipment
            </button>
            <button 
              className="btn-outline inventory-btn"
              onClick={exportData}
            >
              <span className="inventory-btn-icon">↓</span>
              Export
            </button>
          </div>
            
          {/* Stats Cards */}
          <div className="inventory-stat-tabs">
            <div className="inventory-stat-tab inventory-blue-tab">
              <div className="inventory-stat-content">
                <div className="inventory-stat-title">TOTAL EQUIPMENT</div>
                <div className="inventory-stat-value">{equipmentStats.total}</div>
              </div>
              <div className="inventory-stat-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
              </div>
            </div>
            
            <div className="inventory-stat-tab inventory-green-tab">
              <div className="inventory-stat-content">
                <div className="inventory-stat-title">AVAILABLE</div>
                <div className="inventory-stat-value">{equipmentStats.available}</div>
              </div>
              <div className="inventory-stat-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none">
                  <path d="M4 21v-7m0 0V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9m-4 0H4m16 0v7"></path>
                  <path d="M12 12H4"></path>
                  <path d="M12 16H4"></path>
                  <path d="M12 8H4"></path>
                </svg>
              </div>
            </div>
            
            <div className="inventory-yellow-tab inventory-stat-tab">
              <div className="inventory-stat-content">
                <div className="inventory-stat-title">IN USE</div>
                <div className="inventory-stat-value">{equipmentStats.in_use}</div>
              </div>
              <div className="inventory-stat-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="10" r="3"></circle>
                  <path d="M7 20.662V19c0-1.5 1.5-3 5-3s5 1.5 5 3v1.662"></path>
                </svg>
              </div>
            </div>
            
            <div className="inventory-stat-tab inventory-red-tab">
              <div className="inventory-stat-content">
                <div className="inventory-stat-title">MAINTENANCE</div>
                <div className="inventory-stat-value">{equipmentStats.maintenance}</div>
              </div>
              <div className="inventory-stat-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Equipment List */}
          <div className="inventory-content-card">
            <div className="inventory-card-header">
              <div className="inventory-card-title">
                Equipment List ({filteredEquipment.length} total, showing {currentEquipment.length})
              </div>
              <select
                className="inventory-filter-dropdown"
                value={selectedCategory}
                onChange={handleCategoryChange}
              >
                <option value="All Categories">All Categories</option>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading categories...</option>
                )}
              </select>
            </div>
            
            <div className="inventory-table-responsive">
              <table className="equipment-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Serial Number</th>
                    <th>Name</th>
                    <th>Model</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Condition</th>
                    <th>Location</th>
                    <th>Total Quantity</th>
                    <th>Available Quantity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEquipment.length > 0 ? (
                    currentEquipment.map(item => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.serial_number}</td>
                        <td>{item.name}</td>
                        <td>{item.model}</td>
                        <td>{item.brand}</td>
                        <td>{item.category}</td>
                        <td>
                          <span className={`equipment-status status-${item.status.toLowerCase().replace(' ', '-')}`}>
                            {item.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td>{item.condition}</td>
                        <td>{item.location}</td>
                        <td>{item.quantity || 1}</td>
                        <td>{item.available_quantity || 0}</td>
                        <td>
                          <div className="actions-dropdown-container">
                            <button 
                              className="actions-dropdown-trigger"
                              onClick={(e) => handleDropdownToggle(item.id, e)}
                              type="button"
                            >
                              ⋮
                            </button>
                            {openDropdown === item.id && (
                              <div className="actions-dropdown-menu">
                                <button 
                                  className="dropdown-item edit"
                                  onClick={() => handleEditEquipment(item)}
                                >
                                  ✏️ Edit Equipment
                                </button>
                                <button 
                                  className="dropdown-item status"
                                  onClick={() => handleChangeStatus(item)}
                                >
                                  🔄 Change Status
                                </button>
                                <button 
                                  className="dropdown-item delete"
                                  onClick={() => handleDeleteEquipment(item)}
                                >
                                  🗑️ Delete Equipment
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '20px' }}>
                        {searchTerm || selectedCategory !== 'All Categories' ? 'No equipment matches your filters' : 'No equipment found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            

            {/* Pagination Controls */}
            {filteredEquipment.length > 0 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  <span>
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredEquipment.length)} of {filteredEquipment.length} entries
                  </span>
                  <div className="items-per-page">
                    <label>Show: </label>
                    <select 
                      value={itemsPerPage} 
                      onChange={handleItemsPerPageChange}
                      className="items-per-page-select"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <label> per page</label>
                  </div>
                </div>

                <div className="pagination-controls">
                  <button 
                    className="pagination-btn"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>

                  <div className="pagination-numbers">
                    {getPageNumbers().map((page, index) => (
                      <span key={index}>
                        {page === '...' ? (
                          <span className="pagination-dots">...</span>
                        ) : (
                          <button
                            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                            onClick={() => handlePageChange(page as number)}
                          >
                            {page}
                          </button>
                        )}
                      </span>
                    ))}
                  </div>

                  <button 
                    className="pagination-btn"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Category Chart with Grid Background */}
{categoryData.length > 0 && (
  <div className="inventory-content-card">
    <div className="inventory-card-header">
      <div className="inventory-card-title">Inventory by Category</div>
    </div>
    
    <div className="chart-container">
      {(() => {
        const maxCount = Math.max(...categoryData.map(cat => cat.count));
        const minHeight = 20;
        const maxHeight = 180;
        
        // Generate Y-axis labels
        const gridLines = 6;
        const yLabels = [];
        for (let i = 0; i <= gridLines; i++) {
          yLabels.push(Math.round((maxCount / gridLines) * i));
        }
        
        return (
          <>
            {/* Y-axis labels */}
            <div className="chart-y-labels">
              {yLabels.reverse().map((value, index) => (
                <span key={index} className="y-label">{value}</span>
              ))}
            </div>
            
            
            {/* Chart area with grid */}
           <div className="inventory-category-chart labeled-grid">
          {categoryData.map(category => {
            const percentage = (category.count / maxCount) * 100;
            const barHeight = Math.max(minHeight, (percentage / 100) * maxHeight);
            
            return (
              <div className="inventory-chart-bar" key={category.name}>
                <div 
                  className="inventory-bar" 
                  style={{ height: `${barHeight}px` }}
                  title={`${category.name}: ${category.count} items in stock`}
                ></div>
                <div className="inventory-bar-label">{category.name}</div>
                <div className="inventory-bar-count">Stock: {category.count}</div>  {/* New: Amount in stock label */}
              </div>
            );
          })}
        </div>
      </>
    );
  })()}
    </div>
  </div>
)}


        </div>

        {/* Edit Equipment Modal */}
        {showEditModal && selectedEquipment && (
          <div className="modal-overlay" onClick={() => !submitting && setShowEditModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Equipment - {selectedEquipment.name}</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowEditModal(false)}
                  disabled={submitting}
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleUpdateEquipment}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Equipment Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={editForm.name}
                      onChange={handleEditFormChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Model *</label>
                    <input
                      type="text"
                      name="model"
                      value={editForm.model}
                      onChange={handleEditFormChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Brand *</label>
                    <input
                      type="text"
                      name="brand"
                      value={editForm.brand}
                      onChange={handleEditFormChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Serial Number *</label>
                    <input
                      type="text"
                      name="serial_number"
                      value={editForm.serial_number}
                      onChange={handleEditFormChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      name="category_id"
                      value={editForm.category_id}
                      onChange={handleEditFormChange}
                      required
                      disabled={submitting}
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Location *</label>
                    <select
                      name="location_id"
                      value={editForm.location_id}
                      onChange={handleEditFormChange}
                      required
                      disabled={submitting}
                    >
                      <option value="">Select Location</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  
                  <div className="form-group">
                    <label>Status *</label>
                    <select
                      name="status"
                      value={editForm.status}
                      onChange={handleEditFormChange}
                      required
                      disabled={submitting}
                    >
                      <option value="available">Available</option>
                      <option value="in_use">In Use</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="out_of_service">Out of Service</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Condition *</label>
                    <select
                      name="condition"
                      value={editForm.condition}
                      onChange={handleEditFormChange}
                      required
                      disabled={submitting}
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>

  <div className="form-group">
    <label>Quantity *</label>
    <input
      type="number"
      name="quantity"
      min="1"
      value={editForm.quantity || 1}
      onChange={handleEditFormChange}
      required
      disabled={submitting}
    />
  </div>
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowEditModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Updating...' : 'Update Equipment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedEquipment && (
          <div className="modal-overlay" onClick={() => !submitting && setShowDeleteModal(false)}>
            <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Delete Equipment</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={submitting}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                <div className="delete-warning">
                  <div className="warning-icon">⚠️</div>
                  <div className="warning-text">
                    <p>Are you sure you want to delete this equipment?</p>
                    <div className="equipment-details">
                      <strong>{selectedEquipment.name}</strong>
                      <span>Serial: {selectedEquipment.serial_number}</span>
                      <span>Model: {selectedEquipment.model}</span>
                    </div>
                    <p className="warning-note">This action cannot be undone.</p>
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="btn-danger"
                  onClick={confirmDelete}
                  disabled={submitting}
                >
                  {submitting ? 'Deleting...' : 'Delete Equipment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Change Modal */}
        {showStatusModal && selectedEquipment && (
          <div className="modal-overlay" onClick={() => !submitting && setShowStatusModal(false)}>
            <div className="modal-content status-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Change Equipment Status</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowStatusModal(false)}
                  disabled={submitting}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                <div className="status-change-info">
                  <div className="equipment-info">
                    <strong>{selectedEquipment.name}</strong>
                    <span>Current Status: <span className={`equipment-status status-${selectedEquipment.status.toLowerCase().replace(' ', '-')}`}>
                      {selectedEquipment.status.replace('_', ' ').toUpperCase()}
                    </span></span>
                  </div>
                  
                  <div className="form-group">
                    <label>New Status *</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      required
                      disabled={submitting}
                    >
                      <option value="available">Available</option>
                      <option value="in_use">In Use</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="out_of_service">Out of Service</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowStatusModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="btn-primary"
                  onClick={confirmStatusChange}
                  disabled={submitting || newStatus === selectedEquipment.status}
                >
                  {submitting ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => !submitting && setShowAddModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add New Equipment</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAddEquipment}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Equipment Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={addForm.name}
                      onChange={handleFormChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Model *</label>
                    <input
                      type="text"
                      name="model"
                      value={addForm.model}
                      onChange={handleFormChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Brand *</label>
                    <input
                      type="text"
                      name="brand"
                      value={addForm.brand}
                      onChange={handleFormChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Serial Number *</label>
                    <input
                      type="text"
                      name="serial_number"
                      value={addForm.serial_number}
                      onChange={handleFormChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      name="category_id"
                      value={addForm.category_id}
                      onChange={handleFormChange}
                      required
                      disabled={submitting}
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Location *</label>
                    <select
                      name="location_id"
                      value={addForm.location_id}
                      onChange={handleFormChange}
                      required
                      disabled={submitting}
                    >
                      <option value="">Select Location</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Status *</label>
                    <select
                      name="status"
                      value={addForm.status}
                      onChange={handleFormChange}
                      required
                      disabled={submitting}
                    >
                      <option value="available">Available</option>
                      <option value="in_use">In Use</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="out_of_service">Out of Service</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Condition *</label>
                    <select
                      name="condition"
                      value={addForm.condition}
                      onChange={handleFormChange}
                      required
                      disabled={submitting}
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Purchase Date</label>
                    <input
                      type="date"
                      name="purchase_date"
                      value={addForm.purchase_date}
                      onChange={handleFormChange}
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Warranty Expiry</label>
                    <input
                      type="date"
                      name="warranty_expiry"
                      value={addForm.warranty_expiry}
                      onChange={handleFormChange}
                      disabled={submitting}
                    />
                  </div>

                       <div className="form-group">
    <label>Quantity *</label>
    <input
      type="number"
      name="quantity"
      min="1"
      value={addForm.quantity}
      onChange={handleFormChange}
      required
      disabled={submitting}
    />
  </div>
  
                  <div className="form-group form-group-full">
                    <label>Notes</label>
                    <textarea
                      name="notes"
                      value={addForm.notes}
                      onChange={handleFormChange}
                      rows={3}
                      disabled={submitting}
                    />
                  </div>


                </div>
                
                <div className="modal-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Adding...' : 'Add Equipment'}
                  </button>
                </div>
              </form>
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

        {/* Success/Error Modal */}
<SuccessModal
  isOpen={successModal.isOpen}
  onClose={closeSuccessModal}
  title={successModal.title}
  message={successModal.message}
  type={successModal.type}
/>
      </main>
    </div>
  );
};

export default Inventory;