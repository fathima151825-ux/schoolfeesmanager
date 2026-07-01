import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BackupManagement = ({ backups, onDownload, onTriggerBackup, lastBackupDate }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024)?.toFixed(2) + ' KB';
    return (bytes / (1024 * 1024))?.toFixed(2) + ' MB';
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Icon name="Database" size={20} className="text-accent" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
              Data Backup Management
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground font-caption">
              Last backup: {formatDate(lastBackupDate)}
            </p>
          </div>
        </div>
        <Button
          variant="default"
          size="sm"
          iconName="Download"
          iconPosition="left"
          onClick={onTriggerBackup}
        >
          Backup Now
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Calendar" size={16} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-caption">
              Backup Schedule
            </p>
          </div>
          <p className="text-sm md:text-base font-semibold text-foreground">
            Monthly (1st of every month)
          </p>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="HardDrive" size={16} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-caption">
              Total Backups
            </p>
          </div>
          <p className="text-sm md:text-base font-semibold text-foreground data-text">
            {backups?.length} files
          </p>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Clock" size={16} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-caption">
              Retention Period
            </p>
          </div>
          <p className="text-sm md:text-base font-semibold text-foreground">
            3 Years
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <p className="text-sm font-medium text-foreground font-caption">
            Available Backups
          </p>
          <p className="text-xs text-muted-foreground font-caption">
            {backups?.length} files
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {backups?.map((backup) => (
            <div
              key={backup?.id}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors duration-250"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="FileArchive" size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {backup?.fileName}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-muted-foreground font-caption">
                      {formatDate(backup?.date)}
                    </p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-xs text-muted-foreground font-caption data-text">
                      {formatFileSize(backup?.size)}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                iconName="Download"
                onClick={() => onDownload(backup?.id)}
              >
                Download
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BackupManagement;