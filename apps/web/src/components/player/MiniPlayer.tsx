'use client';

import { motion } from 'framer-motion';
import { usePlayerStore } from '@/stores/player-store';
import { Heart, Maximize2, Volume2, VolumeX, Mic2, ListMusic } from 'lucide-react';
import { PlayerArtwork } from './PlayerArtwork';
import { PlayerControls } from './PlayerControls';
import { PlayerProgress } from './PlayerProgress';

export function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    bufferedTime,
    volume,
    isMuted,
    likedTrackIds,
    repeatMode,
    isShuffled,
    togglePlayPause,
    nextTrack,
    prevTrack,
    toggleShuffle,
    cycleRepeatMode,
    toggleLike,
    seek,
    setVolume,
    toggleMute,
    setFullPlayerOpen,
    setLyricsOpen,
    setQueueOpen
  } = usePlayerStore();

  if (!currentTrack) return null;

  const isLiked = likedTrackIds.includes(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0;

  return (
    <>
      {/* ================= MOBILE FLOATING MINI-PLAYER ================= */}
      <motion.div
        role="button"
        tabIndex={0}
        aria-label={`Now playing: ${currentTrack.title} by ${currentTrack.artist}. Tap or swipe up to open full player.`}
        onClick={() => setFullPlayerOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setFullPlayerOpen(true);
          }
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.3, bottom: 0.05 }}
        onDragEnd={(_, info) => {
          if (info.offset.y < -25 || info.velocity.y < -150) {
            setFullPlayerOpen(true);
          }
        }}
        className="md:hidden fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom,12px))] left-3 right-3 z-30 h-16 rounded-2xl glass-panel bg-white/75 border border-white/60 shadow-glass flex items-center justify-between px-3 cursor-pointer select-none overflow-hidden touch-pan-y focus-visible:ring-2 focus-visible:ring-accent"
      >
        {/* Subtle Progress Bar along top edge */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200/60 pointer-events-none">
          <div
            className="absolute top-0 left-0 h-full bg-slate-300/80"
            style={{ width: `${bufferedPercent}%` }}
          />
          <div
            className="absolute top-0 left-0 h-full bg-slate-600 rounded-r-full shadow-sm transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Track Info & Artwork */}
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <PlayerArtwork track={currentTrack} isPlaying={isPlaying} size="sm" />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-text-primary truncate">{currentTrack.title}</h4>
            <p className="text-[11px] text-text-secondary truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Quick Controls */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => toggleLike(currentTrack)}
            aria-label={isLiked ? 'Unlike track' : 'Like track'}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary active:scale-90 transition-transform focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Heart
              size={18}
              fill={isLiked ? '#e11d48' : 'none'}
              className={isLiked ? 'text-rose-600' : ''}
            />
          </button>

          <PlayerControls
            isPlaying={isPlaying}
            repeatMode={repeatMode}
            isShuffled={isShuffled}
            onTogglePlay={togglePlayPause}
            onPrev={prevTrack}
            onNext={nextTrack}
            variant="compact"
          />
        </div>
      </motion.div>

      {/* ================= DESKTOP PERSISTENT BOTTOM BAR ================= */}
      <div className="hidden md:flex fixed bottom-0 left-64 right-0 h-24 glass-panel bg-white/75 border-t border-white/60 shadow-glass z-30 px-8 items-center justify-between select-none">
        {/* Left: Track Details */}
        <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
          <div
            onClick={() => setFullPlayerOpen(true)}
            className="relative cursor-pointer group"
            role="button"
            tabIndex={0}
            aria-label="Expand player artwork"
            onKeyDown={(e) => {
              if (e.key === 'Enter') setFullPlayerOpen(true);
            }}
          >
            <PlayerArtwork track={currentTrack} isPlaying={isPlaying} size="md" />
            <div className="absolute inset-0 bg-slate-900/20 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 size={16} className="text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <h4
              onClick={() => setFullPlayerOpen(true)}
              className="text-sm font-semibold text-text-primary truncate cursor-pointer hover:underline"
            >
              {currentTrack.title}
            </h4>
            <p className="text-xs text-text-secondary truncate">{currentTrack.artist}</p>
          </div>
          <button
            onClick={() => toggleLike(currentTrack)}
            aria-label={isLiked ? 'Unlike track' : 'Like track'}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Heart
              size={18}
              fill={isLiked ? '#e11d48' : 'none'}
              className={isLiked ? 'text-rose-600' : ''}
            />
          </button>
        </div>

        {/* Center: Playback Controls & Scrubber */}
        <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleShuffle}
              aria-label={isShuffled ? 'Shuffle on' : 'Shuffle off'}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                isShuffled ? 'text-slate-800 bg-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="text-sm">🔀</span>
            </button>

            <button
              onClick={prevTrack}
              aria-label="Previous track"
              className="w-10 h-10 flex items-center justify-center rounded-full text-text-primary hover:bg-white/60 transition-colors"
            >
              <span className="text-sm font-bold">⏮</span>
            </button>

            <button
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-11 h-11 rounded-full liquid-button text-text-primary flex items-center justify-center shadow-md transition-transform active:scale-95"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            <button
              onClick={nextTrack}
              aria-label="Next track"
              className="w-10 h-10 flex items-center justify-center rounded-full text-text-primary hover:bg-white/60 transition-colors"
            >
              <span className="text-sm font-bold">⏭</span>
            </button>

            <button
              onClick={cycleRepeatMode}
              aria-label={`Repeat mode: ${repeatMode}`}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors relative ${
                repeatMode !== 'off' ? 'text-slate-800 bg-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="text-sm">🔁</span>
              {repeatMode === 'one' && (
                <span className="absolute top-1 right-1 text-[9px] font-bold text-slate-700">1</span>
              )}
            </button>
          </div>

          <PlayerProgress
            currentTime={currentTime}
            duration={duration}
            bufferedTime={bufferedTime}
            onSeek={seek}
            showLabels={true}
          />
        </div>

        {/* Right: Actions, Lyrics, Queue, Volume */}
        <div className="flex items-center justify-end gap-3 w-1/4">
          <button
            onClick={() => {
              setFullPlayerOpen(true);
              setLyricsOpen(true);
            }}
            aria-label="Open lyrics"
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary hover:bg-white/50 transition-colors"
          >
            <Mic2 size={18} />
          </button>

          <button
            onClick={() => setQueueOpen(true)}
            aria-label="Open up next queue"
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary hover:bg-white/50 transition-colors"
          >
            <ListMusic size={18} />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 w-32">
            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Volume slider"
              className="w-20"
            />
          </div>
        </div>
      </div>
    </>
  );
}
