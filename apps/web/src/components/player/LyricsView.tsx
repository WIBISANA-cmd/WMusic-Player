'use client';

import { useState, useEffect, useRef } from 'react';
import { LyricsData, Track } from '@music/shared';
import { fetchTrackLyrics } from '@/services/apiClient';
import { usePlayerStore } from '@/store/usePlayerStore';
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
      <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Synchronizing lyrics...</p>
      </div>
    );
  }

  if (!lyricsData || lyricsData.lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-slate-500">
          <Music2 size={28} />
        </div>
        <p className="text-sm font-semibold text-slate-300">Instrumental / No Lyrics Available</p>
        <p className="text-xs text-slate-500 mt-1">Enjoy the music and beat vibes.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-6 py-12 space-y-6 text-center scroll-smooth select-none"
    >
      <div className="text-[11px] uppercase tracking-widest text-primary-400 font-semibold mb-6">
        Synced Lyrics • Tap any line to seek
      </div>

      {lyricsData.lines.map((line, idx) => {
        const isActive = idx === activeIndex;
        const isPast = idx < activeIndex;

        return (
          <p
            key={line.id}
            ref={isActive ? activeLineRef : null}
            onClick={() => seek(line.timeMs / 1000)}
            className={`transition-all duration-300 cursor-pointer font-bold leading-relaxed rounded-xl py-2 px-3 ${
              isActive
                ? 'text-white text-xl sm:text-2xl scale-105 bg-white/5 shadow-inner shadow-primary-500/10 text-primary-300 drop-shadow-[0_2px_12px_rgba(139,92,246,0.5)]'
                : isPast
                ? 'text-slate-400/80 text-base sm:text-lg hover:text-slate-200'
                : 'text-slate-600 text-base sm:text-lg hover:text-slate-400'
            }`}
          >
            {line.text}
          </p>
        );
      })}
    </div>
  );
}
