'use client';

import { formatTime } from '@/lib/utils';

interface PlayerProgressProps {
  currentTime: number;
  duration: number;
  bufferedTime?: number;
  onSeek: (time: number) => void;
  showLabels?: boolean;
  className?: string;
}

export function PlayerProgress({
  currentTime,
  duration,
  bufferedTime = 0,
  onSeek,
  showLabels = true,
  className = ''
}: PlayerProgressProps) {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0;

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      <div className="relative flex items-center h-8 group select-none">
        {/* Track background */}
        <div className="absolute left-0 right-0 h-1.5 bg-slate-300/40 rounded-full pointer-events-none" />

        {/* Buffering bar */}
        <div
          className="absolute left-0 h-1.5 bg-slate-300/80 rounded-full pointer-events-none transition-all duration-300"
          style={{ width: `${bufferedPercent}%` }}
        />

        {/* Played progress bar (Soft Charcoal / Accent) */}
        <div
          className="absolute left-0 h-1.5 bg-gradient-to-r from-slate-400 to-slate-600 rounded-full shadow-sm pointer-events-none transition-all duration-150"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Scrub slider input with full 44px tap target height */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full h-8 relative z-10 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
          aria-label="Seek track position"
        />
      </div>

      {showLabels && (
        <div className="flex items-center justify-between text-xs font-mono text-text-secondary px-0.5 select-none">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
}
