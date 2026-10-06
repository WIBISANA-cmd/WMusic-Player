'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Play, Music, Disc, Radio } from 'lucide-react';
import { Track, Playlist, GenreCategory } from '@music/shared';
import { searchMusic, fetchTracks } from '@/services/apiClient';
import { usePlayerStore } from '@/store/usePlayerStore';

export const dynamic = 'force-dynamic';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialGenre = searchParams.get('genre') || '';

  const [query, setQuery] = useState(initialQuery || initialGenre);
  const [activeTab, setActiveTab] = useState<'all' | 'tracks' | 'playlists'>('all');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [genres, setGenres] = useState<GenreCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  const { playTrack, currentTrack, isPlaying } = usePlayerStore();

  useEffect(() => {
    if (!query.trim()) {
      fetchTracks({ limit: 10 }).then(setTracks);
      return;
    }

    setLoading(true);
    const handler = setTimeout(() => {
      startTransition(async () => {
        const results = await searchMusic(query);
        setTracks(results.tracks);
        setPlaylists(results.playlists);
        setGenres(results.genres);
        setLoading(false);
      });
    }, 250);

    return () => clearTimeout(handler);
  }, [query]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Search Header Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to listen to?"
          autoFocus
          className="w-full pl-12 pr-12 py-3.5 bg-surface rounded-2xl text-base text-white placeholder-slate-500 border border-white/10 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-lg"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['all', 'tracks', 'playlists'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                : 'bg-surface text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Searching library...</p>
        </div>
      ) : (
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
                  const isCurrent = currentTrack?.id === track.id;

                  return (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track, tracks)}
                      className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer group transition-all ${
                        isCurrent
                          ? 'bg-primary-600/20 border border-primary-500/30'
                          : 'bg-surface hover:bg-surface-hover border border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
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
                          <h4 className="text-sm font-semibold text-white truncate">
                            {track.title}
                          </h4>
                          <p className="text-xs text-slate-400 truncate">
                            {track.artist} • {track.genre}
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

          {/* Empty Search Fallback */}
          {query.trim() && tracks.length === 0 && playlists.length === 0 && (
            <div className="py-20 text-center text-slate-400">
              <Radio size={36} className="mx-auto mb-3 text-slate-600" />
              <p className="text-base font-semibold text-white">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for artists, songs, or genres.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-slate-400 text-xs">Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
