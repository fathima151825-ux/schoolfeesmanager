import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ReportTypeCard = ({ title, description, icon, stats, onExportExcel, onExportPDF, onPreview }) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6 hover:shadow-warm-md transition-all duration-250">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon name={icon} size={24} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-1">
            {title}
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground font-caption line-clamp-2">
            {description}
          </p>
        </div>
      </div>
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
          {stats?.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-xs text-muted-foreground font-caption mb-1">
                {stat?.label}
              </p>
              <p className="text-sm md:text-base font-semibold text-foreground data-text">
                {stat?.value}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          size="sm"
          iconName="Eye"
          onClick={onPreview}
          fullWidth
          className="sm:flex-1"
        >
          Preview
        </Button>
        <Button
          variant="outline"
          size="sm"
          iconName="FileSpreadsheet"
          onClick={onExportExcel}
          fullWidth
          className="sm:flex-1"
        >
          Excel
        </Button>
        <Button
          variant="default"
          size="sm"
          iconName="FileText"
          onClick={onExportPDF}
          fullWidth
          className="sm:flex-1"
        >
          PDF
        </Button>
      </div>
    </div>
  );
};

export default ReportTypeCard;