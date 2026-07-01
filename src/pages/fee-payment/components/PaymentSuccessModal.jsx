import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PaymentSuccessModal = ({ isOpen, paymentDetails, onClose, onDownloadReceipt }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg border border-border shadow-warm-xl max-w-md w-full p-6 md:p-8 animate-in fade-in zoom-in duration-250">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <Icon name="CheckCircle2" size={40} className="text-success" />
          </div>
          <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-2">
            Payment Successful!
          </h2>
          <p className="text-sm md:text-base text-muted-foreground font-caption">
            Your fee payment has been processed successfully
          </p>
        </div>

        <div className="space-y-3 mb-6 p-4 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-caption">Payment ID</span>
            <span className="text-xs font-mono font-semibold text-foreground data-text">
              {paymentDetails?.transactionId}
            </span>
          </div>
          {paymentDetails?.orderId && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-caption">Order ID</span>
              <span className="text-xs font-mono font-semibold text-foreground data-text">
                {paymentDetails?.orderId}
              </span>
            </div>
          )}
          {paymentDetails?.receiptNumber && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-caption">Receipt No.</span>
              <span className="text-xs font-mono font-semibold text-foreground data-text">
                {paymentDetails?.receiptNumber}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-caption">Amount Paid</span>
            <span className="text-lg font-bold text-success data-text">
              ₹{paymentDetails?.amount?.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-caption">Payment Date</span>
            <span className="text-sm font-semibold text-foreground">
              {new Date(paymentDetails?.date)?.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-caption">Payment Method</span>
            <span className="text-sm font-semibold text-foreground">
              {paymentDetails?.method}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            variant="default"
            size="lg"
            fullWidth
            iconName="Download"
            iconPosition="left"
            onClick={onDownloadReceipt}
          >
            Download Receipt
          </Button>
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={onClose}
          >
            Back to Dashboard
          </Button>
        </div>

        <div className="flex items-start gap-2 mt-4 p-3 rounded-md bg-primary/5">
          <Icon name="Info" size={16} className="text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground font-caption">
            A confirmation email has been sent to your registered email address
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;