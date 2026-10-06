'use client';

import { usePlayerStore } from '@/stores/player-store';
import { Moon, Clock, X, Check } from 'lucide-react';

export function SleepTimerModal() {
  const { sleepTimer, setSleepTimer, cancelSleepTimer, isSleepTimerModalOpen, setSleepTimerModalOpen } =
    usePlayerStore();

  if (!isSleepTimerModalOpen) return null;

  const presets = [
    { label: '15 Minutes', minutes: 15, mode: 'duration' as const },
    { label: '30 Minutes', minutes: 30, mode: 'duration' as const },
    { label: '45 Minutes', minutes: 45, mode: 'duration' as const },
    { label: '60 Minutes', minutes: 60, mode: 'duration' as const },
    { label: 'End of Current Track', minutes: 0, mode: 'end_of_track' as const },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-fadeIn select-none"
      onClick={() => setSleepTimerModalOpen(false)}
    >
      <div
        className="w-full max-w-sm rounded-3xl glass-card bg-white/92 border border-white/80 p-6 shadow-glass-lg space-y-5 text-text-primary"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Sleep timer settings"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl liquid-button flex items-center justify-center text-slate-800 shadow-sm">
              <Moon size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Sleep Timer</h3>
              <p className="text-xs text-text-secondary">Audio will smoothly fade out</p>
            </div>
          </div>
          <button
            onClick={() => setSleepTimerModalOpen(false)}
            aria-label="Close sleep timer dialog"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-slate-200/50 transition-colors focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={18} />
          </button>
        </div>

        {/* Active Timer Status */}
        {sleepTimer.isActive && (
          <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs text-text-primary">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-slate-600" />
              <span>
                {sleepTimer.mode === 'end_of_track'
                  ? 'Stopping after current track'
                  : `${Math.floor(sleepTimer.remainingSeconds / 60)}m ${sleepTimer.remainingSeconds % 60}s remaining`}
              </span>
            </div>
            <button
              onClick={cancelSleepTimer}
              className="text-rose-600 font-semibold hover:underline px-2 py-1"
            >
              Turn Off
            </button>
          </div>
        )}

        {/* Presets */}
        <div className="space-y-2">
          {presets.map((preset) => {
            const isSelected =
              sleepTimer.isActive &&
              ((preset.mode === 'end_of_track' && sleepTimer.mode === 'end_of_track') ||
                (preset.mode === 'duration' &&
                  sleepTimer.mode === 'duration' &&
                  Math.abs(Math.round(sleepTimer.remainingSeconds / 60) - preset.minutes) <= 1));

            return (
              <button
                key={preset.label}
                onClick={() => setSleepTimer(preset.minutes, preset.mode)}
                className={`w-full flex items-center justify-between px-4 py-3 min-h-[48px] rounded-2xl text-sm font-semibold transition-all select-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isSelected
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'glass-pill hover:bg-white text-text-primary'
                }`}
              >
                <span>{preset.label}</span>
                {isSelected && <Check size={16} />}
              </button>
            );
          })}
        </div>

        {/* Cancel Button */}
        {sleepTimer.isActive && (
          <button
            onClick={cancelSleepTimer}
            className="w-full py-2.5 min-h-[44px] rounded-2xl glass-pill hover:bg-white text-text-secondary hover:text-text-primary text-xs font-semibold transition-all"
          >
            Cancel Sleep Timer
          </button>
        )}
      </div>
    </div>
  );
}
