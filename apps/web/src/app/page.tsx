'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Sparkles, Flame, Headphones, Heart } from 'lucide-react';
import { Track, Playlist, GenreCategory } from '@music/shared';
import { fetchTracks, fetchPlaylists, fetchGenres, searchMusic } from '@/services/api-client';
import { usePlayerStore } from '@/stores/player-store';
import { PlayerArtwork } from '@/components/player/PlayerArtwork';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { useDebounce } from '@/hooks/useDebounce';

export default function HomePage() {
  // Discovery Content State
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [genres, setGenres] = useState<GenreCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<{
    tracks: Track[];
    playlists: Playlist[];
  }>({ tracks: [], playlists: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { playTrack, currentTrack, isPlaying, likedTrackIds, toggleLike } = usePlayerStore();

  // Load Initial Curated Catalog
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [tracksData, playlistsData, genresData] = await Promise.all([
        fetchTracks({ limit: 12 }),
        fetchPlaylists(),
        fetchGenres()
      ]);
      setTracks(tracksData);
      setPlaylists(playlistsData);
      setGenres(genresData);
    } catch (err) {
      console.error('Failed loading homepage content:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Execute Debounced Search
  const executeSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ tracks: [], playlists: [] });
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);
      const res = await searchMusic(query.trim());
      setSearchResults({
        tracks: res.tracks || [],
        playlists: res.playlists || []
      });
    } catch (err) {
      console.error('Search failed:', err);
      setSearchError('Could not reach media servers. Please check your network.');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    executeSearch(debouncedSearch);
  }, [debouncedSearch, executeSearch]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const featuredTrack = tracks[0];
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      {/* ================= 1. SEARCH SECTION ================= */}
      <section className="sticky top-16 z-10 pt-1 pb-2">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Search songs, artists, or genres..."
        />
      </section>

      {/* ================= 2. CONTENT / SEARCH RESULTS ================= */}
      {isSearching ? (
        <section aria-label="Search Results" className="space-y-4 pt-1">
          <SearchResults
            tracks={searchResults.tracks}
            playlists={searchResults.playlists}
            loading={searchLoading}
            error={searchError}
            query={searchQuery}
            onRetry={() => executeSearch(debouncedSearch)}
            onSelectSuggestion={(tag) => setSearchQuery(tag)}
          />
        </section>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          {/* Greeting Header */}
          <div className="flex items-center justify-between px-1">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                {getGreeting()}
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                Lossless audio streams & curated listening sessions.
              </p>
            </div>
          </div>

          {/* Featured Hero Banner */}
          {featuredTrack && (
            <div className="relative rounded-3xl overflow-hidden glass-card bg-white/70 border border-white/60 shadow-glass p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-3 z-10 max-w-md text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-text-primary text-xs font-semibold shadow-sm">
                  <Sparkles size={14} className="text-slate-600" />
                  <span>Spotlight Track</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-text-primary leading-tight">
                  {featuredTrack.title}
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary">
                  By <span className="font-semibold text-text-primary">{featuredTrack.artist}</span> •{' '}
                  {featuredTrack.genre || 'Soundtrack'} • {Math.floor(featuredTrack.duration / 60)}:
                  {(featuredTrack.duration % 60).toString().padStart(2, '0')}
                </p>
                <div className="pt-2 flex items-center justify-center sm:justify-start gap-3">
                  <button
                    onClick={() => playTrack(featuredTrack, tracks)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full liquid-button text-text-primary font-bold text-sm shadow-liquid active:scale-95 transition-all min-h-[44px]"
                  >
                    <Play size={16} fill="currentColor" />
                    <span>
                      {currentTrack?.id === featuredTrack.id && isPlaying ? 'Playing' : 'Listen Now'}
                    </span>
                  </button>
                  <button
                    onClick={() => toggleLike(featuredTrack)}
                    aria-label={likedTrackIds.includes(featuredTrack.id) ? 'Unlike track' : 'Like track'}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full glass-pill flex items-center justify-center text-text-secondary hover:text-text-primary active:scale-90 transition-transform shadow-sm"
                  >
                    <Heart
                      size={20}
                      fill={likedTrackIds.includes(featuredTrack.id) ? '#e11d48' : 'none'}
                      className={likedTrackIds.includes(featuredTrack.id) ? 'text-rose-600' : ''}
                    />
                  </button>
                </div>
              </div>

              <div className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-glass shrink-0">
                <PlayerArtwork
                  track={featuredTrack}
                  isPlaying={isPlaying && currentTrack?.id === featuredTrack.id}
                  size="lg"
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* Quick Picks Responsive List / Grid */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Flame className="text-slate-600" size={18} />
                <h3 className="text-base font-bold text-text-primary">Quick Picks</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 rounded-2xl glass-card bg-white/40 border border-white/40 animate-pulse"
                    />
                  ))
                : tracks.slice(0, 6).map((track) => {
                    const isCurrent = currentTrack?.id === track.id;

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
                        className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer group transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                          isCurrent
                            ? 'glass-card bg-white/80 border border-slate-300 shadow-sm'
                            : 'glass-card bg-white/50 hover:bg-white/70 border border-white/50 shadow-glass-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <PlayerArtwork
                            track={track}
                            isPlaying={isCurrent && isPlaying}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-text-primary truncate">
                              {track.title}
                            </h4>
                            <p className="text-[11px] text-text-secondary truncate mt-0.5">
                              {track.artist}
                            </p>
                          </div>
                        </div>

                        <button
                          aria-label={isCurrent && isPlaying ? 'Pause' : 'Play'}
                          className={`w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center shrink-0 transition-all shadow-sm ${
                            isCurrent && isPlaying
                              ? 'liquid-button text-slate-800'
                              : 'bg-white/80 group-hover:bg-white text-slate-700'
                          }`}
                        >
                          <Play size={14} fill="currentColor" className="ml-0.5" />
                        </button>
                      </div>
                    );
                  })}
            </div>
          </section>

          {/* Curated Playlists */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Headphones className="text-slate-600" size={18} />
                <h3 className="text-base font-bold text-text-primary">Curated Playlists</h3>
              </div>
              <Link
                href="/library"
                className="text-xs text-text-secondary font-semibold hover:text-text-primary transition-colors"
              >
                View All
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {playlists.map((playlist) => (
                <Link
                  key={playlist.id}
                  href={`/playlist/${playlist.id}`}
                  className="group p-4 rounded-3xl glass-card bg-white/50 hover:bg-white/70 border border-white/50 shadow-glass-sm transition-all block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden mb-3 shadow-sm bg-slate-200">
                    <Image
                      src={playlist.coverUrl}
                      alt={playlist.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <h4 className="font-bold text-sm text-text-primary group-hover:text-slate-900 transition-colors truncate">
                    {playlist.title}
                  </h4>
                  <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                    {playlist.description}
                  </p>
                  <div className="text-[11px] text-text-secondary font-mono mt-2">
                    {playlist.trackCount} tracks
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Explore Genres */}
          <section className="space-y-3.5 pb-6">
            <h3 className="text-base font-bold text-text-primary px-1">Explore Genres</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setSearchQuery(genre.name.split('&')[0].trim())}
                  className="relative overflow-hidden h-20 rounded-2xl glass-card bg-white/60 hover:bg-white/80 border border-white/50 p-3.5 flex flex-col justify-between group shadow-glass-sm hover:scale-[1.02] active:scale-95 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="text-xs font-bold text-text-primary leading-tight">
                    {genre.name}
                  </span>
                  <span className="text-[10px] text-text-secondary font-mono">
                    {genre.trackCount} tracks
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
