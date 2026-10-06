'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Track, Playlist, GenreCategory } from '@music/shared';
import { searchMusic, fetchTracks } from '@/services/api-client';
import { usePlayerStore } from '@/stores/player-store';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchResults } from '@/components/search/SearchResults';

export const dynamic = 'force-dynamic';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialGenre = searchParams.get('genre') || '';

  const [query, setQuery] = useState(initialQuery || initialGenre);
  const [activeTab, setActiveTab] = useState<'all' | 'tracks' | 'playlists'>('all');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [, setGenres] = useState<GenreCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  const { playTrack, currentTrack, isPlaying } = usePlayerStore();

  useEffect(() => {
    if (!query.trim()) {
      fetchTracks({ limit: 10 }).then(setTracks);
      return;
    }

    setLoading(true);
    const handler = setTimeout(() => {
      startTransition(async () => {
        const results = await searchMusic(query);
        setTracks(results.tracks);
        setPlaylists(results.playlists);
        setGenres(results.genres);
        setLoading(false);
      });
    }, 250);

    return () => clearTimeout(handler);
  }, [query]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* SearchBar Component */}
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="What do you want to listen to?"
        autoFocus
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['all', 'tracks', 'playlists'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                : 'bg-surface text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Searching library...</p>
        </div>
      ) : (
        /* SearchResults Component */
        <SearchResults
          tracks={tracks}
          playlists={playlists}
          activeTab={activeTab}
          currentTrackId={currentTrack?.id}
          isPlaying={isPlaying}
          onPlayTrack={(track, queue) => playTrack(track, queue)}
          query={query}
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-slate-400 text-xs">Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
