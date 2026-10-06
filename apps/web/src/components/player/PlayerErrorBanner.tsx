'use client';

import { usePlayerStore } from '@/stores/player-store';
import { AlertCircle, RefreshCw, SkipForward, X } from 'lucide-react';

export function PlayerErrorBanner() {
  const { error, clearError, retry, skip } = usePlayerStore();

  if (!error) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,12px))] left-3 right-3 md:bottom-28 md:right-8 md:left-auto md:w-96 z-50 p-3.5 rounded-2xl glass-card bg-rose-50/95 border border-rose-300 text-rose-950 shadow-glass-lg flex flex-col gap-2.5 animate-fadeIn select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-rose-800">
          <AlertCircle size={18} className="shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider">Playback Notice</span>
        </div>
        <button
          onClick={clearError}
          aria-label="Dismiss error notification"
          className="text-rose-600 hover:text-rose-950 p-1 rounded-full hover:bg-rose-100 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      <p className="text-xs text-rose-900 leading-relaxed font-medium">
        {error.message}
      </p>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={skip}
          aria-label="Skip to next track"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-800 hover:bg-rose-100 transition-colors focus-visible:ring-2 focus-visible:ring-accent"
        >
          <SkipForward size={14} />
          <span>Skip</span>
        </button>

        <button
          onClick={retry}
          aria-label="Retry playback"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-sm transition-colors active:scale-95 focus-visible:ring-2 focus-visible:ring-accent"
        >
          <RefreshCw size={13} />
          <span>Retry</span>
        </button>
      </div>
    </div>
  );
}
