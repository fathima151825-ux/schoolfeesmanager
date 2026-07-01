import React from 'react';
import Icon from '../../../components/AppIcon';

const SecurityFeatures = () => {
  const features = [
    {
      icon: 'Shield',
      title: 'Secure Access',
      description: 'Role-based authentication ensures only authorized personnel can access administrative functions'
    },
    {
      icon: 'Clock',
      title: 'Session Management',
      description: 'Automatic timeout for sensitive data protection during inactive periods'
    },
    {
      icon: 'Lock',
      title: 'Data Protection',
      description: 'All administrative actions are logged and secured with encryption'
    }
  ];

  return (
    <div className="mt-8 md:mt-10 lg:mt-12 space-y-4 md:space-y-5 lg:space-y-6">
      <div className="flex items-center gap-2">
        <Icon name="ShieldCheck" size={24} className="text-primary" />
        <h3 className="text-base md:text-lg font-semibold text-foreground">
          Security Features
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-3 md:gap-4">
        {features?.map((feature, index) => (
          <div 
            key={index}
            className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name={feature?.icon} size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm md:text-base font-semibold text-foreground mb-1">
                {feature?.title}
              </h4>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {feature?.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityFeatures;