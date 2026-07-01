import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricCard = ({ title, value, subtitle, icon, trend, trendValue, variant = 'default' }) => {
  const variantStyles = {
    default: 'bg-card border-border',
    success: 'bg-success/10 border-success/20',
    warning: 'bg-warning/10 border-warning/20',
    danger: 'bg-error/10 border-error/20',
    primary: 'bg-primary/10 border-primary/20'
  };

  const iconColors = {
    default: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-error',
    primary: 'text-primary'
  };

  return (
    <div className={`${variantStyles?.[variant]} border rounded-xl p-4 md:p-6 transition-all duration-250 hover:shadow-warm-md`}>
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className="flex-1">
          <p className="text-xs md:text-sm font-caption text-muted-foreground uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`${iconColors?.[variant]} bg-background/50 rounded-lg p-2 md:p-3`}>
          <Icon name={icon} size={24} className="md:w-7 md:h-7 lg:w-8 lg:h-8" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-2 pt-3 border-t border-border/50">
          <Icon 
            name={trend === 'up' ? 'TrendingUp' : trend === 'down' ? 'TrendingDown' : 'Minus'} 
            size={16} 
            className={trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-muted-foreground'}
          />
          <span className={`text-xs md:text-sm font-medium ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-muted-foreground'}`}>
            {trendValue}
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;