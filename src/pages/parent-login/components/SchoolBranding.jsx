import React from 'react';
import AppImage from '../../../components/AppImage';

const SchoolBranding = () => {
  return (
    <div className="flex flex-col items-center gap-3 md:gap-4 mb-6 md:mb-8">
      <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-warm-lg p-2">
        <AppImage
          src="/assets/images/Untitled_design-1775296554870.png"
          alt="Sri Saraswathi Vidhya Mandir School Logo"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground">
          Sri Saraswathi Vidhya Mandir
        </h1>
        <p className="text-sm md:text-base text-muted-foreground font-caption mt-1 md:mt-2">
          Parent Portal
        </p>
      </div>
    </div>
  );
};

export default SchoolBranding;