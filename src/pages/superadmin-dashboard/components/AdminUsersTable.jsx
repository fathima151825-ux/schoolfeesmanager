import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { listAdminUsers, toggleAdminUserStatus, deleteAdminUser } from '../../../services/superAdminService';

const AdminUsersTable = ({ onCreateNew, onDataChange }) => {
  const [adminUsers, setAdminUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAdminUsers();
      setAdminUsers(data || []);
      onDataChange?.();
    } catch (err) {
      setError(err?.message || 'Failed to load admin users');
    } finally {
      setIsLoading(false);
    }
  }, [onDataChange]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleToggleStatus = async (id, currentStatus) => {
    setActionLoading(id + '_toggle');
    try {
      await toggleAdminUserStatus(id, !currentStatus);
      await fetchAdmins();
    } catch (err) {
      setError(err?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Delete admin "${username}"? This cannot be undone.`)) return;
    setActionLoading(id + '_delete');
    try {
      await deleteAdminUser(id);
      await fetchAdmins();
    } catch (err) {
      setError(err?.message || 'Failed to delete admin');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {/* Table Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
          <Icon name="Users" size={20} className="text-primary" />
          Admin Users
          {!isLoading && (
            <span className="text-sm font-normal text-muted-foreground">
              ({adminUsers?.length})
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdmins}
            disabled={isLoading}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <Icon name={isLoading ? 'Loader2' : 'RefreshCw'} size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <Button variant="default" iconName="UserPlus" iconPosition="left" onClick={onCreateNew}>
            Create Admin
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg mb-4">
          <Icon name="AlertCircle" size={18} className="text-error flex-shrink-0" />
          <p className="text-sm text-error flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-error hover:text-error/70">
            <Icon name="X" size={16} />
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Icon name="Loader2" size={36} className="text-primary animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading admin users...</p>
          </div>
        </div>
      ) : adminUsers?.length === 0 ? (
        /* Empty state */
        <div className="text-center py-16 bg-muted/20 rounded-lg border border-dashed border-border">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Icon name="UserX" size={28} className="text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground mb-1">No admin users yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Click "Create Admin" to add the first admin user.
          </p>
          <Button variant="default" iconName="UserPlus" iconPosition="left" onClick={onCreateNew}>
            Create First Admin
          </Button>
        </div>
      ) : (
        /* Table */
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Username</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Full Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Created</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {adminUsers?.map((admin) => (
                <tr key={admin?.id} className="bg-card hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon name="User" size={15} className="text-primary" />
                      </div>
                      <span className="font-mono font-medium text-foreground">{admin?.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{admin?.full_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      admin?.role === 'owner' ?'bg-accent/10 text-accent' :'bg-primary/10 text-primary'
                    }`}>
                      <Icon name={admin?.role === 'owner' ? 'Crown' : 'UserCog'} size={11} />
                      {admin?.role === 'owner' ? 'Owner' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                      admin?.is_active
                        ? 'bg-success/10 text-success' :'bg-muted text-muted-foreground'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${admin?.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
                      {admin?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {admin?.created_at ? new Date(admin.created_at)?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Toggle Active/Inactive */}
                      <button
                        onClick={() => handleToggleStatus(admin?.id, admin?.is_active)}
                        disabled={!!actionLoading}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                          admin?.is_active
                            ? 'text-warning bg-warning/10 hover:bg-warning/20' :'text-success bg-success/10 hover:bg-success/20'
                        }`}
                        title={admin?.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {actionLoading === admin?.id + '_toggle' ? (
                          <Icon name="Loader2" size={13} className="animate-spin" />
                        ) : (
                          <Icon name={admin?.is_active ? 'ToggleRight' : 'ToggleLeft'} size={13} />
                        )}
                        <span className="hidden sm:inline">
                          {admin?.is_active ? 'Deactivate' : 'Activate'}
                        </span>
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(admin?.id, admin?.username)}
                        disabled={!!actionLoading}
                        className="p-1.5 rounded text-muted-foreground hover:text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                        title="Delete admin"
                      >
                        {actionLoading === admin?.id + '_delete' ? (
                          <Icon name="Loader2" size={15} className="animate-spin" />
                        ) : (
                          <Icon name="Trash2" size={15} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsersTable;
