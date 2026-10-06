import { ApiResponse, GenreCategory, LyricsData, Playlist, Track } from '@music/shared';

const API_BASE = ''; // Uses Next.js reverse-proxy rewrite to backend

export async function fetchTracks(params?: {
  page?: number;
  limit?: number;
  genre?: string;
  artist?: string;
  search?: string;
}): Promise<Track[]> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.genre) query.set('genre', params.genre);
  if (params?.artist) query.set('artist', params.artist);
  if (params?.search) query.set('search', params.search);

  try {
    const res = await fetch(`${API_BASE}/api/tracks?${query.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: ApiResponse<Track[]> = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('Network fetch tracks failed, returning offline fallback:', err);
    return getOfflineFallbackTracks();
  }
}

export async function fetchTrackById(id: string): Promise<Track | null> {
  try {
    const res = await fetch(`${API_BASE}/api/tracks/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: ApiResponse<{ track: Track }> = await res.json();
    return json.data?.track || null;
  } catch (err) {
    console.warn(`Failed fetching track ${id}:`, err);
    const fallbacks = getOfflineFallbackTracks();
    return fallbacks.find((t) => t.id === id) || null;
  }
}

export async function fetchTrackLyrics(id: string): Promise<LyricsData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/tracks/${id}/lyrics`);
    if (!res.ok) return null;
    const json: ApiResponse<LyricsData> = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn(`Failed fetching lyrics for ${id}:`, err);
    return null;
  }
}

export async function fetchPlaylists(): Promise<Playlist[]> {
  try {
    const res = await fetch(`${API_BASE}/api/playlists`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: ApiResponse<Playlist[]> = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('Network fetch playlists failed, returning offline fallback:', err);
    return getOfflineFallbackPlaylists();
  }
}

export async function fetchPlaylistById(id: string): Promise<Playlist | null> {
  try {
    const res = await fetch(`${API_BASE}/api/playlists/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: ApiResponse<Playlist> = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn(`Failed fetching playlist ${id}:`, err);
    const list = getOfflineFallbackPlaylists();
    return list.find((p) => p.id === id) || null;
  }
}

export async function createPlaylist(title: string, description: string): Promise<Playlist | null> {
  try {
    const res = await fetch(`${API_BASE}/api/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: ApiResponse<Playlist> = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Failed to create playlist:', err);
    return null;
  }
}

export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId })
    });
    return res.ok;
  } catch (err) {
    console.error('Failed adding track to playlist:', err);
    return false;
  }
}

export async function fetchGenres(): Promise<GenreCategory[]> {
  try {
    const res = await fetch(`${API_BASE}/api/genres`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: ApiResponse<GenreCategory[]> = await res.json();
    return json.data || [];
  } catch {
    return [
      { id: 'synthwave', name: 'Synthwave & Retrowave', gradient: 'from-pink-500 to-indigo-600', coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80', trackCount: 14 },
      { id: 'lofi', name: 'Lo-Fi Chill & Beats', gradient: 'from-amber-500 to-rose-600', coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500&auto=format&fit=crop&q=80', trackCount: 22 },
      { id: 'cyberpunk', name: 'Cyberpunk & Darksynth', gradient: 'from-cyan-500 to-blue-700', coverUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=500&auto=format&fit=crop&q=80', trackCount: 18 },
      { id: 'ambient', name: 'Ambient & Space Drift', gradient: 'from-purple-500 to-violet-800', coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80', trackCount: 11 },
      { id: 'indie-dance', name: 'Indie Dance & Nu-Disco', gradient: 'from-emerald-500 to-teal-700', coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80', trackCount: 16 }
    ];
  }
}

export async function searchMusic(query: string): Promise<{
  tracks: Track[];
  playlists: Playlist[];
  genres: GenreCategory[];
}> {
  try {
    const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: ApiResponse<{ tracks: Track[]; playlists: Playlist[]; genres: GenreCategory[] }> = await res.json();
    return json.data || { tracks: [], playlists: [], genres: [] };
  } catch (err) {
    console.warn('Search request failed:', err);
    return { tracks: [], playlists: [], genres: [] };
  }
}

// Built-in fallback metadata for offline browsing before first sync
function getOfflineFallbackTracks(): Track[] {
  return [
    {
      id: 'track-neon-horizon',
      title: 'Neon Horizon',
      artist: 'Aetherwave',
      album: 'Synthetic Sunset',
      duration: 38,
      coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      audioUrl: '/api/stream/track-neon-horizon',
      genre: 'Synthwave',
      bpm: 124,
      providerId: 'provider-local-storage',
      providerType: 'local',
      hasLyrics: true,
      waveform: [12, 18, 30, 45, 60, 75, 90, 85, 70, 65, 80, 95, 100, 85, 75, 60, 45, 30, 20, 15]
    },
    {
      id: 'track-midnight-lofi',
      title: 'Midnight Coffee & Rainy Thoughts',
      artist: 'Kaito Chill',
      album: 'Tokyo After Dark',
      duration: 35,
      coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
      audioUrl: '/api/stream/track-midnight-lofi',
      genre: 'Lo-Fi Chill',
      bpm: 84,
      providerId: 'provider-local-storage',
      providerType: 'local',
      hasLyrics: true,
      waveform: [20, 35, 40, 50, 45, 55, 60, 62, 58, 54, 52, 60, 65, 62, 55, 48, 40, 32, 25, 18]
    },
    {
      id: 'track-cyber-pulse',
      title: 'Cyber Pulse Overdrive',
      artist: 'Vektor 99',
      album: 'Sub-Orbital Matrix',
      duration: 42,
      coverUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80',
      audioUrl: '/api/stream/track-cyber-pulse',
      genre: 'Cyberpunk',
      bpm: 132,
      providerId: 'provider-local-storage',
      providerType: 'local',
      hasLyrics: true,
      waveform: [30, 50, 70, 90, 85, 95, 100, 90, 80, 95, 100, 90, 85, 75, 80, 95, 90, 70, 50, 30]
    },
    {
      id: 'track-celestial-echo',
      title: 'Celestial Echoes',
      artist: 'Astral Drift',
      album: 'Infinite Void',
      duration: 40,
      coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      audioUrl: '/api/stream/track-celestial-echo',
      genre: 'Ambient',
      bpm: 72,
      providerId: 'provider-local-storage',
      providerType: 'local',
      hasLyrics: true,
      waveform: [10, 15, 25, 35, 45, 40, 50, 55, 60, 55, 50, 48, 52, 58, 55, 42, 35, 28, 20, 12]
    }
  ];
}

function getOfflineFallbackPlaylists(): Playlist[] {
  const tracks = getOfflineFallbackTracks();
  return [
    {
      id: 'playlist-cyber-drive',
      title: 'Midnight Cyber Drive',
      description: 'Neon-soaked synthwave, pulsating basslines, and retro vibes.',
      coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      tracks: [tracks[0], tracks[2]],
      trackCount: 2,
      totalDuration: 80,
      isSystemPlaylist: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'playlist-deep-focus',
      title: 'Deep Focus & Late Night Study',
      description: 'Warm tape saturation, gentle rainy lo-fi beats, and cosmic ambient soundscapes.',
      coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
      tracks: [tracks[1], tracks[3]],
      trackCount: 2,
      totalDuration: 75,
      isSystemPlaylist: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}
