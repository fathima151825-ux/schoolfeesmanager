import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const PERMISSIONS = [
  { key: 'view_students', label: 'View Students', description: 'Access student list and profiles', icon: 'Users' },
  { key: 'manage_students', label: 'Manage Students', description: 'Add, edit, delete student records', icon: 'UserCog' },
  { key: 'view_payments', label: 'View Payments', description: 'View payment history and records', icon: 'Eye' },
  { key: 'process_payments', label: 'Process Payments', description: 'Record and process fee payments', icon: 'CreditCard' },
  { key: 'manage_fees', label: 'Manage Fee Structure', description: 'Configure fee categories and amounts', icon: 'Settings' },
  { key: 'view_reports', label: 'View Reports', description: 'Access reports and analytics', icon: 'BarChart2' },
  { key: 'export_data', label: 'Export Data', description: 'Export reports and backup data', icon: 'Download' },
  { key: 'manage_ads', label: 'Manage Advertisements', description: 'Upload and manage ad content', icon: 'Megaphone' },
];

const DEFAULT_PERMISSIONS = {
  admin: {
    view_students: true,
    manage_students: true,
    view_payments: true,
    process_payments: true,
    manage_fees: false,
    view_reports: true,
    export_data: false,
    manage_ads: false,
  },
  owner: {
    view_students: true,
    manage_students: true,
    view_payments: true,
    process_payments: true,
    manage_fees: true,
    view_reports: true,
    export_data: true,
    manage_ads: true,
  },
};

const PermissionManagement = () => {
  const [activeRole, setActiveRole] = useState('admin');
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [saved, setSaved] = useState(false);

  const handleToggle = (permKey) => {
    setPermissions(prev => ({
      ...prev,
      [activeRole]: {
        ...prev?.[activeRole],
        [permKey]: !prev?.[activeRole]?.[permKey],
      },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    // In a real implementation, this would persist to the backend
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const enabledCount = Object.values(permissions?.[activeRole])?.filter(Boolean)?.length;

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="ShieldCheck" size={17} className="text-primary" />
          </div>
          <div>
            <h2 className="text-base font-heading font-semibold text-foreground">Permission Management</h2>
            <p className="text-xs text-muted-foreground">Configure access rights per role</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            saved
              ? 'bg-success/10 text-success border border-success/20' :'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          <Icon name={saved ? 'CheckCircle' : 'Save'} size={13} />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
      {/* Role Tabs */}
      <div className="flex gap-2 mb-5 p-1 bg-muted/40 rounded-lg w-fit">
        {['admin', 'owner']?.map(role => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeRole === role
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name={role === 'owner' ? 'Crown' : 'UserCog'} size={14} />
            {role === 'owner' ? 'Owner' : 'Admin'}
          </button>
        ))}
      </div>
      {/* Permission count badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{enabledCount}</span> of {PERMISSIONS?.length} permissions enabled for{' '}
          <span className="font-semibold text-primary capitalize">{activeRole}</span>
        </span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(enabledCount / PERMISSIONS?.length) * 100}%` }}
          />
        </div>
      </div>
      {/* Permissions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {PERMISSIONS?.map(perm => {
          const isEnabled = permissions?.[activeRole]?.[perm?.key];
          return (
            <div
              key={perm?.key}
              onClick={() => handleToggle(perm?.key)}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none ${
                isEnabled
                  ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' :'bg-muted/20 border-border hover:bg-muted/40'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isEnabled ? 'bg-primary/15' : 'bg-muted/50'
              }`}>
                <Icon name={perm?.icon} size={15} className={isEnabled ? 'text-primary' : 'text-muted-foreground'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {perm?.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">{perm?.description}</p>
              </div>
              {/* Toggle */}
              <div className={`w-9 h-5 rounded-full flex-shrink-0 relative transition-colors ${
                isEnabled ? 'bg-primary' : 'bg-muted'
              }`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  isEnabled ? 'left-[18px]' : 'left-0.5'
                }`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PermissionManagement;
