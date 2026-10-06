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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md h-full bg-[#111726] border-l border-white/10 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Music size={18} className="text-primary-400" />
            <h3 className="text-base font-bold text-white">Up Next Queue</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400 font-mono">
              {queue.length}
            </span>
          </div>
          <button
            onClick={() => setQueueOpen(false)}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X size={20} />
          </button>
        </div>

        {/* Currently Playing Card */}
        {currentTrack && (
          <div className="p-4 bg-primary-600/10 border-b border-primary-500/20">
            <div className="text-[11px] font-semibold text-primary-400 uppercase tracking-wider mb-2">
              Now Playing
            </div>
            <div className="flex items-center gap-3">
              <PlayerArtwork track={currentTrack} isPlaying={true} size="sm" />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">{currentTrack.title}</h4>
                <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
              </div>
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-3 rounded-full bg-primary-400 animate-pulse" />
                <span className="w-1 h-5 rounded-full bg-primary-400 animate-pulse delay-75" />
                <span className="w-1 h-2 rounded-full bg-primary-400 animate-pulse delay-150" />
              </div>
            </div>
          </div>
        )}

        {/* Up Next List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {queue.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">The queue is empty.</div>
          ) : (
            queue.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id && idx === queueIndex;

              return (
                <div
                  key={`${track.id}-${idx}`}
                  className={`flex items-center justify-between p-2.5 rounded-2xl group transition-colors ${
                    isCurrent ? 'bg-white/10 border border-primary-500/30' : 'hover:bg-white/5'
                  }`}
                >
                  <div
                    onClick={() => playTrack(track)}
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  >
                    <span className="text-xs font-mono text-slate-500 w-4 text-center">
                      {idx + 1}
                    </span>
                    <PlayerArtwork track={track} isPlaying={false} size="sm" className="w-10 h-10" />
                    <div className="min-w-0">
                      <h5 className="text-xs font-semibold text-white truncate">{track.title}</h5>
                      <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                    </div>
                  </div>

                  {/* Actions: Move Up, Move Down, Delete */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    {idx > 0 && (
                      <button
                        onClick={() => reorderQueue(idx, idx - 1)}
                        title="Move Up"
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <ArrowUp size={14} />
                      </button>
                    )}
                    {idx < queue.length - 1 && (
                      <button
                        onClick={() => reorderQueue(idx, idx + 1)}
                        title="Move Down"
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <ArrowDown size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => removeFromQueue(idx)}
                      title="Remove from queue"
                      className="p-1 text-slate-400 hover:text-pink-400"
                    >
                      <Trash2 size={14} />
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
