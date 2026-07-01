import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const EmptyState = ({ onClearFilters }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-16 lg:py-20 px-4">
      <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-muted flex items-center justify-center mb-4 md:mb-6">
        <Icon name="Users" size={32} className="text-muted-foreground" />
      </div>
      
      <h3 className="text-lg md:text-xl lg:text-2xl font-heading font-semibold text-foreground mb-2">
        No Students Found
      </h3>
      
      <p className="text-sm md:text-base text-muted-foreground text-center max-w-md mb-6">
        No students match your current filter criteria. Try adjusting your filters or clearing them to see all students.
      </p>

      <Button
        variant="outline"
        onClick={onClearFilters}
        iconName="RefreshCw"
        iconPosition="left"
      >
        Clear All Filters
      </Button>
    </div>
  );
};

export default EmptyState;