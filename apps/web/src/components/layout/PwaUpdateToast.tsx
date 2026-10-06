'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';

export function PwaUpdateToast() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let refreshing = false;

    // Listen for controlling service worker change after skipWaiting
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.ready.then((reg) => {
      // If a waiting worker already exists
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setShowToast(true);
      }

      // Detect newly installed worker
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available! Prompt user gracefully
            setWaitingWorker(newWorker);
            setShowToast(true);
          }
        });
      });
    });
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  if (!showToast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-14 left-3 right-3 md:top-auto md:bottom-28 md:left-8 md:right-auto md:w-84 z-50 p-3 rounded-2xl glass-card bg-white/95 border border-slate-300 shadow-glass-lg flex items-center justify-between gap-3 animate-fadeIn text-text-primary select-none"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles size={15} />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-text-primary truncate">New version available</div>
          <div className="text-[11px] text-text-secondary truncate">Tap reload to update</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleUpdate}
          aria-label="Reload and apply new version"
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-sm transition-colors active:scale-95 focus-visible:ring-2 focus-visible:ring-accent"
        >
          <RefreshCw size={12} />
          <span>Reload</span>
        </button>

        <button
          onClick={() => setShowToast(false)}
          aria-label="Dismiss update notification"
          className="w-7 h-7 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-slate-200/60 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
