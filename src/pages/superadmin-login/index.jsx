import React from 'react';
import BrandHeader from '../../components/ui/BrandHeader';
import SuperAdminLoginForm from './components/SuperAdminLoginForm';
import Icon from '../../components/AppIcon';
import AppImage from '../../components/AppImage';

const SuperAdminLogin = () => {
  return (
    <div className="min-h-screen bg-background">
      <BrandHeader variant="admin" />
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-warm-md">
            <div className="text-center mb-6 md:mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Icon name="ShieldCheck" size={32} className="text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">
                Superadmin Login
              </h1>
              <p className="text-sm text-muted-foreground">
                Restricted access — authorized personnel only
              </p>
            </div>

            <SuperAdminLoginForm />

            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Icon name="Lock" size={14} />
                <span>Secured by Sri Saraswathi Vidhya Mandir</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t border-border bg-card mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AppImage
                src="/assets/images/Untitled_design-1775296554870.png"
                alt="Sri Saraswathi Vidhya Mandir School Logo"
                className="w-5 h-5 object-contain"
              />
              <p className="text-sm text-muted-foreground">
                © {new Date()?.getFullYear()} Sri Saraswathi Vidhya Mandir. All rights reserved.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Developed by <span className="font-medium">ZAMZAM Infotech</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SuperAdminLogin;
