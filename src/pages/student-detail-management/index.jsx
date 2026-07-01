import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Select from '../../components/ui/Select';
import AdminSidebarNavigation from '../../components/ui/AdminSidebarNavigation';
import BrandHeader from '../../components/ui/BrandHeader';
import StudentProfileCard from './components/StudentProfileCard';
import FeeManagementTab from './components/FeeManagementTab';
import PaymentEntryForm from './components/PaymentEntryForm';
import PaymentTimeline from './components/PaymentTimeline';
import AdministrativeNotes from './components/AdministrativeNotes';
import QuickActions from './components/QuickActions';
import { getStudentById } from '../../services/studentService';
import { getAcademicYears, getStudentFeeStructure, calculateFeeSummary } from '../../services/feeService';
import { useAcademicYear } from '../../contexts/AcademicYearContext';
import useRealtimeSubscription from '../../hooks/useRealtimeSubscription';

const StudentDetailManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentAcademicYear } = useAcademicYear();
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedYear, setSelectedYear] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState([]);
  const [feeData, setFeeData] = useState(null);

  // Get student ID from location state or URL
  const studentId = location?.state?.studentId;

  useEffect(() => {
    loadInitialData();
  }, [studentId]);

  // When currentAcademicYear loads from context, default selectedYear to it
  useEffect(() => {
    if (currentAcademicYear?.id && !selectedYear) {
      setSelectedYear(currentAcademicYear?.id);
    }
  }, [currentAcademicYear?.id]);

  useEffect(() => {
    if (selectedYear && studentId) {
      loadFeeData();
    }
  }, [selectedYear, studentId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Always fetch academic years unconditionally
      const years = await getAcademicYears();
      const yearOptions = years?.map(y => ({ value: y?.id, label: y?.yearName })) || [];
      setAcademicYears(yearOptions);

      // Default to current academic year from context, fallback to first in list
      if (currentAcademicYear?.id) {
        setSelectedYear(currentAcademicYear?.id);
      } else if (yearOptions?.length > 0) {
        // Find the year marked as current, else use first
        const currentYearOption = yearOptions?.find(y =>
          years?.find(yr => yr?.id === y?.value && yr?.isCurrent)
        );
        setSelectedYear(currentYearOption?.value || yearOptions?.[0]?.value);
      }

      if (!studentId) {
        setLoading(false);
        return;
      }

      const data = await getStudentById(studentId);
      setStudentData(data);
    } catch (error) {
      console.error('Failed to load student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeeData = async () => {
    if (!studentId || !selectedYear) return;
    try {
      const feeStructure = await getStudentFeeStructure(studentId, selectedYear);
      const summary = await calculateFeeSummary(studentId, selectedYear);

      const termGroups = feeStructure?.reduce((acc, fee) => {
        if (!acc?.[fee?.term]) {
          acc[fee.term] = [];
        }
        acc?.[fee?.term]?.push(fee);
        return acc;
      }, {}) || {};

      const terms = Object.entries(termGroups)?.map(([termName, fees], idx) => {
        const totalAmount = fees?.reduce((sum, f) => sum + (f?.amount || 0), 0);
        const paidAmount = fees?.reduce((sum, f) => sum + (f?.paid_amount || 0), 0);
        const balance = totalAmount - paidAmount;
        return {
          id: idx + 1,
          name: termName,
          dueDate: fees?.[0]?.due_date || '',
          status: balance <= 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending',
          totalAmount,
          balance,
          categories: fees?.map((f, i) => ({
            id: i + 1,
            name: f?.fee_category || f?.category || 'Fee',
            amount: f?.amount || 0,
            paid: f?.paid_amount || 0,
            balance: (f?.amount || 0) - (f?.paid_amount || 0)
          }))
        };
      });

      setFeeData({
        totalFees: summary?.totalFees || 0,
        paidAmount: summary?.paidAmount || 0,
        outstandingBalance: summary?.outstandingBalance || 0,
        terms: terms || []
      });
    } catch (error) {
      console.error('Failed to load fee data:', error);
    }
  };

  // Realtime: reload when this student's data or payments change
  useRealtimeSubscription(
    [
      { table: 'students', filter: studentId ? `id=eq.${studentId}` : undefined },
      { table: 'payments', filter: studentId ? `student_id=eq.${studentId}` : undefined }
    ],
    () => {
      loadInitialData();
    },
    [studentId]
  );

  const handlePhotoUpdated = async (newPhotoPath) => {
    // Refresh student data to get updated photo
    if (studentId) {
      try {
        const updatedData = await getStudentById(studentId);
        setStudentData(updatedData);
      } catch (error) {
        console.error('Failed to refresh student data:', error);
      }
    }
  };

  const paymentHistory = [];

  const [administrativeNotes, setAdministrativeNotes] = useState([]);

  const tabs = [
    { id: 'profile', label: 'Student Profile', icon: 'User' },
    { id: 'fees', label: 'Fee Management', icon: 'DollarSign' },
    { id: 'payment-entry', label: 'Payment Entry', icon: 'CreditCard' },
    { id: 'history', label: 'Payment History', icon: 'Receipt' },
    { id: 'notes', label: 'Admin Notes', icon: 'FileText' },
    { id: 'actions', label: 'Quick Actions', icon: 'Zap' }
  ];

  const handlePaymentSubmit = (paymentData) => {
    console.log('Payment submitted:', paymentData);
    alert(`Payment of ₹${paymentData?.amount} recorded successfully!\nReceipt will be generated.`);
  };

  const handleAddNote = (noteContent) => {
    const newNote = {
      id: administrativeNotes?.length + 1,
      content: noteContent,
      addedBy: "Admin User",
      date: new Date()?.toLocaleDateString('en-GB'),
      time: new Date()?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      isImportant: false
    };
    setAdministrativeNotes([newNote, ...administrativeNotes]);
  };

  const handleQuickAction = (actionId) => {
    switch (actionId) {
      case 'send-reminder': alert('Payment reminder sent successfully via SMS and Email!');
        break;
      case 'generate-report': alert('Student report generated successfully! Download will start shortly.');
        break;
      case 'regenerate-receipt': alert('Receipt regeneration initiated. Please select the payment from history.');
        break;
      case 'export-data':
        alert('Student data exported successfully in Excel format!');
        break;
      default:
        console.log('Action:', actionId);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarNavigation />
      <div className="lg:ml-64">
        <BrandHeader variant="admin" />
        
        <main className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 md:mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                  Student Detail Management
                </h1>
                <p className="text-sm md:text-base text-muted-foreground font-caption">
                  Complete financial history and profile management for {studentData?.name}
                </p>
              </div>
              
              <div className="w-full lg:w-64">
                <Select
                  label="Academic Year"
                  options={academicYears}
                  value={selectedYear}
                  onChange={setSelectedYear}
                />
              </div>
            </div>

            <div className="mb-6 md:mb-8">
              <StudentProfileCard 
                student={studentData} 
                selectedYear={selectedYear}
                onPhotoUpdated={handlePhotoUpdated}
              />
            </div>

            <div className="bg-card rounded-lg border border-border mb-6">
              <div className="overflow-x-auto">
                <div className="flex border-b border-border min-w-max">
                  {tabs?.map((tab) => (
                    <button
                      key={tab?.id}
                      onClick={() => setActiveTab(tab?.id)}
                      className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-caption transition-all duration-250 border-b-2 whitespace-nowrap ${
                        activeTab === tab?.id
                          ? 'border-primary text-primary bg-primary/5' :'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon name={tab?.icon} size={18} />
                      <span>{tab?.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {activeTab === 'profile' && (
                <div className="bg-card rounded-lg border border-border p-4 md:p-6 lg:p-8">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon name="User" size={32} className="text-primary" />
                    </div>
                    <p className="text-base md:text-lg text-muted-foreground font-caption">
                      Student profile displayed above
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'fees' && (
                <FeeManagementTab feeData={feeData} selectedYear={selectedYear} />
              )}

              {activeTab === 'payment-entry' && (
                <PaymentEntryForm student={studentData} onPaymentSubmit={handlePaymentSubmit} />
              )}

              {activeTab === 'history' && (
                <PaymentTimeline payments={paymentHistory} />
              )}

              {activeTab === 'notes' && (
                <AdministrativeNotes notes={administrativeNotes} onAddNote={handleAddNote} />
              )}

              {activeTab === 'actions' && (
                <QuickActions student={studentData} onAction={handleQuickAction} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDetailManagement;