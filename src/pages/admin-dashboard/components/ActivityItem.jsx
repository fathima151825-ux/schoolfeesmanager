import React from 'react';
import Icon from '../../../components/AppIcon';

const ActivityItem = ({ type, title, description, timestamp, amount, status }) => {
  const typeIcons = {
    payment: 'CreditCard',
    registration: 'UserPlus',
    update: 'Edit',
    backup: 'Database',
    reminder: 'Bell'
  };

  const statusColors = {
    success: 'text-success',
    pending: 'text-warning',
    failed: 'text-error',
    info: 'text-primary'
  };

  return (
    <div className="flex items-start gap-3 p-3 md:p-4 hover:bg-muted/50 rounded-lg transition-all duration-250">
      <div className="bg-primary/10 text-primary rounded-lg p-2 flex-shrink-0">
        <Icon name={typeIcons?.[type] || 'Activity'} size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h6 className="text-sm md:text-base font-medium text-foreground">
            {title}
          </h6>
          {amount && (
            <span className="text-sm md:text-base font-semibold text-foreground whitespace-nowrap">
              ₹{amount?.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        <p className="text-xs md:text-sm text-muted-foreground mb-1 line-clamp-2">
          {description}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {timestamp}
          </span>
          {status && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className={`text-xs font-medium ${statusColors?.[status]}`}>
                {status?.charAt(0)?.toUpperCase() + status?.slice(1)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityItem;