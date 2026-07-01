import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { formatDateToDDMMYYYY } from '../../../utils/dateUtils';

const PaymentTimeline = ({ payments }) => {
  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'Online':
        return 'CreditCard';
      case 'Cash':
        return 'Banknote';
      case 'Cheque':
        return 'FileText';
      case 'DD':
        return 'Receipt';
      default:
        return 'DollarSign';
    }
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'Online':
        return 'text-primary';
      case 'Cash':
        return 'text-success';
      case 'Cheque':
        return 'text-warning';
      case 'DD':
        return 'text-accent';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6 lg:p-8">
      <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">
        Payment History Timeline
      </h3>
      <div className="space-y-4 md:space-y-6">
        {payments?.map((payment, index) => (
          <div key={payment?.id} className="relative">
            {index !== payments?.length - 1 && (
              <div className="absolute left-5 md:left-6 top-12 md:top-14 bottom-0 w-0.5 bg-border" />
            )}
            
            <div className="flex gap-4 md:gap-6">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-border bg-card flex items-center justify-center flex-shrink-0 ${getPaymentMethodColor(payment?.method)}`}>
                <Icon name={getPaymentMethodIcon(payment?.method)} size={20} />
              </div>

              <div className="flex-1 min-w-0 bg-muted/30 rounded-lg p-4 md:p-6 border border-border">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base md:text-lg font-heading font-semibold text-foreground mb-1">
                      {payment?.category}
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground font-caption">
                      {payment?.term} • {formatDateToDDMMYYYY(payment?.date)} • {payment?.time}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xl md:text-2xl font-heading font-bold text-success">
                      ₹{payment?.amount?.toLocaleString('en-IN')}
                    </p>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-success/10 text-success rounded-full text-xs font-caption mt-1">
                      <Icon name="CheckCircle2" size={12} />
                      Paid
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Icon name={getPaymentMethodIcon(payment?.method)} size={16} className="text-muted-foreground" />
                    <span className="text-xs md:text-sm text-foreground font-caption">
                      {payment?.method}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Hash" size={16} className="text-muted-foreground" />
                    <span className="text-xs md:text-sm text-foreground font-caption monospace">
                      {payment?.receiptNumber}
                    </span>
                  </div>
                </div>

                {payment?.transactionId && (
                  <div className="flex items-center gap-2 mb-4">
                    <Icon name="FileText" size={16} className="text-muted-foreground" />
                    <span className="text-xs md:text-sm text-muted-foreground font-caption monospace">
                      Transaction ID: {payment?.transactionId}
                    </span>
                  </div>
                )}

                {payment?.remarks && (
                  <div className="bg-background rounded-lg p-3 mb-4">
                    <p className="text-xs md:text-sm text-muted-foreground font-caption">
                      <span className="font-medium text-foreground">Remarks:</span> {payment?.remarks}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    iconName="Download"
                    iconPosition="left"
                  >
                    Download Receipt
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="Printer"
                    iconPosition="left"
                  >
                    Print
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {payments?.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Icon name="Receipt" size={32} className="text-muted-foreground" />
          </div>
          <p className="text-base md:text-lg text-muted-foreground font-caption">
            No payment history available
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentTimeline;