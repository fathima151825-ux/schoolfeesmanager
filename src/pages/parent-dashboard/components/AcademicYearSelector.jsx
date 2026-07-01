import React from 'react';
import Select from '../../../components/ui/Select';

const AcademicYearSelector = ({ selectedYear, onYearChange, availableYears }) => {
  const yearOptions = availableYears?.map(year => ({
    value: year?.id,
    label: year?.yearName || `Academic Year ${year?.id}`
  }));

  return (
    <div className="bg-card rounded-xl shadow-warm-md p-4 md:p-6 border border-border">
      <Select
        label="Select Academic Year"
        description="View fee details for different academic years"
        options={yearOptions}
        value={selectedYear}
        onChange={onYearChange}
        className="w-full"
      />
    </div>
  );
};

export default AcademicYearSelector;