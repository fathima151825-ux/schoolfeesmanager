import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const LoginFooter = () => {
  const currentYear = new Date()?.getFullYear();
  const navigate = useNavigate();

  return (
    <div className="mt-8 md:mt-12 text-center space-y-3 md:space-y-4">
      {/* Admin Login Link */}
      <div className="pb-3 md:pb-4 border-b border-border">
        <button
          onClick={() => navigate('/admin-login')}
          className="inline-flex items-center gap-2 text-sm md:text-base text-primary hover:text-primary/80 transition-colors duration-250 font-medium group"
        >
          <Icon name="Shield" size={18} className="md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
          <span>School Owner / Admin Login</span>
          <Icon name="ArrowRight" size={16} className="md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
        </button>
        <p className="text-xs text-muted-foreground mt-1 font-caption">
          Access admin panel and management features
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Icon name="Shield" size={16} className="md:w-5 md:h-5" />
        <p className="text-xs md:text-sm font-caption">
          Secure authentication without OTP
        </p>
      </div>
      <div className="flex items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-muted-foreground">
        <a 
          href="#" 
          className="hover:text-primary transition-colors duration-250 font-caption"
        >
          Help &amp; Support
        </a>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
        <a 
          href="#" 
          className="hover:text-primary transition-colors duration-250 font-caption"
        >
          Privacy Policy
        </a>
      </div>
      <p className="text-xs text-muted-foreground font-caption">
        © {new Date()?.getFullYear()} Your School Name. All rights reserved.
      </p>
      <p className="text-xs text-muted-foreground/80 font-caption mt-1">
        Developed by <span className="font-medium text-muted-foreground">Navomax Infotech</span>
      </p>
    </div>
  );
};

export default LoginFooter;
