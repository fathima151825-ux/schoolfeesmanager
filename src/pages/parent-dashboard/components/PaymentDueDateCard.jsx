import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d?.getTime()) ? null : d;
};

const getTermStatus = (dueDateStr) => {
  const dueDate = parseDate(dueDateStr);
  if (!dueDate) return { status: 'unknown', daysLeft: null };
  const now = new Date();
  const today = new Date(now?.getFullYear(), now?.getMonth(), now?.getDate());
  const due = new Date(dueDate?.getFullYear(), dueDate?.getMonth(), dueDate?.getDate());
  const diffMs = due - today;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { status: 'overdue', daysLeft };
  if (daysLeft === 0) return { status: 'due_today', daysLeft: 0 };
  if (daysLeft <= 7) return { status: 'due_soon', daysLeft };
  return { status: 'upcoming', daysLeft };
};

const formatDueDate = (dateStr) => {
  const d = parseDate(dateStr);
  if (!d) return 'Not set';
  return d?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const CountdownDisplay = ({ daysLeft, status }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (status !== 'due_today') return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  if (status === 'overdue') {
    return (
      <div className="flex items-center gap-1.5 text-error">
        <Icon name="AlertTriangle" size={14} />
        <span className="text-xs font-semibold">
          {Math.abs(daysLeft)} day{Math.abs(daysLeft) !== 1 ? 's' : ''} overdue
        </span>
      </div>
    );
  }

  if (status === 'due_today') {
    return (
      <div className="flex items-center gap-1.5 text-warning">
        <Icon name="Clock" size={14} className="animate-pulse" />
        <span className="text-xs font-semibold">Due Today!</span>
      </div>
    );
  }

  if (status === 'due_soon') {
    return (
      <div className="flex items-center gap-1.5 text-warning">
        <Icon name="Timer" size={14} />
        <span className="text-xs font-semibold">
          {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
        </span>
      </div>
    );
  }

  if (status === 'upcoming') {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon name="Calendar" size={14} />
        <span className="text-xs font-caption">
          {daysLeft} days away
        </span>
      </div>
    );
  }

  return null;
};

const StatusBadge = ({ status }) => {
  const config = {
    overdue: { label: 'Overdue', className: 'bg-error/10 text-error border border-error/20' },
    due_today: { label: 'Due Today', className: 'bg-warning/10 text-warning border border-warning/20' },
    due_soon: { label: 'Due Soon', className: 'bg-warning/10 text-warning border border-warning/20' },
    upcoming: { label: 'Upcoming', className: 'bg-primary/10 text-primary border border-primary/20' },
    paid: { label: 'Paid', className: 'bg-success/10 text-success border border-success/20' },
    unknown: { label: 'No Date', className: 'bg-muted text-muted-foreground' },
  };
  const c = config?.[status] || config?.unknown;
  return (
    <span className={`text-xs font-caption px-2 py-0.5 rounded-full ${c?.className}`}>
      {c?.label}
    </span>
  );
};

const PaymentDueDateCard = ({ feeData }) => {
  const terms = feeData?.terms || [];

  // Find the next upcoming or overdue term (not paid)
  const unpaidTerms = terms?.filter(t => t?.status !== 'paid' && t?.dueDate);
  const nextDueTerm = unpaidTerms?.reduce((closest, term) => {
    const { daysLeft } = getTermStatus(term?.dueDate);
    if (daysLeft === null) return closest;
    if (!closest) return term;
    const { daysLeft: closestDays } = getTermStatus(closest?.dueDate);
    // Prefer overdue (negative) first, then soonest upcoming
    if (closestDays < 0 && daysLeft >= 0) return closest;
    if (daysLeft < 0 && closestDays >= 0) return term;
    return Math.abs(daysLeft) < Math.abs(closestDays) ? term : closest;
  }, null);

  const overdueCount = unpaidTerms?.filter(t => getTermStatus(t?.dueDate)?.status === 'overdue')?.length;

  return (
    <div className="bg-card rounded-xl shadow-warm-md p-4 md:p-6 border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="CalendarClock" size={20} className="text-primary" />
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
            Payment Due Dates
          </h3>
        </div>
        {overdueCount > 0 && (
          <div className="flex items-center gap-1.5 bg-error/10 text-error px-3 py-1 rounded-full border border-error/20">
            <Icon name="AlertCircle" size={14} />
            <span className="text-xs font-semibold">{overdueCount} Overdue</span>
          </div>
        )}
      </div>

      {/* Next Due Countdown Banner */}
      {nextDueTerm && (() => {
        const { status, daysLeft } = getTermStatus(nextDueTerm?.dueDate);
        const isOverdue = status === 'overdue';
        const isDueToday = status === 'due_today';
        const isDueSoon = status === 'due_soon';
        const bannerClass = isOverdue
          ? 'bg-error/5 border-error/20'
          : isDueToday || isDueSoon
          ? 'bg-warning/5 border-warning/20' :'bg-primary/5 border-primary/20';

        return (
          <div className={`rounded-lg border p-3 md:p-4 mb-4 ${bannerClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-caption mb-0.5">
                  {isOverdue ? 'Most Urgent Payment' : 'Next Payment Due'}
                </p>
                <p className="text-sm md:text-base font-semibold text-foreground">
                  {nextDueTerm?.name}
                </p>
                <p className="text-xs text-muted-foreground font-caption mt-0.5">
                  {formatDueDate(nextDueTerm?.dueDate)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg md:text-2xl font-bold text-foreground data-text">
                  ₹{nextDueTerm?.amount?.toLocaleString('en-IN')}
                </p>
                <CountdownDisplay daysLeft={daysLeft} status={status} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* All Terms List */}
      {terms?.length > 0 ? (
        <div className="space-y-2 mb-4">
          {terms?.map((term) => {
            const { status: termStatus, daysLeft } = getTermStatus(term?.dueDate);
            const effectiveStatus = term?.status === 'paid' ? 'paid' : termStatus;
            const isOverdue = effectiveStatus === 'overdue';
            const rowClass = isOverdue
              ? 'bg-error/5 border border-error/10'
              : effectiveStatus === 'due_today'|| effectiveStatus === 'due_soon' ?'bg-warning/5 border border-warning/10' :'bg-muted/40 border border-transparent';

            return (
              <div
                key={term?.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${rowClass}`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isOverdue && (
                    <Icon name="AlertTriangle" size={16} className="text-error flex-shrink-0" />
                  )}
                  {effectiveStatus === 'paid' && (
                    <Icon name="CheckCircle2" size={16} className="text-success flex-shrink-0" />
                  )}
                  {(effectiveStatus === 'due_today' || effectiveStatus === 'due_soon') && (
                    <Icon name="Clock" size={16} className="text-warning flex-shrink-0" />
                  )}
                  {effectiveStatus === 'upcoming' && (
                    <Icon name="Calendar" size={16} className="text-primary flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{term?.name}</p>
                    <p className="text-xs text-muted-foreground font-caption">
                      {term?.dueDate ? formatDueDate(term?.dueDate) : 'No due date set'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-3">
                  <p className="text-sm font-semibold text-foreground data-text whitespace-nowrap">
                    ₹{term?.amount?.toLocaleString('en-IN')}
                  </p>
                  <StatusBadge status={effectiveStatus} />
                  {effectiveStatus !== 'paid' && term?.dueDate && (
                    <CountdownDisplay daysLeft={daysLeft} status={effectiveStatus} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Icon name="CalendarX" size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm font-caption">No fee schedule available</p>
        </div>
      )}

      {/* Pay Now CTA if overdue or due soon */}
      {(overdueCount > 0 || (nextDueTerm && getTermStatus(nextDueTerm?.dueDate)?.daysLeft <= 7)) && (
        <Link
          to="/fee-payment"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Icon name="CreditCard" size={16} />
          Pay Now
        </Link>
      )}
    </div>
  );
};

export default PaymentDueDateCard;
