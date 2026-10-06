'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Sparkles, Flame, Headphones, Heart } from 'lucide-react';
import { Track, Playlist, GenreCategory } from '@music/shared';
import { fetchTracks, fetchPlaylists, fetchGenres } from '@/services/api-client';
import { usePlayerStore } from '@/stores/player-store';
import { PlayerArtwork } from '@/components/player/PlayerArtwork';

export default function HomePage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [genres, setGenres] = useState<GenreCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const { playTrack, currentTrack, isPlaying, likedTrackIds, toggleLike } = usePlayerStore();

  useEffect(() => {
    async function loadData() {
      try {
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
    }
    loadData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const featuredTrack = tracks[0];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Hand-picked lossless tracks & curated listening sessions.
          </p>
        </div>
      </div>

      {/* Featured Hero Banner */}
      {featuredTrack && (
        <div className="relative rounded-3xl overflow-hidden glass-panel bg-gradient-to-r from-primary-950/80 via-slate-900/90 to-surface border border-primary-500/20 shadow-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-3 z-10 max-w-md text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold border border-primary-500/30">
              <Sparkles size={14} />
              <span>Spotlight Track</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {featuredTrack.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              By <span className="font-semibold text-white">{featuredTrack.artist}</span> •{' '}
              {featuredTrack.genre || 'Music'} • {Math.floor(featuredTrack.duration / 60)}:
              {(featuredTrack.duration % 60).toString().padStart(2, '0')}
            </p>
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-3">
              <button
                onClick={() => playTrack(featuredTrack, tracks)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm shadow-lg shadow-primary-600/30 active:scale-95 transition-all cursor-pointer"
              >
                <Play size={18} fill="currentColor" />
                <span>
                  {currentTrack?.id === featuredTrack.id && isPlaying ? 'Playing Now' : 'Listen Now'}
                </span>
              </button>
              <button
                onClick={() => toggleLike(featuredTrack)}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <Heart
                  size={20}
                  fill={likedTrackIds.includes(featuredTrack.id) ? '#ec4899' : 'none'}
                  className={likedTrackIds.includes(featuredTrack.id) ? 'text-pink-500' : ''}
                />
              </button>
            </div>
          </div>

          <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl shrink-0 group">
            <PlayerArtwork
              track={featuredTrack}
              isPlaying={isPlaying && currentTrack?.id === featuredTrack.id}
              size="lg"
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Quick Picks 2-Column / 3-Column Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="text-pink-500" size={20} />
            <h3 className="text-lg font-bold text-white">Quick Picks</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-surface animate-pulse" />
              ))
            : tracks.slice(0, 6).map((track) => {
                const isCurrent = currentTrack?.id === track.id;

                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, tracks)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer group transition-all ${
                      isCurrent
                        ? 'bg-primary-600/20 border border-primary-500/40'
                        : 'bg-surface hover:bg-surface-hover border border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PlayerArtwork track={track} isPlaying={isCurrent && isPlaying} size="sm" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{track.title}</h4>
                        <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                      </div>
                    </div>

                    <button
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isCurrent && isPlaying
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'bg-white/5 group-hover:bg-primary-600 text-white'
                      }`}
                    >
                      <Play size={14} fill="currentColor" className="ml-0.5" />
                    </button>
                  </div>
                );
              })}
        </div>
      </section>

      {/* Featured Curated Playlists */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="text-cyan-400" size={20} />
            <h3 className="text-lg font-bold text-white">Curated Playlists</h3>
          </div>
          <Link href="/library" className="text-xs text-primary-400 font-semibold hover:underline">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlist/${playlist.id}`}
              className="group p-4 rounded-3xl bg-surface hover:bg-surface-hover border border-white/5 transition-all block"
            >
              <div className="relative aspect-video rounded-2xl overflow-hidden mb-3 shadow-lg">
                <Image
                  src={playlist.coverUrl}
                  alt={playlist.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <h4 className="font-bold text-sm text-white group-hover:text-primary-300 transition-colors truncate">
                {playlist.title}
              </h4>
              <p className="text-xs text-slate-400 line-clamp-2 mt-1">{playlist.description}</p>
              <div className="text-[11px] text-slate-500 font-mono mt-2">
                {playlist.trackCount} tracks
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Explore Genres & Themes */}
      <section className="space-y-4 pb-8">
        <h3 className="text-lg font-bold text-white">Explore Genres</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {genres.map((genre) => (
            <Link
              key={genre.id}
              href={`/search?genre=${genre.id}`}
              className={`relative overflow-hidden h-24 rounded-2xl bg-gradient-to-tr ${genre.gradient} p-3.5 flex flex-col justify-between group shadow-md hover:scale-[1.02] active:scale-95 transition-all`}
            >
              <span className="text-xs font-black text-white leading-tight drop-shadow-md">
                {genre.name}
              </span>
              <span className="text-[10px] text-white/80 font-mono">{genre.trackCount} tracks</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
