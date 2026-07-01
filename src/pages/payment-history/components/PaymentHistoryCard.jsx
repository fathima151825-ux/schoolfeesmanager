import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { formatDateToDDMMYYYY } from '../../../utils/dateUtils';

const PaymentHistoryCard = ({ payment, onDownloadReceipt }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPaymentMethodBadge = (method) => {
    const styles = {
      online: 'bg-success/10 text-success border border-success/20',
      cash: 'bg-warning/10 text-warning border border-warning/20'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium font-caption ${styles?.[method?.toLowerCase()]}`}>
        {method}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-success/10 text-success border border-success/20',
      pending: 'bg-warning/10 text-warning border border-warning/20',
      failed: 'bg-error/10 text-error border border-error/20'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium font-caption ${styles?.[status?.toLowerCase()]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4 shadow-warm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="Calendar" size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {formatDateToDDMMYYYY(payment?.date || payment?.paymentDate)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-mono data-text">
            Ref: {payment?.referenceNo}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label={isExpanded ? "Collapse details" : "Expand details"}
        >
          <Icon 
            name={isExpanded ? "ChevronUp" : "ChevronDown"} 
            size={20} 
            className="text-muted-foreground"
          />
        </button>
      </div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-bold text-foreground data-text">
          ₹{payment?.amount?.toLocaleString('en-IN')}
        </span>
        {getStatusBadge(payment?.status)}
      </div>
      <div className="flex items-center gap-2 mb-3">
        {getPaymentMethodBadge(payment?.method)}
      </div>
      {isExpanded && (
        <div className="pt-3 border-t border-border space-y-3">
          <div>
            <span className="text-xs text-muted-foreground font-caption block mb-2">
              Fee Categories
            </span>
            <div className="flex flex-wrap gap-2">
              {payment?.categories?.map((category, index) => (
                <span 
                  key={index}
                  className="text-xs px-2 py-1 bg-muted border border-border rounded text-foreground font-caption"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          {payment?.transactionId && (
            <div>
              <span className="text-xs text-muted-foreground font-caption block mb-1">
                Transaction ID
              </span>
              <span className="text-xs font-medium text-foreground font-mono data-text">
                {payment?.transactionId}
              </span>
            </div>
          )}

          {payment?.remarks && (
            <div>
              <span className="text-xs text-muted-foreground font-caption block mb-1">
                Remarks
              </span>
              <span className="text-xs text-foreground">
                {payment?.remarks}
              </span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            iconPosition="left"
            iconSize={16}
            fullWidth
            onClick={() => onDownloadReceipt(payment)}
            disabled={payment?.status?.toLowerCase() !== 'completed'}
          >
            Download Receipt
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryCard;