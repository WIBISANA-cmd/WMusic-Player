'use client';

import { usePlayerStore } from '@/stores/player-store';
import { Download, Play, Trash2, HardDrive, Smartphone, CheckCircle } from 'lucide-react';
import { PlayerArtwork } from '@/components/player/PlayerArtwork';

export function OfflinePage() {
  const {
    offlineTracks,
    isOfflineMode,
    setOfflineMode,
    playTrack,
    removeOfflineTrack,
    currentTrack,
    isPlaying
  } = usePlayerStore();

  const estimatedStorageMb = (offlineTracks.length * 3.5).toFixed(1);

  return (
    <div className="space-y-6 animate-fadeIn pb-16 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-text-primary">Offline Mode</h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Listen to your downloaded songs without an internet connection
          </p>
        </div>
      </div>

      {/* Storage and Offline Mode Switch Banner */}
      <div className="p-5 rounded-3xl glass-card bg-white/60 border border-white/60 shadow-glass-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
              <HardDrive size={22} />
            </div>
            <div>
              <div className="text-sm font-bold text-text-primary">
                {offlineTracks.length} Tracks Downloaded
              </div>
              <div className="text-xs text-text-secondary">
                ~{estimatedStorageMb} MB cached in CacheStorage / IndexedDB
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs text-text-secondary font-medium">Force Offline Playback</span>
            <button
              onClick={() => setOfflineMode(!isOfflineMode)}
              aria-label={isOfflineMode ? 'Disable force offline' : 'Enable force offline'}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isOfflineMode ? 'bg-slate-700' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  isOfflineMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* PWA Tip */}
        <div className="pt-3 border-t border-slate-200/60 flex items-center gap-2 text-xs text-text-secondary">
          <Smartphone size={15} className="text-slate-600 shrink-0" />
          <span>
            Install WMusic to your device for instant offline playback anytime.
          </span>
        </div>
      </div>

      {/* Downloaded Songs List */}
      <section className="space-y-3 pt-2">
        <h3 className="text-base font-bold text-text-primary flex items-center gap-2 px-1">
          <CheckCircle size={16} className="text-emerald-600" />
          <span>Downloaded Songs ({offlineTracks.length})</span>
        </h3>

        {offlineTracks.length === 0 ? (
          <div className="py-16 text-center text-text-secondary rounded-3xl glass-card bg-white/40 border border-white/50 p-6">
            <Download size={32} className="mx-auto mb-3 opacity-50 text-slate-500" />
            <p className="text-sm font-bold text-text-primary">No tracks downloaded yet</p>
            <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
              Tap the download icon in the player to save songs for offline listening.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {offlineTracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  className={`flex items-center justify-between p-3 rounded-2xl group transition-all ${
                    isCurrent
                      ? 'glass-card bg-white/80 border border-slate-300 shadow-sm'
                      : 'glass-card bg-white/50 hover:bg-white/70 border border-white/50 shadow-glass-sm'
                  }`}
                >
                  <div
                    onClick={() => playTrack(track, offlineTracks)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Play ${track.title}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') playTrack(track, offlineTracks);
                    }}
                    className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
                  >
                    <PlayerArtwork track={track} isPlaying={isCurrent && isPlaying} size="sm" />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-text-primary truncate">{track.title}</h4>
                      <p className="text-xs text-text-secondary truncate">
                        {track.artist} • <span className="text-emerald-700 font-mono text-[11px]">Saved Offline</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playTrack(track, offlineTracks)}
                      aria-label={isCurrent && isPlaying ? 'Pause' : 'Play'}
                      className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                        isCurrent && isPlaying
                          ? 'liquid-button text-slate-800'
                          : 'bg-white/80 group-hover:bg-white text-slate-700'
                      }`}
                    >
                      <Play size={14} fill="currentColor" className="ml-0.5" />
                    </button>

                    <button
                      onClick={() => removeOfflineTrack(track.id)}
                      aria-label="Remove from offline"
                      className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-text-secondary hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default OfflinePage;
