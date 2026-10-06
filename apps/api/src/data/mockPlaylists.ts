import { Playlist } from '@music/shared';
import { mockTracks } from './mockTracks';

export const mockPlaylists: Playlist[] = [
  {
    id: 'playlist-cyber-drive',
    title: 'Midnight Cyber Drive',
    description: 'Neon-soaked synthwave, pulsating basslines, and high-speed retro escapism.',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    tracks: [mockTracks[0], mockTracks[2], mockTracks[5]],
    trackCount: 3,
    totalDuration: mockTracks[0].duration + mockTracks[2].duration + mockTracks[5].duration,
    isSystemPlaylist: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'playlist-deep-focus',
    title: 'Deep Focus & Late Night Study',
    description: 'Warm tape saturation, gentle rainy lo-fi beats, and cosmic ambient soundscapes.',
    coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
    tracks: [mockTracks[1], mockTracks[3]],
    trackCount: 2,
    totalDuration: mockTracks[1].duration + mockTracks[3].duration,
    isSystemPlaylist: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'playlist-solar-groove',
    title: 'Solar Beats & Electric Waves',
    description: 'Upbeat groove sessions designed for energy, movement, and inspiration.',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    tracks: [mockTracks[4], mockTracks[0]],
    trackCount: 2,
    totalDuration: mockTracks[4].duration + mockTracks[0].duration,
    isSystemPlaylist: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
