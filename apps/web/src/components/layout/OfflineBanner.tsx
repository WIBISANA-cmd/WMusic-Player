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
    <div className="fixed top-2 left-4 right-4 md:left-auto md:right-8 z-50 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-500/90 text-black backdrop-blur-md shadow-lg shadow-amber-500/20 text-xs font-semibold">
      <div className="flex items-center gap-2">
        <WifiOff size={16} />
        <span>You are currently offline.</span>
        <Link href="/offline" className="underline font-bold hover:opacity-80">
          View downloaded tracks
        </Link>
      </div>
      <button onClick={() => setDismissed(true)} className="p-1 hover:opacity-75">
        <X size={14} />
      </button>
    </div>
  );
}
