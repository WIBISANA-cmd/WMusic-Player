'use client';

import { usePlayerStore } from '@/store/usePlayerStore';
import Image from 'next/image';
import { Download, Play, Trash2, HardDrive, Smartphone, CheckCircle } from 'lucide-react';

export default function OfflinePage() {
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
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Offline Mode</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Listen to your downloaded songs without an internet connection
          </p>
        </div>
      </div>

      {/* Storage and Offline Mode Switch Banner */}
      <div className="p-5 rounded-3xl bg-surface border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <HardDrive size={22} />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {offlineTracks.length} Tracks Downloaded
              </div>
              <div className="text-xs text-slate-400">
                ~{estimatedStorageMb} MB cached in CacheStorage / IndexedDB
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs text-slate-400">Force Offline Playback</span>
            <button
              onClick={() => setOfflineMode(!isOfflineMode)}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                isOfflineMode ? 'bg-emerald-500' : 'bg-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  isOfflineMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* PWA Tip */}
        <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-slate-400">
          <Smartphone size={15} className="text-primary-400 shrink-0" />
          <span>
            Tip: Install Pulse Music to your Home Screen to enable continuous offline background playback.
          </span>
        </div>
      </div>

      {/* Downloaded Songs List */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-400" />
          <span>Downloaded Songs ({offlineTracks.length})</span>
        </h3>

        {offlineTracks.length === 0 ? (
          <div className="py-16 text-center text-slate-500 rounded-3xl bg-surface border border-white/5 p-6">
            <Download size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm font-semibold text-slate-300">No tracks downloaded yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tap the download icon in the full-screen player or track menus to make tracks available offline.
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
                      ? 'bg-primary-600/20 border border-primary-500/40'
                      : 'bg-surface hover:bg-surface-hover border border-white/5'
                  }`}
                >
                  <div
                    onClick={() => playTrack(track, offlineTracks)}
                    className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md">
                      <Image
                        src={track.coverUrl}
                        alt={track.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{track.title}</h4>
                      <p className="text-xs text-slate-400 truncate">
                        {track.artist} • <span className="text-emerald-400 font-mono text-[11px]">Saved Offline</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playTrack(track, offlineTracks)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isCurrent && isPlaying
                          ? 'bg-primary-500 text-white'
                          : 'bg-white/5 group-hover:bg-primary-600 text-white'
                      }`}
                    >
                      <Play size={14} fill="currentColor" className="ml-0.5" />
                    </button>

                    <button
                      onClick={() => removeOfflineTrack(track.id)}
                      title="Remove from offline"
                      className="p-2 text-slate-400 hover:text-pink-400 transition-colors"
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
