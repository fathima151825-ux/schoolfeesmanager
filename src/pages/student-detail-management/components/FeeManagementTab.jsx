import React from 'react';
import Icon from '../../../components/AppIcon';

const FeeManagementTab = ({ feeData, selectedYear }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-success/10 text-success border-success/20';
      case 'Partial':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Pending':
        return 'bg-error/10 text-error border-error/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid':
        return 'CheckCircle2';
      case 'Partial':
        return 'AlertCircle';
      case 'Pending':
        return 'XCircle';
      default:
        return 'Circle';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-card rounded-lg border border-border p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm md:text-base text-muted-foreground font-caption">Total Fees</p>
            <Icon name="DollarSign" size={20} className="text-primary" />
          </div>
          <p className="text-2xl md:text-3xl font-heading font-bold text-foreground">
            ₹{feeData?.totalFees?.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm md:text-base text-muted-foreground font-caption">Paid Amount</p>
            <Icon name="CheckCircle2" size={20} className="text-success" />
          </div>
          <p className="text-2xl md:text-3xl font-heading font-bold text-success">
            ₹{feeData?.paidAmount?.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm md:text-base text-muted-foreground font-caption">Outstanding Balance</p>
            <Icon name="AlertCircle" size={20} className="text-error" />
          </div>
          <p className="text-2xl md:text-3xl font-heading font-bold text-error">
            ₹{feeData?.outstandingBalance?.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border p-4 md:p-6 lg:p-8">
        <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-4 md:mb-6">
          Term-wise Payment Status
        </h3>
        <div className="space-y-4 md:space-y-6">
          {feeData?.terms?.map((term) => (
            <div key={term?.id} className="border border-border rounded-lg p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${getStatusColor(term?.status)} border`}>
                    <Icon name={getStatusIcon(term?.status)} size={20} />
                  </div>
                  <div>
                    <h4 className="text-base md:text-lg font-heading font-semibold text-foreground">
                      {term?.name}
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground font-caption">
                      Due Date: {term?.dueDate}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm font-caption border ${getStatusColor(term?.status)}`}>
                  <Icon name={getStatusIcon(term?.status)} size={14} />
                  {term?.status}
                </span>
              </div>

              <div className="space-y-3">
                {term?.categories?.map((category) => (
                  <div key={category?.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm md:text-base font-medium text-foreground">{category?.name}</p>
                      {category?.paid > 0 && (
                        <p className="text-xs md:text-sm text-success font-caption">
                          Paid: ₹{category?.paid?.toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm md:text-base font-medium text-foreground">
                        ₹{category?.amount?.toLocaleString('en-IN')}
                      </p>
                      {category?.balance > 0 && (
                        <p className="text-xs md:text-sm text-error font-caption">
                          Balance: ₹{category?.balance?.toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <p className="text-sm md:text-base font-semibold text-foreground">Term Total</p>
                <div className="text-right">
                  <p className="text-base md:text-lg font-heading font-bold text-foreground">
                    ₹{term?.totalAmount?.toLocaleString('en-IN')}
                  </p>
                  {term?.balance > 0 && (
                    <p className="text-xs md:text-sm text-error font-caption">
                      Balance: ₹{term?.balance?.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeeManagementTab;