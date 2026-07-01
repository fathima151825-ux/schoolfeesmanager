import React from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const FilterControls = ({ 
  academicYear, 
  onAcademicYearChange, 
  paymentMethod, 
  onPaymentMethodChange,
  searchTerm,
  onSearchChange,
  onClearFilters,
  academicYearOptions 
}) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 mb-6 shadow-warm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          label="Academic Year"
          options={academicYearOptions}
          value={academicYear}
          onChange={onAcademicYearChange}
          placeholder="Select year"
        />

        <Select
          label="Payment Method"
          options={[
            { value: 'all', label: 'All Methods' },
            { value: 'online', label: 'Online' },
            { value: 'cash', label: 'Cash' }
          ]}
          value={paymentMethod}
          onChange={onPaymentMethodChange}
          placeholder="Select method"
        />

        <Input
          label="Search"
          type="search"
          placeholder="Search by reference or amount"
          value={searchTerm}
          onChange={(e) => onSearchChange(e?.target?.value)}
        />

        <div className="flex items-end">
          <Button
            variant="outline"
            iconName="X"
            iconPosition="left"
            iconSize={16}
            onClick={onClearFilters}
            fullWidth
          >
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;