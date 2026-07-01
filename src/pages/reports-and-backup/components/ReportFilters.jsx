import React from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const ReportFilters = ({ filters, academicYearOptions = [], onFilterChange, onGenerate, onReset }) => {
  const classOptions = [
    { value: 'all', label: 'All Classes' },
    { value: 'LKG', label: 'LKG' },
    { value: 'UKG', label: 'UKG' },
    { value: '1', label: 'Class 1' },
    { value: '2', label: 'Class 2' },
    { value: '3', label: 'Class 3' },
    { value: '4', label: 'Class 4' },
    { value: '5', label: 'Class 5' },
    { value: '6', label: 'Class 6' },
    { value: '7', label: 'Class 7' },
    { value: '8', label: 'Class 8' },
    { value: '9', label: 'Class 9' },
    { value: '10', label: 'Class 10' },
    { value: '11', label: 'Class 11' },
    { value: '12', label: 'Class 12' }
  ];

  const sectionOptions = [
    { value: 'all', label: 'All Sections' },
    { value: 'A', label: 'Section A' },
    { value: 'B', label: 'Section B' },
    { value: 'C', label: 'Section C' }
  ];

  const paymentStatusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'paid', label: 'Fully Paid' },
    { value: 'partial', label: 'Partially Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' }
  ];

  const termOptions = [
    { value: 'all', label: 'All Terms' },
    { value: 'term1', label: 'Term 1' },
    { value: 'term2', label: 'Term 2' },
    { value: 'term3', label: 'Term 3' }
  ];

  const paymentMethodOptions = [
    { value: 'all', label: 'All Methods' },
    { value: 'online', label: 'Online Payment' },
    { value: 'cash', label: 'Cash Payment' },
    { value: 'upi', label: 'UPI Payment' }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="Filter" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
              Report Filters
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground font-caption">
              Customize your report parameters
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          iconName="RotateCcw"
          onClick={onReset}
        >
          Reset
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Select
          label="Academic Year"
          options={academicYearOptions?.length > 0 ? academicYearOptions : [{ value: '', label: 'Loading...' }]}
          value={filters?.academicYearId}
          onChange={(value) => onFilterChange('academicYearId', value)}
          required
        />

        <Input
          label="From Date"
          type="date"
          value={filters?.fromDate}
          onChange={(e) => onFilterChange('fromDate', e?.target?.value)}
        />

        <Input
          label="To Date"
          type="date"
          value={filters?.toDate}
          onChange={(e) => onFilterChange('toDate', e?.target?.value)}
        />

        <Select
          label="Class"
          options={classOptions}
          value={filters?.class}
          onChange={(value) => onFilterChange('class', value)}
        />

        <Select
          label="Section"
          options={sectionOptions}
          value={filters?.section}
          onChange={(value) => onFilterChange('section', value)}
        />

        <Select
          label="Payment Status"
          options={paymentStatusOptions}
          value={filters?.paymentStatus}
          onChange={(value) => onFilterChange('paymentStatus', value)}
        />

        <Select
          label="Term"
          options={termOptions}
          value={filters?.term}
          onChange={(value) => onFilterChange('term', value)}
        />

        <Select
          label="Payment Method"
          options={paymentMethodOptions}
          value={filters?.paymentMethod}
          onChange={(value) => onFilterChange('paymentMethod', value)}
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button
          variant="default"
          iconName="FileText"
          iconPosition="left"
          onClick={onGenerate}
          fullWidth
          className="sm:flex-1"
        >
          Generate Report
        </Button>
      </div>
    </div>
  );
};

export default ReportFilters;