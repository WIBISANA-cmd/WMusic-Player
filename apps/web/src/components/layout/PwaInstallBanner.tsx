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
    <div className="fixed bottom-20 left-4 right-4 md:bottom-28 md:right-8 md:left-auto md:w-80 z-40 p-3.5 rounded-2xl glass-panel bg-[#151d30]/95 border border-primary-500/30 shadow-2xl flex items-center justify-between gap-3 animate-bounce">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-primary-500 flex items-center justify-center text-white shrink-0">
          <Download size={18} />
        </div>
        <div>
          <div className="text-xs font-bold text-white">Install Pulse Music</div>
          <div className="text-[10px] text-slate-400">Add to home screen for full offline app experience</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shrink-0 transition-colors"
        >
          Install
        </button>
        <button onClick={() => setShowBanner(false)} className="text-slate-400 hover:text-white p-1">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
