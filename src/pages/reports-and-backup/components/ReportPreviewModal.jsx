import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ReportPreviewModal = ({ isOpen, onClose, reportData, reportType }) => {
  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    })?.format(amount);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-card rounded-lg border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-warm-xl">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="Eye" size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
                Report Preview
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground font-caption">
                {reportType}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            onClick={onClose}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="bg-background rounded-lg p-4 md:p-6 border border-border">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-1">
                    Sri Saraswathi Vidhya Mandir
                  </h4>
                  <p className="text-sm text-muted-foreground font-caption">
                    Financial Report - Academic Year 2025-2026
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-caption">
                    Generated on
                  </p>
                  <p className="text-sm font-medium text-foreground data-text">
                    {new Date()?.toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-3 px-2 text-xs md:text-sm font-semibold text-foreground font-caption">
                      Admission No.
                    </th>
                    <th className="text-left py-3 px-2 text-xs md:text-sm font-semibold text-foreground font-caption">
                      Student Name
                    </th>
                    <th className="text-left py-3 px-2 text-xs md:text-sm font-semibold text-foreground font-caption">
                      Class
                    </th>
                    <th className="text-right py-3 px-2 text-xs md:text-sm font-semibold text-foreground font-caption">
                      Total Fees
                    </th>
                    <th className="text-right py-3 px-2 text-xs md:text-sm font-semibold text-foreground font-caption">
                      Paid
                    </th>
                    <th className="text-right py-3 px-2 text-xs md:text-sm font-semibold text-foreground font-caption">
                      Balance
                    </th>
                    <th className="text-center py-3 px-2 text-xs md:text-sm font-semibold text-foreground font-caption">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.map((row, index) => (
                    <tr key={index} className="border-b border-border hover:bg-muted/30">
                      <td className="py-3 px-2 text-xs md:text-sm text-foreground data-text">
                        {row?.admissionNo}
                      </td>
                      <td className="py-3 px-2 text-xs md:text-sm text-foreground">
                        {row?.studentName}
                      </td>
                      <td className="py-3 px-2 text-xs md:text-sm text-foreground">
                        {row?.class}
                      </td>
                      <td className="py-3 px-2 text-xs md:text-sm text-foreground text-right data-text">
                        {formatCurrency(row?.totalFees)}
                      </td>
                      <td className="py-3 px-2 text-xs md:text-sm text-success text-right data-text">
                        {formatCurrency(row?.paid)}
                      </td>
                      <td className="py-3 px-2 text-xs md:text-sm text-error text-right data-text">
                        {formatCurrency(row?.balance)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium font-caption ${
                          row?.status === 'Paid' ?'bg-success/10 text-success' 
                            : row?.status === 'Partial' ?'bg-warning/10 text-warning' :'bg-error/10 text-error'
                        }`}>
                          {row?.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td colSpan="3" className="py-3 px-2 text-sm font-semibold text-foreground">
                      Total
                    </td>
                    <td className="py-3 px-2 text-sm font-semibold text-foreground text-right data-text">
                      {formatCurrency(reportData?.reduce((sum, row) => sum + row?.totalFees, 0))}
                    </td>
                    <td className="py-3 px-2 text-sm font-semibold text-success text-right data-text">
                      {formatCurrency(reportData?.reduce((sum, row) => sum + row?.paid, 0))}
                    </td>
                    <td className="py-3 px-2 text-sm font-semibold text-error text-right data-text">
                      {formatCurrency(reportData?.reduce((sum, row) => sum + row?.balance, 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 md:p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            variant="default"
            iconName="Download"
            iconPosition="left"
          >
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportPreviewModal;