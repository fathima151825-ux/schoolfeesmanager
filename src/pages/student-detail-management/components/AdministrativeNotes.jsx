import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AdministrativeNotes = ({ notes, onAddNote }) => {
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (newNote?.trim()) {
      onAddNote(newNote);
      setNewNote('');
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
          Administrative Notes
        </h3>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            iconName="Plus"
            iconPosition="left"
            onClick={() => setIsAdding(true)}
          >
            Add Note
          </Button>
        )}
      </div>
      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-6 bg-muted/30 rounded-lg p-4 border border-border">
          <textarea
            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-3"
            rows="4"
            placeholder="Enter administrative note..."
            value={newNote}
            onChange={(e) => setNewNote(e?.target?.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              variant="default"
              size="sm"
              iconName="Save"
              iconPosition="left"
            >
              Save Note
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewNote('');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
      <div className="space-y-4">
        {notes?.map((note) => (
          <div key={note?.id} className="bg-muted/30 rounded-lg p-4 md:p-6 border border-border">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name="User" size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <p className="text-sm md:text-base font-medium text-foreground">
                    {note?.addedBy}
                  </p>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground font-caption">
                    <Icon name="Calendar" size={14} />
                    <span>{note?.date}</span>
                    <Icon name="Clock" size={14} />
                    <span>{note?.time}</span>
                  </div>
                </div>
                <p className="text-sm md:text-base text-foreground leading-relaxed">
                  {note?.content}
                </p>
              </div>
            </div>
            {note?.isImportant && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <Icon name="AlertCircle" size={16} className="text-warning" />
                <span className="text-xs md:text-sm text-warning font-caption font-medium">
                  Important Note
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      {notes?.length === 0 && !isAdding && (
        <div className="text-center py-12">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Icon name="FileText" size={32} className="text-muted-foreground" />
          </div>
          <p className="text-base md:text-lg text-muted-foreground font-caption mb-4">
            No administrative notes yet
          </p>
          <Button
            variant="outline"
            iconName="Plus"
            iconPosition="left"
            onClick={() => setIsAdding(true)}
          >
            Add First Note
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdministrativeNotes;