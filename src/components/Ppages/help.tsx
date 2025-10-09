import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './help.css';

const Help = () => {
  const [activeTab, setActiveTab] = useState('help');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  
  const handleNavigation = (path: string) => {
    navigate(path);
  };
  
  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };
  
  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };
  
  // FAQ data organized by categories
  const faqData = [
    {
      id: 1,
      category: 'equipment',
      question: 'How do I request equipment?',
      answer: 'Navigate to the Equipment page, browse available items, and click the "Request" button next to the equipment you need. Fill out the request form with your project details, required duration, and submit.'
    },
    {
      id: 2,
      category: 'equipment',
      question: 'What equipment is available for request?',
      answer: 'You can view all available equipment on the Equipment page. Items are categorized by type (drones, cameras, sensors, etc.) and their current availability status is displayed.'
    },
    {
      id: 3,
      category: 'requests',
      question: 'How can I track my equipment requests?',
      answer: 'Visit the "My Requests" page to see all your current and past requests. You can view the status (pending, approved, in-use, returned) and estimated approval time for each request.'
    },
    {
      id: 4,
      category: 'requests',
      question: 'Can I cancel a pending request?',
      answer: 'Yes, you can cancel any request with "Pending" status from your My Requests page. Click the cancel button next to the request you wish to withdraw.'
    },
    {
      id: 5,
      category: 'account',
      question: 'How do I update my profile information?',
      answer: 'Go to Profile Settings from the sidebar menu. You can update your name, email, phone number, department, and notification preferences.'
    },
    {
      id: 6,
      category: 'account',
      question: 'I forgot my password. What should I do?',
      answer: 'Click "Forgot Password" on the login page. Enter your registered email address, and you\'ll receive a password reset link. Follow the instructions in the email to create a new password.'
    },
    {
      id: 7,
      category: 'equipment',
      question: 'What should I do if equipment is damaged?',
      answer: 'Report any damage immediately through the system or contact the equipment manager. Do not attempt to return damaged equipment without reporting it first. Fill out an incident report with details of what happened.'
    },
    {
      id: 8,
      category: 'requests',
      question: 'How long does it take to approve a request?',
      answer: 'Standard requests are typically approved within 24-48 hours. Urgent requests can be flagged during submission and are usually reviewed within 4-6 hours during business hours.'
    },
    {
      id: 9,
      category: 'equipment',
      question: 'Can I extend my equipment reservation?',
      answer: 'Yes, you can request an extension from the My Requests page before your return date. Extensions are subject to availability and approval.'
    },
    {
      id: 10,
      category: 'system',
      question: 'How do I subscribe to system updates?',
      answer: 'Visit the Updates page and click the "Subscribe to Updates" button. You\'ll receive notifications about new equipment, system changes, and important announcements.'
    }
  ];
  
  // Filter FAQs based on search and category
  const filteredFaqs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  const quickLinks = [
    { icon: '📦', title: 'Browse Equipment', path: '/equipments', description: 'View all available equipment' },
    { icon: '➕', title: 'New Request', path: '/equipments', description: 'Submit a new equipment request' },
    { icon: '🔍', title: 'My Requests', path: '/myrequest', description: 'Track your request status' },
    { icon: '⚙️', title: 'Profile Settings', path: '/psettings', description: 'Update your account details' }
  ];
  
  const contactInfo = [
    { icon: '📧', label: 'Email', value: 'support@sokoaerial.com' },
    { icon: '📞', label: 'Phone', value: '+233 XX XXX XXXX' },
    { icon: '⏰', label: 'Support Hours', value: 'Mon-Fri: 8AM - 6PM' },
    { icon: '📍', label: 'Location', value: 'Accra, Ghana' }
  ];

  //Profile states
  const [currentUser, setCurrentUser] = useState<{
  name: string;
  email: string;
  role: string;
} | null>(null);

//Profile Funcetions
const fetchCurrentUser = async () => {
  try {
    const token = localStorage.getItem('userToken');
    
    console.log('📍 fetchCurrentUser - Token:', !!token);
    
    if (!token) {
      console.error('No token in fetchCurrentUser');
      navigate('/');
      return;
    }

    try {
      // Split and decode the JWT
      const parts = token.split('.');
      console.log('Token parts:', parts.length);
      
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const payload = JSON.parse(atob(parts[1]));
      console.log('✅ Decoded payload:', payload);
      
      setCurrentUser({
        name: payload.name,
        email: payload.email,
        role: payload.role
      });
      
      console.log('✅ Current user set:', payload.name);
      
    } catch (decodeError) {
      console.error('❌ Token decode error:', decodeError);
      localStorage.clear();
      navigate('/');
    }
    
  } catch (error) {
    console.error('❌ Error in fetchCurrentUser:', error);
    navigate('/');
  }
};

// Update your useEffect to include fetchCurrentUser
useEffect(() => {
  const initializeData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCurrentUser(), // Add this line
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  };

  initializeData();
}, []);

