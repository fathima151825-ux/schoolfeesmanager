import React, { useState } from 'react';
import AdminSidebarNavigation from '../../components/ui/AdminSidebarNavigation';
import BrandHeader from '../../components/ui/BrandHeader';
import StudentLookup from './components/StudentLookup';
import CashPaymentForm from './components/CashPaymentForm';
import OnlinePaymentMonitor from './components/OnlinePaymentMonitor';
import ReceiptGenerator from './components/ReceiptGenerator';
import BulkPaymentProcessor from './components/BulkPaymentProcessor';
import TransactionSearch from './components/TransactionSearch';
import { useAcademicYear } from '../../contexts/AcademicYearContext';

const PaymentManagement = () => {
  const { currentAcademicYear } = useAcademicYear();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
  };

  const handlePaymentSuccess = (payment) => {
    setPaymentData(payment);
    setShowReceipt(true);
  };

  const handleBulkPaymentSuccess = (payments) => {
    alert(`Successfully processed ${payments?.length} payments. Receipts generated.`);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setSelectedStudent(null);
    setPaymentData(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarNavigation />
      
      <div className="lg:ml-64">
        <BrandHeader variant="admin" />
        
        <main className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                Payment Management
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-sm md:text-base text-muted-foreground">
                  Process cash payments, monitor online transactions, and generate receipts
                </p>
                {currentAcademicYear && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    {currentAcademicYear?.yearName || currentAcademicYear?.year_name}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-6 mb-6">
              <StudentLookup
                onStudentSelect={handleStudentSelect}
                academicYearId={currentAcademicYear?.id}
              />
              {selectedStudent && (
                <CashPaymentForm 
                  selectedStudent={selectedStudent} 
                  onPaymentSuccess={handlePaymentSuccess}
                />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
              <OnlinePaymentMonitor />
              <BulkPaymentProcessor onBulkPaymentSuccess={handleBulkPaymentSuccess} />
            </div>

            <TransactionSearch />
          </div>
        </main>
      </div>

      {showReceipt && (
        <ReceiptGenerator 
          paymentData={paymentData} 
          onClose={handleCloseReceipt}
        />
      )}
    </div>
  );
};

export default PaymentManagement;