import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import AppImage from '../AppImage';

const AdminSidebarNavigation = ({ isCollapsed = false }) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    studentManagement: true,
    reports: true
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev?.[section]
    }));
  };

  const isActive = (path) => location?.pathname === path;

  const mainNavItems = [
    {
      label: 'Dashboard',
      path: '/admin-dashboard',
      icon: 'LayoutDashboard'
    }
  ];

  const studentManagementItems = [
    {
      label: 'Student List',
      path: '/student-list-management',
      icon: 'Users'
    },
    {
      label: 'Student Details',
      path: '/student-detail-management',
      icon: 'UserCog'
    }
  ];

  const reportsItems = [
    {
      label: 'Payment Management',
      path: '/payment-management',
      icon: 'DollarSign'
    },
    {
      label: 'Fee Structure',
      path: '/fee-structure-management',
      icon: 'IndianRupee'
    },
    {
      label: 'Quick Cash Payment',
      path: '/quick-cash-payment',
      icon: 'Zap'
    },
    {
      label: 'Reports & Backup',
      path: '/reports-and-backup',
      icon: 'FileText'
    },
    {
      label: 'Academic Years',
      path: '/academic-year-management',
      icon: 'CalendarDays'
    },
    {
      label: 'Advertisements',
      path: '/advertisement-management',
      icon: 'Megaphone'
    }
  ];

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="mobile-menu-button"
        aria-label="Toggle menu"
      >
        <Icon name={isMobileOpen ? 'X' : 'Menu'} size={24} />
      </button>
      {isMobileOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={closeMobileMenu}
        />
      )}
      <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'block' : 'hidden lg:block'}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            <AppImage
              src="/assets/images/Untitled_design-1775296554870.png"
              alt="Sri Saraswathi Vidhya Mandir School Logo"
              className="w-12 h-12 object-contain"
            />
          </div>
          <div className="admin-sidebar-brand">
            <h2 className="text-lg font-heading font-semibold text-foreground">
              SSVM
            </h2>
            <p className="text-xs text-muted-foreground font-caption">
              Admin Portal
            </p>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {mainNavItems?.map((item) => (
            <Link
              key={item?.path}
              to={item?.path}
              onClick={closeMobileMenu}
              className={`admin-sidebar-item ${isActive(item?.path) ? 'active' : ''}`}
            >
              <Icon name={item?.icon} size={20} />
              <span className="admin-sidebar-label">{item?.label}</span>
            </Link>
          ))}

          <div className="admin-sidebar-section">
            <div 
              className="admin-sidebar-section-header"
              onClick={() => toggleSection('studentManagement')}
            >
              <span className={isCollapsed ? 'hidden' : ''}>Student Management</span>
              {!isCollapsed && (
                <Icon 
                  name={expandedSections?.studentManagement ? 'ChevronDown' : 'ChevronRight'} 
                  size={16} 
                />
              )}
            </div>
            {expandedSections?.studentManagement && (
              <div className="admin-sidebar-section-items">
                {studentManagementItems?.map((item) => (
                  <Link
                    key={item?.path}
                    to={item?.path}
                    onClick={closeMobileMenu}
                    className={`admin-sidebar-item ${isActive(item?.path) ? 'active' : ''}`}
                  >
                    <Icon name={item?.icon} size={20} />
                    <span className="admin-sidebar-label">{item?.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="admin-sidebar-section">
            <div 
              className="admin-sidebar-section-header"
              onClick={() => toggleSection('reports')}
            >
              <span className={isCollapsed ? 'hidden' : ''}>Reports</span>
              {!isCollapsed && (
                <Icon 
                  name={expandedSections?.reports ? 'ChevronDown' : 'ChevronRight'} 
                  size={16} 
                />
              )}
            </div>
            {expandedSections?.reports && (
              <div className="admin-sidebar-section-items">
                {reportsItems?.map((item) => (
                  <Link
                    key={item?.path}
                    to={item?.path}
                    onClick={closeMobileMenu}
                    className={`admin-sidebar-item ${isActive(item?.path) ? 'active' : ''}`}
                  >
                    <Icon name={item?.icon} size={20} />
                    <span className="admin-sidebar-label">{item?.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/admin-login"
            onClick={closeMobileMenu}
            className="admin-sidebar-item mt-auto"
          >
            <Icon name="LogOut" size={20} />
            <span className="admin-sidebar-label">Logout</span>
          </Link>
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebarNavigation;