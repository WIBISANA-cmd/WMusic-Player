'use client';

import { usePlayerStore } from '@/store/usePlayerStore';
import { Play, Pause, SkipForward, Heart, Maximize2, Volume2, VolumeX, Mic2, ListMusic } from 'lucide-react';
import Image from 'next/image';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

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
    togglePlayPause,
    nextTrack,
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
      <div
        onClick={() => setFullPlayerOpen(true)}
        className="md:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,12px))] left-2 right-2 z-30 h-16 rounded-2xl glass-panel bg-[#111726]/95 border border-white/10 shadow-2xl flex items-center justify-between px-3 cursor-pointer overflow-hidden backdrop-blur-xl select-none"
      >
        {/* Progress Bar Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="absolute top-0 left-0 h-full bg-white/20"
            style={{ width: `${bufferedPercent}%` }}
          />
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-primary-500 shadow-[0_0_8px_#8b5cf6]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-md">
            <Image
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              fill
              className={`object-cover ${isPlaying ? 'scale-105' : 'scale-100'} transition-transform duration-500`}
              sizes="44px"
            />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">{currentTrack.title}</h4>
            <p className="text-[11px] text-slate-400 truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Quick Controls */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => toggleLike(currentTrack)}
            aria-label="Like"
            className="w-10 h-10 flex items-center justify-center text-slate-400 active:scale-90 transition-transform"
          >
            <Heart size={18} fill={isLiked ? '#ec4899' : 'none'} className={isLiked ? 'text-pink-500' : ''} />
          </button>

          <button
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-11 h-11 rounded-full bg-primary-600 active:bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-600/30 active:scale-95 transition-transform"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>

          <button
            onClick={() => nextTrack()}
            aria-label="Next track"
            className="w-10 h-10 flex items-center justify-center text-slate-300 active:scale-90 transition-transform"
          >
            <SkipForward size={18} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* ================= DESKTOP PERSISTENT BOTTOM BAR ================= */}
      <div className="hidden md:flex fixed bottom-0 left-64 right-0 h-24 bg-[#0d1322]/95 border-t border-white/5 z-30 px-6 items-center justify-between backdrop-blur-2xl select-none">
        {/* Left: Track Details */}
        <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
          <div
            onClick={() => setFullPlayerOpen(true)}
            className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 cursor-pointer group shadow-lg"
          >
            <Image
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              sizes="56px"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 size={16} className="text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <h4
              onClick={() => setFullPlayerOpen(true)}
              className="text-sm font-semibold text-white truncate cursor-pointer hover:underline"
            >
              {currentTrack.title}
            </h4>
            <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
          </div>
          <button
            onClick={() => toggleLike(currentTrack)}
            aria-label="Like track"
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Heart size={18} fill={isLiked ? '#ec4899' : 'none'} className={isLiked ? 'text-pink-500' : ''} />
          </button>
        </div>

        {/* Center: Playback Controls & Scrubber */}
        <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-xl">
          <div className="flex items-center gap-5">
            <button
              onClick={() => usePlayerStore.getState().toggleShuffle()}
              aria-label="Shuffle"
              className={`p-1.5 transition-colors ${
                usePlayerStore.getState().isShuffled ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-xs font-bold">🔀</span>
            </button>

            <button
              onClick={() => usePlayerStore.getState().prevTrack()}
              aria-label="Previous"
              className="text-slate-300 hover:text-white transition-colors"
            >
              <SkipForward size={18} fill="currentColor" className="rotate-180" />
            </button>

            <button
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-10 h-10 rounded-full bg-white hover:scale-105 text-black flex items-center justify-center shadow-lg transition-transform"
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>

            <button
              onClick={() => nextTrack()}
              aria-label="Next"
              className="text-slate-300 hover:text-white transition-colors"
            >
              <SkipForward size={18} fill="currentColor" />
            </button>

            <button
              onClick={() => usePlayerStore.getState().cycleRepeatMode()}
              aria-label="Repeat mode"
              className={`p-1.5 transition-colors relative ${
                usePlayerStore.getState().repeatMode !== 'off' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-xs font-bold">🔁</span>
              {usePlayerStore.getState().repeatMode === 'one' && (
                <span className="absolute -top-1 -right-1 text-[9px] font-bold text-cyan-400">1</span>
              )}
            </button>
          </div>

          {/* Time Scrubber */}
          <div className="w-full flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full h-1 relative z-10"
              />
              <div
                className="absolute top-0 left-0 h-1 bg-primary-500 rounded-full pointer-events-none"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Actions, Lyrics, Queue, Volume */}
        <div className="flex items-center justify-end gap-3 w-1/4">
          <button
            onClick={() => {
              setFullPlayerOpen(true);
              setLyricsOpen(true);
            }}
            aria-label="Open lyrics"
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Mic2 size={18} />
          </button>

          <button
            onClick={() => setQueueOpen(true)}
            aria-label="Open queue"
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <ListMusic size={18} />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 w-32">
            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-white transition-colors"
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
              className="w-20 h-1"
            />
          </div>
        </div>
      </div>
    </>
  );
}
