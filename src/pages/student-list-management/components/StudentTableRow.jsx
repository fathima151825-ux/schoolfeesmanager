import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import PaymentStatusBadge from './PaymentStatusBadge';

const StudentTableRow = ({ student, isSelected, onSelect }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate('/student-detail-management', { state: { studentId: student?.id } });
  };

  const handlePaymentManagement = () => {
    navigate('/payment-management', { state: { studentId: student?.id } });
  };

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="px-4 py-3">
        <Checkbox
          checked={isSelected}
          onChange={(e) => onSelect(student?.id, e?.target?.checked)}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{student?.name}</span>
          <span className="text-xs text-muted-foreground">{student?.admissionNumber}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-foreground">
        {student?.class} - {student?.section}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {student?.academicYear}
      </td>
      <td className="px-4 py-3">
        <PaymentStatusBadge 
          status={student?.paymentStatus} 
          amount={student?.outstandingBalance}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewDetails}
            iconName="Eye"
            iconPosition="left"
          >
            View
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handlePaymentManagement}
            iconName="CreditCard"
            iconPosition="left"
          >
            Payment
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default StudentTableRow;