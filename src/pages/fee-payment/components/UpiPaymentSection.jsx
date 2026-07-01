import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SCHOOL_UPI_ID = 'school@upi';
const SCHOOL_NAME = 'SSVM School';

const UpiPaymentSection = ({ amount, studentName, onPaymentInitiated }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);

  const generateQr = useCallback(() => {
    if (!amount || amount <= 0) return;
    setIsGenerating(true);
    const link = `upi://pay?pa=${encodeURIComponent(SCHOOL_UPI_ID)}&pn=${encodeURIComponent(SCHOOL_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Fee payment for ${studentName || ''}`)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
    setQrDataUrl(qrUrl);
    setIsGenerating(false);
  }, [amount, studentName]);

  useEffect(() => {
    generateQr();
  }, [generateQr]);

  const handlePayNow = () => {
    const note = `Fee payment for ${studentName || ''}`;
    const link = `upi://pay?pa=${encodeURIComponent(SCHOOL_UPI_ID)}&pn=${encodeURIComponent(SCHOOL_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    // window.location.href triggers UPI deep link reliably on mobile browsers
    window.location.href = link;
    // Show pending notice after a short delay (app may have opened)
    setTimeout(() => {
      setPaymentInitiated(true);
      if (typeof onPaymentInitiated === 'function') onPaymentInitiated();
    }, 1500);
  };

  if (!amount || amount <= 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Smartphone" size={20} className="text-blue-600" />
        <h3 className="text-base font-semibold text-blue-900">Pay via UPI</h3>
      </div>
      <div className="flex flex-col md:flex-row gap-6 items-center">
        {/* QR Code */}
        <div className="flex flex-col items-center gap-2">
          <div className="bg-white p-3 rounded-lg border-2 border-blue-200 shadow-sm">
            {isGenerating ? (
              <div className="w-[180px] h-[180px] flex items-center justify-center">
                <Icon name="Loader2" size={32} className="text-blue-400 animate-spin" />
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="UPI QR Code for payment"
                className="w-[180px] h-[180px] object-contain"
                onError={() => setQrDataUrl('')}
              />
            ) : (
              <div className="w-[180px] h-[180px] flex flex-col items-center justify-center gap-2 text-blue-400">
                <Icon name="QrCode" size={48} />
                <span className="text-xs text-center">QR unavailable</span>
              </div>
            )}
          </div>
          <p className="text-xs text-blue-700 font-medium text-center">Scan with any UPI app</p>
        </div>

        {/* Payment Info */}
        <div className="flex-1 space-y-3">
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <p className="text-xs text-blue-600 mb-0.5">Pay To (UPI ID)</p>
            <p className="text-sm font-mono font-semibold text-blue-900">{SCHOOL_UPI_ID}</p>
            <p className="text-xs text-blue-500 mt-0.5">{SCHOOL_NAME}</p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <p className="text-xs text-blue-600 mb-0.5">Amount to Pay</p>
            <p className="text-xl font-bold text-blue-900">₹{amount?.toLocaleString('en-IN')}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {['UPI', 'Net Banking', 'Wallet']?.map((app) => (
              <span key={app} className="px-2 py-1 bg-white border border-blue-200 rounded text-xs font-medium text-blue-700">
                {app}
              </span>
            ))}
          </div>

          <Button
            variant="default"
            iconName="Smartphone"
            iconPosition="left"
            onClick={handlePayNow}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Open UPI App to Pay
          </Button>

          {paymentInitiated && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
              <Icon name="Clock" size={14} className="flex-shrink-0" />
              <span>
                UPI app should have opened. After completing payment, share the UTR/Transaction ID with the school office.
                Your payment will be marked as <strong>Pending Verification</strong> until admin confirms.
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-start gap-2 text-xs text-blue-700 bg-blue-100 px-3 py-2 rounded-lg">
        <Icon name="Info" size={13} className="flex-shrink-0 mt-0.5" />
        <span>
          Tap "Open UPI App to Pay" to launch your UPI app directly.
          After payment, share the UTR/Transaction ID with the school office for verification.
        </span>
      </div>
    </div>
  );
};

export default UpiPaymentSection;
