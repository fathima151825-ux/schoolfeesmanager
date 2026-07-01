import React from 'react';
import Icon from '../../../components/AppIcon';
import { Checkbox } from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';

const FeeCategory = ({ 
  category, 
  isSelected, 
  onToggle, 
  partialAmount, 
  onPartialAmountChange,
  allowPartialPayment,
  disabled,
  onPayNow,
  processingPayment
}) => {
  const balance = category?.totalAmount - category?.paidAmount;
  const isFullyPaid = balance === 0;

  return (
    <div 
      className={`
        relative p-4 md:p-6 rounded-lg border-2 transition-all duration-250
        ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
        ${isFullyPaid ? 'opacity-60' : ''}
      `}
      onClick={() => !disabled && !isFullyPaid && onToggle()}
    >
      <div className="flex items-start gap-3 md:gap-4">
        <div onClick={(e) => e?.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onChange={() => !disabled && !isFullyPaid && onToggle()}
            disabled={disabled || isFullyPaid}
            size="lg"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-1">
                {category?.name}
              </h3>
              {category?.description && (
                <p className="text-xs md:text-sm text-muted-foreground font-caption">
                  {category?.description}
                </p>
              )}
            </div>
            {isFullyPaid && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-success/10 text-success">
                <Icon name="CheckCircle2" size={16} />
                <span className="text-xs font-caption font-medium">Paid</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 mt-3">
            <div>
              <p className="text-xs text-muted-foreground font-caption mb-1">Total Amount</p>
              <p className="text-sm md:text-base font-semibold text-foreground data-text">
                ₹{category?.totalAmount?.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-caption mb-1">Paid</p>
              <p className="text-sm md:text-base font-semibold text-success data-text">
                ₹{category?.paidAmount?.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-caption mb-1">Balance</p>
              <p className="text-sm md:text-base font-semibold text-warning data-text">
                ₹{balance?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {isSelected && !isFullyPaid && (
            <div className="mt-4 pt-4 border-t border-border" onClick={(e) => e?.stopPropagation()}>
              {allowPartialPayment && (
                <>
                  <label className="block text-sm font-caption font-medium text-foreground mb-2">
                    Enter Amount to Pay (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-muted-foreground">₹</span>
                    <input
                      type="number"
                      min="1"
                      max={balance}
                      value={partialAmount || ''}
                      onChange={(e) => onPartialAmountChange(e?.target?.value)}
                      placeholder={`Max: ${balance?.toLocaleString('en-IN')}`}
                      className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-foreground data-text focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground font-caption mt-1 mb-3">
                    Leave empty to pay full balance
                  </p>
                </>
              )}
              <Button
                variant="default"
                size="sm"
                fullWidth
                iconName="CreditCard"
                iconPosition="left"
                onClick={(e) => { e?.stopPropagation(); onPayNow?.(); }}
                loading={processingPayment}
                className="shadow-warm-md"
              >
                Pay Now
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeeCategory;