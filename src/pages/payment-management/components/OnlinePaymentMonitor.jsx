import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

import { getOnlinePayments } from '../../../services/paymentService';
import useRealtimeSubscription from '../../../hooks/useRealtimeSubscription';

const OnlinePaymentMonitor = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [onlinePayments, setOnlinePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realtimeFlash, setRealtimeFlash] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  // Realtime: refresh when online payments change
  useRealtimeSubscription(
    [{ table: 'payments', filter: 'payment_method=eq.online' }],
    () => {
      setRealtimeFlash(true);
      setTimeout(() => setRealtimeFlash(false), 1500);
      loadPayments();
    },
    []
  );

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await getOnlinePayments(20);
      setOnlinePayments(data);
    } catch (error) {
      console.error('Error loading online payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = selectedFilter === 'all'
    ? onlinePayments
    : onlinePayments?.filter(payment => payment?.paymentStatus === selectedFilter);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success bg-success/10';
      case 'pending':
        return 'text-warning bg-warning/10';
      case 'failed':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'CheckCircle';
      case 'pending':
        return 'Clock';
      case 'failed':
        return 'XCircle';
      default:
        return 'AlertCircle';
    }
  };

  const getDisplayStatus = (status) => {
    if (status === 'completed') return 'success';
    return status;
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <Icon name="Wifi" size={20} className={realtimeFlash ? 'text-success' : 'text-primary'} />
          <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
            Online Payment Monitor
          </h2>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-500 ${realtimeFlash ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${realtimeFlash ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`}></span>
            Live
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {['all', 'completed', 'pending', 'failed']?.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-250 whitespace-nowrap ${
                selectedFilter === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {filter?.charAt(0)?.toUpperCase() + filter?.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Icon name="Loader2" size={24} className="text-primary animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Loading payments...</span>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 md:max-h-[500px] overflow-y-auto">
          {filteredPayments?.map((payment) => (
            <div
              key={payment?.id}
              className="p-3 md:p-4 bg-muted rounded-lg border border-border hover:border-primary/30 transition-all duration-250"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2">
                    <Icon
                      name={getStatusIcon(payment?.paymentStatus)}
                      size={20}
                      className={getStatusColor(payment?.paymentStatus)?.split(' ')?.[0]}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm md:text-base font-medium text-foreground truncate">
                        {payment?.students?.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {payment?.students?.admissionNumber}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm">
                    <div className="flex items-center gap-2">
                      <Icon name="Hash" size={14} className="text-muted-foreground" />
                      <span className="text-muted-foreground data-text truncate">
                        {payment?.transactionId || payment?.receiptNumber || payment?.id?.slice(0, 12)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="Calendar" size={14} className="text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {payment?.paymentDate ? new Date(payment?.paymentDate)?.toLocaleString('en-IN') : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="CreditCard" size={14} className="text-muted-foreground" />
                      <span className="text-muted-foreground capitalize">
                        {payment?.paymentMethod || 'Online'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-base md:text-lg font-bold text-primary data-text">
                      ₹{parseFloat(payment?.amount || 0)?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(payment?.paymentStatus)} whitespace-nowrap`}>
                    {getDisplayStatus(payment?.paymentStatus)?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredPayments?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Icon name="Inbox" size={48} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm md:text-base">No {selectedFilter !== 'all' ? selectedFilter : ''} online payments found</p>
        </div>
      )}
    </div>
  );
};

export default OnlinePaymentMonitor;