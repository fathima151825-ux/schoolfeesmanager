import React from 'react';
import { useOnlineStatus } from '../contexts/OnlineStatusContext';
import { Wifi, WifiOff } from 'lucide-react';

const NetworkStatusIndicator = () => {
  const { isOnline, showNotification } = useOnlineStatus();

  if (!showNotification) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          isOnline
            ? 'bg-green-500 text-white' :'bg-red-500 text-white'
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="w-5 h-5" />
            <span className="font-medium">Back Online - Syncing data...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5" />
            <span className="font-medium">You are offline - Changes will sync when online</span>
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkStatusIndicator;