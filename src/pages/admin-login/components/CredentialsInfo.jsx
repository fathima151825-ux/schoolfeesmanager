import React from 'react';
import Icon from '../../../components/AppIcon';

const CredentialsInfo = () => {
  return (
    <div className="mt-6 md:mt-8 lg:mt-10 p-4 md:p-5 bg-muted/50 border border-border rounded-lg">
      <div className="flex items-center gap-2">
        <Icon name="Info" size={18} className="text-primary" />
        <p className="text-sm text-muted-foreground">
          Use your assigned username and password to sign in. Contact the superadmin if you need access.
        </p>
      </div>
    </div>
  );
};

export default CredentialsInfo;