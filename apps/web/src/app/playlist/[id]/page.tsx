'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Shuffle, Clock, ChevronLeft, Heart, Plus } from 'lucide-react';
import { Playlist, Track } from '@music/shared';
import { fetchPlaylistById } from '@/services/api-client';
import { usePlayerStore } from '@/stores/player-store';
import { PlayerArtwork } from '@/components/player/PlayerArtwork';

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}m ${secs}s`;
}

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
      <div className="py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading playlist...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="py-24 text-center text-slate-400">
        <p className="text-base font-bold text-white">Playlist not found</p>
        <Link href="/library" className="text-xs text-primary-400 underline mt-2 block">
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
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Back Button */}
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ChevronLeft size={16} />
        <span>Library</span>
      </Link>

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 pt-2">
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden shadow-2xl shrink-0 border border-white/10">
          <Image
            src={playlist.coverUrl}
            alt={playlist.title}
            fill
            priority
            className="object-cover"
            sizes="224px"
          />
        </div>

        <div className="space-y-2.5 text-center sm:text-left flex-1 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            Playlist
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            {playlist.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">{playlist.description}</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono text-slate-400 pt-1">
            <span>{playlist.trackCount} tracks</span>
            <span>•</span>
            <span>{formatDuration(playlist.totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handlePlayAll}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm shadow-lg shadow-primary-600/30 active:scale-95 transition-all"
        >
          <Play size={18} fill="currentColor" />
          <span>Play All</span>
        </button>

        <button
          onClick={handleShufflePlay}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white font-semibold text-sm active:scale-95 transition-all border border-white/5"
        >
          <Shuffle size={16} />
          <span>Shuffle</span>
        </button>
      </div>

      {/* Track List */}
      <div className="space-y-1.5 pt-4">
        {playlist.tracks.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;
          const isLiked = likedTrackIds.includes(track.id);

          return (
            <div
              key={track.id}
              className={`flex items-center justify-between p-3 rounded-2xl group transition-all ${
                isCurrent
                  ? 'bg-primary-600/20 border border-primary-500/40'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div
                onClick={() => playTrack(track, playlist.tracks)}
                className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
              >
                <span className="text-xs font-mono text-slate-500 w-5 text-center">
                  {idx + 1}
                </span>
                <PlayerArtwork track={track} isPlaying={isCurrent && isPlaying} size="sm" />
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">{track.title}</h4>
                  <p className="text-xs text-slate-400 truncate">{track.artist}</p>
                </div>
              </div>

              {/* Actions & Time */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => addToQueue(track)}
                  title="Add to queue"
                  className="p-1.5 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => toggleLike(track)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <Heart
                    size={16}
                    fill={isLiked ? '#ec4899' : 'none'}
                    className={isLiked ? 'text-pink-500' : ''}
                  />
                </button>
                <span className="text-xs font-mono text-slate-400 w-10 text-right">
                  {Math.floor(track.duration / 60)}:
                  {(track.duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
