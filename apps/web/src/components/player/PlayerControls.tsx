'use client';

import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { RepeatMode } from '@music/shared';

interface PlayerControlsProps {
  isPlaying: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleShuffle?: () => void;
  onCycleRepeat?: () => void;
  variant?: 'compact' | 'full';
}

export function PlayerControls({
  isPlaying,
  repeatMode,
  isShuffled,
  onTogglePlay,
  onPrev,
  onNext,
  onToggleShuffle,
  onCycleRepeat,
  variant = 'full'
}: PlayerControlsProps) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full liquid-button flex items-center justify-center text-text-primary shadow-sm active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-accent"
        >
          {isPlaying ? (
            <Pause size={18} fill="currentColor" />
          ) : (
            <Play size={18} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <button
          onClick={onNext}
          aria-label="Next track"
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary active:scale-90 transition-transform focus-visible:ring-2 focus-visible:ring-accent"
        >
          <SkipForward size={18} fill="currentColor" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-2 pt-1 w-full max-w-sm mx-auto select-none">
      {/* Shuffle Button (min 44x44) */}
      <button
        onClick={onToggleShuffle}
        aria-label={isShuffled ? 'Shuffle enabled' : 'Shuffle disabled'}
        className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all active:scale-90 focus-visible:ring-2 focus-visible:ring-accent ${
          isShuffled ? 'text-slate-800 font-bold bg-white/70 shadow-sm' : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        <Shuffle size={20} />
      </button>

      {/* Prev Track (min 44x44) */}
      <button
        onClick={onPrev}
        aria-label="Previous track"
        className="w-12 h-12 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-text-primary hover:bg-white/40 active:scale-90 transition-all focus-visible:ring-2 focus-visible:ring-accent"
      >
        <SkipBack size={26} fill="currentColor" />
      </button>

      {/* Liquid Play / Pause Button */}
      <button
        onClick={onTogglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-full liquid-button text-text-primary flex items-center justify-center shadow-liquid active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-accent"
      >
        {isPlaying ? (
          <Pause size={28} fill="currentColor" />
        ) : (
          <Play size={28} fill="currentColor" className="ml-1" />
        )}
      </button>

      {/* Next Track (min 44x44) */}
      <button
        onClick={onNext}
        aria-label="Next track"
        className="w-12 h-12 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-text-primary hover:bg-white/40 active:scale-90 transition-all focus-visible:ring-2 focus-visible:ring-accent"
      >
        <SkipForward size={26} fill="currentColor" />
      </button>

      {/* Repeat Mode (min 44x44) */}
      <button
        onClick={onCycleRepeat}
        aria-label={`Repeat mode: ${repeatMode}`}
        className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all active:scale-90 relative focus-visible:ring-2 focus-visible:ring-accent ${
          repeatMode !== 'off'
            ? 'text-slate-800 font-bold bg-white/70 shadow-sm'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
        {repeatMode === 'one' && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-slate-700" />
        )}
      </button>
    </div>
  );
}
