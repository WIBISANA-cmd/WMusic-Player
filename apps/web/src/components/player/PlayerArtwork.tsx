'use client';

import Image from 'next/image';
import { Disc3, Music2 } from 'lucide-react';
import { Track } from '@music/shared';

interface PlayerArtworkProps {
  track: Track;
  isPlaying: boolean;
  size?: 'sm' | 'md' | 'lg';
  showVinylEffect?: boolean;
  className?: string;
}

export function PlayerArtwork({
  track,
  isPlaying,
  size = 'md',
  showVinylEffect = false,
  className = ''
}: PlayerArtworkProps) {
  const artworkUrl = track.artwork?.[0]?.url || '/icon.svg';

  const sizeClasses = {
    sm: 'w-11 h-11 rounded-xl',
    md: 'w-14 h-14 rounded-xl',
    lg: 'w-64 h-64 sm:w-80 sm:h-80 rounded-3xl'
  };

  return (
    <div
      className={`relative overflow-hidden shrink-0 shadow-xl border border-white/10 ${sizeClasses[size]} ${className}`}
    >
      {artworkUrl ? (
        <Image
          src={artworkUrl}
          alt={track.title}
          fill
          priority={size === 'lg'}
          className={`object-cover transition-transform duration-500 ${
            isPlaying && size !== 'lg' ? 'scale-105' : 'scale-100'
          }`}
          sizes={size === 'lg' ? '320px' : '56px'}
        />
      ) : (
        <div className="w-full h-full bg-surface flex items-center justify-center text-slate-500">
          <Music2 size={size === 'lg' ? 48 : 20} />
        </div>
      )}

      {showVinylEffect && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
          <div className="absolute bottom-4 right-4 p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80">
            <Disc3
              size={20}
              className={isPlaying ? 'animate-spin-slow' : 'animate-spin-slow-paused'}
            />
          </div>
        </>
      )}
    </div>
  );
}

