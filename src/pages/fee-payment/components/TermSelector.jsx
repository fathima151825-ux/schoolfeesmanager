import React from 'react';
import Icon from '../../../components/AppIcon';

const TermSelector = ({ terms, selectedTerm, onTermChange, termStatus }) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Calendar" size={20} className="text-primary" />
        <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
          Select Term
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {terms?.map((term) => {
          const status = termStatus?.[term?.id];
          const isLocked = status?.locked;
          const isPaid = status?.paid;

          return (
            <button
              key={term?.id}
              onClick={() => !isLocked && onTermChange(term?.id)}
              disabled={isLocked}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-250 text-left
                ${selectedTerm === term?.id ? 'border-primary bg-primary/5' : 'border-border bg-background'}
                ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 cursor-pointer'}
                ${isPaid ? 'bg-success/5' : ''}
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
                    {term?.name}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground font-caption mt-1">
                    {term?.period}
                  </p>
                </div>
                {isPaid && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-success/10 text-success">
                    <Icon name="CheckCircle2" size={16} />
                  </div>
                )}
                {isLocked && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-muted-foreground">
                    <Icon name="Lock" size={16} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm font-caption">
                <Icon name="Calendar" size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">
                  Due: {new Date(term.dueDate)?.toLocaleDateString('en-IN', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
              {isLocked && (
                <p className="text-xs text-warning font-caption mt-2">
                  Complete {term?.id === 'term2' ? 'Term 1' : 'Term 2'} payment first
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TermSelector;