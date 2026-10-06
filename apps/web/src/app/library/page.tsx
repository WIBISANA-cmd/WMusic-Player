'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Plus, Download, Disc, Music, Trash2 } from 'lucide-react';
import { Playlist, Track } from '@music/shared';
import { fetchPlaylists, createPlaylist, fetchTracks } from '@/services/api-client';
import { usePlayerStore } from '@/stores/player-store';

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
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Your Library</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Playlists, favorites, and saved offline tracks
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
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
          className="p-5 rounded-3xl bg-gradient-to-tr from-pink-900/60 to-surface border border-pink-500/20 cursor-pointer group hover:scale-[1.01] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
              <Heart size={26} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors">
                Liked Songs
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{likedTrackIds.length} tracks</p>
            </div>
          </div>
        </div>

        {/* Offline Downloads Card */}
        <Link
          href="/offline"
          className="p-5 rounded-3xl bg-gradient-to-tr from-emerald-950/60 to-surface border border-emerald-500/20 cursor-pointer group hover:scale-[1.01] transition-transform block"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <Download size={26} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                Downloaded Tracks
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{offlineTracks.length} offline ready</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Playlists Grid */}
      <section className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Disc size={18} className="text-primary-400" />
          <span>Playlists</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlist/${playlist.id}`}
              className="p-3.5 rounded-2xl bg-surface hover:bg-surface-hover border border-white/5 transition-all flex items-center gap-3.5 group"
            >
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-md">
                <Image
                  src={playlist.coverUrl}
                  alt={playlist.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="64px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate group-hover:text-primary-300 transition-colors">
                  {playlist.title}
                </h4>
                <p className="text-xs text-slate-400 truncate mt-0.5">{playlist.description}</p>
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  {playlist.trackCount} tracks
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Create Playlist Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-sm rounded-3xl bg-[#111726] border border-white/10 p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-white">Create New Playlist</h3>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Awesome Playlist"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Vibes and chill beats..."
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-md shadow-primary-600/30"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
