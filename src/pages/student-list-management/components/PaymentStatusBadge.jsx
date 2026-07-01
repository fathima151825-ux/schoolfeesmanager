import React from 'react';

const PaymentStatusBadge = ({ status, amount }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'paid':
        return {
          bg: 'bg-success/10',
          text: 'text-success',
          label: 'Fully Paid'
        };
      case 'partial':
        return {
          bg: 'bg-warning/10',
          text: 'text-warning',
          label: 'Partially Paid'
        };
      case 'overdue':
        return {
          bg: 'bg-error/10',
          text: 'text-error',
          label: 'Overdue'
        };
      default:
        return {
          bg: 'bg-muted',
          text: 'text-muted-foreground',
          label: 'Pending'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${config?.bg} ${config?.text}`}>
        {config?.label}
      </span>
      {amount > 0 && (
        <span className="text-xs text-error font-medium">
          ₹{amount?.toLocaleString('en-IN')} due
        </span>
      )}
    </div>
  );
};

export default PaymentStatusBadge;