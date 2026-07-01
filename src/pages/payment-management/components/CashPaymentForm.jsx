import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';
import { getFeeCategories, getStudentFeeStructure } from '../../../services/feeService';
import { createPayment, generateReceiptNumber } from '../../../services/paymentService';
import { getCurrentUser } from '../../../services/authService';
import { useAcademicYear } from '../../../contexts/AcademicYearContext';

const PAYMENT_MODE_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' }
];

const CashPaymentForm = ({ selectedStudent, onPaymentSuccess }) => {
  const { currentAcademicYear } = useAcademicYear();
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessages, setSuccessMessages] = useState({});
  const [feeCategories, setFeeCategories] = useState([]);
  const [studentFees, setStudentFees] = useState([]);
  const [isLoadingFees, setIsLoadingFees] = useState(false);
  const [categorySelectionSuccess, setCategorySelectionSuccess] = useState(false);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);

  useEffect(() => {
    loadFeeCategories();
  }, []);

  useEffect(() => {
    if (selectedStudent?.id && currentAcademicYear?.id && selectedTerm) {
      loadStudentFees();
    }
  }, [selectedStudent, currentAcademicYear?.id, selectedTerm]);

  const loadFeeCategories = async () => {
    try {
      const categories = await getFeeCategories();
      setFeeCategories(categories);
    } catch (error) {
      console.error('Error loading fee categories:', error);
    }
  };

  const loadStudentFees = async () => {
    setIsLoadingFees(true);
    try {
      const fees = await getStudentFeeStructure(selectedStudent?.id, currentAcademicYear?.id);
      setStudentFees(fees);
    } catch (error) {
      console.error('Error loading student fees:', error);
      setStudentFees([]);
    } finally {
      setIsLoadingFees(false);
    }
  };

  const termOptions = [
    { value: 'term1', label: 'Term 1 (June - September)' },
    { value: 'term2', label: 'Term 2 (October - January)' },
    { value: 'term3', label: 'Term 3 (February - May)' }
  ];

  const availableCategories = feeCategories?.map(cat => {
    const feeStructure = studentFees?.find(f => f?.feeCategoryId === cat?.id && f?.term === selectedTerm);
    return {
      id: cat?.id,
      label: cat?.name,
      amount: feeStructure?.amount || 0
    };
  })?.filter(cat => cat?.amount > 0);

  useEffect(() => {
    const total = Object.values(amounts)?.reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
    setTotalAmount(total);
  }, [amounts]);

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => {
      const newCategories = prev?.includes(categoryId)
        ? prev?.filter(id => id !== categoryId)
        : [...prev, categoryId];

      if (newCategories?.length > 0) {
        setErrors(prevErrors => {
          const { categories, ...rest } = prevErrors;
          return rest;
        });
        setCategorySelectionSuccess(true);
        setTimeout(() => setCategorySelectionSuccess(false), 3000);
      } else {
        setCategorySelectionSuccess(false);
      }

      if (prev?.includes(categoryId)) {
        const newAmounts = { ...amounts };
        delete newAmounts?.[categoryId];
        setAmounts(newAmounts);
        setSuccessMessages(prevSuccess => {
          const { [categoryId]: _, ...rest } = prevSuccess;
          return rest;
        });
        return newCategories;
      } else {
        return newCategories;
      }
    });
  };

  const validateAmount = (categoryId, value) => {
    const category = availableCategories?.find(cat => cat?.id === categoryId);
    const numValue = parseFloat(value);
    if (!value || value?.trim() === '') return { isValid: false, error: 'Amount is required' };
    if (isNaN(numValue)) return { isValid: false, error: 'Please enter a valid number' };
    if (numValue <= 0) return { isValid: false, error: 'Amount must be greater than ₹0' };
    if (numValue > category?.amount) return { isValid: false, error: `Amount cannot exceed ₹${category?.amount?.toLocaleString('en-IN')}` };
    return { isValid: true, error: null };
  };

  const handleAmountChange = (categoryId, value) => {
    const category = availableCategories?.find(cat => cat?.id === categoryId);
    if (selectedCategories?.length === 1 && selectedCategories?.[0] === categoryId) {
      const validation = validateAmount(categoryId, value);
      if (validation?.isValid) {
        setErrors(prevErrors => { const { [categoryId]: _, ...rest } = prevErrors; return rest; });
        setSuccessMessages(prev => ({ ...prev, [categoryId]: `Valid amount: ₹${parseFloat(value)?.toLocaleString('en-IN')}` }));
      } else {
        setErrors(prev => ({ ...prev, [categoryId]: validation?.error }));
        setSuccessMessages(prevSuccess => { const { [categoryId]: _, ...rest } = prevSuccess; return rest; });
      }
      setAmounts({ ...amounts, [categoryId]: value });
    } else {
      setAmounts({ ...amounts, [categoryId]: category?.amount?.toString() });
      setSuccessMessages(prev => ({ ...prev, [categoryId]: `Full amount: ₹${category?.amount?.toLocaleString('en-IN')}` }));
    }
  };

  const handleSubmit = async () => {
    if (!selectedTerm) { setErrors({ term: 'Please select a term' }); return; }
    if (selectedCategories?.length === 0) { setErrors({ categories: 'Please select at least one fee category' }); return; }

    let hasErrors = false;
    const newErrors = {};
    for (const catId of selectedCategories) {
      const validation = validateAmount(catId, amounts?.[catId]);
      if (!validation?.isValid) { newErrors[catId] = validation?.error; hasErrors = true; }
    }

    if (paymentMode === 'upi' && !utrNumber?.trim()) {
      newErrors.utrNumber = 'Transaction ID (UTR) is required for UPI payments';
      hasErrors = true;
    }

    if (hasErrors) { setErrors(newErrors); return; }
    if (totalAmount === 0) { setErrors({ amount: 'Total amount must be greater than zero' }); return; }

    setIsProcessing(true);
    try {
      const user = await getCurrentUser();
      const receiptNumber = generateReceiptNumber();
      const categoryDetails = [];

      for (const catId of selectedCategories) {
        const category = availableCategories?.find(c => c?.id === catId);
        const paymentPayload = {
          studentId: selectedStudent?.id,
          academicYearId: currentAcademicYear?.id,
          term: selectedTerm,
          feeCategoryId: catId,
          amount: parseFloat(amounts?.[catId] || 0),
          paymentMethod: paymentMode,
          paymentStatus: 'completed',
          receiptNumber: `${receiptNumber}_${catId}`,
          recordedBy: user?.id,
          ...(paymentMode === 'upi' && {
            transactionId: utrNumber?.trim(),
            utrNumber: utrNumber?.trim(),
            remarks: `UPI Payment - UTR: ${utrNumber?.trim()}`
          })
        };
        await createPayment(paymentPayload);
        categoryDetails?.push({ name: category?.label, amount: parseFloat(amounts?.[catId] || 0) });
      }

      onPaymentSuccess({
        studentName: selectedStudent?.name,
        admissionNumber: selectedStudent?.admissionNumber,
        totalAmount,
        receiptNumber,
        paymentMethod: paymentMode,
        transactionId: paymentMode === 'upi' ? utrNumber?.trim() : null,
        utrNumber: paymentMode === 'upi' ? utrNumber?.trim() : null,
        term: selectedTerm,
        categories: categoryDetails,
        paymentDate: new Date()?.toISOString()
      });

      setSelectedTerm('');
      setSelectedCategories([]);
      setAmounts({});
      setErrors({});
      setSuccessMessages({});
      setCategorySelectionSuccess(false);
      setPaymentMode('cash');
      setUtrNumber('');
      setScreenshotFile(null);
    } catch (error) {
      console.error('Error processing payment:', error);
      setErrors({ submit: 'Failed to process payment. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedStudent) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 md:p-8 text-center">
        <Icon name="UserSearch" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground text-sm md:text-base">
          Please search and select a student to process payment
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <Icon name="CreditCard" size={20} className="text-primary" />
        <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
          Fee Payment Entry
        </h2>
      </div>
      {/* Student Info */}
      <div className="bg-muted rounded-lg p-3 md:p-4 mb-4 md:mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon name="User" size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm md:text-base font-medium text-foreground mb-1">{selectedStudent?.name}</h3>
            <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
              <span>{selectedStudent?.admissionNumber}</span>
              <span>Class {selectedStudent?.class}-{selectedStudent?.section}</span>
              <span className="data-text">Balance: ₹{selectedStudent?.balance?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4 md:space-y-6">
        {/* Payment Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Payment Mode <span className="text-error">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_MODE_OPTIONS?.map(mode => (
              <button
                key={mode?.value}
                type="button"
                onClick={() => {
                  setPaymentMode(mode?.value);
                  setUtrNumber('');
                  setErrors(prev => { const { utrNumber, ...rest } = prev; return rest; });
                }}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  paymentMode === mode?.value
                    ? 'border-primary bg-primary/10 text-primary' :'border-border bg-background text-foreground hover:border-primary/40'
                }`}
              >
                <Icon name={mode?.value === 'cash' ? 'Banknote' : 'Smartphone'} size={18} />
                {mode?.label}
              </button>
            ))}
          </div>
          {/* Mode indicator */}
          <div className={`mt-2 flex items-center gap-2 text-xs px-3 py-2 rounded-md ${
            paymentMode === 'cash' ? 'bg-success/10 text-success' : 'bg-blue-50 text-blue-700'
          }`}>
            <Icon name={paymentMode === 'cash' ? 'Wallet' : 'Building2'} size={13} />
            <span>
              {paymentMode === 'cash' ?'Cash payment → will be recorded in Cash Ledger' :'UPI payment → will be recorded in Bank/UPI Ledger'}
            </span>
          </div>
        </div>

        {/* UPI Transaction ID */}
        {paymentMode === 'upi' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Smartphone" size={16} className="text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">UPI Payment Details</span>
            </div>
            <Input
              label="Transaction ID (UTR Number)"
              type="text"
              placeholder="Enter 12-digit UTR number (e.g. 123456789012)"
              value={utrNumber}
              onChange={(e) => {
                setUtrNumber(e?.target?.value);
                if (errors?.utrNumber) setErrors(prev => { const { utrNumber, ...rest } = prev; return rest; });
              }}
              error={errors?.utrNumber}
              required
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Payment Screenshot <span className="text-muted-foreground text-xs">(Optional)</span>
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors text-sm text-foreground">
                  <Icon name="Upload" size={15} className="text-muted-foreground" />
                  {screenshotFile ? screenshotFile?.name : 'Upload Screenshot'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setScreenshotFile(e?.target?.files?.[0] || null)}
                  />
                </label>
                {screenshotFile && (
                  <button
                    type="button"
                    onClick={() => setScreenshotFile(null)}
                    className="text-xs text-error hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <Select
          label="Select Term"
          placeholder="Choose payment term"
          options={termOptions}
          value={selectedTerm}
          onChange={(value) => {
            setSelectedTerm(value);
            setSelectedCategories([]);
            setAmounts({});
            setErrors({});
            setSuccessMessages({});
            setCategorySelectionSuccess(false);
          }}
          error={errors?.term}
          required
        />

        {selectedTerm && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Fee Categories <span className="text-error">*</span>
            </label>
            {isLoadingFees ? (
              <div className="text-center py-8">
                <Icon name="Loader2" size={32} className="mx-auto mb-2 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Loading fee categories...</p>
              </div>
            ) : availableCategories?.length > 0 ? (
              <>
                <div className="space-y-2">
                  {availableCategories?.map((category) => (
                    <div key={category?.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg border border-border hover:border-primary/30 transition-colors">
                      <Checkbox
                        checked={selectedCategories?.includes(category?.id)}
                        onChange={() => handleCategoryToggle(category?.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-medium text-foreground">{category?.label}</span>
                          <span className="text-sm font-semibold text-primary data-text whitespace-nowrap">
                            ₹{category?.amount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                        {selectedCategories?.includes(category?.id) && (
                          <div className="space-y-2">
                            <Input
                              type="number"
                              placeholder="Enter amount"
                              value={amounts?.[category?.id] || ''}
                              onChange={(e) => handleAmountChange(category?.id, e?.target?.value)}
                              error={errors?.[category?.id]}
                              disabled={selectedCategories?.length > 1}
                              className="mt-2"
                            />
                            {successMessages?.[category?.id] && !errors?.[category?.id] && (
                              <div className="flex items-center gap-2 text-xs text-success bg-success/10 px-3 py-2 rounded-md">
                                <Icon name="CheckCircle2" size={14} className="flex-shrink-0" />
                                <span>{successMessages?.[category?.id]}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {categorySelectionSuccess && selectedCategories?.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-success bg-success/10 px-3 py-2 rounded-md mt-3">
                    <Icon name="CheckCircle2" size={14} className="flex-shrink-0" />
                    <span>{selectedCategories?.length} {selectedCategories?.length === 1 ? 'category' : 'categories'} selected</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 bg-muted rounded-lg">
                <Icon name="AlertCircle" size={32} className="mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground mb-1">No fee structure found for this term</p>
                <p className="text-xs text-muted-foreground">Please set up fee structure for {selectedStudent?.name} in Student Management</p>
              </div>
            )}
            {errors?.categories && (
              <div className="flex items-center gap-2 text-xs text-error bg-error/10 px-3 py-2 rounded-md mt-3">
                <Icon name="AlertCircle" size={14} className="flex-shrink-0" />
                <span>{errors?.categories}</span>
              </div>
            )}
          </div>
        )}

        {selectedCategories?.length > 0 && (
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm md:text-base font-medium text-foreground">Total Amount</span>
              <span className="text-xl md:text-2xl font-bold text-primary data-text">
                ₹{totalAmount?.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                paymentMode === 'cash' ? 'bg-success/10 text-success' : 'bg-blue-100 text-blue-700'
              }`}>
                <Icon name={paymentMode === 'cash' ? 'Banknote' : 'Smartphone'} size={11} />
                {paymentMode === 'cash' ? 'Cash' : 'UPI'}
              </span>
              {paymentMode === 'upi' && utrNumber && (
                <span className="text-xs text-muted-foreground">UTR: {utrNumber}</span>
              )}
            </div>
            {selectedCategories?.length > 1 && (
              <p className="text-xs text-muted-foreground mt-2">Partial payment not allowed for multiple categories</p>
            )}
          </div>
        )}

        {errors?.amount && <p className="text-xs text-error">{errors?.amount}</p>}
        {errors?.submit && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-sm text-error">{errors?.submit}</div>
        )}

        <Button
          variant="default"
          iconName="Check"
          iconPosition="left"
          onClick={handleSubmit}
          loading={isProcessing}
          disabled={!selectedTerm || selectedCategories?.length === 0 || isLoadingFees}
          className="w-full min-h-[48px] text-base font-semibold"
        >
          {paymentMode === 'upi' ? 'Confirm UPI Payment' : 'Process Cash Payment'}
        </Button>
      </div>
    </div>
  );
};

export default CashPaymentForm;