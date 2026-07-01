import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const EmptyState = ({ onClearFilters, hasFilters }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-8 md:p-12 text-center">
      <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 bg-muted rounded-full flex items-center justify-center">
        <Icon name="Receipt" size={40} className="text-muted-foreground" />
      </div>
      <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2 font-heading">
        No Payment Records Found
      </h3>
      <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-md mx-auto">
        {hasFilters 
          ? "No payments match your current filters. Try adjusting your search criteria." :"You haven't made any payments yet. Start by making your first fee payment."}
      </p>
      {hasFilters && (
        <Button
          variant="outline"
          iconName="X"
          iconPosition="left"
          onClick={onClearFilters}
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );
};

export default EmptyState;