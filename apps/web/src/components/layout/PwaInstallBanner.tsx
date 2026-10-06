'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-24 left-3 right-3 md:bottom-28 md:right-8 md:left-auto md:w-80 z-40 p-3.5 rounded-2xl glass-card bg-white/95 border border-white/80 shadow-glass-lg flex items-center justify-between gap-3 animate-fadeIn text-text-primary">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl liquid-button flex items-center justify-center text-slate-800 shrink-0 shadow-sm">
          <Download size={18} />
        </div>
        <div>
          <div className="text-xs font-bold text-text-primary">Install Pulse Music</div>
          <div className="text-[10px] text-text-secondary">Add to home screen for offline audio</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold shrink-0 transition-colors shadow-sm"
        >
          Install
        </button>
        <button
          onClick={() => setShowBanner(false)}
          aria-label="Dismiss install banner"
          className="text-text-secondary hover:text-text-primary p-1"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
