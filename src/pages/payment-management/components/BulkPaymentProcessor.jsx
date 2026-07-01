import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import { getAllStudents } from '../../../services/studentService';
import { getCurrentAcademicYear } from '../../../services/feeService';

const BulkPaymentProcessor = ({ onBulkPaymentSuccess }) => {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const year = await getCurrentAcademicYear();
      if (!year?.id) {
        setError('No active academic year found');
        setStudents([]);
        return;
      }

      const allStudents = await getAllStudents(year?.id);
      
      // Filter students with outstanding balance > 0
      const studentsWithBalance = allStudents?.filter(s => s?.outstandingBalance > 0) || [];
      
      setStudents(studentsWithBalance);
    } catch (err) {
      console.error('Error loading students:', err);
      setError('Failed to load students');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => {
      if (prev?.includes(studentId)) {
        return prev?.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedStudents?.length === students?.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students?.map(s => s?.id));
    }
  };

  const handleBulkProcess = () => {
    if (selectedStudents?.length === 0) {
      alert('Please select at least one student');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const processedPayments = selectedStudents?.map(studentId => {
        const student = students?.find(s => s?.id === studentId);
        return {
          studentId: student?.id,
          studentName: student?.name,
          admissionNumber: student?.admissionNumber,
          amount: student?.outstandingBalance,
          receiptNumber: `RCP${Date.now()}${studentId}`
        };
      });

      setIsProcessing(false);
      onBulkPaymentSuccess(processedPayments);
      setSelectedStudents([]);
      loadStudents(); // Reload to refresh balances
    }, 2000);
  };

  const totalAmount = selectedStudents?.reduce((sum, studentId) => {
    const student = students?.find(s => s?.id === studentId);
    return sum + (student?.outstandingBalance || 0);
  }, 0);

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <Icon name="Users" size={20} className="text-primary" />
          <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
            Bulk Payment Processing
          </h2>
        </div>
        {!isLoading && students?.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            iconName={selectedStudents?.length === students?.length ? 'CheckSquare' : 'Square'}
            iconPosition="left"
            onClick={handleSelectAll}
          >
            {selectedStudents?.length === students?.length ? 'Deselect All' : 'Select All'}
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <Icon name="Loader2" size={32} className="mx-auto mb-2 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading students with outstanding fees...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="text-center py-8">
          <Icon name="AlertCircle" size={48} className="mx-auto mb-2 text-error opacity-50" />
          <p className="text-sm text-error font-medium mb-1">{error}</p>
          <Button variant="outline" size="sm" onClick={loadStudents} className="mt-4">
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && students?.length === 0 && (
        <div className="text-center py-8">
          <Icon name="CheckCircle" size={48} className="mx-auto mb-2 text-success opacity-50" />
          <p className="text-sm text-muted-foreground font-medium mb-1">No outstanding fees</p>
          <p className="text-xs text-muted-foreground">All students have cleared their fees</p>
        </div>
      )}

      {!isLoading && !error && students?.length > 0 && (
        <>
          <div className="space-y-2 mb-4 md:mb-6 max-h-64 md:max-h-80 overflow-y-auto">
            {students?.map((student) => (
              <div
                key={student?.id}
                className={`p-3 md:p-4 rounded-lg border transition-all duration-250 ${
                  selectedStudents?.includes(student?.id)
                    ? 'bg-primary/5 border-primary' :'bg-muted border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedStudents?.includes(student?.id)}
                    onChange={() => handleStudentToggle(student?.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-base font-medium text-foreground truncate">
                          {student?.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="data-text">{student?.admissionNumber}</span>
                          <span>•</span>
                          <span>Class {student?.class}-{student?.section}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className="text-sm md:text-base font-semibold text-error data-text">
                          ₹{student?.outstandingBalance?.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {selectedStudents?.length > 0 && (
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Selected Students
                </span>
                <span className="text-sm font-medium text-foreground">
                  {selectedStudents?.length} of {students?.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-base font-medium text-foreground">
                  Total Amount
                </span>
                <span className="text-xl md:text-2xl font-bold text-primary data-text">
                  ₹{totalAmount?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
          <Button
            variant="default"
            iconName="Check"
            iconPosition="left"
            onClick={handleBulkProcess}
            loading={isProcessing}
            disabled={selectedStudents?.length === 0}
            fullWidth
          >
            Process {selectedStudents?.length} Payment{selectedStudents?.length !== 1 ? 's' : ''}
          </Button>
        </>
      )}
    </div>
  );
};

export default BulkPaymentProcessor;