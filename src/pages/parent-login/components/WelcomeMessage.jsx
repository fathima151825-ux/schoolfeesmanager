import React from 'react';

const WelcomeMessage = () => {
  return (
    <div className="text-center mb-6 md:mb-8">
      <h2 className="text-xl md:text-2xl lg:text-3xl font-heading font-semibold text-foreground mb-2 md:mb-3">
        Welcome Back
      </h2>
      <p className="text-sm md:text-base text-muted-foreground">
        Please login with your admission number and date of birth
      </p>
    </div>
  );
};

export default WelcomeMessage;