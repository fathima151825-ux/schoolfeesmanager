import React, { useState, useMemo, useEffect } from 'react';
import AdminSidebarNavigation from '../../components/ui/AdminSidebarNavigation';
import BrandHeader from '../../components/ui/BrandHeader';
import FilterToolbar from './components/FilterToolbar';
import StudentTableRow from './components/StudentTableRow';
import StudentMobileCard from './components/StudentMobileCard';
import BulkActionsBar from './components/BulkActionsBar';
import EmptyState from './components/EmptyState';
import { Checkbox } from '../../components/ui/Checkbox';
import Icon from '../../components/AppIcon';
import { getAllStudents, bulkImportStudents } from '../../services/studentService';
import { getClasses } from '../../services/feeService';
import ExcelUploadModal from './components/ExcelUploadModal';
import UploadResultModal from './components/UploadResultModal';
import BulkImageUploadModal from './components/BulkImageUploadModal';
import useRealtimeSubscription from '../../hooks/useRealtimeSubscription';
import { useAcademicYear } from '../../contexts/AcademicYearContext';

const StudentListManagement = () => {
  const { currentAcademicYear, loading: yearLoading } = useAcademicYear();
  const [filters, setFilters] = useState({
    search: '',
    class: 'all',
    section: 'all',
    academicYear: 'all',
    paymentStatus: 'all'
  });

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showBulkImageModal, setShowBulkImageModal] = useState(false);

  useEffect(() => {
    // Load classes master list on mount
    getClasses()?.then(list => setClasses(list || []))?.catch(() => {});
  }, []);

  useEffect(() => {
    if (!yearLoading && currentAcademicYear?.id) {
      loadStudents();
    }
  }, [currentAcademicYear?.id, yearLoading]);

  // Realtime: reload when students or payments change
  useRealtimeSubscription(
    [
      { table: 'students' },
      { table: 'payments' }
    ],
    () => {
      if (currentAcademicYear?.id) loadStudents();
    },
    [currentAcademicYear?.id]
  );

  const loadStudents = async () => {
    try {
      setLoading(true);
      if (currentAcademicYear?.id) {
        const studentsData = await getAllStudents(currentAcademicYear?.id);
        setStudents(studentsData);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students?.filter(student => {
      const matchesSearch = filters?.search === '' || 
        student?.name?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
        student?.admissionNumber?.toLowerCase()?.includes(filters?.search?.toLowerCase());
      
      // Use class_id for matching when available; fall back to text class name
      const matchesClass = filters?.class === 'all' ||
        (student?.classId ? student?.classId === filters?.class : student?.class === filters?.class);
      const matchesSection = filters?.section === 'all' || student?.section === filters?.section;
      const matchesStatus = filters?.paymentStatus === 'all' || student?.paymentStatus === filters?.paymentStatus;

      return matchesSearch && matchesClass && matchesSection && matchesStatus;
    });
  }, [filters, students]);

  const sortedStudents = useMemo(() => {
    const sorted = [...filteredStudents];
    sorted?.sort((a, b) => {
      let aValue = a?.[sortConfig?.key];
      let bValue = b?.[sortConfig?.key];

      if (sortConfig?.key === 'outstandingBalance') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (aValue < bValue) return sortConfig?.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig?.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredStudents, sortConfig]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      class: 'all',
      section: 'all',
      academicYear: 'all',
      paymentStatus: 'all'
    });
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectStudent = (studentId, isSelected) => {
    setSelectedStudents(prev => 
      isSelected 
        ? [...prev, studentId]
        : prev?.filter(id => id !== studentId)
    );
  };

  const handleSelectAll = (isSelected) => {
    setSelectedStudents(isSelected ? sortedStudents?.map(s => s?.id) : []);
  };

  const handleSendReminders = () => {
    alert(`Sending payment reminders to ${selectedStudents?.length} student(s)`);
  };

  const handleGenerateReport = () => {
    alert(`Generating report for ${selectedStudents?.length} student(s)`);
  };

  const handleExport = () => {
    alert('Exporting student list to Excel...');
  };

  const handleBulkUpload = async (studentsData) => {
    try {
      const results = await bulkImportStudents(studentsData, currentAcademicYear?.id);
      setUploadResults(results);
      setShowResultsModal(true);
      
      if (results?.success > 0) {
        await loadStudents();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResults({
        success: 0,
        failed: studentsData?.length || 0,
        errors: [{ row: 0, message: 'Failed to process upload. Please try again.' }]
      });
      setShowResultsModal(true);
    }
  };

  const handleCloseResultsModal = () => {
    setShowResultsModal(false);
    setUploadResults(null);
  };

  const allSelected = sortedStudents?.length > 0 && selectedStudents?.length === sortedStudents?.length;
  const someSelected = selectedStudents?.length > 0 && selectedStudents?.length < sortedStudents?.length;

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarNavigation />
      <div className="lg:ml-64">
        <BrandHeader variant="admin" />
        
        <main className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
              Student List Management
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Comprehensive student directory with advanced filtering and payment tracking
            </p>
          </div>

          <FilterToolbar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            resultCount={sortedStudents?.length}
            onExport={handleExport}
            onBulkUpload={() => setShowUploadModal(true)}
            onBulkImageUpload={() => setShowBulkImageModal(true)}
            classes={classes}
          />

          {selectedStudents?.length > 0 && (
            <BulkActionsBar
              selectedCount={selectedStudents?.length}
              onSendReminders={handleSendReminders}
              onGenerateReport={handleGenerateReport}
              onClearSelection={() => setSelectedStudents([])}
            />
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Icon name="Loader2" size={32} className="animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading students...</p>
              </div>
            </div>
          ) : sortedStudents?.length === 0 ? (
            <EmptyState
              hasFilters={Object.values(filters)?.some(v => v !== 'all' && v !== '')}
              onClearFilters={handleClearFilters}
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="p-3 text-left">
                        <Checkbox
                          checked={allSelected}
                          indeterminate={someSelected}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      {[
                        { key: 'admissionNumber', label: 'Adm. No.' },
                        { key: 'name', label: 'Student Name' },
                        { key: 'class', label: 'Class' },
                        { key: 'section', label: 'Section' },
                        { key: 'paymentStatus', label: 'Status' },
                        { key: 'outstandingBalance', label: 'Balance' }
                      ]?.map(col => (
                        <th
                          key={col?.key}
                          className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground"
                          onClick={() => handleSort(col?.key)}
                        >
                          <div className="flex items-center gap-1">
                            {col?.label}
                            {sortConfig?.key === col?.key && (
                              <Icon
                                name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                                size={14}
                              />
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedStudents?.map(student => (
                      <StudentTableRow
                        key={student?.id}
                        student={student}
                        isSelected={selectedStudents?.includes(student?.id)}
                        onSelect={handleSelectStudent}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {sortedStudents?.map(student => (
                  <StudentMobileCard
                    key={student?.id}
                    student={student}
                    isSelected={selectedStudents?.includes(student?.id)}
                    onSelect={handleSelectStudent}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {showUploadModal && (
        <ExcelUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleBulkUpload}
          onUploadSuccess={handleBulkUpload}
        />
      )}

      {showResultsModal && uploadResults && (
        <UploadResultModal
          isOpen={showResultsModal}
          results={uploadResults}
          onClose={handleCloseResultsModal}
        />
      )}

      {showBulkImageModal && (
        <BulkImageUploadModal
          isOpen={showBulkImageModal}
          students={students}
          onClose={() => setShowBulkImageModal(false)}
          onUploadComplete={() => setShowBulkImageModal(false)}
        />
      )}
    </div>
  );
};

export default StudentListManagement;