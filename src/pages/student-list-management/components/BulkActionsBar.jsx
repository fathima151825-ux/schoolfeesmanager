import React from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const BulkActionsBar = ({ selectedCount, onSendReminders, onGenerateReport, onClearSelection }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 lg:bottom-6">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-warm-lg px-4 py-3 md:px-6 md:py-4 flex items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2">
          <Icon name="CheckSquare" size={20} />
          <span className="font-medium text-sm md:text-base">
            {selectedCount} student{selectedCount > 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="h-6 w-px bg-primary-foreground/30" />

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSendReminders}
            iconName="Bell"
            iconPosition="left"
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            Send Reminders
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onGenerateReport}
            iconName="FileText"
            iconPosition="left"
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            Generate Report
          </Button>

          <button
            onClick={onClearSelection}
            className="text-primary-foreground hover:bg-primary-foreground/10 p-2 rounded-md transition-colors"
            aria-label="Clear selection"
          >
            <Icon name="X" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;