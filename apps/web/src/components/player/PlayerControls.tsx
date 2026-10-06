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
      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="w-11 h-11 rounded-full bg-primary-600 active:bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-600/30 active:scale-95 transition-transform"
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>

        <button
          onClick={onNext}
          aria-label="Next track"
          className="w-10 h-10 flex items-center justify-center text-slate-300 active:scale-90 transition-transform"
        >
          <SkipForward size={18} fill="currentColor" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-2 pt-1 w-full max-w-sm mx-auto">
      {/* Shuffle */}
      <button
        onClick={onToggleShuffle}
        aria-label="Toggle shuffle"
        className={`p-2 transition-colors active:scale-90 ${
          isShuffled ? 'text-cyan-400 drop-shadow-[0_0_8px_#06b6d4]' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Shuffle size={20} />
      </button>

      {/* Prev Track */}
      <button
        onClick={onPrev}
        aria-label="Previous track"
        className="p-3 text-slate-200 active:scale-90 transition-transform"
      >
        <SkipBack size={26} fill="currentColor" />
      </button>

      {/* Play / Pause Glow Button */}
      <button
        onClick={onTogglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="w-[68px] h-[68px] rounded-full bg-gradient-to-tr from-cyan-500 via-primary-500 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-primary-600/40 active:scale-95 transition-transform"
      >
        {isPlaying ? (
          <Pause size={28} fill="currentColor" />
        ) : (
          <Play size={28} fill="currentColor" className="ml-1" />
        )}
      </button>

      {/* Next Track */}
      <button
        onClick={onNext}
        aria-label="Next track"
        className="p-3 text-slate-200 active:scale-90 transition-transform"
      >
        <SkipForward size={26} fill="currentColor" />
      </button>

      {/* Repeat Mode */}
      <button
        onClick={onCycleRepeat}
        aria-label="Cycle repeat mode"
        className={`p-2 transition-colors active:scale-90 ${
          repeatMode !== 'off' ? 'text-cyan-400 drop-shadow-[0_0_8px_#06b6d4]' : 'text-slate-400 hover:text-white'
        }`}
      >
        {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
      </button>
    </div>
  );
}

