import React from 'react';
import Icon from '../../../components/AppIcon';
import AppImage from '../../../components/AppImage';

const ReceiptGenerator = ({ paymentData, onClose }) => {
  if (!paymentData) return null;

  const isUpi = paymentData?.paymentMethod === 'upi';
  const isCash = paymentData?.paymentMethod === 'cash';

  const getPaymentModeLabel = (method) => {
    if (method === 'cash') return 'Cash';
    if (method === 'upi') return 'UPI / Digital Payment';
    if (method === 'online') return 'Online (Razorpay)';
    if (method === 'cheque') return 'Cheque';
    return method || 'Cash';
  };

  const ReceiptContent = ({ copyType }) => (
    <div className="receipt-copy bg-white p-4">
      {/* Copy Type Label */}
      <div className="mb-2">
        <span className="inline-block border-2 border-gray-400 px-2 py-0.5 text-xs font-bold text-gray-700">
          {copyType}
        </span>
      </div>

      {/* School Header */}
      <div className="text-center mb-3">
        <div className="flex justify-center mb-1">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center p-1.5">
            <AppImage
              src="/assets/images/Untitled_design-1775296554870.png"
              alt="School Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <h1 className="text-xs font-bold text-gray-900 leading-tight">
          Sri Saraswathi Vidhya Mandir Matriculation
        </h1>
        <h1 className="text-xs font-bold text-gray-900 leading-tight mt-0.5">
          Higher Secondary School
        </h1>
        <p className="text-[10px] text-gray-600 mt-0.5">
          Affiliated to CBSE | School Code: SSVM2026
        </p>
      </div>

      {/* Receipt Title */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-1.5 border-2 border-green-600 px-3 py-0.5 rounded">
          <Icon name="CheckCircle" size={12} className="text-green-600" />
          <span className="text-[10px] font-bold text-green-700">OFFICIAL RECEIPT</span>
        </div>
      </div>

      {/* Receipt Number & Date */}
      <div className="mb-3 pb-2 border-b-2 border-gray-300">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[9px] text-gray-500 mb-0.5">Receipt Number</p>
            <p className="text-xs font-bold text-gray-900">{paymentData?.receiptNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-gray-500 mb-0.5">Payment Date</p>
            <p className="text-xs font-semibold text-gray-900">
              {new Date(paymentData.paymentDate)?.toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Student Information */}
      <div className="mb-3">
        <h3 className="text-[9px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
          Student Information
        </h3>
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] text-gray-500 mb-0.5">Student Name</p>
              <p className="text-xs font-bold text-gray-900 break-words">{paymentData?.studentName}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 mb-0.5">Admission Number</p>
              <p className="text-xs font-bold text-gray-900">{paymentData?.admissionNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="mb-3">
        <h3 className="text-[9px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
          Payment Details
        </h3>
        <div className="space-y-1">
          <div className="flex justify-between py-1 border-b border-gray-200">
            <span className="text-[9px] text-gray-600">Academic Term</span>
            <span className="text-[9px] font-semibold text-gray-900 capitalize">
              {paymentData?.term?.replace('term', 'Term ')}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-200">
            <span className="text-[9px] text-gray-600">Payment Mode</span>
            <span className={`text-[9px] font-bold ${isUpi ? 'text-blue-700' : isCash ? 'text-green-700' : 'text-gray-900'}`}>
              {getPaymentModeLabel(paymentData?.paymentMethod)}
            </span>
          </div>
          {/* UPI Transaction ID */}
          {(isUpi || paymentData?.utrNumber || paymentData?.transactionId) && (
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-[9px] text-gray-600">
                {isUpi ? 'UTR / Transaction ID' : 'Transaction ID'}
              </span>
              <span className="text-[9px] font-semibold text-gray-900 font-mono">
                {paymentData?.utrNumber || paymentData?.transactionId || '-'}
              </span>
            </div>
          )}
          {/* Ledger indicator */}
          <div className="flex justify-between py-1">
            <span className="text-[9px] text-gray-600">Ledger</span>
            <span className={`text-[9px] font-semibold ${isUpi ? 'text-blue-700' : 'text-green-700'}`}>
              {isUpi ? 'Bank / UPI Ledger' : 'Cash Ledger'}
            </span>
          </div>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="mb-3">
        <h3 className="text-[9px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
          Fee Breakdown
        </h3>
        <div className="border-2 border-gray-300">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 text-left text-[9px] font-bold text-gray-700">Fee Category</th>
                <th className="px-2 py-1 text-right text-[9px] font-bold text-gray-700">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {paymentData?.categories?.map((category, index) => (
                <tr key={index} className="border-t border-gray-200">
                  <td className="px-2 py-1 text-[9px] text-gray-900">{category?.name}</td>
                  <td className="px-2 py-1 text-[9px] font-semibold text-gray-900 text-right">
                    {category?.amount?.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total Amount */}
      <div className="mb-3 bg-gray-900 p-2 rounded">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-bold text-white">TOTAL AMOUNT PAID</span>
          <span className="text-sm font-bold text-white">
            ₹{paymentData?.totalAmount?.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <span className={`text-[8px] px-1.5 py-0.5 rounded font-medium ${
            isUpi ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
          }`}>
            {isUpi ? 'UPI' : 'CASH'}
          </span>
          {isUpi && (paymentData?.utrNumber || paymentData?.transactionId) && (
            <span className="text-[8px] text-gray-300 font-mono">
              UTR: {paymentData?.utrNumber || paymentData?.transactionId}
            </span>
          )}
        </div>
      </div>

      {/* Payment Status */}
      <div className="mb-2 text-center">
        <div className="inline-flex items-center gap-1.5 text-green-700">
          <Icon name="CheckCircle" size={12} className="text-green-600" />
          <span className="text-[9px] font-semibold">Payment Successfully Received</span>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-2 text-center">
        <p className="text-[9px] text-gray-500 leading-tight">
          This is a computer-generated receipt and does not require a physical signature.
        </p>
        <p className="text-[8px] text-gray-400 mt-1">
          © {new Date()?.getFullYear()} Sri Saraswathi Vidhya Mandir Matriculation Higher Secondary School
        </p>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          body * { visibility: hidden; }
          .receipt-container, .receipt-container * { visibility: visible; }
          .receipt-container {
            position: fixed !important; left: 0 !important; top: 0 !important;
            width: 100% !important; display: flex !important; flex-direction: column !important;
            gap: 0 !important; justify-content: flex-start !important;
            align-items: center !important; page-break-after: avoid !important;
            page-break-inside: avoid !important; page-break-before: avoid !important;
          }
          .receipt-copy {
            width: 100%; max-width: 100%; box-sizing: border-box;
            padding: 4mm !important; border: none;
            page-break-inside: avoid !important; page-break-after: avoid !important;
            height: auto; max-height: 138mm;
          }
          .cut-line {
            display: flex !important; align-items: center; justify-content: center;
            width: 100%; height: 5mm; position: relative;
            border-top: 2px dashed #9ca3af; margin: 2mm 0; padding: 0;
          }
          .cut-line svg { background: white; padding: 0 3mm; }
          .receipt-copy .mb-3 { margin-bottom: 2mm !important; }
          .receipt-copy .mb-2 { margin-bottom: 1mm !important; }
          .receipt-copy .mb-1\\.5 { margin-bottom: 0.8mm !important; }
          .receipt-copy .mb-1 { margin-bottom: 0.5mm !important; }
          .receipt-copy .mb-0\\.5 { margin-bottom: 0.3mm !important; }
          .receipt-copy .mt-1 { margin-top: 0.5mm !important; }
          .receipt-copy .mt-0\\.5 { margin-top: 0.3mm !important; }
          .receipt-copy .pb-2 { padding-bottom: 1mm !important; }
          .receipt-copy .pt-2 { padding-top: 1mm !important; }
          .receipt-copy .p-2 { padding: 1mm !important; }
          .receipt-copy .py-1 { padding-top: 0.5mm !important; padding-bottom: 0.5mm !important; }
          .receipt-copy .px-2 { padding-left: 1mm !important; padding-right: 1mm !important; }
          .receipt-copy .px-3 { padding-left: 1.5mm !important; padding-right: 1.5mm !important; }
          .receipt-copy .py-0\\.5 { padding-top: 0.3mm !important; padding-bottom: 0.3mm !important; }
          .receipt-copy .gap-3 { gap: 1.5mm !important; }
          .receipt-copy .gap-1\\.5 { gap: 0.8mm !important; }
          .receipt-copy .space-y-1 > * + * { margin-top: 0.5mm !important; }
          .receipt-copy .text-sm { font-size: 8.5px !important; line-height: 1.2 !important; }
          .receipt-copy .text-xs { font-size: 7.5px !important; line-height: 1.2 !important; }
          .receipt-copy .text-\\[10px\\] { font-size: 7px !important; line-height: 1.2 !important; }
          .receipt-copy .text-\\[9px\\] { font-size: 6.5px !important; line-height: 1.2 !important; }
          .receipt-copy .text-\\[8px\\] { font-size: 6px !important; line-height: 1.2 !important; }
          .receipt-copy .w-10 { width: 24px !important; height: 24px !important; }
          .receipt-copy .h-10 { height: 24px !important; }
          .receipt-copy svg { width: 8px !important; height: 8px !important; }
          .receipt-copy .leading-tight { line-height: 1.1 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-300">
          <div className="absolute top-4 right-4 no-print z-10">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shadow-md"
            >
              <Icon name="X" size={24} className="text-gray-600" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-200 no-print">
            <button
              onClick={() => window.print()}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Icon name="Printer" size={20} />
              Print Receipt (A4 Portrait - 2 Copies)
            </button>
          </div>

          <div className="receipt-container p-4 flex flex-col gap-4">
            <ReceiptContent copyType="ORIGINAL" />
            <div className="cut-line hidden print:flex items-center justify-center relative border-t-2 border-dashed border-gray-400 my-2">
              <div className="bg-white px-3">
                <Icon name="Scissors" size={20} className="text-gray-500" />
              </div>
            </div>
            <ReceiptContent copyType="COPY" />
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptGenerator;