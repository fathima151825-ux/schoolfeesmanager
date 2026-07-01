import React, { useState, useEffect } from 'react';
import AdminSidebarNavigation from '../../components/ui/AdminSidebarNavigation';
import BrandHeader from '../../components/ui/BrandHeader';
import Icon from '../../components/AppIcon';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import Button from '../../components/ui/Button';
import ReceiptGenerator from '../payment-management/components/ReceiptGenerator';
import { searchStudents } from '../../services/studentService';
import { getFeeCategories, getClassFeeStructure } from '../../services/feeService';
import { createPayment, generateReceiptNumber } from '../../services/paymentService';
import { getCurrentUser } from '../../services/authService';
import { useAcademicYear } from '../../contexts/AcademicYearContext';

const QuickCashPayment = () => {
  const { currentAcademicYear } = useAcademicYear();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const [feeCategories, setFeeCategories] = useState([]);
  const [classFeeStructure, setClassFeeStructure] = useState([]);
  const [feeLoadError, setFeeLoadError] = useState(null);
  const [isFeeLoading, setIsFeeLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    loadFeeCategories();
  }, []);

  useEffect(() => {
    if (selectedStudent?.id && currentAcademicYear?.id) {
      loadClassFees();
    }
  }, [selectedStudent, currentAcademicYear?.id]);

  useEffect(() => {
    const total = Object.values(amounts)?.reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
    setTotalAmount(total);
  }, [amounts]);

  const loadFeeCategories = async () => {
    try {
      const categories = await getFeeCategories();
      setFeeCategories(categories);
    } catch (error) {
      console.error('Error loading fee categories:', error);
    }
  };

  /**
   * Load fee structure using class_id (UUID) — never text class name.
   * Priority: student.classId (UUID) → fallback resolve from student.class text.
   */
  const loadClassFees = async () => {
    setIsFeeLoading(true);
    setFeeLoadError(null);
    setClassFeeStructure([]);

    const academicYearId = currentAcademicYear?.id;
    const academicYearName = currentAcademicYear?.yearName || currentAcademicYear?.year_name;

    // Prefer the UUID class_id stored on the student record
    const classId = selectedStudent?.classId || selectedStudent?.class_id;
    const classDisplayName = selectedStudent?.class || '(unknown)';

    if (!classId && !selectedStudent?.class) {
      setFeeLoadError(`Student record does not have a class assigned. Please update the student's class in Student Management.`);
      setIsFeeLoading(false);
      return;
    }

    if (!academicYearId) {
      setFeeLoadError(`No current academic year is set. Please configure one in Academic Year Management.`);
      setIsFeeLoading(false);
      return;
    }

    try {
      // Pass class_id UUID if available; otherwise pass text name (feeService will resolve it)
      const lookupKey = classId || selectedStudent?.class;
      const rows = await getClassFeeStructure(lookupKey, academicYearId);

      if (!rows || rows?.length === 0) {
        setFeeLoadError(
          `No fee structure found for Class ${classDisplayName} in Academic Year ${academicYearName}. ` +
          `Please set up the fee structure in Fee Structure Management → select "${academicYearName}" → select Class ${classDisplayName}.`
        );
      } else {
        setClassFeeStructure(rows);
      }
    } catch (error) {
      console.error('Error loading class fee structure:', error);
      setFeeLoadError(`Failed to load fee structure for Class ${classDisplayName}. Error: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsFeeLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm?.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchStudents(searchTerm, currentAcademicYear?.id);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching students:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e?.key === 'Enter') handleSearch();
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchTerm('');
    setSelectedTerm('');
    setSelectedCategories([]);
    setAmounts({});
    setErrors({});
    setFeeLoadError(null);
    setClassFeeStructure([]);
  };

  const termOptions = [
    { value: 'term1', label: 'Term 1 (June - September)' },
    { value: 'term2', label: 'Term 2 (October - January)' },
    { value: 'term3', label: 'Term 3 (February - May)' }
  ];

  /**
   * Build available categories for the selected term from class_fee_structures rows.
   * Match by fee_category_id (UUID) — never by name string.
   */
  const availableCategories = feeCategories
    ?.map(cat => {
      const feeRow = classFeeStructure?.find(
        f => (f?.feeCategoryId || f?.fee_category_id) === cat?.id && f?.term === selectedTerm
      );
      return {
        id: cat?.id,
        label: cat?.name,
        amount: feeRow ? parseFloat(feeRow?.amount || 0) : 0
      };
    })
    ?.filter(cat => cat?.amount > 0);

  const hasFeesForSelectedTerm = classFeeStructure?.some(f => f?.term === selectedTerm);

  const handleCategoryToggle = (categoryId) => {
    const category = availableCategories?.find(cat => cat?.id === categoryId);
    console.log('Checkbox clicked');
    console.log('Fee category ID:', categoryId);
    setSelectedCategories(prev => {
      console.log('Selected fee IDs before update:', prev);
      let updated;
      if (prev?.includes(categoryId)) {
        const newAmounts = { ...amounts };
        delete newAmounts?.[categoryId];
        setAmounts(newAmounts);
        updated = prev?.filter(id => id !== categoryId);
      } else {
        // Auto-set the standard amount when selecting a category
        setAmounts(prevAmounts => ({
          ...prevAmounts,
          [categoryId]: category?.amount?.toString() || '0'
        }));
        updated = [...prev, categoryId];
      }
      console.log('Selected fee IDs after update:', updated);
      return updated;
    });
  };

  const handleAmountChange = (categoryId, value) => {
    const category = availableCategories?.find(cat => cat?.id === categoryId);
    const numValue = parseFloat(value) || 0;
    if (selectedCategories?.length === 1 && selectedCategories?.[0] === categoryId) {
      if (numValue > category?.amount) {
        setErrors({ ...errors, [categoryId]: `Amount cannot exceed ₹${category?.amount?.toLocaleString('en-IN')}` });
      } else {
        const newErrors = { ...errors };
        delete newErrors?.[categoryId];
        setErrors(newErrors);
      }
      setAmounts({ ...amounts, [categoryId]: value });
    } else {
      setAmounts({ ...amounts, [categoryId]: category?.amount?.toString() });
    }
  };

  const handleSubmit = async () => {
    if (!selectedTerm) {
      setErrors({ term: 'Please select a term' });
      return;
    }
    if (selectedCategories?.length === 0) {
      setErrors({ categories: 'Please select at least one fee category' });
      return;
    }
    if (totalAmount === 0) {
      setErrors({ amount: 'Total amount must be greater than zero' });
      return;
    }
    if (!currentAcademicYear?.id) {
      setErrors({ submit: 'No current academic year found. Please set one in Academic Year Management.' });
      return;
    }

    setIsProcessing(true);
    try {
      const user = await getCurrentUser();
      const receiptNumber = generateReceiptNumber();

      for (const catId of selectedCategories) {
        await createPayment({
          studentId: selectedStudent?.id,
          academicYearId: currentAcademicYear?.id,
          term: selectedTerm,
          feeCategoryId: catId,
          amount: parseFloat(amounts?.[catId] || 0),
          paymentMethod: 'cash',
          paymentStatus: 'completed',
          receiptNumber: `${receiptNumber}_${catId}`,
          recordedBy: user?.id
        });
      }

      setPaymentData({
        studentName: selectedStudent?.name,
        admissionNumber: selectedStudent?.admissionNumber,
        totalAmount,
        receiptNumber,
        paymentDate: new Date()?.toISOString(),
        academicYear: currentAcademicYear?.yearName || currentAcademicYear?.year_name
      });
      setShowReceipt(true);
      setSelectedTerm('');
      setSelectedCategories([]);
      setAmounts({});
      setErrors({});
    } catch (error) {
      console.error('Error processing payment:', error);
      setErrors({ submit: 'Failed to process payment. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setSelectedStudent(null);
    setPaymentData(null);
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setSelectedTerm('');
    setSelectedCategories([]);
    setAmounts({});
    setErrors({});
    setFeeLoadError(null);
    setClassFeeStructure([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarNavigation />
      <div className="lg:ml-64">
        <BrandHeader variant="admin" />
        <main className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 md:mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Icon name="Zap" size={32} className="text-primary" />
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                  Quick Cash Payment
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm md:text-base text-muted-foreground">
                  Fast cash payment entry with instant receipt generation
                </p>
                {currentAcademicYear && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    {currentAcademicYear?.yearName || currentAcademicYear?.year_name}
                  </span>
                )}
              </div>
            </div>

            {/* Academic Year Warning */}
            {!currentAcademicYear && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm text-amber-700">
                <Icon name="AlertTriangle" size={16} />
                No current academic year set. Please configure one in{' '}
                <a href="/academic-year-management" className="underline font-medium">Academic Year Management</a>.
              </div>
            )}

            <div className="bg-card rounded-lg border border-border p-4 md:p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Search" size={20} className="text-primary" />
                <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
                  Student Search
                </h2>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search by Admission Number, Name, or Mobile"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e?.target?.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <Button
                  variant="default"
                  iconName={isSearching ? 'Loader2' : 'Search'}
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults?.length > 0 && (
                <div className="mt-3 border border-border rounded-lg overflow-hidden">
                  {searchResults?.map((student) => (
                    <button
                      key={student?.id}
                      onClick={() => handleStudentSelect(student)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left border-b border-border last:border-b-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon name="User" size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{student?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {student?.admissionNumber} • Class {student?.class} {student?.section}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Student */}
            {selectedStudent && (
              <>
                <div className="bg-card rounded-lg border border-border p-4 md:p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon name="User" size={20} className="text-primary" />
                      <h2 className="text-lg font-heading font-semibold text-foreground">Selected Student</h2>
                    </div>
                    <button onClick={handleClearStudent} className="text-muted-foreground hover:text-foreground">
                      <Icon name="X" size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="text-sm font-semibold text-foreground">{selectedStudent?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Admission No.</p>
                      <p className="text-sm font-semibold text-foreground">{selectedStudent?.admissionNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Class</p>
                      <p className="text-sm font-semibold text-foreground">Class {selectedStudent?.class} {selectedStudent?.section}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Academic Year</p>
                      <p className="text-sm font-semibold text-primary">{currentAcademicYear?.yearName || currentAcademicYear?.year_name || '—'}</p>
                    </div>
                  </div>

                  {/* Fee structure load status */}
                  {isFeeLoading && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="Loader2" size={14} className="animate-spin" />
                      Loading fee structure for Class {selectedStudent?.class}…
                    </div>
                  )}

                  {/* Specific diagnostic error when fee structure is missing */}
                  {!isFeeLoading && feeLoadError && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                      <Icon name="AlertTriangle" size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Fee Structure Not Found</p>
                        <p className="text-xs text-amber-700 mt-0.5">{feeLoadError}</p>
                        <a
                          href="/fee-structure-management"
                          className="inline-flex items-center gap-1 text-xs text-primary underline mt-1"
                        >
                          <Icon name="ExternalLink" size={11} />
                          Go to Fee Structure Management
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Success indicator */}
                  {!isFeeLoading && !feeLoadError && classFeeStructure?.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <Icon name="CheckCircle" size={14} className="text-green-600" />
                      Fee structure loaded for Class {selectedStudent?.class} — {currentAcademicYear?.yearName || currentAcademicYear?.year_name}
                    </div>
                  )}
                </div>

                {/* Term Selection — only show if fee structure loaded */}
                {!feeLoadError && classFeeStructure?.length > 0 && (
                  <div className="bg-card rounded-lg border border-border p-4 md:p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Icon name="Calendar" size={20} className="text-primary" />
                      <h2 className="text-lg font-heading font-semibold text-foreground">Select Term</h2>
                    </div>
                    <Select
                      label="Term"
                      options={termOptions}
                      value={selectedTerm}
                      onChange={(value) => {
                        setSelectedTerm(value);
                        setSelectedCategories([]);
                        setAmounts({});
                      }}
                      placeholder="Select a term..."
                    />
                    {errors?.term && <p className="text-xs text-red-500 mt-1">{errors?.term}</p>}
                  </div>
                )}

                {/* Fee Categories */}
                {selectedTerm && !feeLoadError && (
                  <div className="bg-card rounded-lg border border-border p-4 md:p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Icon name="IndianRupee" size={20} className="text-primary" />
                      <h2 className="text-lg font-heading font-semibold text-foreground">Fee Categories</h2>
                    </div>
                    {availableCategories?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Icon name="AlertCircle" size={28} className="mx-auto mb-2 opacity-40" />
                        {hasFeesForSelectedTerm ? (
                          <>
                            <p className="text-sm font-medium">No fee categories with amount &gt; 0 for this term.</p>
                            <p className="text-xs mt-1">
                              Class {selectedStudent?.class} has a fee structure for {currentAcademicYear?.yearName || currentAcademicYear?.year_name},
                              but all amounts for {termOptions?.find(t => t?.value === selectedTerm)?.label} are set to ₹0.
                              Please update the amounts in{' '}
                              <a href="/fee-structure-management" className="text-primary underline">Fee Structure Management</a>.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium">
                              No fee structure for {termOptions?.find(t => t?.value === selectedTerm)?.label}.
                            </p>
                            <p className="text-xs mt-1">
                              Class {selectedStudent?.class} does not have fees configured for this term in{' '}
                              {currentAcademicYear?.yearName || currentAcademicYear?.year_name}.
                              Please add it in{' '}
                              <a href="/fee-structure-management" className="text-primary underline">Fee Structure Management</a>.
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {availableCategories?.map(cat => (
                          <div key={cat?.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                            <Checkbox
                              checked={selectedCategories?.includes(cat?.id)}
                              onCheckedChange={() => handleCategoryToggle(cat?.id)}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{cat?.label}</p>
                              <p className="text-xs text-muted-foreground">Standard: ₹{cat?.amount?.toLocaleString('en-IN')}</p>
                            </div>
                            {selectedCategories?.includes(cat?.id) && (
                              <div className="w-32">
                                <Input
                                  type="number"
                                  value={amounts?.[cat?.id] || cat?.amount?.toString()}
                                  onChange={(e) => handleAmountChange(cat?.id, e?.target?.value)}
                                  min="0"
                                  max={cat?.amount}
                                />
                                {errors?.[cat?.id] && <p className="text-xs text-red-500 mt-1">{errors?.[cat?.id]}</p>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {errors?.categories && <p className="text-xs text-red-500 mt-2">{errors?.categories}</p>}
                  </div>
                )}

                {/* Total & Submit */}
                {selectedCategories?.length > 0 && (
                  <div className="bg-card rounded-lg border border-border p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-heading font-semibold text-foreground">Payment Summary</h2>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total Amount</p>
                        <p className="text-2xl font-bold text-primary">₹{totalAmount?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    {errors?.submit && (
                      <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                        {errors?.submit}
                      </div>
                    )}
                    <Button
                      variant="default"
                      iconName={isProcessing ? 'Loader2' : 'CheckCircle'}
                      onClick={handleSubmit}
                      disabled={isProcessing || !currentAcademicYear?.id}
                      fullWidth
                    >
                      {isProcessing ? 'Processing...' : `Collect ₹${totalAmount?.toLocaleString('en-IN')} Cash`}
                    </Button>
                  </div>
                )}
              </>
            )}
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

export default QuickCashPayment;