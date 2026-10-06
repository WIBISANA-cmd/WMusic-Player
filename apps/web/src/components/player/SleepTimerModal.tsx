'use client';

import { usePlayerStore } from '@/store/usePlayerStore';
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
    { label: 'End of Track', minutes: 0, mode: 'end_of_track' as const },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm rounded-3xl bg-[#111726] border border-white/10 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center">
              <Moon size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sleep Timer</h3>
              <p className="text-xs text-slate-400">Audio will automatically fade out</p>
            </div>
          </div>
          <button
            onClick={() => setSleepTimerModalOpen(false)}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Active Timer Indicator */}
        {sleepTimer.isActive && (
          <div className="p-3 rounded-2xl bg-primary-600/15 border border-primary-500/30 flex items-center justify-between text-xs text-primary-300">
            <div className="flex items-center gap-2">
              <Clock size={15} />
              <span>
                {sleepTimer.mode === 'end_of_track'
                  ? 'Active: Stopping at end of current track'
                  : `Active: ${Math.floor(sleepTimer.remainingSeconds / 60)}m ${sleepTimer.remainingSeconds % 60}s remaining`}
              </span>
            </div>
            <button
              onClick={cancelSleepTimer}
              className="text-pink-400 font-semibold hover:underline"
            >
              Turn Off
            </button>
          </div>
        )}

        {/* Preset Options */}
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
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isSelected
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{preset.label}</span>
                {isSelected && <Check size={16} />}
              </button>
            );
          })}
        </div>

        {/* Turn Off Button if Active */}
        {sleepTimer.isActive && (
          <button
            onClick={cancelSleepTimer}
            className="w-full py-2.5 rounded-2xl bg-white/5 text-slate-400 hover:text-white text-xs font-semibold"
          >
            Cancel Sleep Timer
          </button>
        )}
      </div>
    </div>
  );
}
