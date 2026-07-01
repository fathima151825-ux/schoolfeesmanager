import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActionCard = ({ title, description, icon, actionLabel, actionPath, variant = 'default' }) => {
  const navigate = useNavigate();

  const variantStyles = {
    default: 'bg-card',
    primary: 'bg-primary/5',
    success: 'bg-success/5',
    warning: 'bg-warning/5'
  };

  const iconColors = {
    default: 'text-primary',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning'
  };

  return (
    <div className={`${variantStyles?.[variant]} border border-border rounded-xl p-4 md:p-6 transition-all duration-250 hover:shadow-warm-md`}>
      <div className="flex items-start gap-4 mb-4">
        <div className={`${iconColors?.[variant]} bg-background rounded-lg p-3 flex-shrink-0`}>
          <Icon name={icon} size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base md:text-lg font-heading font-semibold text-foreground mb-1">
            {title}
          </h4>
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        fullWidth
        iconName="ArrowRight"
        iconPosition="right"
        onClick={() => navigate(actionPath)}
      >
        {actionLabel}
      </Button>
    </div>
  );
};

export default QuickActionCard;