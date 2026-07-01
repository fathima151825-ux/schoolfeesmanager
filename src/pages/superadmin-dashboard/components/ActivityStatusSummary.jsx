import React, { useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const ActivityStatusSummary = ({ adminUsers = [] }) => {
  const summary = useMemo(() => {
    const total = adminUsers?.length || 0;
    const active = adminUsers?.filter(a => a?.is_active)?.length || 0;
    const inactive = total - active;
    const owners = adminUsers?.filter(a => a?.role === 'owner')?.length || 0;
    const admins = adminUsers?.filter(a => a?.role === 'admin')?.length || 0;

    // Recent activity: admins created in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentlyAdded = adminUsers?.filter(a => {
      if (!a?.created_at) return false;
      return new Date(a.created_at) > sevenDaysAgo;
    })?.length || 0;

    return { total, active, inactive, owners, admins, recentlyAdded };
  }, [adminUsers]);

  const recentAdmins = useMemo(() => {
    return [...(adminUsers || [])]?.sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0))?.slice(0, 5);
  }, [adminUsers]);

  const metrics = [
    { label: 'Total Admins', value: summary?.total, icon: 'Users', color: 'primary', bg: 'bg-primary/10' },
    { label: 'Active', value: summary?.active, icon: 'UserCheck', color: 'success', bg: 'bg-success/10' },
    { label: 'Inactive', value: summary?.inactive, icon: 'UserX', color: 'warning', bg: 'bg-warning/10' },
    { label: 'New (7 days)', value: summary?.recentlyAdded, icon: 'UserPlus', color: 'accent', bg: 'bg-accent/10' },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
          <Icon name="Activity" size={17} className="text-success" />
        </div>
        <div>
          <h2 className="text-base font-heading font-semibold text-foreground">Admin Activity Summary</h2>
          <p className="text-xs text-muted-foreground">Status overview and recent admin activity</p>
        </div>
      </div>
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {metrics?.map(m => (
          <div key={m?.label} className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/20 border border-border text-center">
            <div className={`w-8 h-8 rounded-lg ${m?.bg} flex items-center justify-center mb-2`}>
              <Icon name={m?.icon} size={15} className={`text-${m?.color}`} />
            </div>
            <p className="text-xl font-bold text-foreground leading-none mb-1">{m?.value}</p>
            <p className="text-xs text-muted-foreground">{m?.label}</p>
          </div>
        ))}
      </div>
      {/* Role Breakdown Bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground font-medium">Role Distribution</span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              Admin ({summary?.admins})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-accent inline-block" />
              Owner ({summary?.owners})
            </span>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden flex">
          {summary?.total > 0 && (
            <>
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(summary?.admins / summary?.total) * 100}%` }}
              />
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${(summary?.owners / summary?.total) * 100}%` }}
              />
            </>
          )}
          {summary?.total === 0 && <div className="h-full w-full bg-muted" />}
        </div>
      </div>
      {/* Recent Admins */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Recent Admin Accounts</p>
        {recentAdmins?.length === 0 ? (
          <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed border-border">
            <Icon name="Clock" size={20} className="text-muted-foreground mx-auto mb-1.5" />
            <p className="text-xs text-muted-foreground">No admin accounts yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentAdmins?.map(admin => (
              <div key={admin?.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-colors">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="User" size={13} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground truncate">{admin?.full_name || admin?.username}</p>
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${
                      admin?.role === 'owner' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'
                    }`}>
                      <Icon name={admin?.role === 'owner' ? 'Crown' : 'UserCog'} size={9} />
                      {admin?.role === 'owner' ? 'Owner' : 'Admin'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">@{admin?.username}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                    admin?.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${admin?.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
                    {admin?.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(admin?.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityStatusSummary;
