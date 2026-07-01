import React from 'react';
import Icon from '../../../components/AppIcon';

const ParentDetailsCard = ({ parentDetails }) => {
  return (
    <div className="bg-card rounded-xl shadow-warm-md p-4 md:p-6 lg:p-8 border border-border">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <Icon name="Users" size={20} className="text-primary" />
        <h3 className="text-lg md:text-xl lg:text-2xl font-heading font-semibold text-foreground">
          Parent Information
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-3 md:space-y-4">
          <div className="space-y-1">
            <p className="text-xs md:text-sm text-muted-foreground font-caption">Father's Name</p>
            <p className="text-sm md:text-base font-medium text-foreground">{parentDetails?.fatherName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs md:text-sm text-muted-foreground font-caption">Mother's Name</p>
            <p className="text-sm md:text-base font-medium text-foreground">{parentDetails?.motherName}</p>
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div className="space-y-1">
            <p className="text-xs md:text-sm text-muted-foreground font-caption">Mobile Number</p>
            <p className="text-sm md:text-base font-medium text-foreground data-text">
              {parentDetails?.mobileNumber}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs md:text-sm text-muted-foreground font-caption">Address</p>
            <p className="text-sm md:text-base font-medium text-foreground leading-relaxed">
              {parentDetails?.address}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDetailsCard;