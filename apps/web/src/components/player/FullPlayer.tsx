'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

export function FullPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    bufferedTime,
    repeatMode,
    isShuffled,
    playbackRate,
    likedTrackIds,
    offlineTrackIds,
    isFullPlayerOpen,
    isLyricsOpen,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seek,
    cycleRepeatMode,
    toggleShuffle,
    setPlaybackRate,
    toggleLike,
    downloadTrackForOffline,
    setFullPlayerOpen,
    setLyricsOpen,
    setQueueOpen,
    setSleepTimerModalOpen
  } = usePlayerStore();

  const [downloading, setDownloading] = useState(false);

  if (!isFullPlayerOpen || !currentTrack) return null;

  const isLiked = likedTrackIds.includes(currentTrack.id);
  const isDownloaded = offlineTrackIds.includes(currentTrack.id);

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
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed inset-0 z-50 flex flex-col bg-[#090d16] select-none overflow-hidden"
      >
        {/* Dynamic Glowing Ambient Blur Background */}
        <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-600/30 blur-3xl animate-pulse" />
          <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-cyan-600/25 blur-3xl" />
          <div className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-pink-600/25 blur-3xl" />
        </div>

        {/* Top App Bar */}
        <header className="relative z-10 flex items-center justify-between px-6 pt-4 pb-2">
          <button
            onClick={() => setFullPlayerOpen(false)}
            aria-label="Collapse player"
            className="w-10 h-10 rounded-full bg-white/5 active:bg-white/10 flex items-center justify-center text-slate-300 transition-colors"
          >
            <ChevronDown size={24} />
          </button>

          <div className="text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Playing From
            </span>
            <h4 className="text-xs font-bold text-white truncate max-w-[200px]">
              {currentTrack.album || 'Pulse Stream'}
            </h4>
          </div>

          <button
            onClick={handleDownload}
            aria-label="Download offline"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isDownloaded
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-white/5 active:bg-white/10 text-slate-300'
            }`}
          >
            {downloading ? (
              <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            ) : isDownloaded ? (
              <Check size={18} />
            ) : (
              <Download size={18} />
            )}
          </button>
        </header>

        {/* Center Main Stage: Album Art or Lyrics View */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 min-h-0">
          {isLyricsOpen ? (
            <div className="w-full h-full max-w-lg">
              <LyricsView track={currentTrack} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full max-w-sm">
              <PlayerArtwork
                track={currentTrack}
                isPlaying={isPlaying}
                size="lg"
                showVinylEffect={true}
              />
            </div>
          )}
        </main>

        {/* Bottom Section: Info, Scrubber, Controls */}
        <footer className="relative z-10 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,12px))] pt-2 space-y-4 max-w-lg mx-auto w-full">
          {/* Track Meta & Like */}
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-4">
              <h2 className="text-xl sm:text-2xl font-black text-white truncate drop-shadow-sm">
                {currentTrack.title}
              </h2>
              <p className="text-sm font-medium text-slate-400 truncate mt-0.5">
                {currentTrack.artist} • <span className="text-primary-400">{currentTrack.genre || 'Electronic'}</span>
              </p>
            </div>
            <button
              onClick={() => toggleLike(currentTrack)}
              aria-label="Like"
              className="p-3 text-slate-400 active:scale-90 transition-transform shrink-0"
            >
              <Heart
                size={24}
                fill={isLiked ? '#ec4899' : 'none'}
                className={isLiked ? 'text-pink-500' : ''}
              />
            </button>
          </div>

          {/* Interactive Range Scrubber Component */}
          <PlayerProgress
            currentTime={currentTime}
            duration={duration}
            bufferedTime={bufferedTime}
            onSeek={seek}
          />

          {/* Core Playback Controls Component */}
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
          <div className="flex items-center justify-around pt-3 border-t border-white/5 text-slate-400 text-xs">
            <button
              onClick={() => setLyricsOpen(!isLyricsOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
                isLyricsOpen ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'hover:text-white'
              }`}
            >
              <Mic2 size={16} />
              <span>Lyrics</span>
            </button>

            <button
              onClick={handleSpeedCycle}
              className="px-2.5 py-1 rounded-full font-mono text-[11px] bg-white/5 hover:bg-white/10 text-slate-300"
            >
              {playbackRate}x
            </button>

            <button
              onClick={() => setSleepTimerModalOpen(true)}
              className="p-2 hover:text-white transition-colors"
            >
              <Moon size={18} />
            </button>

            <button
              onClick={() => setQueueOpen(true)}
              className="p-2 hover:text-white transition-colors"
            >
              <ListMusic size={20} />
            </button>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}

