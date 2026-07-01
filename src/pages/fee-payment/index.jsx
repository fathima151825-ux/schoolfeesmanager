import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import jsPDF from 'jspdf';

import BrandHeader from '../../components/ui/BrandHeader';
import ParentTabNavigation from '../../components/ui/ParentTabNavigation';
import FeeCategory from './components/FeeCategory';
import TermSelector from './components/TermSelector';
import PaymentSummary from './components/PaymentSummary';
import PaymentGatewayModal from './components/PaymentGatewayModal';
import PaymentSuccessModal from './components/PaymentSuccessModal';
import UpiPaymentSection from './components/UpiPaymentSection';
import { initiateRazorpayCheckout, generateOrderId } from '../../services/razorpayService';
import { generateReceiptNumber } from '../../services/paymentService';
import { useAuth } from '../../contexts/AuthContext';
import { getClassFeeStructure, getCurrentAcademicYear } from '../../services/feeService';
import { supabase } from '../../lib/supabase';

const FeePayment = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [selectedTerm, setSelectedTerm] = useState('term1');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [partialAmounts, setPartialAmounts] = useState({});
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showUpiSection, setShowUpiSection] = useState(false);

  // Real-time fee structure state
  const [studentData, setStudentData] = useState({
    name: '',
    admissionNumber: '',
    class: '',
    section: '',
    academicYear: ''
  });
  const [feeCategories, setFeeCategories] = useState({ term1: [], term2: [], term3: [] });
  const [loadingFees, setLoadingFees] = useState(true);
  const [feeError, setFeeError] = useState(null);
  const [currentAcademicYear, setCurrentAcademicYear] = useState(null);

  const terms = [
    { id: 'term1', name: 'Term 1', period: 'June - September', dueDate: '2025-09-30' },
    { id: 'term2', name: 'Term 2', period: 'October - January', dueDate: '2026-01-31' },
    { id: 'term3', name: 'Term 3', period: 'February - May', dueDate: '2026-05-31' }
  ];

  // Load student data and class fee structure on mount
  useEffect(() => {
    const loadStudentAndFees = async () => {
      setLoadingFees(true);
      setFeeError(null);
      try {
        // 1. Get current academic year
        const academicYear = await getCurrentAcademicYear();
        setCurrentAcademicYear(academicYear);

        // 2. Get student linked to this parent
        let student = null;
        if (user?.id) {
          const { data: parentStudentData } = await supabase?.from('parent_students')?.select('student_id, students(id, name, admission_number, class, section)')?.eq('parent_id', user?.id)?.limit(1)?.single();

          student = parentStudentData?.students;
        }

        if (student) {
          setStudentData({
            name: student?.name || '',
            admissionNumber: student?.admission_number || '',
            class: student?.class || '',
            section: student?.section || '',
            academicYear: academicYear?.yearName || academicYear?.year_name || ''
          });

          // 3. Load class fee structure using class_id (UUID) when available, else text name
          const classLookupKey = student?.class_id || student?.classId || student?.class;
          if (classLookupKey && academicYear?.id) {
            const classFees = await getClassFeeStructure(classLookupKey, academicYear?.id);

            // 4. Get payments already made for this student
            const { data: payments } = await supabase?.from('payments')?.select('term, fee_category_id, amount')?.eq('student_id', student?.id)?.eq('academic_year_id', academicYear?.id)?.eq('payment_status', 'completed');

            // Build paid amounts map: term+categoryId -> paidAmount
            const paidMap = {};
            (payments || [])?.forEach(p => {
              const key = `${p?.term}_${p?.fee_category_id}`;
              paidMap[key] = (paidMap?.[key] || 0) + parseFloat(p?.amount || 0);
            });

            // 5. Group by term and build fee categories
            const grouped = { term1: [], term2: [], term3: [] };
            classFees?.forEach(fee => {
              const term = fee?.term;
              if (!grouped?.[term]) return;
              const catId = fee?.feeCategoryId || fee?.fee_category_id;
              const catName = fee?.feeCategories?.name || fee?.fee_categories?.name || 'Fee';
              const catDesc = fee?.feeCategories?.description || fee?.fee_categories?.description || '';
              const totalAmount = parseFloat(fee?.amount || 0);
              const paidKey = `${term}_${catId}`;
              const paidAmount = paidMap?.[paidKey] || 0;

              grouped?.[term]?.push({
                id: `${term}_${catId}`,
                dbId: fee?.id,
                feeCategoryId: catId,
                name: catName,
                description: catDesc,
                totalAmount,
                paidAmount
              });
            });

            setFeeCategories(grouped);
          }
        } else {
          // Fallback: no student linked
          setFeeError('No student linked to this account. Please contact admin.');
        }
      } catch (err) {
        console.error('loadStudentAndFees error:', err);
        setFeeError('Failed to load fee structure. Please try again.');
      } finally {
        setLoadingFees(false);
      }
    };

    loadStudentAndFees();
  }, [user?.id]);

  // Real-time subscription for fee structure changes
  useEffect(() => {
    if (!currentAcademicYear?.id || !studentData?.class) return;

    const channel = supabase?.channel('class_fee_structures_changes')?.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_fee_structures',
          filter: `academic_year_id=eq.${currentAcademicYear?.id}`
        },
        async () => {
          // Reload fee structure when admin updates it
          const classLookupKey2 = studentData?.classId || studentData?.class_id || studentData?.class;
          if (classLookupKey2) {
            const classFees = await getClassFeeStructure(classLookupKey2, currentAcademicYear?.id);
            const grouped = { term1: [], term2: [], term3: [] };
            classFees?.forEach(fee => {
              const term = fee?.term;
              if (!grouped?.[term]) return;
              const catId = fee?.feeCategoryId || fee?.fee_category_id;
              const catName = fee?.feeCategories?.name || fee?.fee_categories?.name || 'Fee';
              const catDesc = fee?.feeCategories?.description || fee?.fee_categories?.description || '';
              const totalAmount = parseFloat(fee?.amount || 0);
              grouped?.[term]?.push({
                id: `${term}_${catId}`,
                dbId: fee?.id,
                feeCategoryId: catId,
                name: catName,
                description: catDesc,
                totalAmount,
                paidAmount: 0
              });
            });
            setFeeCategories(grouped);
          }
        }
      )?.subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [currentAcademicYear?.id, studentData?.class]);

  const [termPaymentStatus, setTermPaymentStatus] = useState({
    term1: { paid: false, locked: false },
    term2: { paid: false, locked: true },
    term3: { paid: false, locked: true }
  });

  useEffect(() => {
    const term1Categories = feeCategories?.term1;
    const term1FullyPaid = term1Categories?.length > 0 && term1Categories?.every(cat => cat?.paidAmount >= cat?.totalAmount);

    const term2Categories = feeCategories?.term2;
    const term2FullyPaid = term2Categories?.length > 0 && term2Categories?.every(cat => cat?.paidAmount >= cat?.totalAmount);

    setTermPaymentStatus({
      term1: { paid: term1FullyPaid, locked: false },
      term2: { paid: term2FullyPaid, locked: !term1FullyPaid },
      term3: { paid: false, locked: !term2FullyPaid }
    });
  }, [feeCategories]);

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev?.includes(categoryId)) {
        const newPartialAmounts = { ...partialAmounts };
        delete newPartialAmounts?.[categoryId];
        setPartialAmounts(newPartialAmounts);
        return prev?.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handlePartialAmountChange = (categoryId, amount) => {
    const numAmount = parseFloat(amount) || 0;
    const category = feeCategories?.[selectedTerm]?.find(cat => cat?.id === categoryId);
    const maxAmount = category?.totalAmount - category?.paidAmount;

    if (numAmount <= maxAmount) {
      setPartialAmounts(prev => ({
        ...prev,
        [categoryId]: numAmount > 0 ? numAmount : null
      }));
    }
  };

  const calculateTotalAmount = () => {
    return selectedCategories?.reduce((total, categoryId) => {
      const category = feeCategories?.[selectedTerm]?.find(cat => cat?.id === categoryId);
      const partialAmount = partialAmounts?.[categoryId];
      const amount = partialAmount || (category?.totalAmount - category?.paidAmount);
      return total + amount;
    }, 0);
  };

  const getSelectedCategoriesWithAmounts = () => {
    return selectedCategories?.map(categoryId => {
      const category = feeCategories?.[selectedTerm]?.find(cat => cat?.id === categoryId);
      return {
        ...category,
        partialAmount: partialAmounts?.[categoryId]
      };
    });
  };

  const handleProceedToPayment = () => {
    if (selectedCategories?.length === 0) {
      return;
    }

    const hasMultipleCategories = selectedCategories?.length > 1;
    const hasPartialPayment = Object.keys(partialAmounts)?.some(key => partialAmounts?.[key] > 0);

    if (hasMultipleCategories && hasPartialPayment) {
      alert('Partial payment is not allowed when multiple categories are selected. Please pay full amount or select only one category for partial payment.');
      return;
    }

    handleRazorpayPayment();
  };

  const handleRazorpayPayment = async () => {
    setProcessingPayment(true);
    setPaymentError(null);

    try {
      const amount = calculateTotalAmount();
      const orderId = generateOrderId();

      // Get student details from parent-student relationship
      // In production, fetch from Supabase
      const studentEmail = user?.email || 'parent@example.com';
      const studentMobile = profile?.mobile || '9999999999';

      // Store payment details in sessionStorage for retry functionality
      sessionStorage.setItem('payment_amount', amount);
      sessionStorage.setItem('student_name', studentData?.name);
      sessionStorage.setItem('student_email', studentEmail);
      sessionStorage.setItem('student_mobile', studentMobile);
      sessionStorage.setItem('fee_category', getSelectedCategoriesWithAmounts()?.map(c => c?.name)?.join(', '));

      await initiateRazorpayCheckout({
        amount,
        orderId,
        studentName: studentData?.name,
        studentEmail,
        studentMobile,
        onSuccess: async (razorpayResponse) => {
          await handlePaymentSuccess(razorpayResponse, amount, orderId);
        },
        onFailure: (error) => {
          handlePaymentFailure(error);
        }
      });
    } catch (error) {
      console.error('Payment initiation error:', error);
      setPaymentError(error?.message || 'Failed to initiate payment');
      setProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async (razorpayResponse, amount, orderId) => {
    try {
      const receiptNumber = generateReceiptNumber();
      const selectedCategoriesData = getSelectedCategoriesWithAmounts();

      // Store all payment details in sessionStorage for the success screen
      sessionStorage.setItem('razorpay_payment_id', razorpayResponse?.razorpayPaymentId || '');
      sessionStorage.setItem('razorpay_order_id', razorpayResponse?.razorpayOrderId || orderId || '');
      sessionStorage.setItem('payment_amount', amount);
      sessionStorage.setItem('receipt_number', receiptNumber);
      sessionStorage.setItem('payment_method', 'Razorpay Online Payment');
      sessionStorage.setItem('student_name', studentData?.name);
      sessionStorage.setItem('fee_category', selectedCategoriesData?.map(c => c?.name)?.join(', '));

      setSelectedCategories([]);
      setPartialAmounts({});

      navigate('/payment-success');
    } catch (error) {
      console.error('Payment recording error:', error);
      setPaymentError('Payment successful but failed to record. Please contact admin.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
    const errorMsg = error || 'Payment failed. Please try again.';

    // Store failure details in sessionStorage for the failure screen
    sessionStorage.setItem('payment_error', errorMsg);
    sessionStorage.setItem('error_reference', `ERR${Date.now()}`);
    // payment_amount, student_name, fee_category, student_email, student_mobile already set before checkout

    setProcessingPayment(false);
    navigate('/payment-failure');
  };

  const handlePaymentSuccess_OLD = (details) => {
    setShowPaymentGateway(false);
    setPaymentDetails(details);
    setShowSuccessModal(true);
    setSelectedCategories([]);
    setPartialAmounts({});
  };

  const handleDownloadReceipt = () => {
    if (!paymentDetails) return;

    const doc = new jsPDF();
    const pageWidth = doc?.internal?.pageSize?.getWidth();
    const pageHeight = doc?.internal?.pageSize?.getHeight();
    const margin = 20;
    let yPosition = 20;

    // Add logo at the top center
    const logoImg = new Image();
    logoImg.src = '/assets/images/Untitled_design-1775296554870.png';
    
    logoImg.onload = () => {
      // Draw logo centered at top
      const logoWidth = 30;
      const logoHeight = 30;
      const logoX = (pageWidth - logoWidth) / 2;
      doc?.addImage(logoImg, 'PNG', logoX, yPosition, logoWidth, logoHeight);
      yPosition += logoHeight + 10;

      // School name
      doc?.setFontSize(20);
      doc?.setFont('helvetica', 'bold');
      doc?.text('SSVM SCHOOL', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      // Receipt title
      doc?.setFontSize(14);
      doc?.text('FEE PAYMENT RECEIPT', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Horizontal line
      doc?.setLineWidth(0.5);
      doc?.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Receipt details
      doc?.setFontSize(10);
      doc?.setFont('helvetica', 'normal');
      doc?.text(`Receipt No: ${paymentDetails?.receiptNumber}`, margin, yPosition);
      doc?.text(`Date: ${new Date(paymentDetails?.date)?.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })}`, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 15;

      // Student details section
      doc?.setFontSize(12);
      doc?.setFont('helvetica', 'bold');
      doc?.text('STUDENT DETAILS', margin, yPosition);
      yPosition += 8;

      doc?.setFontSize(10);
      doc?.setFont('helvetica', 'normal');
      doc?.text(`Name: ${studentData?.name}`, margin, yPosition);
      yPosition += 6;
      doc?.text(`Admission No: ${studentData?.admissionNumber}`, margin, yPosition);
      yPosition += 6;
      doc?.text(`Class: ${studentData?.class} - ${studentData?.section}`, margin, yPosition);
      yPosition += 6;
      doc?.text(`Academic Year: ${studentData?.academicYear}`, margin, yPosition);
      yPosition += 15;

      // Payment details section
      doc?.setFontSize(12);
      doc?.setFont('helvetica', 'bold');
      doc?.text('PAYMENT DETAILS', margin, yPosition);
      yPosition += 8;

      doc?.setFontSize(10);
      doc?.setFont('helvetica', 'normal');
      doc?.text(`Transaction ID: ${paymentDetails?.transactionId}`, margin, yPosition);
      yPosition += 6;
      doc?.text(`Order ID: ${paymentDetails?.orderId}`, margin, yPosition);
      yPosition += 6;
      doc?.text(`Payment Method: ${paymentDetails?.method}`, margin, yPosition);
      yPosition += 6;
      doc?.text('Payment Status: Successful', margin, yPosition);
      yPosition += 15;

      // Fee breakdown section
      doc?.setFontSize(12);
      doc?.setFont('helvetica', 'bold');
      doc?.text('FEE BREAKDOWN', margin, yPosition);
      yPosition += 8;

      doc?.setFontSize(10);
      doc?.setFont('helvetica', 'normal');
      paymentDetails?.categories?.forEach(cat => {
        const amount = cat?.partialAmount || (cat?.totalAmount - cat?.paidAmount);
        doc?.text(`${cat?.name}`, margin, yPosition);
        doc?.text(`₹${amount?.toLocaleString('en-IN')}`, pageWidth - margin, yPosition, { align: 'right' });
        yPosition += 6;
      });

      yPosition += 5;
      // Horizontal line before total
      doc?.setLineWidth(0.5);
      doc?.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Total amount
      doc?.setFontSize(12);
      doc?.setFont('helvetica', 'bold');
      doc?.text('TOTAL AMOUNT PAID:', margin, yPosition);
      doc?.text(`₹${paymentDetails?.amount?.toLocaleString('en-IN')}`, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 15;

      // Footer
      doc?.setFontSize(9);
      doc?.setFont('helvetica', 'italic');
      doc?.text('Thank you for your payment!', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;
      doc?.text('This is a computer-generated receipt.', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      doc?.text('For any queries, please contact the school office.', pageWidth / 2, yPosition, { align: 'center' });

      // Save PDF
      doc?.save(`Receipt_${paymentDetails?.receiptNumber?.replace(/\//g, '_')}_${new Date()?.getTime()}.pdf`);
    };

    // Fallback if logo fails to load
    logoImg.onerror = () => {
      // Generate PDF without logo
      doc?.setFontSize(20);
      doc?.setFont('helvetica', 'bold');
      doc?.text('SSVM SCHOOL', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      doc?.setFontSize(14);
      doc?.text('FEE PAYMENT RECEIPT', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc?.setLineWidth(0.5);
      doc?.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      doc?.setFontSize(10);
      doc?.setFont('helvetica', 'normal');
      doc?.text(`Receipt No: ${paymentDetails?.receiptNumber}`, margin, yPosition);
      doc?.text(`Date: ${new Date(paymentDetails?.date)?.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })}`, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 15;

      doc?.setFontSize(12);
      doc?.setFont('helvetica', 'bold');
      doc?.text('STUDENT DETAILS', margin, yPosition);
      yPosition += 8;

      doc?.setFontSize(10);
      doc?.setFont('helvetica', 'normal');
      doc?.text(`Name: ${studentData?.name}`, margin, yPosition);
      yPosition += 6;
      doc?.text(`Admission No: ${studentData?.admissionNumber}`, margin, yPosition);
      yPosition += 6;
      doc?.text(`Class: ${studentData?.class} - ${studentData?.section}`, margin, yPosition);
      yPosition += 6;
      doc?.text(`Academic Year: ${studentData?.academicYear}`, margin, yPosition);
      yPosition += 15;

      doc?.setFontSize(12);
      doc?.setFont('helvetica', 'bold');
      doc?.text('PAYMENT DETAILS', margin, yPosition);
      yPosition += 8;

      doc?.setFontSize(10);
      doc?.setFont('helvetica', 'normal');
      doc?.text(`Transaction ID: ${paymentDetails?.transactionId}`, margin, yPosition);
      yPosition += 6;
      doc?.text(`Order ID: ${paymentDetails?.orderId}`, margin, yPosition);
      yPosition += 6;
      doc?.text(`Payment Method: ${paymentDetails?.method}`, margin, yPosition);
      yPosition += 6;
      doc?.text('Payment Status: Successful', margin, yPosition);
      yPosition += 15;

      doc?.setFontSize(12);
      doc?.setFont('helvetica', 'bold');
      doc?.text('FEE BREAKDOWN', margin, yPosition);
      yPosition += 8;

      doc?.setFontSize(10);
      doc?.setFont('helvetica', 'normal');
      paymentDetails?.categories?.forEach(cat => {
        const amount = cat?.partialAmount || (cat?.totalAmount - cat?.paidAmount);
        doc?.text(`${cat?.name}`, margin, yPosition);
        doc?.text(`₹${amount?.toLocaleString('en-IN')}`, pageWidth - margin, yPosition, { align: 'right' });
        yPosition += 6;
      });

      yPosition += 5;
      doc?.setLineWidth(0.5);
      doc?.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      doc?.setFontSize(12);
      doc?.setFont('helvetica', 'bold');
      doc?.text('TOTAL AMOUNT PAID:', margin, yPosition);
      doc?.text(`₹${paymentDetails?.amount?.toLocaleString('en-IN')}`, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 15;

      doc?.setFontSize(9);
      doc?.setFont('helvetica', 'italic');
      doc?.text('Thank you for your payment!', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;
      doc?.text('This is a computer-generated receipt.', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      doc?.text('For any queries, please contact the school office.', pageWidth / 2, yPosition, { align: 'center' });

      doc?.save(`Receipt_${paymentDetails?.receiptNumber?.replace(/\//g, '_')}_${new Date()?.getTime()}.pdf`);
    };
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigate('/parent-dashboard');
  };

  const totalAmount = calculateTotalAmount();
  const allowPartialPayment = selectedCategories?.length === 1;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <BrandHeader variant="parent" academicYear={studentData?.academicYear} />
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => navigate('/parent-dashboard')}
              className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
            >
              <Icon name="ArrowLeft" size={20} className="text-muted-foreground" />
            </button>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground">
              Fee Payment
            </h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground font-caption ml-10">
            Select fee categories and proceed with secure payment
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-caption mb-1">Student Name</p>
              <p className="text-sm md:text-base font-semibold text-foreground">{studentData?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-caption mb-1">Admission Number</p>
              <p className="text-sm md:text-base font-semibold text-foreground data-text">{studentData?.admissionNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-caption mb-1">Class & Section</p>
              <p className="text-sm md:text-base font-semibold text-foreground">{studentData?.class} - {studentData?.section}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-caption mb-1">Academic Year</p>
              <p className="text-sm md:text-base font-semibold text-foreground">{studentData?.academicYear}</p>
            </div>
          </div>
        </div>

        <TermSelector
          terms={terms}
          selectedTerm={selectedTerm}
          onTermChange={setSelectedTerm}
          termStatus={termPaymentStatus}
        />

        {/* Loading state */}
        {loadingFees && (
          <div className="mt-6 flex items-center justify-center py-12">
            <Icon name="Loader2" size={32} className="animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground text-sm">Loading fee structure...</span>
          </div>
        )}

        {/* Fee error state */}
        {!loadingFees && feeError && (
          <div className="mt-6 p-4 rounded-lg bg-error/10 border border-error/20 flex items-start gap-3">
            <Icon name="AlertCircle" size={20} className="text-error flex-shrink-0 mt-0.5" />
            <p className="text-sm text-error">{feeError}</p>
          </div>
        )}

        {/* No fee structure set by admin */}
        {!loadingFees && !feeError && feeCategories?.[selectedTerm]?.length === 0 && (
          <div className="mt-6 p-6 rounded-lg bg-muted/50 border border-border text-center">
            <Icon name="IndianRupee" size={32} className="mx-auto mb-2 text-muted-foreground opacity-40" />
            <p className="text-sm font-medium text-foreground mb-1">Fee structure not set</p>
            <p className="text-xs text-muted-foreground">
              The fee structure for Class {studentData?.class} has not been configured yet for this term. 
              Please contact the school admin.
            </p>
          </div>
        )}

        {!loadingFees && !feeError && termPaymentStatus?.[selectedTerm]?.locked && (
          <div className="mt-6 p-4 md:p-6 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-start gap-3">
              <Icon name="AlertCircle" size={24} className="text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-1">
                  Term Locked
                </h3>
                <p className="text-sm md:text-base text-muted-foreground font-caption">
                  Please complete the payment for {selectedTerm === 'term2' ? 'Term 1' : 'Term 2'} before proceeding with this term's payment.
                </p>
              </div>
            </div>
          </div>
        )}

        {!loadingFees && !feeError && !termPaymentStatus?.[selectedTerm]?.locked && (
          <>
            <div className="mt-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Layers" size={20} className="text-primary" />
                <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
                  Fee Categories
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {feeCategories?.[selectedTerm]?.map((category) => (
                  <FeeCategory
                    key={category?.id}
                    category={category}
                    isSelected={selectedCategories?.includes(category?.id)}
                    onToggle={() => handleCategoryToggle(category?.id)}
                    partialAmount={partialAmounts?.[category?.id]}
                    onPartialAmountChange={(amount) => handlePartialAmountChange(category?.id, amount)}
                    allowPartialPayment={allowPartialPayment}
                    disabled={termPaymentStatus?.[selectedTerm]?.locked}
                    onPayNow={() => {
                      if (!selectedCategories?.includes(category?.id)) {
                        handleCategoryToggle(category?.id);
                      }
                      setShowPaymentSheet(true);
                    }}
                    processingPayment={processingPayment}
                  />
                ))}
              </div>

              {selectedCategories?.length > 1 && Object.keys(partialAmounts)?.length > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-error/10 border border-error/20">
                  <div className="flex items-start gap-3">
                    <Icon name="AlertTriangle" size={20} className="text-error flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-error font-caption">
                      Partial payment is not allowed when multiple categories are selected. Please pay full amount or select only one category.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom sheet for payment - shown when Pay Now is clicked */}
            {showPaymentSheet && (
              <div className="fixed inset-0 z-50 flex items-end justify-center">
                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => { setShowPaymentSheet(false); setShowUpiSection(false); }}
                />
                {/* Sheet */}
                <div className="relative w-full max-w-lg bg-background rounded-t-2xl shadow-2xl p-5 pb-8 animate-slide-up">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon name="Receipt" size={18} className="text-primary" />
                      <h2 className="text-base font-heading font-semibold text-foreground">Payment Summary</h2>
                    </div>
                    <button
                      onClick={() => { setShowPaymentSheet(false); setShowUpiSection(false); }}
                      className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                    >
                      <Icon name="X" size={18} className="text-muted-foreground" />
                    </button>
                  </div>

                  <PaymentSummary
                    selectedCategories={getSelectedCategoriesWithAmounts()}
                    totalAmount={totalAmount}
                    onProceedToPayment={() => { setShowPaymentSheet(false); handleProceedToPayment(); }}
                    processingPayment={processingPayment}
                    onSelectUpi={() => setShowUpiSection(true)}
                  />

                  {totalAmount > 0 && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setShowUpiSection(prev => !prev)}
                        className="flex items-center gap-2 mb-3 w-full text-left"
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${showUpiSection ? 'bg-blue-600 border-blue-600' : 'border-gray-400 bg-white'}`}>
                          {showUpiSection && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <Icon name="Smartphone" size={16} className="text-blue-600" />
                        <h3 className="text-sm font-heading font-semibold text-foreground">
                          Pay via UPI
                        </h3>
                      </button>
                      {showUpiSection && (
                        <UpiPaymentSection
                          amount={totalAmount}
                          studentName={studentData?.name}
                          onPaymentInitiated={() => {}}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <ParentTabNavigation />
      <PaymentGatewayModal
        isOpen={showPaymentGateway}
        amount={totalAmount}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setShowPaymentGateway(false)}
      />
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        paymentDetails={paymentDetails}
        onClose={handleCloseSuccessModal}
        onDownloadReceipt={handleDownloadReceipt}
      />

      {paymentError && (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 bg-error/10 border border-error text-error p-4 rounded-lg shadow-warm-lg z-50">
          <div className="flex items-start gap-3">
            <Icon name="AlertCircle" size={20} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1">Payment Error</p>
              <p className="text-xs">{paymentError}</p>
            </div>
            <button
              onClick={() => setPaymentError(null)}
              className="text-error hover:text-error/80"
            >
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeePayment;