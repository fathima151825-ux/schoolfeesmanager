import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/AppIcon';

import BrandHeader from '../../components/ui/BrandHeader';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    const transactionId = searchParams?.get('transactionId') || sessionStorage.getItem('razorpay_payment_id') || `TXN${Date.now()}`;
    const orderId = searchParams?.get('orderId') || sessionStorage.getItem('razorpay_order_id') || `ORD${Date.now()}`;
    const amount = searchParams?.get('amount') || sessionStorage.getItem('payment_amount') || '0';
    const receiptNumber = searchParams?.get('receiptNumber') || sessionStorage.getItem('receipt_number') || `RCP${Date.now()}`;
    const paymentMethod = searchParams?.get('method') || sessionStorage.getItem('payment_method') || 'Online Payment';
    const studentName = sessionStorage.getItem('student_name') || 'Student';
    const feeCategory = sessionStorage.getItem('fee_category') || 'School Fees';

    setPaymentDetails({
      transactionId,
      orderId,
      amount: parseFloat(amount) || 0,
      receiptNumber,
      paymentMethod,
      studentName,
      feeCategory,
      date: new Date()?.toISOString()
    });
  }, [searchParams]);

  const handleDownloadReceipt = () => {
    setDownloading(true);
    setTimeout(() => {
      const receiptContent = `
SSVM SCHOOL - PAYMENT RECEIPT
==============================
Receipt No: ${paymentDetails?.receiptNumber}
Date: ${new Date(paymentDetails?.date)?.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
Time: ${new Date(paymentDetails?.date)?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}

STUDENT DETAILS
---------------
Student Name: ${paymentDetails?.studentName}
Fee Category: ${paymentDetails?.feeCategory}

PAYMENT DETAILS
---------------
Amount Paid: Rs. ${paymentDetails?.amount?.toLocaleString('en-IN')}
Payment Mode: ${paymentDetails?.paymentMethod}
Transaction ID: ${paymentDetails?.transactionId}
Order ID: ${paymentDetails?.orderId}

Status: PAYMENT SUCCESSFUL

Thank you for your payment!
For queries: fees@ssvm.school
`;
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${paymentDetails?.receiptNumber}.txt`;
      a?.click();
      URL.revokeObjectURL(url);
      setDownloading(false);
    }, 800);
  };

  const handleCopyTransactionId = () => {
    navigator.clipboard?.writeText(paymentDetails?.transactionId)?.then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
  };

  if (!paymentDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BrandHeader variant="parent" />
      <div className="container mx-auto px-4 py-8 max-w-2xl">

        {/* Success Banner */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 border-4 border-green-300 flex items-center justify-center mx-auto mb-4">
            <Icon name="CheckCircle2" size={40} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-800 mb-1">Payment Successful!</h1>
          <p className="text-green-700 text-sm">Your fee payment has been processed successfully</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
            <Icon name="IndianRupee" size={14} />
            <span>₹{paymentDetails?.amount?.toLocaleString('en-IN')} Paid</span>
          </div>
        </div>

        {/* Receipt Card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-6">
          <div className="bg-primary/5 border-b border-border px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Receipt" size={18} className="text-primary" />
              <h2 className="font-semibold text-foreground">Payment Receipt</h2>
            </div>
            {paymentDetails?.receiptNumber && (
              <span className="text-xs font-mono bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">
                #{paymentDetails?.receiptNumber}
              </span>
            )}
          </div>

          <div className="p-6 space-y-0">
            {/* Amount Row - Highlighted */}
            <div className="flex items-center justify-between py-4 border-b border-dashed border-border">
              <span className="text-sm text-muted-foreground">Amount Paid</span>
              <span className="text-2xl font-bold text-green-600">₹{paymentDetails?.amount?.toLocaleString('en-IN')}</span>
            </div>

            {/* Student */}
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Student Name</span>
              <span className="text-sm font-semibold text-foreground">{paymentDetails?.studentName}</span>
            </div>

            {/* Fee Category */}
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Fee Category</span>
              <span className="text-sm font-semibold text-foreground">{paymentDetails?.feeCategory}</span>
            </div>

            {/* Payment Mode */}
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Payment Mode</span>
              <div className="flex items-center gap-2">
                <Icon name="CreditCard" size={14} className="text-primary" />
                <span className="text-sm font-semibold text-foreground">{paymentDetails?.paymentMethod}</span>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Date & Time</span>
              <span className="text-sm font-semibold text-foreground">
                {new Date(paymentDetails?.date)?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' · '}
                {new Date(paymentDetails?.date)?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Transaction ID */}
            <div className="flex items-start justify-between py-3 border-b border-border gap-4">
              <span className="text-sm text-muted-foreground flex-shrink-0">Transaction ID</span>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-mono text-foreground break-all text-right">{paymentDetails?.transactionId}</span>
                <button
                  onClick={handleCopyTransactionId}
                  className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
                  title="Copy transaction ID"
                >
                  <Icon name={showCopied ? 'Check' : 'Copy'} size={14} className={showCopied ? 'text-green-600' : 'text-muted-foreground'} />
                </button>
              </div>
            </div>

            {/* Order ID */}
            {paymentDetails?.orderId && (
              <div className="flex items-start justify-between py-3 gap-4">
                <span className="text-sm text-muted-foreground flex-shrink-0">Order ID</span>
                <span className="text-xs font-mono text-foreground break-all text-right">{paymentDetails?.orderId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Email Notice */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 mb-6">
          <Icon name="Mail" size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Confirmation Email Sent</p>
            <p className="text-xs text-blue-600 mt-0.5">A payment receipt has been sent to your registered email address.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleDownloadReceipt}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            {downloading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Preparing Receipt...</span></>
            ) : (
              <><Icon name="Download" size={18} /><span>Download Receipt</span></>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/parent-dashboard')}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              <Icon name="Home" size={16} />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/fee-payment')}
              className="flex items-center justify-center gap-2 border border-border hover:bg-muted text-foreground font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              <Icon name="Plus" size={16} />
              <span>Pay Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;