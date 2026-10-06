'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Shuffle, ChevronLeft, Heart, Plus } from 'lucide-react';
import { Playlist } from '@music/shared';
import { fetchPlaylistById } from '@/services/api-client';
import { usePlayerStore } from '@/stores/player-store';
import { PlayerArtwork } from '@/components/player/PlayerArtwork';
import { formatTime } from '@/lib/utils';

export default function PlaylistDetailPage() {
  const params = useParams();
  const playlistId = params.id as string;

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  const { playTrack, currentTrack, isPlaying, likedTrackIds, toggleLike, addToQueue } =
    usePlayerStore();

  useEffect(() => {
    if (playlistId) {
      fetchPlaylistById(playlistId).then((data) => {
        setPlaylist(data);
        setLoading(false);
      });
    }
  }, [playlistId]);

  if (loading) {
    return (
      <div className="py-24 text-center text-text-secondary">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading playlist...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="py-24 text-center text-text-secondary space-y-2">
        <p className="text-base font-bold text-text-primary">Playlist not found</p>
        <Link href="/library" className="text-xs text-text-primary font-semibold underline block">
          Back to library
        </Link>
      </div>
    );
  }

  const handlePlayAll = () => {
    if (playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const handleShufflePlay = () => {
    if (playlist.tracks.length > 0) {
      usePlayerStore.getState().toggleShuffle();
      const randomIndex = Math.floor(Math.random() * playlist.tracks.length);
      playTrack(playlist.tracks[randomIndex], playlist.tracks);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16 max-w-4xl mx-auto w-full">
      {/* Back Link */}
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
      >
        <ChevronLeft size={16} />
        <span>Library</span>
      </Link>

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 pt-1">
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-3xl overflow-hidden shadow-glass shrink-0 border border-white/60 bg-slate-200">
          <Image
            src={playlist.coverUrl}
            alt={playlist.title}
            fill
            priority
            className="object-cover"
            sizes="208px"
          />
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
            Curated Playlist
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary leading-tight">
            {playlist.title}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary max-w-xl">{playlist.description}</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono text-text-secondary pt-1">
            <span>{playlist.trackCount} tracks</span>
            <span>•</span>
            <span>{formatTime(playlist.totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
        <button
          onClick={handlePlayAll}
          className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-full liquid-button text-text-primary font-bold text-sm shadow-liquid active:scale-95 transition-all"
        >
          <Play size={16} fill="currentColor" />
          <span>Play All</span>
        </button>

        <button
          onClick={handleShufflePlay}
          className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-full glass-pill hover:bg-white text-text-primary font-semibold text-sm shadow-sm active:scale-95 transition-all"
        >
          <Shuffle size={16} />
          <span>Shuffle</span>
        </button>
      </div>

      {/* Track List */}
      <div className="space-y-2 pt-3">
        {playlist.tracks.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;
          const isLiked = likedTrackIds.includes(track.id);

          return (
            <div
              key={track.id}
              className={`flex items-center justify-between p-3 rounded-2xl group transition-all select-none ${
                isCurrent
                  ? 'glass-card bg-white/80 border border-slate-300 shadow-sm'
                  : 'glass-card bg-white/50 hover:bg-white/70 border border-white/50 shadow-glass-sm'
              }`}
            >
              <div
                onClick={() => playTrack(track, playlist.tracks)}
                role="button"
                tabIndex={0}
                aria-label={`Play ${track.title} by ${track.artist}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') playTrack(track, playlist.tracks);
                }}
                className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
              >
                <span className="text-xs font-mono text-text-secondary w-5 text-center">
                  {idx + 1}
                </span>
                <PlayerArtwork track={track} isPlaying={isCurrent && isPlaying} size="sm" />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-text-primary truncate">{track.title}</h4>
                  <p className="text-xs text-text-secondary truncate">{track.artist}</p>
                </div>
              </div>

              {/* Actions & Time */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => addToQueue(track)}
                  aria-label="Add to queue"
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/60 transition-colors"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => toggleLike(track)}
                  aria-label={isLiked ? 'Unlike' : 'Like'}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/60 transition-colors"
                >
                  <Heart
                    size={16}
                    fill={isLiked ? '#e11d48' : 'none'}
                    className={isLiked ? 'text-rose-600' : ''}
                  />
                </button>
                <span className="text-xs font-mono text-text-secondary w-12 text-right hidden sm:inline">
                  {formatTime(track.duration)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
