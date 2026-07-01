import React, { useState, useEffect } from 'react';
import BrandHeader from '../../components/ui/BrandHeader';
import ParentTabNavigation from '../../components/ui/ParentTabNavigation';
import StudentProfileCard from './components/StudentProfileCard';
import ParentDetailsCard from './components/ParentDetailsCard';
import FeeOverviewCard from './components/FeeOverviewCard';
import QuickActionsCard from './components/QuickActionsCard';
import AcademicYearSelector from './components/AcademicYearSelector';
import PaymentDueDateCard from './components/PaymentDueDateCard';
import { getStudentsByParentId } from '../../services/studentService';
import { getStudentFeeStructure, calculateFeeSummary } from '../../services/feeService';
import { getCurrentUser, getUserProfile } from '../../services/authService';
import { useAcademicYear } from '../../contexts/AcademicYearContext';
import useRealtimeSubscription from '../../hooks/useRealtimeSubscription';

const ParentDashboard = () => {
  const { currentAcademicYear, academicYears, loading: yearLoading } = useAcademicYear();
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [parentData, setParentData] = useState(null);
  const [feeData, setFeeData] = useState(null);

  // Set selected year to current when context loads
  useEffect(() => {
    if (!yearLoading && currentAcademicYear?.id && !selectedAcademicYear) {
      setSelectedAcademicYear(currentAcademicYear?.id);
    }
  }, [yearLoading, currentAcademicYear?.id]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (selectedAcademicYear && studentData?.id) {
      loadFeeData();
    }
  }, [selectedAcademicYear, studentData?.id]);

  // Realtime: reload fee data when payments change for this student
  useRealtimeSubscription(
    [{ table: 'payments' }],
    () => {
      if (selectedAcademicYear && studentData?.id) {
        loadFeeData();
      }
    },
    [selectedAcademicYear, studentData?.id]
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();

      if (user?.id) {
        const profile = await getUserProfile(user?.id);
        setParentData({
          fatherName: profile?.fullName || '',
          motherName: '',
          mobileNumber: profile?.mobile || '',
          address: ''
        });

        const studentRecords = await getStudentsByParentId(user?.id);
        if (studentRecords?.length > 0) {
          const firstStudent = studentRecords?.[0];
          setStudentData({
            ...firstStudent?.students,
            fatherName: firstStudent?.fatherName,
            motherName: firstStudent?.motherName,
            address: firstStudent?.address
          });
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeeData = async () => {
    try {
      const feeStructure = await getStudentFeeStructure(studentData?.id, selectedAcademicYear);
      const summary = await calculateFeeSummary(studentData?.id, selectedAcademicYear);

      const termGroups = feeStructure?.reduce((acc, fee) => {
        if (!acc?.[fee?.term]) acc[fee.term] = [];
        acc?.[fee?.term]?.push(fee);
        return acc;
      }, {});

      const terms = Object.keys(termGroups)?.map((termKey, index) => {
        const termFees = termGroups?.[termKey];
        const termTotal = termFees?.reduce((sum, fee) => sum + parseFloat(fee?.amount), 0);
        return {
          id: index + 1,
          name: termKey?.replace('term', 'Term '),
          amount: termTotal,
          dueDate: termFees?.[0]?.dueDate || '',
          status: 'pending'
        };
      });

      setFeeData({
        terms,
        totalFees: summary?.totalFees,
        paidAmount: summary?.paidAmount,
        outstandingBalance: summary?.outstandingBalance
      });
    } catch (error) {
      console.error('Error loading fee data:', error);
    }
  };

  const selectedYearName = academicYears?.find(y => y?.id === selectedAcademicYear)?.yearName
    || academicYears?.find(y => y?.id === selectedAcademicYear)?.year_name
    || currentAcademicYear?.yearName || currentAcademicYear?.year_name || '';

  if (loading || yearLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <BrandHeader variant="parent" academicYear={selectedYearName} />
        <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </main>
        <ParentTabNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <BrandHeader variant="parent" academicYear={selectedYearName} />
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
        <div className="space-y-4 md:space-y-6 lg:space-y-8">
          <AcademicYearSelector
            selectedYear={selectedAcademicYear}
            onYearChange={setSelectedAcademicYear}
            availableYears={academicYears}
          />

          {studentData && <StudentProfileCard student={studentData} />}

          {parentData && <ParentDetailsCard parentDetails={parentData} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
            {feeData && (
              <FeeOverviewCard 
                feeData={feeData} 
                academicYear={selectedYearName}
              />
            )}
            <QuickActionsCard />
          </div>

          {feeData && (
            <PaymentDueDateCard feeData={feeData} />
          )}
        </div>
      </main>
      <ParentTabNavigation />
    </div>
  );
};

export default ParentDashboard;