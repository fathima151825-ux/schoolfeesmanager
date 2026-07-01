import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const UploadResultModal = ({ isOpen, results, onClose }) => {
  if (!isOpen) return null;

  const { success = 0, failed = 0, errors = [] } = results || {};
  const isSuccess = failed === 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg border border-border shadow-warm-xl max-w-2xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-4 ${
              isSuccess ? 'bg-success/10' : 'bg-warning/10'
            }`}
          >
            <Icon
              name={isSuccess ? 'CheckCircle2' : 'AlertCircle'}
              size={40}
              className={isSuccess ? 'text-success' : 'text-warning'}
            />
          </div>
          <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-2">
            {isSuccess ? 'Upload Successful!' : 'Upload Completed with Errors'}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground font-caption">
            {isSuccess
              ? 'All student records have been imported successfully' :'Some records could not be imported'}
          </p>
        </div>

        <div className="space-y-3 mb-6 p-4 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-caption">
              Successfully Imported
            </span>
            <span className="text-lg font-bold text-success data-text">
              {success} students
            </span>
          </div>
          {failed > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-caption">
                Failed to Import
              </span>
              <span className="text-lg font-bold text-error data-text">
                {failed} records
              </span>
            </div>
          )}
        </div>

        {errors?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Icon name="AlertTriangle" size={16} className="text-warning" />
              Error Details
            </h3>
            <div className="border border-border rounded-lg max-h-60 overflow-y-auto">
              <div className="divide-y divide-border">
                {errors?.map((error, index) => (
                  <div key={index} className="p-3 text-sm">
                    <p className="font-medium text-foreground mb-1">
                      Row {error?.row}: {error?.admissionNumber || 'Unknown'}
                    </p>
                    <p className="text-xs text-error">{error?.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button variant="default" size="lg" fullWidth onClick={onClose}>
            Close
          </Button>
        </div>

        {!isSuccess && (
          <div className="flex items-start gap-2 mt-4 p-3 rounded-md bg-primary/5">
            <Icon name="Info" size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground font-caption">
              Please fix the errors in your Excel file and re-upload the failed records.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadResultModal;