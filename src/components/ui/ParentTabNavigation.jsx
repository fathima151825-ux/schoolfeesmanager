import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const ParentTabNavigation = () => {
  const location = useLocation();

  const tabs = [
    {
      label: 'Dashboard',
      path: '/parent-dashboard',
      icon: 'LayoutDashboard'
    },
    {
      label: 'Pay Fees',
      path: '/fee-payment',
      icon: 'CreditCard'
    },
    {
      label: 'History',
      path: '/payment-history',
      icon: 'Receipt'
    },
    {
      label: 'Logout',
      path: '/parent-login',
      icon: 'LogOut'
    }
  ];

  const isActive = (path) => location?.pathname === path;

  return (
    <nav className="parent-tab-nav">
      <div className="flex justify-around items-center lg:justify-start lg:gap-2 lg:px-6">
        {tabs?.map((tab) => (
          <Link
            key={tab?.path}
            to={tab?.path}
            className={`parent-tab-item ${isActive(tab?.path) ? 'active' : ''}`}
          >
            <Icon 
              name={tab?.icon} 
              size={24} 
              className="parent-tab-icon"
            />
            <span className="text-xs lg:text-sm font-caption">
              {tab?.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default ParentTabNavigation;