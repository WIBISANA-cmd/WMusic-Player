'use client';

import { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';
import Link from 'next/link';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const onOnline = () => {
      setIsOffline(false);
      setDismissed(false);
    };
    const onOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-3 right-3 md:left-auto md:right-8 z-50 flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl glass-card bg-amber-50/95 border border-amber-300 text-amber-900 shadow-glass text-xs font-semibold select-none animate-fadeIn"
    >
      <div className="flex items-center gap-2">
        <WifiOff size={16} className="text-amber-700" />
        <span>Offline Mode.</span>
        <Link href="/offline" className="underline font-bold hover:text-amber-950">
          View downloads
        </Link>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss offline banner"
        className="w-7 h-7 rounded-full flex items-center justify-center text-amber-700 hover:text-amber-950 hover:bg-amber-100 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
