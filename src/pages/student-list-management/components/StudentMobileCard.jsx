import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';
import PaymentStatusBadge from './PaymentStatusBadge';

const StudentMobileCard = ({ student, isSelected, onSelect }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleViewDetails = () => {
    navigate('/student-detail-management', { state: { studentId: student?.id } });
  };

  const handlePaymentManagement = () => {
    navigate('/payment-management', { state: { studentId: student?.id } });
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-3">
      <div className="flex items-start gap-3 mb-3">
        <Checkbox
          checked={isSelected}
          onChange={(e) => onSelect(student?.id, e?.target?.checked)}
        />
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-medium text-foreground text-base">{student?.name}</h3>
              <p className="text-xs text-muted-foreground">{student?.admissionNumber}</p>
            </div>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={20} />
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm mb-2">
            <span className="text-foreground font-medium">
              {student?.class} - {student?.section}
            </span>
            <span className="text-muted-foreground">
              {student?.academicYear}
            </span>
          </div>

          <PaymentStatusBadge 
            status={student?.paymentStatus} 
            amount={student?.outstandingBalance}
          />
        </div>
      </div>
      {isExpanded && (
        <div className="pt-3 border-t border-border space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div>
              <span className="text-muted-foreground">Parent:</span>
              <p className="text-foreground font-medium">{student?.parentName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Mobile:</span>
              <p className="text-foreground font-medium">{student?.mobile}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDetails}
              iconName="Eye"
              iconPosition="left"
              fullWidth
            >
              View Details
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={handlePaymentManagement}
              iconName="CreditCard"
              iconPosition="left"
              fullWidth
            >
              Payment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMobileCard;