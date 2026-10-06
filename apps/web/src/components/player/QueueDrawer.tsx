'use client';

import { usePlayerStore } from '@/stores/player-store';
import { X, Trash2, ArrowUp, ArrowDown, Music } from 'lucide-react';
import { PlayerArtwork } from './PlayerArtwork';

export function QueueDrawer() {
  const {
    queue,
    queueIndex,
    currentTrack,
    isQueueOpen,
    setQueueOpen,
    playTrack,
    removeFromQueue,
    reorderQueue
  } = usePlayerStore();

  if (!isQueueOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-md animate-fadeIn select-none"
      onClick={() => setQueueOpen(false)}
    >
      <div
        className="w-full max-w-md h-full glass-panel bg-white/92 border-l border-white/80 flex flex-col shadow-glass-lg text-text-primary"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Up next playback queue"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <Music size={18} className="text-slate-700" />
            <h3 className="text-base font-bold text-text-primary">Up Next Queue</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full glass-pill text-text-secondary font-mono">
              {queue.length}
            </span>
          </div>
          <button
            onClick={() => setQueueOpen(false)}
            aria-label="Close queue"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-slate-200/50 transition-colors focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={20} />
          </button>
        </div>

        {/* Currently Playing Card */}
        {currentTrack && (
          <div className="p-4 bg-slate-100/70 border-b border-slate-200/60">
            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
              Now Playing
            </div>
            <div className="flex items-center gap-3">
              <PlayerArtwork track={currentTrack} isPlaying={true} size="sm" />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-text-primary truncate">{currentTrack.title}</h4>
                <p className="text-xs text-text-secondary truncate mt-0.5">{currentTrack.artist}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1 h-3 rounded-full bg-slate-600 animate-pulse" />
                <span className="w-1 h-5 rounded-full bg-slate-600 animate-pulse delay-75" />
                <span className="w-1 h-2 rounded-full bg-slate-600 animate-pulse delay-150" />
              </div>
            </div>
          </div>
        )}

        {/* Up Next List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {queue.length === 0 ? (
            <div className="text-center py-16 text-text-secondary text-sm">The queue is empty.</div>
          ) : (
            queue.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id && idx === queueIndex;

              return (
                <div
                  key={`${track.id}-${idx}`}
                  className={`flex items-center justify-between p-2.5 rounded-2xl group transition-all ${
                    isCurrent
                      ? 'glass-card bg-white/90 border border-slate-300 shadow-sm'
                      : 'glass-card bg-white/40 hover:bg-white/70 border border-white/50'
                  }`}
                >
                  <div
                    onClick={() => playTrack(track)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Play ${track.title} from queue`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') playTrack(track);
                    }}
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
                  >
                    <span className="text-xs font-mono text-text-secondary w-5 text-center">
                      {idx + 1}
                    </span>
                    <PlayerArtwork track={track} isPlaying={false} size="sm" className="w-10 h-10" />
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-text-primary truncate">{track.title}</h5>
                      <p className="text-[11px] text-text-secondary truncate">{track.artist}</p>
                    </div>
                  </div>

                  {/* Actions: Move Up, Move Down, Delete */}
                  <div className="flex items-center gap-1">
                    {idx > 0 && (
                      <button
                        onClick={() => reorderQueue(idx, idx - 1)}
                        aria-label="Move track up"
                        className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/60 transition-colors"
                      >
                        <ArrowUp size={15} />
                      </button>
                    )}
                    {idx < queue.length - 1 && (
                      <button
                        onClick={() => reorderQueue(idx, idx + 1)}
                        aria-label="Move track down"
                        className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/60 transition-colors"
                      >
                        <ArrowDown size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => removeFromQueue(idx)}
                      aria-label="Remove from queue"
                      className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-text-secondary hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
