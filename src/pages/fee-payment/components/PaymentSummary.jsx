import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PaymentSummary = ({ 
  selectedCategories, 
  totalAmount, 
  onProceedToPayment,
  processingPayment,
  onSelectUpi
}) => {
  if (selectedCategories?.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg border-2 border-primary shadow-warm-lg p-3 mt-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon name="Receipt" size={16} className="text-primary" />
        <h2 className="text-sm font-heading font-semibold text-foreground">
          Payment Summary
        </h2>
      </div>
      <div className="space-y-1 mb-2">
        {selectedCategories?.map((category) => (
          <div key={category?.id} className="flex items-center justify-between py-1 border-b border-border">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {category?.name}
              </p>
              {category?.partialAmount && (
                <p className="text-xs text-muted-foreground font-caption">
                  Partial payment
                </p>
              )}
            </div>
            <p className="text-xs font-semibold text-foreground data-text ml-4">
              ₹{(category?.partialAmount || (category?.totalAmount - category?.paidAmount))?.toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between py-1.5 border-t-2 border-primary mb-2">
        <p className="text-sm font-heading font-semibold text-foreground">
          Total Amount
        </p>
        <p className="text-base font-heading font-bold text-primary data-text">
          ₹{totalAmount?.toLocaleString('en-IN')}
        </p>
      </div>

      {/* UPI Payment Methods - clickable to open UPI section */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-caption">Pay via:</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSelectUpi}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-400 active:scale-95 transition-all cursor-pointer"
          >
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            UPI
          </button>
          <button
            type="button"
            onClick={onSelectUpi}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-xs font-medium text-green-700 hover:bg-green-100 hover:border-green-400 active:scale-95 transition-all cursor-pointer"
          >
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            Online
          </button>
        </div>
      </div>

      <Button
        variant="default"
        size="sm"
        fullWidth
        iconName="Smartphone"
        iconPosition="left"
        onClick={onProceedToPayment}
        loading={processingPayment}
        className="shadow-warm-md"
      >
        Pay Now
      </Button>
      <div className="flex items-center gap-1.5 mt-2">
        <Icon name="Shield" size={12} className="text-success flex-shrink-0" />
        <p className="text-xs text-muted-foreground font-caption">
          Secured payment · UPI supported
        </p>
      </div>
    </div>
  );
};

export default PaymentSummary;