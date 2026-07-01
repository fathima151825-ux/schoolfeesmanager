import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import BrandHeader from '../../components/ui/BrandHeader';
import { initiateRazorpayCheckout, generateOrderId } from '../../services/razorpayService';
import { generateReceiptNumber } from '../../services/paymentService';

const PaymentFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [failureDetails, setFailureDetails] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  useEffect(() => {
    const errorMessage = searchParams?.get('error') || sessionStorage.getItem('payment_error') || 'Payment could not be processed';
    const amount = searchParams?.get('amount') || sessionStorage.getItem('payment_amount');
    const orderId = searchParams?.get('orderId') || sessionStorage.getItem('razorpay_order_id');
    const paymentMethod = searchParams?.get('method') || sessionStorage.getItem('payment_method') || 'Online Payment';
    const errorReference = searchParams?.get('errorRef') || sessionStorage.getItem('error_reference') || `ERR${Date.now()}`;
    const studentName = sessionStorage.getItem('student_name') || 'Student';
    const feeCategory = sessionStorage.getItem('fee_category') || 'School Fees';
    const studentEmail = sessionStorage.getItem('student_email') || 'parent@example.com';
    const studentMobile = sessionStorage.getItem('student_mobile') || '9999999999';

    setFailureDetails({
      errorMessage,
      amount: parseFloat(amount) || 0,
      orderId,
      paymentMethod,
      errorReference,
      studentName,
      feeCategory,
      studentEmail,
      studentMobile,
      timestamp: new Date()?.toISOString()
    });
  }, [searchParams]);

  const getFailureReason = (errorMsg) => {
    const msg = errorMsg?.toLowerCase() || '';
    if (msg?.includes('insufficient') || msg?.includes('balance')) return { title: 'Insufficient Funds', description: 'Your account does not have sufficient balance for this transaction.', icon: 'Wallet', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' };
    if (msg?.includes('network') || msg?.includes('timeout')) return { title: 'Network Issue', description: 'The payment failed due to a network connectivity issue. Please check your internet connection.', icon: 'WifiOff', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
    if (msg?.includes('declined') || msg?.includes('bank')) return { title: 'Bank Declined', description: 'Your bank has declined this transaction. Please contact your bank for more details.', icon: 'Building2', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
    if (msg?.includes('cancelled') || msg?.includes('cancel')) return { title: 'Payment Cancelled', description: 'The payment was cancelled before completion. You can retry anytime.', icon: 'XCircle', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' };
    if (msg?.includes('expired')) return { title: 'Session Expired', description: 'The payment session has expired. Please initiate a new payment.', icon: 'Clock', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' };
    return { title: 'Payment Failed', description: errorMsg || 'The transaction could not be completed. Please try again.', icon: 'AlertCircle', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
  };

  const paymentMethods = [
    { id: 'upi', name: 'UPI', icon: 'Smartphone', description: 'Pay using any UPI app', recommended: true, color: 'bg-green-100 text-green-700' },
    { id: 'card', name: 'Credit / Debit Card', icon: 'CreditCard', description: 'All major debit and credit cards accepted', recommended: false, color: 'bg-blue-100 text-blue-700' },
    { id: 'netbanking', name: 'Net Banking', icon: 'Building2', description: 'All major banks supported', recommended: false, color: 'bg-purple-100 text-purple-700' },
    { id: 'wallet', name: 'Mobile Wallet', icon: 'Wallet', description: 'Pay using your mobile wallet', recommended: false, color: 'bg-orange-100 text-orange-700' }
  ];

  const handleRetryWithRazorpay = async () => {
    if (!failureDetails?.amount) {
      navigate('/fee-payment');
      return;
    }
    setRetrying(true);
    try {
      const newOrderId = generateOrderId();
      await initiateRazorpayCheckout({
        amount: failureDetails?.amount,
        orderId: newOrderId,
        studentName: failureDetails?.studentName,
        studentEmail: failureDetails?.studentEmail,
        studentMobile: failureDetails?.studentMobile,
        onSuccess: async (razorpayResponse) => {
          const receiptNumber = generateReceiptNumber();
          sessionStorage.setItem('razorpay_payment_id', razorpayResponse?.razorpayPaymentId);
          sessionStorage.setItem('razorpay_order_id', razorpayResponse?.razorpayOrderId);
          sessionStorage.setItem('payment_amount', failureDetails?.amount);
          sessionStorage.setItem('receipt_number', receiptNumber);
          navigate('/payment-success');
        },
        onFailure: (error) => {
          setFailureDetails(prev => ({ ...prev, errorMessage: error || 'Payment failed again.', errorReference: `ERR${Date.now()}`, timestamp: new Date()?.toISOString() }));
          setRetrying(false);
        }
      });
    } catch (error) {
      setRetrying(false);
      navigate('/fee-payment');
    }
  };

  const handleClearAndRetry = () => {
    navigate('/fee-payment');
  };

  const handleReturnToDashboard = () => {
    ['razorpay_payment_id','razorpay_order_id','payment_amount','payment_error','error_reference','payment_method','student_name','fee_category','student_email','student_mobile']?.forEach(k => sessionStorage.removeItem(k));
    navigate('/parent-dashboard');
  };

  if (!failureDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const reason = getFailureReason(failureDetails?.errorMessage);

  return (
    <div className="min-h-screen bg-background">
      <BrandHeader variant="parent" />
      <div className="container mx-auto px-4 py-8 max-w-2xl">

        {/* Failure Banner */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-2xl p-6 mb-6 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 border-4 border-red-300 flex items-center justify-center mx-auto mb-4">
            <Icon name="XCircle" size={40} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-800 mb-1">Payment Failed</h1>
          <p className="text-red-600 text-sm">We couldn't process your payment. Please try again.</p>
          {failureDetails?.amount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold">
              <Icon name="IndianRupee" size={14} />
              <span>₹{failureDetails?.amount?.toLocaleString('en-IN')} — Not Charged</span>
            </div>
          )}
        </div>

        {/* Failure Reason */}
        <div className={`border rounded-xl p-4 mb-6 ${reason?.bg}`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center flex-shrink-0">
              <Icon name={reason?.icon} size={20} className={reason?.color} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{reason?.title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{reason?.description}</p>
            </div>
          </div>
        </div>

        {/* Primary Retry Button */}
        <div className="mb-6">
          <button
            onClick={handleRetryWithRazorpay}
            disabled={retrying}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-3.5 px-6 rounded-xl transition-colors text-base"
          >
            {retrying ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Retrying Payment...</span></>
            ) : (
              <><Icon name="RefreshCw" size={18} /><span>Retry Payment Now</span></>
            )}
          </button>
          <p className="text-xs text-muted-foreground text-center mt-2">Securely processed via Razorpay</p>
        </div>

        {/* Alternative Payment Methods Dropdown */}
        <div className="bg-card rounded-2xl border border-border shadow-sm mb-6 overflow-hidden">
          <button
            onClick={() => setShowPaymentMethods(!showPaymentMethods)}
            className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon name="LayoutGrid" size={18} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground text-sm">Try a Different Payment Method</p>
                <p className="text-xs text-muted-foreground">UPI, Card, Net Banking, Wallet</p>
              </div>
            </div>
            <Icon name={showPaymentMethods ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-muted-foreground" />
          </button>

          {showPaymentMethods && (
            <div className="border-t border-border p-4 space-y-2">
              {paymentMethods?.map((method) => (
                <button
                  key={method?.id}
                  onClick={() => { setSelectedMethod(method?.id); handleRetryWithRazorpay(); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    selectedMethod === method?.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method?.color}`}>
                    <Icon name={method?.icon} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{method?.name}</span>
                      {method?.recommended && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Recommended</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{method?.description}</p>
                  </div>
                  <Icon name="ChevronRight" size={14} className="text-muted-foreground flex-shrink-0" />
                </button>
              ))}
              <p className="text-xs text-muted-foreground text-center pt-2 pb-1">
                All payments are secured by Razorpay with 256-bit encryption
              </p>
            </div>
          )}
        </div>

        {/* Transaction Attempt Details */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-6">
          <div className="bg-muted/40 border-b border-border px-5 py-3 flex items-center gap-2">
            <Icon name="FileText" size={16} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Transaction Attempt Details</h3>
          </div>
          <div className="p-5 space-y-0">
            {failureDetails?.amount > 0 && (
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Attempted Amount</span>
                <span className="text-base font-bold text-foreground">₹{failureDetails?.amount?.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Student</span>
              <span className="text-sm font-semibold text-foreground">{failureDetails?.studentName}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Fee Category</span>
              <span className="text-sm font-semibold text-foreground">{failureDetails?.feeCategory}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Failure Time</span>
              <span className="text-sm font-semibold text-foreground">
                {new Date(failureDetails?.timestamp)?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' · '}
                {new Date(failureDetails?.timestamp)?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-start justify-between py-3 gap-4">
              <span className="text-sm text-muted-foreground flex-shrink-0">Error Reference</span>
              <span className="text-xs font-mono text-foreground break-all text-right">{failureDetails?.errorReference}</span>
            </div>
          </div>
        </div>

        {/* Support Contact Widget */}
        <div className="bg-gradient-to-br from-primary/8 to-primary/4 border border-primary/25 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <Icon name="Headphones" size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Need Help?</h3>
              <p className="text-xs text-muted-foreground">Our support team is ready to assist you</p>
            </div>
          </div>
          <div className="space-y-2">
            <a
              href="tel:+919876543210"
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border hover:border-green-400 hover:shadow-sm transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Icon name="Phone" size={16} className="text-green-700" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Call Support</p>
                <p className="text-sm font-bold text-foreground">+91 98765 43210</p>
              </div>
              <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
            </a>
            <a
              href="mailto:fees@ssvm.school"
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border hover:border-primary/40 hover:shadow-sm transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon name="Mail" size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Email Support</p>
                <p className="text-sm font-bold text-foreground">fees@ssvm.school</p>
              </div>
              <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
            </a>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-primary/15">
            <Icon name="Clock" size={13} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Mon – Sat, 9:00 AM – 6:00 PM</span>
          </div>
        </div>

        {/* Common Reasons */}
        <div className="bg-muted/30 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Icon name="HelpCircle" size={16} className="text-primary" />
            Common Reasons for Payment Failure
          </h3>
          <ul className="space-y-2">
            {['Insufficient balance in your account', 'Network connectivity issues during transaction', 'Bank declined the transaction', 'Incorrect card details or expired card', 'Payment session timeout']?.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleClearAndRetry}
            className="flex items-center justify-center gap-2 border border-border hover:bg-muted text-foreground font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>Back to Payment</span>
          </button>
          <button
            onClick={handleReturnToDashboard}
            className="flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            <Icon name="Home" size={16} />
            <span>Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;