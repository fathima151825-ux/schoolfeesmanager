import React from 'react';
import { Link } from 'react-router-dom';
import BrandHeader from '../../components/ui/BrandHeader';
import LoginForm from './components/LoginForm';
import SecurityFeatures from './components/SecurityFeatures';
import Icon from '../../components/AppIcon';
import AppImage from '../../components/AppImage';

const AdminLogin = () => {
  return (
    <div className="min-h-screen bg-background">
      <BrandHeader variant="admin" />
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
            {/* Left Column - Login Form */}
            <div className="order-2 lg:order-1">
              <div className="bg-card border border-border rounded-lg p-6 md:p-8 lg:p-10 shadow-warm-md">
                <div className="text-center mb-6 md:mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 mb-4">
                    <AppImage
                      src="/assets/images/Untitled_design-1775296554870.png"
                      alt="Sri Saraswathi Vidhya Mandir School Logo"
                      className="w-10 h-10 md:w-12 md:h-12 object-contain"
                    />
                  </div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                    Administrator Login
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Secure access to school management system
                  </p>
                </div>

                <LoginForm />

                <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-border space-y-3">
                  <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-muted-foreground">
                    <Icon name="Lock" size={16} />
                    <span>Secured by Sri Saraswathi Vidhya Mandir</span>
                  </div>
                  <div className="text-center">
                    <Link
                      to="/superadmin-login"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                    >
                      <Icon name="ShieldCheck" size={13} />
                      Superadmin Login
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Information */}
            <div className="order-1 lg:order-2">
              <div className="lg:sticky lg:top-6">
                <div className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-warm-md">
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Icon name="UserCog" size={24} className="text-accent" />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
                        Admin Portal
                      </h2>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Comprehensive management access
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                    <div className="flex items-start gap-3">
                      <Icon name="CheckCircle2" size={20} className="text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm md:text-base font-medium text-foreground">Student Management</p>
                        <p className="text-xs md:text-sm text-muted-foreground">Complete oversight of 600+ student records</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Icon name="CheckCircle2" size={20} className="text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm md:text-base font-medium text-foreground">Financial Reports</p>
                        <p className="text-xs md:text-sm text-muted-foreground">Advanced reporting and data export capabilities</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Icon name="CheckCircle2" size={20} className="text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm md:text-base font-medium text-foreground">Payment Processing</p>
                        <p className="text-xs md:text-sm text-muted-foreground">Manual cash entry and receipt generation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Icon name="CheckCircle2" size={20} className="text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm md:text-base font-medium text-foreground">Data Backup</p>
                        <p className="text-xs md:text-sm text-muted-foreground">Monthly automated backup with download access</p>
                      </div>
                    </div>
                  </div>

                  <SecurityFeatures />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t border-border bg-card mt-12 md:mt-16 lg:mt-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AppImage
                src="/assets/images/Untitled_design-1775296554870.png"
                alt="Sri Saraswathi Vidhya Mandir School Logo"
                className="w-5 h-5 object-contain"
              />
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">
                  © {new Date()?.getFullYear()} Sri Saraswathi Vidhya Mandir. All rights reserved.
                </p>
                <p className="text-xs text-muted-foreground/80">
                  Developed by <span className="font-medium">ZAMZAM Infotech</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors inline-flex items-center gap-1">
                <Icon name="HelpCircle" size={16} />
                Help
              </a>
              <a href="#" className="hover:text-primary transition-colors inline-flex items-center gap-1">
                <Icon name="Shield" size={16} />
                Privacy
              </a>
              <a href="#" className="hover:text-primary transition-colors inline-flex items-center gap-1">
                <Icon name="FileText" size={16} />
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminLogin;