import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { validateDDMMYYYY } from '../../../utils/dateUtils';

const PaymentEntryForm = ({ student, onPaymentSubmit }) => {
  const [formData, setFormData] = useState({
    term: '',
    category: '',
    amount: '',
    paymentMethod: 'cash',
    paymentDate: '',
    transactionId: '',
    utrNumber: '',
    remarks: ''
  });

  const [errors, setErrors] = useState({});

  const termOptions = [
    { value: 'term1', label: 'Term 1' },
    { value: 'term2', label: 'Term 2' },
    { value: 'term3', label: 'Term 3' }
  ];

  const categoryOptions = [
    { value: 'tuition', label: 'Tuition Fees' },
    { value: 'van', label: 'Van Fees' },
    { value: 'books', label: 'Book Fees' },
    { value: 'miscellaneous', label: 'Miscellaneous Fees' },
    { value: 'lab', label: 'Lab Caution Deposit' }
  ];

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'upi', label: 'UPI' },
    { value: 'cheque', label: 'Cheque' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.term) newErrors.term = 'Please select a term';
    if (!formData?.category) newErrors.category = 'Please select a fee category';
    if (!formData?.amount || parseFloat(formData?.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    const dateValidation = validateDDMMYYYY(formData?.paymentDate);
    if (!dateValidation?.valid) {
      newErrors.paymentDate = dateValidation?.error;
    }

    if (formData?.paymentMethod === 'upi') {
      if (!formData?.utrNumber?.trim()) {
        newErrors.utrNumber = 'Transaction ID (UTR) is required for UPI payments';
      }
    } else if (formData?.paymentMethod !== 'cash' && !formData?.transactionId) {
      newErrors.transactionId = 'Transaction ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (validateForm()) {
      onPaymentSubmit(formData);
      setFormData({
        term: '',
        category: '',
        amount: '',
        paymentMethod: 'cash',
        paymentDate: '',
        transactionId: '',
        utrNumber: '',
        remarks: ''
      });
    }
  };

  const isUpi = formData?.paymentMethod === 'upi';
  const isCash = formData?.paymentMethod === 'cash';

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon name="DollarSign" size={20} className="text-primary" />
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
            Record Payment
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground font-caption">
            Enter payment details for {student?.name}
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Select
            label="Select Term"
            required
            options={termOptions}
            value={formData?.term}
            onChange={(value) => handleInputChange('term', value)}
            error={errors?.term}
          />
          <Select
            label="Fee Category"
            required
            options={categoryOptions}
            value={formData?.category}
            onChange={(value) => handleInputChange('category', value)}
            error={errors?.category}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Input
            label="Payment Amount"
            type="number"
            placeholder="Enter amount"
            required
            value={formData?.amount}
            onChange={(e) => handleInputChange('amount', e?.target?.value)}
            error={errors?.amount}
          />
          <Select
            label="Payment Method"
            required
            options={paymentMethodOptions}
            value={formData?.paymentMethod}
            onChange={(value) => handleInputChange('paymentMethod', value)}
          />
        </div>

        {/* Payment mode indicator */}
        {formData?.paymentMethod && (
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-md ${
            isCash ? 'bg-success/10 text-success' : isUpi ? 'bg-blue-50 text-blue-700' : 'bg-muted text-muted-foreground'
          }`}>
            <Icon name={isCash ? 'Wallet' : isUpi ? 'Building2' : 'FileText'} size={13} />
            <span>
              {isCash && 'Cash payment → will be recorded in Cash Ledger'}
              {isUpi && 'UPI payment → will be recorded in Bank/UPI Ledger'}
              {!isCash && !isUpi && 'Cheque payment → will be recorded in Bank Ledger'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <Input
              label="Payment Date"
              type="text"
              placeholder="DD/MM/YYYY"
              required
              value={formData?.paymentDate}
              onChange={(e) => handleInputChange('paymentDate', e?.target?.value)}
              error={errors?.paymentDate}
            />
            {!errors?.paymentDate && (
              <p className="mt-1 text-xs text-muted-foreground font-caption">
                Enter date in DD/MM/YYYY format (e.g. 25/06/2025)
              </p>
            )}
          </div>

          {isUpi && (
            <Input
              label="Transaction ID (UTR Number)"
              type="text"
              placeholder="Enter 12-digit UTR number"
              required
              value={formData?.utrNumber}
              onChange={(e) => handleInputChange('utrNumber', e?.target?.value)}
              error={errors?.utrNumber}
            />
          )}

          {!isCash && !isUpi && (
            <Input
              label="Transaction/Reference ID"
              type="text"
              placeholder="Enter transaction ID"
              required
              value={formData?.transactionId}
              onChange={(e) => handleInputChange('transactionId', e?.target?.value)}
              error={errors?.transactionId}
            />
          )}
        </div>

        <div>
          <label className="block text-sm md:text-base font-medium text-foreground mb-2">
            Remarks (Optional)
          </label>
          <textarea
            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            rows="3"
            placeholder="Add any additional notes..."
            value={formData?.remarks}
            onChange={(e) => handleInputChange('remarks', e?.target?.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            variant="default"
            iconName="Save"
            iconPosition="left"
            fullWidth
            className="sm:flex-1"
          >
            Record Payment
          </Button>
          <Button
            type="button"
            variant="outline"
            iconName="FileText"
            iconPosition="left"
            fullWidth
            className="sm:flex-1"
          >
            Generate Receipt
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PaymentEntryForm;