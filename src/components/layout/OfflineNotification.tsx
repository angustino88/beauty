import { useEffect, useRef, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { SystemBanner, notify } from '@/shared/notifications';

export function OfflineNotification() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const wasOfflineRef = useRef(!navigator.onLine);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      if (wasOfflineRef.current) {
        wasOfflineRef.current = false;
        notify.success('Connection restored', {
          key: 'network-status',
          description: 'You are back online.',
        });
      }
    };
    const goOffline = () => {
      wasOfflineRef.current = true;
      setIsOnline(false);
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2200,
      }}
    >
      <SystemBanner
        variant="error"
        fullBleed
        icon={<WifiOff style={{ width: 16, height: 16 }} />}
        title="You are offline"
        description="Check your network connection. Changes cannot be saved until connectivity is restored."
      />
    </div>
  );
}