// Helper function to get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Helper function to format role for display
const formatRole = (role: string): string => {
  const roleMap: { [key: string]: string } = {
    'admin': 'Administrator',
    'personnel': 'Personnel',
    'user': 'Team Member'
  };
  return roleMap[role.toLowerCase()] || 'Team Member';
};

  return (
    <div className="app-container">
      {isLoggingOut && (
        <div className="dashboard-logout-overlay">
          <div className="dashboard-logout-modal">
            <div className="dashboard-logout-spinner"></div>
            <p>Logging Out...</p>
          </div>
        </div>
      )}
      
      <div className="app-nav">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <span>🚁</span>
          </div>
          <div className="brand-name">Soko Aerial</div>
        </div>
        <div className="nav-links">
          <div className="nav-link" onClick={() => handleNavigation('/userdash')}>
            <i>📊</i> Dashboard
          </div>
          <div className="nav-link" onClick={() => handleNavigation('/equipments')}>
            <i>📦</i> Equipment
          </div>
          <div className="nav-link" onClick={() => handleNavigation('/myrequest')}>
            <i>🔍</i> My Requests
          </div>
          <div className="nav-link" onClick={() => handleNavigation('/updates')}>
            <i>📝</i> Updates
          </div>
          <div 
            className={`nav-link ${activeTab === 'help' ? 'current' : ''}`}
            onClick={() => handleNavigation('/help')}
          >
            <i>❓</i> Help
          </div>
          <div className="nav-link" onClick={() => handleNavigation('/psettings')}>
            <i>⚙️</i> Profile Settings
          </div>
          <div className="nav-link" onClick={handleLogout}>
            <i>🚪</i> Logout
          </div>
        </div>
         <div className="profile-box">
  <div className="profile-avatar">
    {currentUser ? getInitials(currentUser.name) : 'U'}
  </div>
  <div className="profile-details">
    <div className="profile-name">
      {currentUser ? currentUser.name : 'Loading...'}
    </div>
    <div className="profile-position">
      {currentUser ? formatRole(currentUser.role) : '...'}
    </div>
  </div>
</div>
      </div>
      
      <div className="content-area">
        <div className="help-container">
          <div className="help-header">
            <h1><i>❓</i> Help & Support Center</h1>
            <p className="help-subtitle">Find answers to common questions and get assistance</p>
          </div>

          {/* Quick Links Section */}
          <div className="quick-links-section">
            <h2 className="section-title">Quick Links</h2>
            <div className="quick-links-grid">
              {quickLinks.map((link, index) => (
                <div 
                  key={index} 
                  className="quick-link-card"
                  onClick={() => handleNavigation(link.path)}
                >
                  <div className="quick-link-icon">{link.icon}</div>
                  <h3>{link.title}</h3>
                  <p>{link.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="faq-section">
            <h2 className="section-title">Frequently Asked Questions</h2>
            
            <div className="faq-controls">
              <div className="faq-search">
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="faq-search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
              
              <div className="faq-category-filter">
                <button 
                  className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  All
                </button>
                <button 
                  className={`category-btn ${selectedCategory === 'equipment' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('equipment')}
                >
                  Equipment
                </button>
                <button 
                  className={`category-btn ${selectedCategory === 'requests' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('requests')}
                >
                  Requests
                </button>
                <button 
                  className={`category-btn ${selectedCategory === 'account' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('account')}
                >
                  Account
                </button>
                <button 
                  className={`category-btn ${selectedCategory === 'system' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('system')}
                >
                  System
                </button>
              </div>
            </div>

            <div className="faq-list">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq) => (
                  <div 
                    key={faq.id} 
                    className={`faq-item ${expandedFaq === faq.id ? 'expanded' : ''}`}
                  >
                    <div 
                      className="faq-question"
                      onClick={() => toggleFaq(faq.id)}
                    >
                      <span className="faq-q-icon">Q</span>
                      <span className="faq-q-text">{faq.question}</span>
                      <span className="faq-toggle">{expandedFaq === faq.id ? '−' : '+'}</span>
                    </div>
                    {expandedFaq === faq.id && (
                      <div className="faq-answer">
                        <span className="faq-a-icon">A</span>
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <p>😕 No FAQs found matching your search.</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Section */}
          <div className="contact-section">
            <h2 className="section-title">Still Need Help?</h2>
            <p className="contact-description">
              Can't find what you're looking for? Our support team is here to help!
            </p>
            
            <div className="contact-grid">
              {contactInfo.map((contact, index) => (
                <div key={index} className="contact-card">
                  <div className="contact-icon">{contact.icon}</div>
                  <div className="contact-details">
                    <h4>{contact.label}</h4>
                    <p>{contact.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="contact-form-section">
              <h3>Send us a message</h3>
              <form className="contact-form">
                <div className="form-group">
                  <label>Subject</label>
                  <input type="text" placeholder="Brief description of your issue" />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea rows={5} placeholder="Describe your issue in detail..."></textarea>
                </div>
                <button type="submit" className="submit-btn">
                  📧 Send Message
                </button>
              </form>
            </div>
          </div>

          {/* User Guide Section */}
          <div className="guide-section">
            <h2 className="section-title">User Guides & Resources</h2>
            <div className="guide-grid">
              <div className="guide-card">
                <div className="guide-icon">📖</div>
                <h3>Getting Started Guide</h3>
                <p>Learn the basics of using the inventory system</p>
                <button className="guide-btn">Read Guide</button>
              </div>
              <div className="guide-card">
                <div className="guide-icon">🎥</div>
                <h3>Video Tutorials</h3>
                <p>Watch step-by-step video instructions</p>
                <button className="guide-btn">Watch Videos</button>
              </div>
              <div className="guide-card">
                <div className="guide-icon">📄</div>
                <h3>Documentation</h3>
                <p>Detailed technical documentation</p>
                <button className="guide-btn">View Docs</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;