import React from 'react';
import Icon from '../../../components/AppIcon';

const QuickStats = ({ stats }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    })?.format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <div className="bg-card rounded-lg border border-border p-4 md:p-6 hover:shadow-warm-md transition-all duration-250">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <Icon name="TrendingUp" size={20} className="text-success" />
          </div>
          <p className="text-xs md:text-sm text-muted-foreground font-caption">
            Total Collection
          </p>
        </div>
        <p className="text-xl md:text-2xl font-heading font-bold text-foreground data-text">
          {formatCurrency(stats?.totalCollection)}
        </p>
        <p className="text-xs text-muted-foreground mt-2 font-caption">
          Current academic year
        </p>
      </div>
      <div className="bg-card rounded-lg border border-border p-4 md:p-6 hover:shadow-warm-md transition-all duration-250">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <Icon name="Clock" size={20} className="text-warning" />
          </div>
          <p className="text-xs md:text-sm text-muted-foreground font-caption">
            Pending Amount
          </p>
        </div>
        <p className="text-xl md:text-2xl font-heading font-bold text-foreground data-text">
          {formatCurrency(stats?.pendingAmount)}
        </p>
        <p className="text-xs text-muted-foreground mt-2 font-caption">
          {stats?.pendingStudents} students
        </p>
      </div>
      <div className="bg-card rounded-lg border border-border p-4 md:p-6 hover:shadow-warm-md transition-all duration-250">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="CreditCard" size={20} className="text-primary" />
          </div>
          <p className="text-xs md:text-sm text-muted-foreground font-caption">
            Online Payments
          </p>
        </div>
        <p className="text-xl md:text-2xl font-heading font-bold text-foreground data-text">
          {formatCurrency(stats?.onlinePayments)}
        </p>
        <p className="text-xs text-muted-foreground mt-2 font-caption">
          {stats?.onlineCount} transactions
        </p>
      </div>
      <div className="bg-card rounded-lg border border-border p-4 md:p-6 hover:shadow-warm-md transition-all duration-250">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Icon name="Banknote" size={20} className="text-accent" />
          </div>
          <p className="text-xs md:text-sm text-muted-foreground font-caption">
            Cash Payments
          </p>
        </div>
        <p className="text-xl md:text-2xl font-heading font-bold text-foreground data-text">
          {formatCurrency(stats?.cashPayments)}
        </p>
        <p className="text-xs text-muted-foreground mt-2 font-caption">
          {stats?.cashCount} transactions
        </p>
      </div>
    </div>
  );
};

export default QuickStats;