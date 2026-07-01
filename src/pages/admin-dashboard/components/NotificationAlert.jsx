import React from 'react';
import Icon from '../../../components/AppIcon';

const NotificationAlert = ({ type = 'info', title, message, count, timestamp }) => {
  const typeStyles = {
    info: 'bg-primary/10 border-primary/20 text-primary',
    success: 'bg-success/10 border-success/20 text-success',
    warning: 'bg-warning/10 border-warning/20 text-warning',
    error: 'bg-error/10 border-error/20 text-error'
  };

  const icons = {
    info: 'Info',
    success: 'CheckCircle',
    warning: 'AlertTriangle',
    error: 'AlertCircle'
  };

  return (
    <div className={`${typeStyles?.[type]} border rounded-lg p-3 md:p-4 transition-all duration-250 hover:shadow-warm`}>
      <div className="flex items-start gap-3">
        <Icon name={icons?.[type]} size={20} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h5 className="text-sm md:text-base font-medium text-foreground">
              {title}
            </h5>
            {count && (
              <span className="px-2 py-0.5 bg-background rounded-full text-xs font-medium whitespace-nowrap">
                {count}
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-foreground/80 mb-1">
            {message}
          </p>
          {timestamp && (
            <p className="text-xs text-muted-foreground">
              {timestamp}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationAlert;