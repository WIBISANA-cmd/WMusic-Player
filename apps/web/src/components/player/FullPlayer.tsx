'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ChevronDown,
  Heart,
  Mic2,
  ListMusic,
  Moon,
  Download,
  Check
} from 'lucide-react';
import { usePlayerStore } from '@/stores/player-store';
import { LyricsView } from './LyricsView';
import { PlayerArtwork } from './PlayerArtwork';
import { PlayerProgress } from './PlayerProgress';
import { PlayerControls } from './PlayerControls';

/**
 * Isolated Scrubber component for FullPlayer.
 * Only this sub-component re-renders as currentTime updates.
 */
function FullPlayerScrubber() {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const buffered = usePlayerStore((s) => s.buffered);
  const seek = usePlayerStore((s) => s.seek);

  return (
    <PlayerProgress
      currentTime={currentTime}
      duration={duration}
      bufferedTime={buffered}
      onSeek={seek}
    />
  );
}

export function FullPlayer() {
  const shouldReduceMotion = useReducedMotion();

  // Narrow selectors: changing currentTime does NOT re-render this outer full player!
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const isShuffled = usePlayerStore((s) => s.shuffle);
  const playbackRate = usePlayerStore((s) => s.playbackRate);
  const isFullPlayerOpen = usePlayerStore((s) => s.isFullPlayerOpen);
  const isLyricsOpen = usePlayerStore((s) => s.isLyricsOpen);
  const isLiked = usePlayerStore((s) => (s.currentTrack ? s.likedTrackIds.includes(s.currentTrack.id) : false));
  const isDownloaded = usePlayerStore((s) => (s.currentTrack ? s.offlineTrackIds.includes(s.currentTrack.id) : false));

  const togglePlayPause = usePlayerStore((s) => s.togglePlay);
  const nextTrack = usePlayerStore((s) => s.next);
  const prevTrack = usePlayerStore((s) => s.previous);
  const cycleRepeatMode = usePlayerStore((s) => s.cycleRepeatMode);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const setPlaybackRate = usePlayerStore((s) => s.setPlaybackRate);
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const downloadTrackForOffline = usePlayerStore((s) => s.downloadTrackForOffline);
  const setFullPlayerOpen = usePlayerStore((s) => s.setFullPlayerOpen);
  const setLyricsOpen = usePlayerStore((s) => s.setLyricsOpen);
  const setQueueOpen = usePlayerStore((s) => s.setQueueOpen);
  const setSleepTimerModalOpen = usePlayerStore((s) => s.setSleepTimerModalOpen);

  const [downloading, setDownloading] = useState(false);

  // Keyboard accessibility: Escape key collapses full player
  useEffect(() => {
    if (!isFullPlayerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullPlayerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullPlayerOpen, setFullPlayerOpen]);

  if (!isFullPlayerOpen || !currentTrack) return null;

  const handleDownload = async () => {
    if (isDownloaded || downloading) return;
    setDownloading(true);
    await downloadTrackForOffline(currentTrack);
    setDownloading(false);
  };

  const handleSpeedCycle = () => {
    const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    setPlaybackRate(rates[nextIdx]);
  };

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Full player for ${currentTrack.title}`}
        initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
        animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        drag={shouldReduceMotion ? false : 'y'}
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0.05, bottom: 0.4 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 70 || info.velocity.y > 250) {
            setFullPlayerOpen(false);
          }
        }}
        className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-2xl text-text-primary select-none overflow-hidden touch-pan-y overscroll-contain"
      >
        {/* Decorative Liquid Blobs for subtle ambient depth (GPU transform-only) */}
        <div className="absolute inset-0 pointer-events-none opacity-50 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-slate-300/30 blur-3xl animate-blob-slow" />
          <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-slate-300/25 blur-3xl animate-blob-reverse" />
        </div>

        {/* Drag Pill Handle */}
        <div
          className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none"
          aria-hidden="true"
        >
          <div className="w-12 h-1.5 rounded-full bg-slate-400/40" />
        </div>

        {/* Top App Bar */}
        <header className="relative z-10 flex items-center justify-between px-6 py-2">
          <button
            onClick={() => setFullPlayerOpen(false)}
            aria-label="Collapse player"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full glass-pill flex items-center justify-center text-text-primary shadow-sm active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronDown size={22} />
          </button>

          <div className="text-center px-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary block">
              Playing From
            </span>
            <h4 className="text-xs font-bold text-text-primary truncate max-w-[200px]">
              {currentTrack.album || 'Curated Stream'}
            </h4>
          </div>

          <button
            onClick={handleDownload}
            aria-label={isDownloaded ? 'Downloaded for offline' : 'Download for offline playback'}
            className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full glass-pill flex items-center justify-center transition-all shadow-sm active:scale-95 focus-visible:ring-2 focus-visible:ring-accent ${
              isDownloaded
                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {downloading ? (
              <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
            ) : isDownloaded ? (
              <Check size={18} />
            ) : (
              <Download size={18} />
            )}
          </button>
        </header>

        {/* Center Stage: Shared Artwork, YouTube Video, or Synced Lyrics */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 min-h-0">
          {isLyricsOpen ? (
            <div className="w-full h-full max-w-lg">
              <LyricsView track={currentTrack} />
            </div>
          ) : currentTrack.provider === 'youtube' ? (
            <div className="w-full max-w-sm sm:max-w-md aspect-video flex items-center justify-center">
              {/* Space reserved for YouTubePlayer floating video */}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full max-w-xs sm:max-w-sm">
              <PlayerArtwork
                track={currentTrack}
                isPlaying={isPlaying}
                size="lg"
                layoutId="player-artwork"
                showVinylEffect={true}
              />
            </div>
          )}
        </main>

        {/* Bottom Panel: Track Info, Scrubber, Controls */}
        <footer className="relative z-10 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,12px))] pt-2 space-y-4 max-w-lg mx-auto w-full">
          {/* Track Meta & Like Button */}
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-text-primary truncate">
                  {currentTrack.title}
                </h2>
                {currentTrack.provider === 'youtube' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-300/60 shrink-0">
                    YouTube
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-text-secondary truncate mt-0.5">
                {currentTrack.artist} {currentTrack.genre ? `• ${currentTrack.genre}` : ''}
              </p>
            </div>
            <button
              onClick={() => toggleLike(currentTrack)}
              aria-label={isLiked ? 'Unlike track' : 'Like track'}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-text-secondary active:scale-90 transition-transform shrink-0 focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Heart
                size={24}
                fill={isLiked ? '#e11d48' : 'none'}
                className={isLiked ? 'text-rose-600' : ''}
              />
            </button>
          </div>

          {/* Isolated Scrubber: Only re-renders its own progress bar during playback */}
          <FullPlayerScrubber />

          {/* Main Controls */}
          <PlayerControls
            isPlaying={isPlaying}
            repeatMode={repeatMode}
            isShuffled={isShuffled}
            onTogglePlay={togglePlayPause}
            onPrev={prevTrack}
            onNext={nextTrack}
            onToggleShuffle={toggleShuffle}
            onCycleRepeat={cycleRepeatMode}
            variant="full"
          />

          {/* Secondary Controls Bar */}
          <div className="flex items-center justify-around pt-3 border-t border-slate-300/40 text-text-secondary text-xs">
            <button
              onClick={() => setLyricsOpen(!isLyricsOpen)}
              aria-label="Toggle synced lyrics"
              className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-full transition-all focus-visible:ring-2 focus-visible:ring-accent ${
                isLyricsOpen
                  ? 'bg-slate-700 text-white font-semibold shadow-sm'
                  : 'hover:text-text-primary hover:bg-white/60'
              }`}
            >
              <Mic2 size={16} />
              <span>Lyrics</span>
            </button>

            <button
              onClick={handleSpeedCycle}
              aria-label={`Playback speed: ${playbackRate}x`}
              className="px-3 py-2 min-w-[44px] min-h-[44px] rounded-full font-mono text-xs glass-pill text-text-primary shadow-sm active:scale-95 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-accent"
            >
              {playbackRate}x
            </button>

            <button
              onClick={() => setSleepTimerModalOpen(true)}
              aria-label="Set sleep timer"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center hover:text-text-primary hover:bg-white/60 transition-colors focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Moon size={18} />
            </button>

            <button
              onClick={() => setQueueOpen(true)}
              aria-label="Open up next queue"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center hover:text-text-primary hover:bg-white/60 transition-colors focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ListMusic size={20} />
            </button>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
