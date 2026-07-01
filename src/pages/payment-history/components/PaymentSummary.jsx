import React from 'react';
import Icon from '../../../components/AppIcon';

const PaymentSummary = ({ totalPaid, totalTransactions, onlinePayments, cashPayments }) => {
  const summaryCards = [
    {
      icon: 'DollarSign',
      label: 'Total Paid',
      value: `₹${totalPaid?.toLocaleString('en-IN')}`,
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary'
    },
    {
      icon: 'Receipt',
      label: 'Total Transactions',
      value: totalTransactions,
      bgColor: 'bg-accent/10',
      iconColor: 'text-accent'
    },
    {
      icon: 'CreditCard',
      label: 'Online Payments',
      value: onlinePayments,
      bgColor: 'bg-success/10',
      iconColor: 'text-success'
    },
    {
      icon: 'Wallet',
      label: 'Cash Payments',
      value: cashPayments,
      bgColor: 'bg-warning/10',
      iconColor: 'text-warning'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {summaryCards?.map((card, index) => (
        <div 
          key={index}
          className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-warm hover:shadow-warm-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-lg ${card?.bgColor} flex items-center justify-center`}>
              <Icon name={card?.icon} size={24} className={card?.iconColor} />
            </div>
            <span className="text-sm text-muted-foreground font-caption">
              {card?.label}
            </span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-foreground data-text">
            {card?.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaymentSummary;