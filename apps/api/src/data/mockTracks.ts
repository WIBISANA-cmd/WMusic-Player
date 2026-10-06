import { Track } from '@music/shared';

export const mockTracks: Track[] = [
  {
    id: 'track-neon-horizon',
    provider: 'local',
    title: 'Neon Horizon',
    artist: 'Aetherwave',
    album: 'Synthetic Sunset',
    duration: 38,
    artwork: [
      {
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        width: 600,
        height: 600
      }
    ],
    playable: true,
    explicit: false,
    audioUrl: '/api/stream/track-neon-horizon',
    genre: 'Synthwave',
    bpm: 124,
    releaseYear: 2025,
    metadata: {
      lossless: true,
      bitrate: 320,
      format: 'wav',
      peaks: [12, 18, 30, 45, 60, 75, 90, 85, 70, 65, 80, 95, 100, 85, 75, 60, 45, 30, 20, 15]
    }
  },
  {
    id: 'track-midnight-lofi',
    provider: 'local',
    title: 'Midnight Coffee & Rainy Thoughts',
    artist: 'Kaito Chill',
    album: 'Tokyo After Dark',
    duration: 35,
    artwork: [
      {
        url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
        width: 600,
        height: 600
      }
    ],
    playable: true,
    explicit: false,
    audioUrl: '/api/stream/track-midnight-lofi',
    genre: 'Lo-Fi Chill',
    bpm: 84,
    releaseYear: 2024,
    metadata: {
      lossless: true,
      bitrate: 320,
      format: 'wav',
      peaks: [20, 35, 40, 50, 45, 55, 60, 62, 58, 54, 52, 60, 65, 62, 55, 48, 40, 32, 25, 18]
    }
  },
  {
    id: 'track-cyber-pulse',
    provider: 'local',
    title: 'Cyber Pulse Overdrive',
    artist: 'Vektor 99',
    album: 'Sub-Orbital Matrix',
    duration: 42,
    artwork: [
      {
        url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80',
        width: 600,
        height: 600
      }
    ],
    playable: true,
    explicit: false,
    audioUrl: '/api/stream/track-cyber-pulse',
    genre: 'Cyberpunk',
    bpm: 132,
    releaseYear: 2025,
    metadata: {
      lossless: true,
      bitrate: 320,
      format: 'wav',
      peaks: [30, 50, 70, 90, 85, 95, 100, 90, 80, 95, 100, 90, 85, 75, 80, 95, 90, 70, 50, 30]
    }
  },
  {
    id: 'track-celestial-echo',
    provider: 'local',
    title: 'Celestial Echoes',
    artist: 'Astral Drift',
    album: 'Infinite Void',
    duration: 40,
    artwork: [
      {
        url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
        width: 600,
        height: 600
      }
    ],
    playable: true,
    explicit: false,
    audioUrl: '/api/stream/track-celestial-echo',
    genre: 'Ambient',
    bpm: 72,
    releaseYear: 2024,
    metadata: {
      lossless: true,
      bitrate: 320,
      format: 'wav',
      peaks: [10, 15, 25, 35, 45, 40, 50, 55, 60, 55, 50, 48, 52, 58, 55, 42, 35, 28, 20, 12]
    }
  },
  {
    id: 'track-solstice-groove',
    provider: 'local',
    title: 'Solstice Groove',
    artist: 'Solaris Duo',
    album: 'Equinox Echoes',
    duration: 36,
    artwork: [
      {
        url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        width: 600,
        height: 600
      }
    ],
    playable: true,
    explicit: false,
    audioUrl: '/api/stream/track-solstice-groove',
    genre: 'Indie Dance',
    bpm: 118,
    releaseYear: 2025,
    metadata: {
      lossless: true,
      bitrate: 320,
      format: 'wav',
      peaks: [25, 40, 60, 75, 80, 70, 85, 90, 75, 65, 80, 88, 85, 70, 65, 75, 60, 45, 30, 20]
    }
  },
  {
    id: 'track-retro-arcade',
    provider: 'local',
    title: 'Quarter In The Slot',
    artist: 'Pixel Rebel',
    album: 'Insert Coin',
    duration: 34,
    artwork: [
      {
        url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
        width: 600,
        height: 600
      }
    ],
    playable: true,
    explicit: false,
    audioUrl: '/api/stream/track-retro-arcade',
    genre: 'Chiptune',
    bpm: 128,
    releaseYear: 2024,
    metadata: {
      lossless: true,
      bitrate: 320,
      format: 'wav',
      peaks: [35, 55, 70, 80, 85, 90, 85, 80, 75, 85, 95, 90, 80, 70, 75, 80, 65, 50, 35, 20]
    }
  }
];

export const mockLyricsRecord: Record<string, string> = {
  'track-neon-horizon': `[00:01.00]Cruising down the empty highway
[00:04.50]Neon reflections in the rear-view glass
[00:08.20]The city glows like a grid in twilight
[00:12.80]Miles fade away as seconds pass
[00:16.50]Can you feel the pulse tonight?
[00:20.10]Rhythms cutting through the digital sky
[00:24.00]Hold the wheel into the horizon
[00:28.50]We leave yesterday behind
[00:32.00]Synthetic dreams will never die...`,

  'track-midnight-lofi': `[00:01.20]Raindrops tapping softly on the window sill
[00:05.80]Warm steam rising from the coffee cup
[00:10.00]The world is fast asleep, the room is still
[00:15.20]Midnight melodies floating up
[00:19.40]Pages turn in quiet peace
[00:24.10]No hurry, no rush, just breathe
[00:29.00]Tokyo lights blur in the dark
[00:32.50]Soft reflections leave their mark...`,

  'track-cyber-pulse': `[00:01.50]System reboot, power online
[00:05.00]Data packets crossing the neural line
[00:09.20]Overdrive engaged in the subterranean core
[00:14.00]We break the firewall, open the door
[00:18.50]Fast electrons, neon blue
[00:23.00]The grid responds to what we do
[00:27.50]Overclocking through the matrix flow
[00:32.00]Sub-orbital pulse ready to glow!`,

  'track-celestial-echo': `[00:02.00]Floating past the rings of Saturn
[00:07.50]Silent gravity forms a pattern
[00:13.20]Harmonics of stellar dust drifting slow
[00:19.50]Far beyond the cosmic glow
[00:25.00]Echoes of time, echoes of space
[00:31.00]Finding eternity in this quiet place...`,

  'track-solstice-groove': `[00:01.00]Step into the golden sunlight
[00:05.20]Let the baseline shake your soul
[00:09.50]Dancing till the morning light
[00:14.00]Lose your mind and lose control
[00:18.20]Summer solstice in the air
[00:22.50]Feel the rhythm everywhere!`,

  'track-retro-arcade': `[00:01.00]Level one, insert your coin
[00:04.20]Ready player, come and join
[00:08.50]8-bit melodies jumping high
[00:13.00]Chasing bonus points in the sky
[00:17.50]Pixel jump and laser blast
[00:22.00]High score that will surely last!`
};
