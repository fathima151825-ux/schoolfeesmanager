import React, { useState, useMemo, useEffect } from 'react';
import BrandHeader from '../../components/ui/BrandHeader';
import ParentTabNavigation from '../../components/ui/ParentTabNavigation';
import FilterControls from './components/FilterControls';
import PaymentSummary from './components/PaymentSummary';
import PaymentHistoryTable from './components/PaymentHistoryTable';
import PaymentHistoryCard from './components/PaymentHistoryCard';
import EmptyState from './components/EmptyState';
import Icon from '../../components/AppIcon';
import { getPaymentHistory } from '../../services/paymentService';
import { getAcademicYears } from '../../services/feeService';
import useRealtimeSubscription from '../../hooks/useRealtimeSubscription';

const PaymentHistory = () => {
  const [academicYear, setAcademicYear] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState([]);

  // Unconditional academic year fetch — always runs on mount
  useEffect(() => {
    loadAcademicYears();
  }, []);

  // Reload payments whenever academicYear changes
  useEffect(() => {
    if (academicYear) {
      loadPayments();
    } else {
      setPayments([]);
    }
  }, [academicYear]);

  // Realtime: reload payments when a new payment is recorded
  useRealtimeSubscription(
    [{ table: 'payments' }],
    () => {
      if (academicYear) loadPayments();
    },
    [academicYear]
  );

  const loadAcademicYears = async () => {
    try {
      setLoading(true);
      const years = await getAcademicYears();
      setAcademicYears(years);
      if (years?.length > 0) {
        setAcademicYear(years?.[0]?.id);
      }
    } catch (error) {
      console.error('Error loading academic years:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const studentId = sessionStorage.getItem('currentStudentId');
      if (studentId) {
        const paymentData = await getPaymentHistory(studentId, academicYear);
        setPayments(paymentData);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const filteredPayments = useMemo(() => {
    return payments?.filter(payment => {
      const matchesMethod = paymentMethod === 'all' || 
        payment?.paymentMethod?.toLowerCase() === paymentMethod?.toLowerCase();
      
      const matchesSearch = searchTerm === '' || 
        payment?.receiptNumber?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        payment?.amount?.toString()?.includes(searchTerm);

      return matchesMethod && matchesSearch;
    });
  }, [payments, paymentMethod, searchTerm]);

  const paymentStats = useMemo(() => {
    const completedPayments = filteredPayments?.filter(p => p?.paymentStatus === 'completed');
    return {
      totalPaid: completedPayments?.reduce((sum, p) => sum + parseFloat(p?.amount || 0), 0),
      totalTransactions: completedPayments?.length,
      onlinePayments: completedPayments?.filter(p => p?.paymentMethod === 'online')?.length,
      cashPayments: completedPayments?.filter(p => p?.paymentMethod === 'cash')?.length
    };
  }, [filteredPayments]);

  const handleClearFilters = () => {
    setPaymentMethod('all');
    setSearchTerm('');
    // Reset to first academic year instead of null so payments still load
    if (academicYears?.length > 0) {
      setAcademicYear(academicYears?.[0]?.id);
    }
  };

  const handleDownloadReceipt = (payment) => {
    console.log('Downloading receipt for:', payment?.receiptNumber);
    alert(`Receipt download initiated for ${payment?.receiptNumber}\n\nIn production, this would generate and download a PDF receipt with:\n• School branding and logo\n• Red-yellow theme colors\n• Transaction details\n• Payment breakdown\n• Official stamp and signature`);
  };

  const hasActiveFilters = paymentMethod !== 'all' || searchTerm !== '';

  const selectedYearName = academicYears?.find(y => y?.id === academicYear)?.yearName || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <BrandHeader variant="parent" academicYear={selectedYearName} />
        <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading payment history...</p>
          </div>
        </main>
        <ParentTabNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <BrandHeader variant="parent" academicYear={selectedYearName} />
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="Receipt" size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground font-heading">
              Payment History
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              View and download all your fee payment records
            </p>
          </div>
        </div>

        <FilterControls
          academicYear={academicYear}
          onAcademicYearChange={setAcademicYear}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClearFilters={handleClearFilters}
          academicYearOptions={academicYears?.map(y => ({ value: y?.id, label: y?.yearName }))}
        />

        <PaymentSummary
          totalPaid={paymentStats?.totalPaid}
          totalTransactions={paymentStats?.totalTransactions}
          onlinePayments={paymentStats?.onlinePayments}
          cashPayments={paymentStats?.cashPayments}
        />

        {filteredPayments?.length > 0 ? (
          <>
            <div className="hidden lg:block bg-card border border-border rounded-lg shadow-warm overflow-hidden">
              <PaymentHistoryTable
                payments={filteredPayments}
                onDownloadReceipt={handleDownloadReceipt}
              />
            </div>

            <div className="lg:hidden">
              {filteredPayments?.map(payment => (
                <PaymentHistoryCard
                  key={payment?.id}
                  payment={payment}
                  onDownloadReceipt={handleDownloadReceipt}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState 
            onClearFilters={handleClearFilters}
            hasFilters={hasActiveFilters}
          />
        )}
      </main>
      <ParentTabNavigation />
    </div>
  );
};

export default PaymentHistory;