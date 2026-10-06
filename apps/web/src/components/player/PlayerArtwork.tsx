'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Disc3, Music2 } from 'lucide-react';
import { Track } from '@music/shared';

interface PlayerArtworkProps {
  track: Track;
  isPlaying: boolean;
  size?: 'sm' | 'md' | 'lg';
  showVinylEffect?: boolean;
  layoutId?: string;
  className?: string;
}

export function PlayerArtwork({
  track,
  isPlaying,
  size = 'md',
  showVinylEffect = false,
  layoutId,
  className = ''
}: PlayerArtworkProps) {
  const shouldReduceMotion = useReducedMotion();
  const artworkUrl = track.artwork?.[0]?.url || '/icon.svg';

  const sizeClasses = {
    sm: 'w-11 h-11 rounded-xl',
    md: 'w-14 h-14 rounded-2xl',
    lg: 'w-64 h-64 sm:w-80 sm:h-80 rounded-3xl'
  };

  const innerContent = (
    <div
      className={`relative overflow-hidden shrink-0 shadow-glass-sm border border-white/60 bg-slate-200/60 ${sizeClasses[size]} ${className}`}
    >
      {artworkUrl ? (
        <Image
          src={artworkUrl}
          alt={track.title}
          fill
          priority={size === 'lg'}
          className={`object-cover transition-transform duration-500 ${
            isPlaying && size !== 'lg' && !shouldReduceMotion ? 'scale-105' : 'scale-100'
          }`}
          sizes={size === 'lg' ? '320px' : '56px'}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-text-secondary">
          <Music2 size={size === 'lg' ? 48 : 20} />
        </div>
      )}

      {showVinylEffect && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-white/20 pointer-events-none" />
          <div className="absolute bottom-4 right-4 p-2.5 rounded-full glass-card text-text-primary shadow-sm">
            <Disc3
              size={20}
              className={
                isPlaying && !shouldReduceMotion ? 'animate-spin-slow' : 'animate-spin-slow-paused'
              }
            />
          </div>
        </>
      )}
    </div>
  );

  if (layoutId) {
    return (
      <motion.div
        layoutId={shouldReduceMotion ? undefined : layoutId}
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
        className="shrink-0"
      >
        {innerContent}
      </motion.div>
    );
  }

  return innerContent;
}
