'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Pause, MoreVertical, Plus, RotateCcw, Search, AlertCircle, Disc } from 'lucide-react';
import { Track, Playlist } from '@music/shared';
import { usePlayerStore } from '@/stores/player-store';
import { TrackActionModal } from '@/components/player/TrackActionModal';
import { formatTime } from '@/lib/utils';

export interface SearchResultsProps {
  tracks: Track[];
  playlists?: Playlist[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  query: string;
  onSelectSuggestion?: (tag: string) => void;
}

export function SearchResults({
  tracks,
  playlists = [],
  loading = false,
  error = null,
  onRetry,
  query,
  onSelectSuggestion
}: SearchResultsProps) {
  const { currentTrack, isPlaying, playTrack, addToQueue } = usePlayerStore();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isActionModalOpen, setActionModalOpen] = useState(false);

  const openActionModal = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    setSelectedTrack(track);
    setActionModalOpen(true);
  };

  const handleAddQueue = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    addToQueue(track);
  };

  // ================= 1. NETWORK ERROR STATE =================
  if (error) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl glass-card mx-auto flex items-center justify-center text-amber-600 shadow-sm">
          <AlertCircle size={28} />
        </div>
        <div>
          <h4 className="text-base font-bold text-text-primary">Unable to load search results</h4>
          <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto">
            {error || 'A network error occurred. Please check your connection and try again.'}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full liquid-button text-sm font-semibold text-text-primary shadow-sm active:scale-95 transition-all"
          >
            <RotateCcw size={15} />
            <span>Try Again</span>
          </button>
        )}
      </div>
    );
  }

  // ================= 2. LOADING SKELETON STATE =================
  if (loading) {
    return (
      <div className="space-y-3 pt-2" aria-label="Loading search results" role="status">
        <div className="h-4 w-28 bg-slate-200/80 rounded-full animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-2xl glass-card bg-white/40 border border-white/40 animate-pulse"
            >
              <div className="flex items-center gap-3.5 flex-1">
                <div className="w-12 h-12 rounded-xl bg-slate-200/80 shrink-0" />
                <div className="space-y-2 flex-1 max-w-xs">
                  <div className="h-3.5 bg-slate-200/80 rounded-full w-3/4" />
                  <div className="h-2.5 bg-slate-200/60 rounded-full w-1/2" />
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200/60 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ================= 3. EMPTY STATE (No query entered yet) =================
  if (!query.trim()) {
    const popularTags = ['Ambient', 'Lo-Fi', 'Electronic', 'Acoustic', 'Synthwave', 'Deep Focus'];

    return (
      <div className="py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl glass-card mx-auto flex items-center justify-center text-accent-dark shadow-sm">
            <Search size={22} />
          </div>
          <h4 className="text-sm font-bold text-text-primary">Discover Soundscapes</h4>
          <p className="text-xs text-text-secondary max-w-xs mx-auto">
            Search for your favorite tracks, artists, moods, or musical genres.
          </p>
        </div>

        {/* Suggested keywords / Quick tags */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary px-1">
            Popular Searches
          </div>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <button
                key={tag}
                onClick={() => onSelectSuggestion?.(tag)}
                className="px-3.5 py-1.5 rounded-full glass-pill text-xs font-medium text-text-primary hover:bg-white shadow-sm active:scale-95 transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ================= 4. NO-RESULT STATE =================
  if (tracks.length === 0 && playlists.length === 0) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl glass-card mx-auto flex items-center justify-center text-text-secondary shadow-sm">
          <Search size={24} />
        </div>
        <h4 className="text-base font-bold text-text-primary">No results found for &ldquo;{query}&rdquo;</h4>
        <p className="text-xs text-text-secondary max-w-xs mx-auto">
          We couldn&apos;t find any tracks matching your search. Try checking your spelling or search for another artist.
        </p>
      </div>
    );
  }

  // ================= 5. POPULATED RESULTS =================
  return (
    <div className="space-y-6">
      {/* Tracks Section */}
      {tracks.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Tracks ({tracks.length})
            </h3>
          </div>

          <div className="space-y-2">
            {tracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const artworkUrl = track.artwork?.[0]?.url || '/icon.svg';

              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, tracks)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Play ${track.title} by ${track.artist}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      playTrack(track, tracks);
                    }
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer group transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isCurrent
                      ? 'glass-card bg-white/80 border border-slate-300 shadow-sm'
                      : 'glass-card bg-white/50 hover:bg-white/70 border border-white/50 shadow-glass-sm'
                  }`}
                >
                  {/* Left: Artwork + Title + Artist */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm bg-slate-200">
                      <Image
                        src={artworkUrl}
                        alt={track.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0 flex-1 pr-2">
                      <h4
                        className={`text-sm font-bold truncate ${
                          isCurrent ? 'text-slate-900' : 'text-text-primary'
                        }`}
                      >
                        {track.title}
                      </h4>
                      <p className="text-xs text-text-secondary truncate mt-0.5">
                        {track.artist} {track.genre ? `• ${track.genre}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right: Duration + Add Queue + More Menu + Play/Pause Button */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-mono text-text-secondary hidden sm:inline mr-1">
                      {formatTime(track.duration)}
                    </span>

                    {/* Direct Add to Queue Button */}
                    <button
                      onClick={(e) => handleAddQueue(e, track)}
                      aria-label="Add to queue"
                      title="Add to queue"
                      className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/70 active:scale-90 transition-all focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <Plus size={18} />
                    </button>

                    {/* More Menu Action Sheet Trigger */}
                    <button
                      onClick={(e) => openActionModal(e, track)}
                      aria-label="More options for track"
                      title="More options"
                      className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/70 active:scale-90 transition-all focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {/* Play/Pause Button */}
                    <button
                      aria-label={isCurrent && isPlaying ? 'Pause' : 'Play'}
                      className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center transition-all shadow-sm ${
                        isCurrent && isPlaying
                          ? 'liquid-button text-slate-800'
                          : 'bg-white/80 group-hover:bg-white text-slate-700'
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause size={16} fill="currentColor" />
                      ) : (
                        <Play size={16} fill="currentColor" className="ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Playlists Section */}
      {playlists.length > 0 && (
        <section className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Disc size={14} />
              <span>Playlists ({playlists.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlist/${playlist.id}`}
                className="flex items-center gap-3 p-3 rounded-2xl glass-card bg-white/50 hover:bg-white/80 border border-white/50 shadow-glass-sm transition-all"
              >
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-200">
                  <Image
                    src={playlist.coverUrl}
                    alt={playlist.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-text-primary truncate">{playlist.title}</h4>
                  <p className="text-xs text-text-secondary mt-0.5">{playlist.trackCount} tracks</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Track Action Modal */}
      <TrackActionModal
        track={selectedTrack}
        isOpen={isActionModalOpen}
        onClose={() => setActionModalOpen(false)}
        allTracks={tracks}
      />
    </div>
  );
}
