import React from 'react';
import AppImage from '../AppImage';

const BrandHeader = ({ variant = 'parent', academicYear = '2025-2026' }) => {
  return (
    <header className="brand-header">
      <div className="brand-logo">
        <AppImage
          src="/assets/images/Untitled_design-1775296554870.png"
          alt="Sri Saraswathi Vidhya Mandir School Logo"
          className="w-10 h-10 object-contain"
        />
      </div>
      <div className="flex-1">
        <h1 className="brand-title font-heading">
          Sri Saraswathi Vidhya Mandir
        </h1>
        {variant === 'parent' && (
          <p className="brand-subtitle font-caption">
            Academic Year {academicYear}
          </p>
        )}
      </div>
    </header>
  );
};

export default BrandHeader;