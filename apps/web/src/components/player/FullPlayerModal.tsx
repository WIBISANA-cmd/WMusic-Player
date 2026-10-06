'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  ChevronDown,
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Mic2,
  ListMusic,
  Moon,
  Download,
  Check,
  Disc3
} from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { LyricsView } from './LyricsView';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function FullPlayerModal() {
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
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0;

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
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-600/30 blur-3xl animate-pulse"
          />
          <div
            className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-cyan-600/25 blur-3xl"
          />
          <div
            className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-pink-600/25 blur-3xl"
          />
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
              {/* Vinyl / Cover Art */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl shadow-primary-950/80 border border-white/10 group">
                <Image
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 640px) 256px, 320px"
                />
                {/* Vinyl Ring Overlay Accent */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                <div className="absolute bottom-4 right-4 p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80">
                  <Disc3 size={20} className={isPlaying ? 'animate-spin-slow' : 'animate-spin-slow-paused'} />
                </div>
              </div>
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
                {currentTrack.artist} • <span className="text-primary-400">{currentTrack.genre}</span>
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

          {/* Interactive Range Scrubber */}
          <div className="space-y-1.5">
            <div className="relative flex items-center h-4">
              {/* Buffer progress bar */}
              <div
                className="absolute left-0 h-1 bg-white/20 rounded-full pointer-events-none"
                style={{ width: `${bufferedPercent}%` }}
              />
              {/* Played progress bar */}
              <div
                className="absolute left-0 h-1 bg-gradient-to-r from-cyan-400 to-primary-500 rounded-full shadow-[0_0_10px_#8b5cf6] pointer-events-none"
                style={{ width: `${progressPercent}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full relative z-10"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Core Playback Buttons */}
          <div className="flex items-center justify-between px-2 pt-1">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              aria-label="Toggle shuffle"
              className={`p-2 transition-colors active:scale-90 ${
                isShuffled ? 'text-cyan-400 drop-shadow-[0_0_8px_#06b6d4]' : 'text-slate-400'
              }`}
            >
              <Shuffle size={20} />
            </button>

            {/* Prev Track */}
            <button
              onClick={() => prevTrack()}
              aria-label="Previous track"
              className="p-3 text-slate-200 active:scale-90 transition-transform"
            >
              <SkipBack size={26} fill="currentColor" />
            </button>

            {/* Play / Pause Glow Button */}
            <button
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-18 h-18 w-[68px] h-[68px] rounded-full bg-gradient-to-tr from-cyan-500 via-primary-500 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-primary-600/40 active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause size={28} fill="currentColor" />
              ) : (
                <Play size={28} fill="currentColor" className="ml-1" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={() => nextTrack()}
              aria-label="Next track"
              className="p-3 text-slate-200 active:scale-90 transition-transform"
            >
              <SkipForward size={26} fill="currentColor" />
            </button>

            {/* Repeat Mode */}
            <button
              onClick={cycleRepeatMode}
              aria-label="Cycle repeat"
              className={`p-2 transition-colors active:scale-90 ${
                repeatMode !== 'off' ? 'text-cyan-400 drop-shadow-[0_0_8px_#06b6d4]' : 'text-slate-400'
              }`}
            >
              {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
            </button>
          </div>

          {/* Secondary Controls Bar */}
          <div className="flex items-center justify-around pt-3 border-t border-white/5 text-slate-400 text-xs">
            {/* Lyrics Toggle */}
            <button
              onClick={() => setLyricsOpen(!isLyricsOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
                isLyricsOpen ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'hover:text-white'
              }`}
            >
              <Mic2 size={16} />
              <span>Lyrics</span>
            </button>

            {/* Speed Cycle */}
            <button
              onClick={handleSpeedCycle}
              className="px-2.5 py-1 rounded-full font-mono text-[11px] bg-white/5 hover:bg-white/10 text-slate-300"
            >
              {playbackRate}x
            </button>

            {/* Sleep Timer */}
            <button
              onClick={() => setSleepTimerModalOpen(true)}
              className="p-2 hover:text-white transition-colors"
            >
              <Moon size={18} />
            </button>

            {/* Up Next Queue */}
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
