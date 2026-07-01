import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const SUPPORT_EMAIL = 'ssvm2003@gmail.com';
const SUPPORT_MOBILE = '9445826320';

const ContactSupportModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="bg-card rounded-xl shadow-warm-md p-6 w-full max-w-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading font-semibold text-foreground">Contact Support</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="X" size={20} />
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Reach out to us for any fee-related queries or assistance.
      </p>
      <div className="space-y-3">
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-primary bg-primary/10">
            <Icon name="Mail" size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Email Us</p>
            <p className="text-xs text-muted-foreground">{SUPPORT_EMAIL}</p>
          </div>
        </a>
        <a
          href={`tel:${SUPPORT_MOBILE}`}
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-success bg-success/10">
            <Icon name="Phone" size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Call Us</p>
            <p className="text-xs text-muted-foreground">{SUPPORT_MOBILE}</p>
          </div>
        </a>
        <a
          href={`https://wa.me/91${SUPPORT_MOBILE}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-accent bg-accent/10">
            <Icon name="MessageCircle" size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">WhatsApp</p>
            <p className="text-xs text-muted-foreground">Chat with us on WhatsApp</p>
          </div>
        </a>
      </div>
      <button
        onClick={onClose}
        className="mt-5 w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Close
      </button>
    </div>
  </div>
);

const QuickActionsCard = () => {
  const [showSupport, setShowSupport] = useState(false);

  const handlePaymentReminder = (e) => {
    e?.preventDefault();
    const message = encodeURIComponent(
      `Hello, I would like to get a reminder about my child's upcoming fee due date. Please assist. Thank you.`
    );
    window.open(`https://wa.me/91${SUPPORT_MOBILE}?text=${message}`, '_blank');
  };

  const actions = [
    {
      id: 1,
      title: "Download Receipt",
      description: "Get latest payment receipt",
      icon: "Download",
      color: "text-primary bg-primary/10",
      path: "/payment-history",
      type: "link"
    },
    {
      id: 2,
      title: "View History",
      description: "Check all transactions",
      icon: "FileText",
      color: "text-accent bg-accent/10",
      path: "/payment-history",
      type: "link"
    },
    {
      id: 3,
      title: "Payment Reminder",
      description: "Ask for due date reminder",
      icon: "Bell",
      color: "text-warning bg-warning/10",
      type: "reminder"
    },
    {
      id: 4,
      title: "Contact Support",
      description: "Get help with fees",
      icon: "MessageCircle",
      color: "text-success bg-success/10",
      type: "support"
    }
  ];

  return (
    <>
      {showSupport && <ContactSupportModal onClose={() => setShowSupport(false)} />}
      <div className="bg-card rounded-xl shadow-warm-md p-4 md:p-6 lg:p-8 border border-border">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <Icon name="Zap" size={20} className="text-primary" />
          <h3 className="text-lg md:text-xl lg:text-2xl font-heading font-semibold text-foreground">
            Quick Actions
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {actions?.map((action) => {
            const inner = (
              <>
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${action?.color} group-hover:scale-110 transition-transform duration-250`}>
                  <Icon name={action?.icon} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base font-medium text-foreground mb-0.5">
                    {action?.title}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground font-caption">
                    {action?.description}
                  </p>
                </div>
                <Icon name="ChevronRight" size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              </>
            );

            const baseClass = "flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-muted/50 hover:bg-muted hover:shadow-warm transition-all duration-250 hover:-translate-y-0.5 group cursor-pointer";

            if (action?.type === 'link') {
              return (
                <Link key={action?.id} to={action?.path} className={baseClass}>
                  {inner}
                </Link>
              );
            }
            if (action?.type === 'reminder') {
              return (
                <a key={action?.id} href="#" onClick={handlePaymentReminder} className={baseClass}>
                  {inner}
                </a>
              );
            }
            if (action?.type === 'support') {
              return (
                <button key={action?.id} onClick={() => setShowSupport(true)} className={`${baseClass} w-full text-left`}>
                  {inner}
                </button>
              );
            }
            return null;
          })}
        </div>
      </div>
    </>
  );
};

export default QuickActionsCard;