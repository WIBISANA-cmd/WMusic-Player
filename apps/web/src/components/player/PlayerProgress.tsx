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
      <div className="relative flex items-center h-4 group">
        {/* Buffering bar */}
        <div
          className="absolute left-0 h-1 bg-white/20 rounded-full pointer-events-none transition-all duration-300"
          style={{ width: `${bufferedPercent}%` }}
        />
        {/* Played progress bar */}
        <div
          className="absolute left-0 h-1 bg-gradient-to-r from-cyan-400 to-primary-500 rounded-full shadow-[0_0_10px_#8b5cf6] pointer-events-none transition-all duration-150"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Scrub slider */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full relative z-10"
          aria-label="Seek track position"
        />
      </div>

      {showLabels && (
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-0.5 select-none">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
}

