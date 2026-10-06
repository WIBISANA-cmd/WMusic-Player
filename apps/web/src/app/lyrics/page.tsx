'use client';

import { usePlayerStore } from '@/stores/player-store';
import { LyricsView } from '@/components/player/LyricsView';
import { Music2, Play } from 'lucide-react';
import Link from 'next/link';

export default function StandaloneLyricsPage() {
  const { currentTrack } = usePlayerStore();

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 select-none">
        <div className="w-16 h-16 rounded-3xl glass-card mx-auto flex items-center justify-center text-text-secondary mb-4 shadow-sm">
          <Music2 size={32} />
        </div>
        <h2 className="text-xl font-bold text-text-primary">No Track Playing</h2>
        <p className="text-xs text-text-secondary mt-1 max-w-xs">
          Select any song from your library or search to experience synchronized lyrics.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full liquid-button text-text-primary text-xs font-semibold shadow-liquid min-h-[44px]"
        >
          <Play size={14} fill="currentColor" />
          <span>Browse Music</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-13rem)] flex flex-col animate-fadeIn select-none">
      <div className="text-center py-4 border-b border-slate-200/60">
        <h1 className="text-lg font-bold text-text-primary">{currentTrack.title}</h1>
        <p className="text-xs text-text-secondary">{currentTrack.artist}</p>
      </div>

      <div className="flex-1 min-h-0">
        <LyricsView track={currentTrack} />
      </div>
    </div>
  );
}
