import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FiHome,
  FiUsers,
  FiBriefcase,
  FiLogOut,
  FiUser,
  FiFileText,
  FiTag,
  FiHelpCircle,
  FiGlobe
} from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const { admin, logout } = useAuth();

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      console.log('Logout function not available');
    }
  };

  const menuItems = [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    { path: '/users', icon: FiUsers, label: 'Users' },
    { path: '/jobs', icon: FiBriefcase, label: 'Jobs' },
    { path: '/companies', icon: FiGlobe, label: 'Companies' },
    { path: '/content', icon: FiFileText, label: 'Content' },
    { path: '/categories', icon: FiTag, label: 'Categories' },
    { path: '/faqs', icon: FiHelpCircle, label: 'FAQs' }
  ];

  // Debug info
  console.log('Sidebar render - admin:', admin);
  console.log('Sidebar render - logout function:', typeof logout);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">
          🚀 Admin Panel
        </h2>
        <p className="sidebar-subtitle">Job Portal Management</p>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path} className="nav-item">
                <Link 
                  to={item.path} 
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="user-profile">
        <div className="user-info-section">
          <div className="user-avatar">
            <FiUser className="user-avatar-icon" />
          </div>
          <div className="user-details">
            <div className="user-name">
              {admin && admin.firstName && admin.lastName 
                ? `${admin.firstName} ${admin.lastName}` 
                : 'Admin User'
              }
            </div>
            <div className="user-role">
              {admin && admin.role ? admin.role : 'Administrator'}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="logout-btn"
          type="button"
        >
          <FiLogOut className="logout-icon" />
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
