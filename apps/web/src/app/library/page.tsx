'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Plus, Download, Disc } from 'lucide-react';
import { Playlist, Track } from '@music/shared';
import { fetchPlaylists, createPlaylist, fetchTracks } from '@/services/api-client';
import { usePlayerStore } from '@/stores/player-store';
import { Modal } from '@/components/ui/Modal';

export default function LibraryPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const { likedTrackIds, offlineTracks, playTrack } = usePlayerStore();

  useEffect(() => {
    fetchPlaylists().then(setPlaylists);
    fetchTracks().then((allTracks) => {
      setLikedTracks(allTracks.filter((t) => likedTrackIds.includes(t.id)));
    });
  }, [likedTrackIds]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || creating) return;

    setCreating(true);
    const created = await createPlaylist(title.trim(), description.trim());
    if (created) {
      setPlaylists([created, ...playlists]);
      setTitle('');
      setDescription('');
      setIsModalOpen(false);
    }
    setCreating(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-text-primary">Your Library</h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Playlists, favorites, and saved offline tracks
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-full liquid-button text-text-primary font-semibold text-xs shadow-sm active:scale-95 transition-all"
        >
          <Plus size={16} />
          <span>New Playlist</span>
        </button>
      </div>

      {/* Quick Pinned Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Liked Songs Card */}
        <div
          onClick={() => {
            if (likedTracks.length > 0) playTrack(likedTracks[0], likedTracks);
          }}
          role="button"
          tabIndex={0}
          aria-label={`Play liked songs (${likedTrackIds.length} tracks)`}
          className="p-5 rounded-3xl glass-card bg-white/60 hover:bg-white/80 border border-white/60 shadow-glass-sm cursor-pointer group hover:scale-[1.01] active:scale-98 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm">
              <Heart size={24} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary group-hover:text-slate-900 transition-colors">
                Liked Songs
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">{likedTrackIds.length} tracks</p>
            </div>
          </div>
        </div>

        {/* Offline Downloads Card */}
        <Link
          href="/offline"
          className="p-5 rounded-3xl glass-card bg-white/60 hover:bg-white/80 border border-white/60 shadow-glass-sm cursor-pointer group hover:scale-[1.01] active:scale-98 transition-all block"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
              <Download size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary group-hover:text-slate-900 transition-colors">
                Downloaded Tracks
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">{offlineTracks.length} offline ready</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Playlists Grid */}
      <section className="space-y-3.5 pt-2">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2 px-1">
          <Disc size={18} className="text-text-secondary" />
          <span>Playlists</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlist/${playlist.id}`}
              className="p-3.5 rounded-2xl glass-card bg-white/50 hover:bg-white/80 border border-white/50 shadow-glass-sm transition-all flex items-center gap-3.5 group"
            >
              <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-sm bg-slate-200">
                <Image
                  src={playlist.coverUrl}
                  alt={playlist.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="56px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-text-primary truncate group-hover:text-slate-900 transition-colors">
                  {playlist.title}
                </h4>
                <p className="text-xs text-text-secondary truncate mt-0.5">{playlist.description}</p>
                <div className="text-[11px] text-text-secondary font-mono mt-1">
                  {playlist.trackCount} tracks
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Create Playlist Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Playlist">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Playlist"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Curated listening session..."
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 min-h-[40px] rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 min-h-[40px] rounded-xl liquid-button text-text-primary text-xs font-semibold shadow-sm"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
