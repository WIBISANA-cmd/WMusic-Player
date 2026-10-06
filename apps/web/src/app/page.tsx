'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SafeArtwork } from '@/components/ui/SafeArtwork';
import Link from 'next/link';
import {
  Play,
  Sparkles,
  Flame,
  Headphones,
  Heart,
  Radio,
  Shuffle,
  Music2,
  TrendingUp,
  Compass
} from 'lucide-react';
import { Track, Playlist, GenreCategory } from '@music/shared';
import { fetchTracks, fetchPlaylists, fetchGenres, searchMusic } from '@/services/api-client';
import { usePlayerStore } from '@/stores/player-store';
import { PlayerArtwork } from '@/components/player/PlayerArtwork';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { useDebounce } from '@/hooks/useDebounce';

interface ConceptCluster {
  name: string;
  themeTitle: string;
  description: string;
  badge: string;
  tags: string[];
}

function getConceptForTrack(track?: Track | null): ConceptCluster {
  if (!track) {
    return {
      name: 'Retro Synth & Cyber Beats',
      themeTitle: 'Nuansa Neon 80s & Cybernetic Pulse',
      description: 'Synthesizer analog, arpeggiator ritmis, dan visual neon retro yang memacu konsentrasi serta energi kreatif.',
      badge: 'Cyber Synthwave',
      tags: ['Synthwave', 'Cyberpunk', 'Chiptune', 'Electronic']
    };
  }

  const genre = (track.genre || '').toLowerCase();
  const title = (track.title || '').toLowerCase();

  if (
    genre.includes('synth') ||
    genre.includes('cyber') ||
    genre.includes('retro') ||
    genre.includes('chip') ||
    title.includes('neon') ||
    title.includes('cyber') ||
    title.includes('arcade')
  ) {
    return {
      name: 'Retro Synth & Cyber Beats',
      themeTitle: 'Nuansa Neon 80s & Cybernetic Pulse',
      description: 'Synthesizer analog, arpeggiator ritmis, dan visual neon retro yang memacu konsentrasi serta energi kreatif.',
      badge: 'Cyber Synthwave',
      tags: ['Synthwave', 'Cyberpunk', 'Chiptune', 'Electronic']
    };
  }

  if (
    genre.includes('lo-fi') ||
    genre.includes('chill') ||
    genre.includes('coffee') ||
    title.includes('rain') ||
    title.includes('coffee') ||
    title.includes('midnight')
  ) {
    return {
      name: 'Late Night Chillout & Coffee Vibes',
      themeTitle: 'Kehangatan Vinil & Ketenangan Larut Malam',
      description: 'Ketukan santai bertempo rendah dengan tekstur vinil hangat, sempurna untuk fokus kerja atau relaksasi mendalam.',
      badge: 'Lo-Fi Chillout',
      tags: ['Lo-Fi Chill', 'Downtempo', 'Ambient', 'Study Beats']
    };
  }

  if (
    genre.includes('ambient') ||
    genre.includes('celestial') ||
    genre.includes('space') ||
    title.includes('echo') ||
    title.includes('astral') ||
    title.includes('void')
  ) {
    return {
      name: 'Deep Ambient & Cosmic Soundscapes',
      themeTitle: 'Eksplorasi Audio Luar Angkasa & Meditasi',
      description: 'Lanskap audio megah tanpa batas dengan harmoni frekuensi luas yang menenangkan jiwa dan memicu imajinasi.',
      badge: 'Space Odyssey',
      tags: ['Ambient', 'Cosmic', 'Atmospheric', 'Meditation']
    };
  }

  if (
    genre.includes('dance') ||
    genre.includes('indie') ||
    genre.includes('groove') ||
    genre.includes('house') ||
    genre.includes('pop')
  ) {
    return {
      name: 'Indie Dance & Solar Grooves',
      themeTitle: 'Harmoni Bersemangat & Ritme Dinamis',
      description: 'Alunan bassline hidup yang mengalir lincah, menghadirkan energi positif pengisi hari di setiap ketukan.',
      badge: 'Solar Grooves',
      tags: ['Indie Dance', 'Nu-Disco', 'Groove', 'Uptempo']
    };
  }

  return {
    name: `${track.genre || 'Curated'} Soundflow`,
    themeTitle: 'Harmoni & Frekuensi Senada',
    description: 'Koleksi audio pilihan dengan karakter estetika dan resonansi melodi yang selaras dengan lagu pilihan Anda.',
    badge: 'Curated Mix',
    tags: [track.genre || 'Music', 'Curated', 'Harmonic Flow']
  };
}

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

  // Player Store
  const {
    playTrack,
    currentTrack,
    isPlaying,
    likedTrackIds,
    toggleLike,
    playCounts
  } = usePlayerStore();

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
    if (hour < 12) return 'Selamat pagi';
    if (hour < 18) return 'Selamat siang';
    return 'Selamat malam';
  };

  const isSearching = searchQuery.trim().length > 0;

  // 1. Frequently Played Tracks Computation
  const frequentlyPlayed = useMemo(() => {
    if (tracks.length === 0) return [];
    return [...tracks]
      .sort((a, b) => {
        const countA = playCounts?.[a.id] || 0;
        const countB = playCounts?.[b.id] || 0;
        return countB - countA;
      })
      .slice(0, 6);
  }, [tracks, playCounts]);

  // 2. Anchor Track & Similar Genres/Concepts Computation
  const anchorTrack = currentTrack || frequentlyPlayed[0] || tracks[0];
  const concept = useMemo(() => getConceptForTrack(anchorTrack), [anchorTrack]);

  const similarTracks = useMemo(() => {
    if (!anchorTrack || tracks.length <= 1) return [];

    return tracks
      .filter((t) => t.id !== anchorTrack.id)
      .map((t) => {
        const tGenre = (t.genre || '').toLowerCase();
        const aGenre = (anchorTrack.genre || '').toLowerCase();

        let score = 82;
        if (tGenre && aGenre && tGenre === aGenre) {
          score = 98;
        } else if (concept.tags.some((tag) => tGenre.includes(tag.toLowerCase()))) {
          score = 92;
        } else if (Math.abs((t.bpm || 110) - (anchorTrack.bpm || 110)) <= 15) {
          score = 86;
        }

        return {
          track: t,
          matchScore: score
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 4);
  }, [tracks, anchorTrack, concept]);

  const playSimilarConceptMix = () => {
    if (similarTracks.length === 0) return;
    const queueTracks = [anchorTrack, ...similarTracks.map((s) => s.track)];
    playTrack(anchorTrack, queueTracks);
  };

  const featuredTrack = tracks[0];

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = Math.floor(sec % 60);
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-7 max-w-4xl mx-auto w-full">
      {/* ================= 1. SEARCH SECTION ================= */}
      <section className="sticky top-16 z-10 pt-1 pb-2">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Cari lagu, musisi, atau genre musik..."
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
                Streaming audio lossless, pencarian YouTube, dan rekomendasi cerdas.
              </p>
            </div>
          </div>

          {/* Spotlight Hero Banner */}
          {featuredTrack && (
            <div className="relative rounded-3xl overflow-hidden glass-card bg-white/70 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 shadow-glass p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-3 z-10 max-w-md text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-text-primary text-xs font-semibold shadow-sm">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Spotlight Audio</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-text-primary leading-tight">
                  {featuredTrack.title}
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Oleh <span className="font-semibold text-text-primary">{featuredTrack.artist}</span> •{' '}
                  {featuredTrack.genre || 'Soundtrack'} • {formatSeconds(featuredTrack.duration)}
                </p>
                <div className="pt-2 flex items-center justify-center sm:justify-start gap-3">
                  <button
                    onClick={() => playTrack(featuredTrack, tracks)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full liquid-button text-text-primary font-bold text-sm shadow-liquid active:scale-95 transition-all min-h-[44px]"
                  >
                    <Play size={16} fill="currentColor" />
                    <span>
                      {currentTrack?.id === featuredTrack.id && isPlaying ? 'Sedang Diputar' : 'Putar Sekarang'}
                    </span>
                  </button>
                  <button
                    onClick={() => toggleLike(featuredTrack)}
                    aria-label={likedTrackIds.includes(featuredTrack.id) ? 'Batal sukai trek' : 'Sukai trek'}
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

          {/* ================= 3. SERING DIPUTAR (FREQUENTLY PLAYED) ================= */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Flame size={18} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary leading-tight">
                    Sering Diputar
                  </h3>
                  <span className="text-[11px] text-text-secondary">
                    Trek favorit dengan frekuensi pemutaran tertinggi Anda
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full glass-pill text-text-secondary hidden sm:inline-block">
                Statistik Personal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 rounded-2xl glass-card bg-white/40 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 animate-pulse"
                    />
                  ))
                : frequentlyPlayed.map((track, idx) => {
                    const isCurrent = currentTrack?.id === track.id;
                    const count = playCounts?.[track.id] || 0;

                    return (
                      <div
                        key={track.id}
                        onClick={() => playTrack(track, frequentlyPlayed)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Putar ${track.title} oleh ${track.artist}, diputar ${count} kali`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            playTrack(track, frequentlyPlayed);
                          }
                        }}
                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer group transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                          isCurrent
                            ? 'glass-card bg-white/85 dark:bg-slate-800/90 border border-slate-300 dark:border-white/20 shadow-md ring-1 ring-slate-400/20'
                            : 'glass-card bg-white/55 dark:bg-slate-900/60 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-white/60 dark:border-white/10 shadow-glass-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="relative">
                            <PlayerArtwork
                              track={track}
                              isPlaying={isCurrent && isPlaying}
                              size="sm"
                            />
                            {/* Ranking Badge */}
                            <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-850 dark:bg-slate-700 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                              #{idx + 1}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-text-primary truncate">
                              {track.title}
                            </h4>
                            <p className="text-[11px] text-text-secondary truncate mt-0.5">
                              {track.artist}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded-md border border-amber-200/60 dark:border-amber-800/40">
                                <Flame size={10} fill="currentColor" />
                                {count}x
                              </span>
                              <span className="text-[10px] text-text-secondary font-mono">
                                {formatSeconds(track.duration)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          aria-label={isCurrent && isPlaying ? 'Jeda' : 'Putar'}
                          className={`w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center shrink-0 transition-all shadow-sm ${
                            isCurrent && isPlaying
                              ? 'liquid-button text-slate-800 dark:text-white'
                              : 'bg-white/80 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <Play size={14} fill="currentColor" className="ml-0.5" />
                        </button>
                      </div>
                    );
                  })}
            </div>
          </section>

          {/* ================= 4. REKOMENDASI GENRE & KONSEP SERUPA ================= */}
          <section className="space-y-4 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <Sparkles size={17} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary leading-tight">
                    Rekomendasi Genre & Konsep Serupa
                  </h3>
                  <p className="text-[11px] text-text-secondary">
                    {anchorTrack ? (
                      <>
                        Harmoni selaras dengan trek: <span className="font-semibold text-text-primary">{anchorTrack.title}</span>
                      </>
                    ) : (
                      'Menganalisis harmoni alunan musik kesukaan Anda...'
                    )}
                  </p>
                </div>
              </div>

              {anchorTrack && similarTracks.length > 0 && (
                <button
                  onClick={playSimilarConceptMix}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold glass-pill text-text-primary hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm self-start sm:self-auto min-h-[34px]"
                >
                  <Shuffle size={13} className="text-sky-500" />
                  <span>Putar Mix Konsep</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-28 rounded-3xl glass-card bg-white/40 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="h-20 rounded-2xl glass-card bg-white/40 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 animate-pulse" />
                  <div className="h-20 rounded-2xl glass-card bg-white/40 dark:bg-slate-800/40 border border-white/40 dark:border-white/5 animate-pulse" />
                </div>
              </div>
            ) : (
              <>
                {/* Concept Ambient Highlight Card */}
                <div className="p-4 sm:p-5 rounded-3xl glass-card bg-white/70 dark:bg-slate-900/80 border border-white/60 dark:border-white/10 shadow-glass-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/40">
                        Konsep: {concept.name}
                      </span>
                      <span className="text-[11px] text-text-secondary">
                        {concept.themeTitle}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed max-w-xl">
                      {concept.description}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {concept.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-text-secondary font-medium"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center gap-2 shrink-0 self-end sm:self-center">
                    <span className="text-[11px] font-bold text-text-secondary">
                      {similarTracks.length + 1} Alunan Terhubung
                    </span>
                  </div>
                </div>

                {/* Similar Tracks Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {similarTracks.map(({ track, matchScore }) => {
                    const isCurrent = currentTrack?.id === track.id;

                    return (
                      <div
                        key={track.id}
                        onClick={() => playTrack(track, [anchorTrack, ...similarTracks.map((s) => s.track)])}
                        role="button"
                        tabIndex={0}
                        aria-label={`Putar lagu serupa ${track.title} oleh ${track.artist}, kecocokan ${matchScore}%`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            playTrack(track, [anchorTrack, ...similarTracks.map((s) => s.track)]);
                          }
                        }}
                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer group transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                          isCurrent
                            ? 'glass-card bg-white/85 dark:bg-slate-800/90 border border-sky-400 dark:border-sky-500 shadow-md ring-1 ring-sky-400/30'
                            : 'glass-card bg-white/55 dark:bg-slate-900/60 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-white/60 dark:border-white/10 shadow-glass-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <PlayerArtwork
                            track={track}
                            isPlaying={isCurrent && isPlaying}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-text-primary truncate">
                                {track.title}
                              </h4>
                            </div>
                            <p className="text-[11px] text-text-secondary truncate mt-0.5">
                              {track.artist}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                                ✨ {matchScore}% Serupa
                              </span>
                              <span className="text-[10px] text-text-secondary font-mono">
                                {track.genre || 'Electronic'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleLike(track)}
                            aria-label={likedTrackIds.includes(track.id) ? 'Unlike' : 'Like'}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                          >
                            <Heart
                              size={16}
                              fill={likedTrackIds.includes(track.id) ? '#e11d48' : 'none'}
                              className={likedTrackIds.includes(track.id) ? 'text-rose-600' : ''}
                            />
                          </button>
                          <button
                            onClick={() => playTrack(track, [anchorTrack, ...similarTracks.map((s) => s.track)])}
                            aria-label={isCurrent && isPlaying ? 'Jeda' : 'Putar'}
                            className={`w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center shrink-0 transition-all shadow-sm ${
                              isCurrent && isPlaying
                                ? 'liquid-button text-slate-800 dark:text-white'
                                : 'bg-white/80 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <Play size={14} fill="currentColor" className="ml-0.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          {/* ================= 5. CURATED PLAYLISTS ================= */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Headphones className="text-slate-600 dark:text-slate-400" size={18} />
                <h3 className="text-base font-bold text-text-primary">Daftar Putar Kurasi</h3>
              </div>
              <Link
                href="/library"
                className="text-xs text-text-secondary font-semibold hover:text-text-primary transition-colors"
              >
                Lihat Semua
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {playlists.map((playlist) => (
                <Link
                  key={playlist.id}
                  href={`/playlist/${playlist.id}`}
                  className="group p-4 rounded-3xl glass-card bg-white/50 dark:bg-slate-900/60 hover:bg-white/70 dark:hover:bg-slate-800/80 border border-white/50 dark:border-white/10 shadow-glass-sm transition-all block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden mb-3 shadow-sm bg-slate-200 dark:bg-slate-800">
                    <SafeArtwork
                      src={playlist.coverUrl}
                      alt={playlist.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      fallbackIconSize={28}
                    />
                  </div>
                  <h4 className="font-bold text-sm text-text-primary group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate">
                    {playlist.title}
                  </h4>
                  <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                    {playlist.description}
                  </p>
                  <div className="text-[11px] text-text-secondary font-mono mt-2">
                    {playlist.trackCount} lagu
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ================= 6. JELAJAHI GENRE ================= */}
          <section className="space-y-3.5 pb-8">
            <h3 className="text-base font-bold text-text-primary px-1">Jelajahi Genre</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setSearchQuery(genre.name.split('&')[0].trim())}
                  className="relative overflow-hidden h-20 rounded-2xl glass-card bg-white/60 dark:bg-slate-900/60 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-white/50 dark:border-white/10 p-3.5 flex flex-col justify-between group shadow-glass-sm hover:scale-[1.02] active:scale-95 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="text-xs font-bold text-text-primary leading-tight">
                    {genre.name}
                  </span>
                  <span className="text-[10px] text-text-secondary font-mono">
                    {genre.trackCount} lagu
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
