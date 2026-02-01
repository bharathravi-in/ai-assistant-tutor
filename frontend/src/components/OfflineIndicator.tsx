import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, Clock } from 'lucide-react';
import offlineQueueService from '../services/offlineQueueService';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update queue count periodically
    const updateQueueCount = async () => {
      const status = await offlineQueueService.getQueueStatus();
      setQueueCount(status.count);
    };

    updateQueueCount();
    const interval = setInterval(updateQueueCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && queueCount === 0) {
    return null; // Don't show anything when online with no queue
  }

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
        isOnline
          ? 'bg-blue-500 text-white'
          : 'bg-orange-500 text-white'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-5 w-5" />
          <div>
            <p className="font-semibold">Back online!</p>
            {queueCount > 0 && (
              <p className="text-sm opacity-90">
                Syncing {queueCount} pending {queueCount === 1 ? 'item' : 'items'}...
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <WifiOff className="h-5 w-5 animate-pulse" />
          <div>
            <p className="font-semibold">You're offline</p>
            <p className="text-sm opacity-90">
              Changes will sync when you reconnect
            </p>
          </div>
          {queueCount > 0 && (
            <div className="ml-2 flex items-center gap-1 px-2 py-1 bg-white/20 rounded">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">{queueCount}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
