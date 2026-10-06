'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Track, Playlist } from '@music/shared';
import { searchMusic, fetchTracks } from '@/services/api-client';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { useDebounce } from '@/hooks/useDebounce';

export const dynamic = 'force-dynamic';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialGenre = searchParams.get('genre') || '';

  const [query, setQuery] = useState(initialQuery || initialGenre);
  const debouncedQuery = useDebounce(query, 300);
  const [activeTab, setActiveTab] = useState<'all' | 'youtube' | 'local' | 'playlists'>('all');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      try {
        setLoading(true);
        const defaultTracks = await fetchTracks({ limit: 10 });
        setTracks(defaultTracks);
        setPlaylists([]);
        setError(null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const results = await searchMusic(q);
      setTracks(results.tracks || []);
      setPlaylists(results.playlists || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Could not complete search. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const filteredTracks =
    activeTab === 'playlists'
      ? []
      : activeTab === 'youtube'
      ? tracks.filter((t) => t.provider === 'youtube')
      : activeTab === 'local'
      ? tracks.filter((t) => t.provider !== 'youtube')
      : tracks;

  const filteredPlaylists = activeTab === 'playlists' || activeTab === 'all' ? playlists : [];

  return (
    <div className="space-y-5 animate-fadeIn pb-12 max-w-4xl mx-auto w-full">
      {/* SearchBar Component */}
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="What do you want to listen to?"
        autoFocus
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
        {(['all', 'youtube', 'local', 'playlists'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 min-h-[40px] rounded-full text-xs font-semibold capitalize transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              activeTab === tab
                ? 'bg-slate-700 text-white shadow-sm'
                : 'glass-pill text-text-secondary hover:text-text-primary hover:bg-white/80'
            }`}
          >
            {tab === 'youtube' ? 'YouTube Videos' : tab === 'local' ? 'Local Catalog' : tab}
          </button>
        ))}
      </div>

      {/* SearchResults Component */}
      <SearchResults
        tracks={filteredTracks}
        playlists={filteredPlaylists}
        loading={loading}
        error={error}
        onRetry={() => performSearch(debouncedQuery)}
        query={query}
        onSelectSuggestion={(tag) => setQuery(tag)}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-text-secondary text-xs">Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
