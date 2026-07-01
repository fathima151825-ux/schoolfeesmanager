import React from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const FilterToolbar = ({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  resultCount,
  onExport,
  onBulkUpload,
  onBulkImageUpload,
  classes = []
}) => {
  // Build class options from classes master table (UUID values)
  const classOptions = [
    { value: 'all', label: 'All Classes' },
    ...classes?.map(c => ({ value: c?.id, label: c?.displayName || c?.display_name || `Class ${c?.name}` }))
  ];

  const sectionOptions = [
    { value: 'all', label: 'All Sections' },
    { value: 'A', label: 'Section A' },
    { value: 'B', label: 'Section B' },
    { value: 'C', label: 'Section C' },
    { value: 'D', label: 'Section D' }
  ];

  const academicYearOptions = [
    { value: 'all', label: 'All Years' },
    { value: '2025-2026', label: '2025-2026' },
    { value: '2024-2025', label: '2024-2025' },
    { value: '2023-2024', label: '2023-2024' },
    { value: '2022-2023', label: '2022-2023' }
  ];

  const paymentStatusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'paid', label: 'Fully Paid' },
    { value: 'partial', label: 'Partially Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6 mb-4 md:mb-6">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search by name or admission number..."
            value={filters?.search}
            onChange={(e) => onFilterChange('search', e?.target?.value)}
            className="w-full"
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 flex-1">
          <Select
            options={classOptions}
            value={filters?.class}
            onChange={(value) => onFilterChange('class', value)}
            placeholder="Class"
          />
          
          <Select
            options={sectionOptions}
            value={filters?.section}
            onChange={(value) => onFilterChange('section', value)}
            placeholder="Section"
          />
          
          <Select
            options={academicYearOptions}
            value={filters?.academicYear}
            onChange={(value) => onFilterChange('academicYear', value)}
            placeholder="Year"
          />
          
          <Select
            options={paymentStatusOptions}
            value={filters?.paymentStatus}
            onChange={(value) => onFilterChange('paymentStatus', value)}
            placeholder="Status"
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon name="Users" size={16} />
          <span className="font-medium">{resultCount} students found</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            iconName="X"
            iconPosition="left"
          >
            Clear Filters
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={onBulkUpload}
            iconName="Upload"
            iconPosition="left"
          >
            Bulk Upload
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onBulkImageUpload}
            iconName="Images"
            iconPosition="left"
          >
            Upload Photos
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            iconName="Download"
            iconPosition="left"
          >
            Export
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterToolbar;