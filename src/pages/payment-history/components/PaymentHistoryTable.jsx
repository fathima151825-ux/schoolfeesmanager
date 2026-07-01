import React from 'react';

import Button from '../../../components/ui/Button';
import { formatDateToDDMMYYYY } from '../../../utils/dateUtils';

const PaymentHistoryTable = ({ payments, onDownloadReceipt }) => {
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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-4 px-4 text-sm font-semibold text-foreground font-heading">
              Transaction Date
            </th>
            <th className="text-left py-4 px-4 text-sm font-semibold text-foreground font-heading">
              Reference No.
            </th>
            <th className="text-left py-4 px-4 text-sm font-semibold text-foreground font-heading">
              Fee Categories
            </th>
            <th className="text-right py-4 px-4 text-sm font-semibold text-foreground font-heading">
              Amount
            </th>
            <th className="text-center py-4 px-4 text-sm font-semibold text-foreground font-heading">
              Payment Method
            </th>
            <th className="text-center py-4 px-4 text-sm font-semibold text-foreground font-heading">
              Status
            </th>
            <th className="text-center py-4 px-4 text-sm font-semibold text-foreground font-heading">
              Receipt
            </th>
          </tr>
        </thead>
        <tbody>
          {payments?.map((payment) => (
            <tr key={payment?.id} className="border-b border-border hover:bg-muted/50 transition-colors">
              <td className="py-4 px-4 text-sm text-foreground">
                {formatDateToDDMMYYYY(payment?.date || payment?.paymentDate)}
              </td>
              <td className="py-4 px-4">
                <span className="text-sm font-medium text-primary font-mono data-text">
                  {payment?.referenceNo}
                </span>
              </td>
              <td className="py-4 px-4">
                <div className="flex flex-wrap gap-1">
                  {payment?.categories?.map((category, index) => (
                    <span 
                      key={index}
                      className="text-xs px-2 py-1 bg-card border border-border rounded text-muted-foreground font-caption"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <span className="text-sm font-semibold text-foreground data-text">
                  ₹{payment?.amount?.toLocaleString('en-IN')}
                </span>
              </td>
              <td className="py-4 px-4 text-center">
                {getPaymentMethodBadge(payment?.method)}
              </td>
              <td className="py-4 px-4 text-center">
                {getStatusBadge(payment?.status)}
              </td>
              <td className="py-4 px-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Download"
                  iconSize={16}
                  onClick={() => onDownloadReceipt(payment)}
                  disabled={payment?.status?.toLowerCase() !== 'completed'}
                >
                  Download
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentHistoryTable;