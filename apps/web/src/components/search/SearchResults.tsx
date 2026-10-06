'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Music, Disc, Radio } from 'lucide-react';
import { Track, Playlist } from '@music/shared';

export interface SearchResultsProps {
  tracks: Track[];
  playlists: Playlist[];
  activeTab: 'all' | 'tracks' | 'playlists';
  currentTrackId?: string;
  isPlaying?: boolean;
  onPlayTrack: (track: Track, queue: Track[]) => void;
  query: string;
}

export function SearchResults({
  tracks,
  playlists,
  activeTab,
  currentTrackId,
  isPlaying,
  onPlayTrack,
  query
}: SearchResultsProps) {
  if (query.trim() && tracks.length === 0 && playlists.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400">
        <Radio size={36} className="mx-auto mb-3 text-slate-600" />
        <p className="text-base font-semibold text-white">No results found for &ldquo;{query}&rdquo;</p>
        <p className="text-xs text-slate-500 mt-1">Try searching for artists, songs, or genres.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tracks Section */}
      {(activeTab === 'all' || activeTab === 'tracks') && tracks.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Music size={16} className="text-primary-400" />
            <span>Songs</span>
          </h3>
          <div className="space-y-2">
            {tracks.map((track) => {
              const isCurrent = currentTrackId === track.id;
              const artworkUrl = track.artwork?.[0]?.url || '/icon.svg';

              return (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track, tracks)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer group transition-all ${
                    isCurrent
                      ? 'bg-primary-600/20 border border-primary-500/30'
                      : 'bg-surface hover:bg-surface-hover border border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md">
                      <Image
                        src={artworkUrl}
                        alt={track.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{track.title}</h4>
                      <p className="text-xs text-slate-400 truncate">
                        {track.artist} {track.genre ? `• ${track.genre}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                      {Math.floor(track.duration / 60)}:
                      {(track.duration % 60).toString().padStart(2, '0')}
                    </span>
                    <button
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isCurrent && isPlaying
                          ? 'bg-primary-500 text-white'
                          : 'bg-white/5 group-hover:bg-primary-600 text-white'
                      }`}
                    >
                      <Play size={14} fill="currentColor" className="ml-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Playlists Section */}
      {(activeTab === 'all' || activeTab === 'playlists') && playlists.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Disc size={16} className="text-cyan-400" />
            <span>Playlists</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlist/${playlist.id}`}
                className="flex items-center gap-3 p-3 rounded-2xl bg-surface hover:bg-surface-hover border border-white/5 transition-colors"
              >
                <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src={playlist.coverUrl}
                    alt={playlist.title}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{playlist.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{playlist.trackCount} tracks</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

