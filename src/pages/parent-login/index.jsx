import React, { useState, useEffect } from 'react';
import SchoolBranding from './components/SchoolBranding';
import WelcomeMessage from './components/WelcomeMessage';
import LoginForm from './components/LoginForm';
import LoginFooter from './components/LoginFooter';
import PWAInstallPrompt from 'components/PWAInstallPrompt';

const ParentLogin = () => {
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);

  useEffect(() => {
    // Only show on very first visit, never again
    const hasVisited = localStorage.getItem('pwa-first-visit-shown');
    if (!hasVisited) {
      // Small delay so the page renders first
      const timer = setTimeout(() => {
        setShowPWAPrompt(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handlePWADismiss = () => {
    localStorage.setItem('pwa-first-visit-shown', 'true');
    setShowPWAPrompt(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-warm-xl p-6 md:p-8 lg:p-10 border border-border">
          <SchoolBranding />
          <WelcomeMessage />
          <LoginForm />
          <LoginFooter />
        </div>
      </div>
      {showPWAPrompt && (
        <PWAInstallPrompt
          showImmediately={true}
          onDismiss={handlePWADismiss}
        />
      )}
    </div>
  );
};

export default ParentLogin;