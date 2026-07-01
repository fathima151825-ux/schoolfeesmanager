import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandHeader from '../../components/ui/BrandHeader';
import Icon from '../../components/AppIcon';
import AppImage from '../../components/AppImage';
import Button from '../../components/ui/Button';
import AdminUsersTable from './components/AdminUsersTable';
import CreateAdminModal from './components/CreateAdminModal';
import PermissionManagement from './components/PermissionManagement';
import RoleAssignmentControls from './components/RoleAssignmentControls';
import ActivityStatusSummary from './components/ActivityStatusSummary';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from '../../services/authService';
import { signOutSuperAdmin, listAdminUsers, toggleAdminUserStatus } from '../../services/superAdminService';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [adminUsers, setAdminUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('users');

  const fetchStats = useCallback(async () => {
    try {
      const data = await listAdminUsers();
      setAdminUsers(data || []);
      setStats({
        total: data?.length || 0,
        active: data?.filter(a => a?.is_active)?.length || 0,
      });
    } catch {
      // ignore stats errors
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  const handleLogout = async () => {
    try {
      signOutSuperAdmin();
      await signOut();
    } catch {
      // ignore
    } finally {
      navigate('/superadmin-login');
    }
  };

  const handleAdminCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleRoleChange = async (adminId, newRole) => {
    // Update role via toggleAdminUserStatus pattern — update the record
    const { supabase } = await import('../../lib/supabase');
    const { error } = await supabase
      ?.from('admin_users')
      ?.update({ role: newRole, updated_at: new Date()?.toISOString() })
      ?.eq('id', adminId);
    if (error) throw new Error(error.message);
    await fetchStats();
  };

  // Get superadmin name from context or sessionStorage
  const getSuperAdminName = () => {
    if (profile?.full_name) return profile?.full_name;
    try {
      const stored = sessionStorage.getItem('superadmin_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.fullName || parsed?.username || 'Super Admin';
      }
    } catch {
      // ignore
    }
    return 'Super Admin';
  };

  const tabs = [
    { id: 'users', label: 'Admin Users', icon: 'Users' },
    { id: 'permissions', label: 'Permissions', icon: 'ShieldCheck' },
    { id: 'roles', label: 'Role Assignment', icon: 'UserCheck' },
    { id: 'activity', label: 'Activity Summary', icon: 'Activity' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BrandHeader variant="admin" />
      {/* Top bar */}
      <div className="bg-card border-b border-border px-4 md:px-6 lg:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="ShieldCheck" size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Superadmin Panel</p>
              <p className="text-xs text-muted-foreground">{getSuperAdminName()}</p>
            </div>
          </div>
          <Button
            variant="outline"
            iconName="LogOut"
            iconPosition="left"
            onClick={handleLogout}
            className="text-sm"
          >
            Logout
          </Button>
        </div>
      </div>
      <main className="flex-1 container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-1">
              Superadmin Dashboard
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Manage admin users, permissions, roles, and monitor system activity.
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 md:mb-8">
            <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name="Users" size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Admins</p>
                <p className="text-xl font-bold text-foreground">{stats?.total}</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Icon name="UserCheck" size={20} className="text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Admins</p>
                <p className="text-xl font-bold text-foreground">{stats?.active}</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Icon name="ShieldCheck" size={20} className="text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Your Role</p>
                <p className="text-sm font-bold text-foreground">Superadmin</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mb-6 overflow-x-auto pb-1 border-b border-border">
            {tabs?.map(tab => (
              <button
                key={tab?.id}
                onClick={() => setActiveTab(tab?.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                  activeTab === tab?.id
                    ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon name={tab?.icon} size={15} />
                {tab?.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'users' && (
            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <AdminUsersTable
                key={refreshKey}
                onCreateNew={() => setShowCreateModal(true)}
                onDataChange={fetchStats}
              />
            </div>
          )}

          {activeTab === 'permissions' && (
            <PermissionManagement />
          )}

          {activeTab === 'roles' && (
            <RoleAssignmentControls
              adminUsers={adminUsers}
              onRoleChange={handleRoleChange}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityStatusSummary adminUsers={adminUsers} />
          )}
        </div>
      </main>
      <footer className="border-t border-border bg-card mt-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            <AppImage
              src="/assets/images/Untitled_design-1775296554870.png"
              alt="Sri Saraswathi Vidhya Mandir School Logo"
              className="w-4 h-4 object-contain"
            />
            <p className="text-xs text-muted-foreground">
              © {new Date()?.getFullYear()} Sri Saraswathi Vidhya Mandir — Developed by ZAMZAM Infotech
            </p>
          </div>
        </div>
      </footer>
      {showCreateModal && (
        <CreateAdminModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleAdminCreated}
        />
      )}
    </div>
  );
};

export default SuperAdminDashboard;
