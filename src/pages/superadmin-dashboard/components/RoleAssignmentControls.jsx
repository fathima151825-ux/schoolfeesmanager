import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const ROLE_DEFINITIONS = [
  {
    role: 'admin',
    label: 'Admin',
    icon: 'UserCog',
    color: 'primary',
    description: 'Standard access to student and payment management',
    capabilities: ['View & manage students', 'Process payments', 'View reports'],
  },
  {
    role: 'owner',
    label: 'Owner',
    icon: 'Crown',
    color: 'accent',
    description: 'Full access including fee structure and data export',
    capabilities: ['All Admin capabilities', 'Manage fee structure', 'Export & backup data', 'Manage advertisements'],
  },
];

const RoleAssignmentControls = ({ adminUsers = [], onRoleChange }) => {
  const [changingId, setChangingId] = useState(null);
  const [successId, setSuccessId] = useState(null);

  const handleRoleChange = async (admin, newRole) => {
    if (admin?.role === newRole || changingId) return;
    setChangingId(admin?.id);
    try {
      await onRoleChange?.(admin?.id, newRole);
      setSuccessId(admin?.id);
      setTimeout(() => setSuccessId(null), 2000);
    } catch {
      // ignore
    } finally {
      setChangingId(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Icon name="UserCheck" size={17} className="text-accent" />
        </div>
        <div>
          <h2 className="text-base font-heading font-semibold text-foreground">Role Assignment</h2>
          <p className="text-xs text-muted-foreground">Assign and manage roles for admin users</p>
        </div>
      </div>
      {/* Role Definitions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {ROLE_DEFINITIONS?.map(def => (
          <div key={def?.role} className={`p-3 rounded-lg border ${
            def?.color === 'accent' ? 'bg-accent/5 border-accent/20' : 'bg-primary/5 border-primary/20'
          }`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name={def?.icon} size={15} className={def?.color === 'accent' ? 'text-accent' : 'text-primary'} />
              <span className={`text-sm font-semibold ${def?.color === 'accent' ? 'text-accent' : 'text-primary'}`}>
                {def?.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{def?.description}</p>
            <ul className="space-y-0.5">
              {def?.capabilities?.map(cap => (
                <li key={cap} className="flex items-center gap-1.5 text-xs text-foreground">
                  <Icon name="Check" size={11} className={def?.color === 'accent' ? 'text-accent' : 'text-primary'} />
                  {cap}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {/* Admin Role Assignment Table */}
      {adminUsers?.length === 0 ? (
        <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed border-border">
          <Icon name="Users" size={24} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No admin users to assign roles to</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Current Assignments</p>
          {adminUsers?.map(admin => (
            <div key={admin?.id} className="flex items-center justify-between gap-3 p-3 bg-muted/20 rounded-lg border border-border">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="User" size={14} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{admin?.full_name || admin?.username}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">@{admin?.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {successId === admin?.id && (
                  <span className="text-xs text-success flex items-center gap-1">
                    <Icon name="CheckCircle" size={12} />
                    Updated
                  </span>
                )}
                {['admin', 'owner']?.map(role => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(admin, role)}
                    disabled={!!changingId}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all disabled:opacity-60 ${
                      admin?.role === role
                        ? role === 'owner' ?'bg-accent text-accent-foreground' :'bg-primary text-primary-foreground' :'bg-muted text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    {changingId === admin?.id ? (
                      <Icon name="Loader2" size={11} className="animate-spin" />
                    ) : (
                      <Icon name={role === 'owner' ? 'Crown' : 'UserCog'} size={11} />
                    )}
                    {role === 'owner' ? 'Owner' : 'Admin'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoleAssignmentControls;
