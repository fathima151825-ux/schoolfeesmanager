import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActions = ({ student, onAction }) => {
  const actions = [
    {
      id: 'send-reminder',
      label: 'Send Payment Reminder',
      icon: 'Bell',
      variant: 'default',
      description: 'Send SMS/Email reminder for pending payments'
    },
    {
      id: 'generate-report',
      label: 'Generate Student Report',
      icon: 'FileText',
      variant: 'outline',
      description: 'Export complete fee and payment history'
    },
    {
      id: 'regenerate-receipt',
      label: 'Regenerate Receipt',
      icon: 'Receipt',
      variant: 'outline',
      description: 'Regenerate receipt for any payment'
    },
    {
      id: 'export-data',
      label: 'Export Student Data',
      icon: 'Download',
      variant: 'outline',
      description: 'Download student data in Excel format'
    }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6 lg:p-8">
      <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions?.map((action) => (
          <div
            key={action?.id}
            className="bg-muted/30 rounded-lg p-4 border border-border hover:border-primary/50 transition-all duration-250 cursor-pointer group"
            onClick={() => onAction(action?.id)}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors duration-250">
                <Icon name={action?.icon} size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm md:text-base font-medium text-foreground mb-1 group-hover:text-primary transition-colors duration-250">
                  {action?.label}
                </h4>
                <p className="text-xs md:text-sm text-muted-foreground font-caption">
                  {action?.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            iconName="ArrowLeft"
            iconPosition="left"
            fullWidth
            className="sm:flex-1"
            onClick={() => window.history?.back()}
          >
            Back to Student List
          </Button>
          <Button
            variant="default"
            iconName="LayoutDashboard"
            iconPosition="left"
            fullWidth
            className="sm:flex-1"
            onClick={() => window.location.href = '/admin-dashboard'}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;