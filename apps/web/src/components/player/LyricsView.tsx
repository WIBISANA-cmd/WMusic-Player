'use client';

import { useState, useEffect, useRef } from 'react';
import { LyricsData, Track } from '@music/shared';
import { fetchTrackLyrics } from '@/services/api-client';
import { usePlayerStore } from '@/stores/player-store';
import { Music2 } from 'lucide-react';

interface LyricsViewProps {
  track: Track;
}

export function LyricsView({ track }: LyricsViewProps) {
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const activeLineRef = useRef<HTMLParagraphElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { currentTime, seek } = usePlayerStore();

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    fetchTrackLyrics(track.id)
      .then((data) => {
        if (!isCancelled) {
          setLyricsData(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [track.id]);

  // Find currently active lyric line based on currentTime in milliseconds
  const currentMs = currentTime * 1000;
  let activeIndex = -1;

  if (lyricsData?.lines && lyricsData.lines.length > 0) {
    for (let i = 0; i < lyricsData.lines.length; i++) {
      if (currentMs >= lyricsData.lines[i].timeMs) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  // Smooth scroll active line into view
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-text-secondary">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Synchronizing lyrics...</p>
      </div>
    );
  }

  if (!lyricsData || lyricsData.lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-text-secondary">
        <div className="w-14 h-14 rounded-2xl glass-card mx-auto flex items-center justify-center mb-4 text-slate-500 shadow-sm">
          <Music2 size={28} />
        </div>
        <p className="text-sm font-bold text-text-primary">Instrumental / No Lyrics Available</p>
        <p className="text-xs text-text-secondary mt-1">Enjoy the melody and acoustic atmosphere.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-6 py-8 space-y-5 text-center scroll-smooth select-none"
    >
      <div className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-4">
        Synchronized Lyrics • Tap any line to seek
      </div>

      {lyricsData.lines.map((line, idx) => {
        const isActive = idx === activeIndex;
        const isPast = idx < activeIndex;

        return (
          <p
            key={line.id}
            ref={isActive ? activeLineRef : null}
            onClick={() => seek(line.timeMs / 1000)}
            role="button"
            tabIndex={0}
            aria-label={`Lyric: ${line.text}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') seek(line.timeMs / 1000);
            }}
            className={`transition-all duration-300 cursor-pointer font-bold leading-relaxed rounded-2xl py-2 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isActive
                ? 'text-slate-900 text-lg sm:text-xl scale-105 glass-card bg-white/80 shadow-glass-sm'
                : isPast
                ? 'text-text-secondary text-sm sm:text-base hover:text-text-primary'
                : 'text-slate-400 text-sm sm:text-base hover:text-text-secondary'
            }`}
          >
            {line.text}
          </p>
        );
      })}
    </div>
  );
}
