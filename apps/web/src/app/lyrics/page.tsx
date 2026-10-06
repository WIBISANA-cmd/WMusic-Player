'use client';

import { usePlayerStore } from '@/store/usePlayerStore';
import { LyricsView } from '@/components/player/LyricsView';
import { Music2, Play } from 'lucide-react';
import Link from 'next/link';

export default function StandaloneLyricsPage() {
  const { currentTrack } = usePlayerStore();

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-slate-500 mb-4">
          <Music2 size={32} />
        </div>
        <h2 className="text-xl font-bold text-white">No Track Playing</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Select any song from your library or homepage to see synchronized lyrics.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-600 text-white text-xs font-semibold"
        >
          <Play size={14} fill="currentColor" />
          <span>Browse Music</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] flex flex-col animate-fadeIn">
      <div className="text-center py-4 border-b border-white/5">
        <h1 className="text-lg font-bold text-white">{currentTrack.title}</h1>
        <p className="text-xs text-primary-400">{currentTrack.artist}</p>
      </div>

      <div className="flex-1 min-h-0">
        <LyricsView track={currentTrack} />
      </div>
    </div>
  );
}
