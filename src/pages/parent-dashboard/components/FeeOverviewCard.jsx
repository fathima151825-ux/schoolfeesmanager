import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FeeOverviewCard = ({ feeData, academicYear }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'text-success bg-success/10';
      case 'pending':
        return 'text-warning bg-warning/10';
      case 'overdue':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return 'CheckCircle2';
      case 'pending':
        return 'Clock';
      case 'overdue':
        return 'AlertCircle';
      default:
        return 'Circle';
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-warm-md p-4 md:p-6 lg:p-8 border border-border">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <Icon name="Receipt" size={20} className="text-primary" />
          <h3 className="text-lg md:text-xl lg:text-2xl font-heading font-semibold text-foreground">
            Fee Overview
          </h3>
        </div>
        <span className="text-xs md:text-sm font-caption text-muted-foreground">
          AY {academicYear}
        </span>
      </div>
      <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
        {feeData?.terms?.map((term) => (
          <div 
            key={term?.id}
            className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Icon 
                name={getStatusIcon(term?.status)} 
                size={20} 
                className={getStatusColor(term?.status)?.split(' ')?.[0]}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm md:text-base font-medium text-foreground mb-1">
                  {term?.name}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground font-caption">
                  Due: {term?.dueDate}
                </p>
              </div>
            </div>
            <div className="text-right ml-3">
              <p className="text-sm md:text-base lg:text-lg font-semibold text-foreground data-text whitespace-nowrap">
                ₹{term?.amount?.toLocaleString('en-IN')}
              </p>
              <span className={`text-xs md:text-sm font-caption px-2 py-1 rounded-full ${getStatusColor(term?.status)}`}>
                {term?.status?.charAt(0)?.toUpperCase() + term?.status?.slice(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-primary/5 rounded-lg p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm md:text-base text-muted-foreground font-caption">Total Fees</span>
          <span className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground data-text">
            ₹{feeData?.totalFees?.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm md:text-base text-muted-foreground font-caption">Paid Amount</span>
          <span className="text-lg md:text-xl lg:text-2xl font-semibold text-success data-text">
            ₹{feeData?.paidAmount?.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="h-px bg-border my-3" />
        <div className="flex items-center justify-between">
          <span className="text-sm md:text-base font-medium text-foreground font-caption">Outstanding Balance</span>
          <span className="text-xl md:text-2xl lg:text-3xl font-bold text-error data-text">
            ₹{feeData?.outstandingBalance?.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Link to="/fee-payment" className="block">
          <Button 
            variant="default" 
            fullWidth
            iconName="CreditCard"
            iconPosition="left"
          >
            Pay Fees
          </Button>
        </Link>
        <Link to="/payment-history" className="block">
          <Button 
            variant="outline" 
            fullWidth
            iconName="History"
            iconPosition="left"
          >
            Payment History
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default FeeOverviewCard;