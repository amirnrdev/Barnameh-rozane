import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [shouldRender, setShouldRender] = useState(!isOnline);

  useEffect(() => {
    if (!isOnline) {
      setShouldRender(true);
    } else {
      // Keep showing "Online" status briefly before hiding
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-lg transition-all duration-300 transform translate-y-0 ${
        isOnline
          ? 'bg-emerald-600 border border-emerald-500 animate-out fade-out'
          : 'bg-amber-600 border border-amber-500 animate-in fade-in slide-in-from-bottom-4'
      }`}
    >
      {isOnline ? (
        <>
          <span className="h-2 w-2 rounded-full bg-white animate-ping" />
          <span>اتصال برقرار شد — آنلاین هستید</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 animate-bounce" />
          <span>حالت آفلاین — از نسخه ذخیره‌شده محلی استفاده می‌کنید</span>
        </>
      )}
    </div>
  );
};
