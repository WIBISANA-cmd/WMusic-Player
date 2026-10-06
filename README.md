# Pulse Music 🎵
> A production-oriented, mobile-first Progressive Web Application (PWA) audio player engineered with Next.js 16 (App Router), Express.js, native HTML5 Audio Engine, Media Session API, and a modular MediaProvider abstraction.

---

## 🌟 Architecture Overview

Pulse Music is built as a TypeScript monorepo using **pnpm workspaces**:

```
music-app/
├── apps/
│   ├── web/                    # Next.js 16 (App Router) Mobile-First PWA frontend
│   │   ├── src/app/            # App Router pages (layout.tsx, page.tsx, search, library, etc.)
│   │   ├── src/components/     # MiniPlayer, FullPlayerModal, LyricsView, QueueDrawer, etc.
│   │   ├── src/lib/            # AudioEngine (HTML5 Audio + Media Session API)
│   │   ├── src/store/          # Zustand store with persistence & offline queue
│   │   ├── src/services/       # API client with offline fallback
│   │   └── public/             # PWA Manifest, Service Worker (sw.js), Vector icon
│   └── api/                    # Node.js + Express + TypeScript Backend
│       ├── src/controllers/    # StreamController (HTTP 206 Partial Content), Track, Playlist, Search
│       ├── src/providers/      # MediaProvider abstraction (Local, S3/R2, CDN)
│       ├── src/middlewares/    # RateLimiter, Structured Request Logger, ErrorHandler
│       ├── src/services/       # Melodic PCM WAV audio synthesizer for instant sound
│       └── media/              # Audio file storage & LRC synchronized lyrics
├── packages/
│   └── shared/                 # Shared TypeScript models, contracts, and Zod schemas
│       ├── models/track.ts
│       ├── models/media-provider.ts
│       ├── models/player.ts
│       ├── models/lyrics.ts
│       └── models/api.ts
├── docker/
│   ├── docker-compose.yml      # Multi-container production deployment
│   ├── Dockerfile.api          # Multi-stage build for API
│   └── Dockerfile.web          # Multi-stage build for Next.js Web
├── pnpm-workspace.yaml
└── README.md
```

---

## 🛡️ Media Source Policy & MediaProvider Abstraction

Per strict policy requirements:
- ❌ **No YouTube audio extraction, stream scraping, or hidden players.**
- ❌ **No proxying extracted YouTube audio through backend.**
- ✅ Built entirely around a **`MediaProvider` abstraction contract** (`IMediaProvider`).
- ✅ Streams media legally permitted to stream: owned audio files, licensed audio APIs, S3-compatible object storage (MinIO / Cloudflare R2 / AWS S3), or authorized CDNs.
- ✅ If a YouTube provider is added in the future, it must use the official YouTube IFrame Player mechanism and remain strictly separated from native HTML5 Audio.

### MediaProvider Contract
Located in `packages/shared/src/models/media-provider.ts`:

```typescript
export interface IMediaProvider {
  readonly id: string;
  readonly name: string;
  readonly type: MediaProviderType;
  readonly capabilities: MediaProviderCapabilities;
  getStreamSource(trackId: string, quality?: StreamQuality): Promise<StreamSource>;
  getLyrics?(trackId: string): Promise<string | null>;
}
```

Registered implementations:
1. **`LocalMediaProvider`**: Serves local files with full HTTP 206 Range request support.
2. **`S3MediaProvider`**: Generates pre-signed time-limited S3 / Cloudflare R2 / MinIO URLs.
3. **`AuthorizedCdnMediaProvider`**: Produces HMAC-SHA256 signed CDN URLs with expiration tokens.
4. **`MediaProviderRegistry`**: Enforces security policies, capabilities introspection, and provider resolution.

---

## 🎧 High-Reliability Native HTML5 Audio Engine

The audio engine (`apps/web/src/lib/audioEngine.ts`) delivers zero-drop playback:
- **Native HTML5 Audio**: State machine (`idle`, `loading`, `ready`, `playing`, `paused`, `buffering`, `ended`, `error`).
- **HTTP 206 Range Streaming**: Backend slices audio buffers (`Accept-Ranges: bytes`, `Content-Range: bytes start-end/total`), enabling instant scrubbing and low buffer latency.
- **Media Session API**:
  - Full lockscreen and notification center controls (iOS, Android, smartwatch, Bluetooth head units).
  - Artwork provided in 5 responsive resolutions (`96x96` to `512x512`).
  - Action handlers: `play`, `pause`, `previoustrack`, `nexttrack`, `seekto`, `seekbackward`, `seekforward`, `stop`.
  - Real-time `navigator.mediaSession.setPositionState`.
- **Autoplay Policy Resilience**: Gracefully catches `NotAllowedError` without crashing and provides user gesture prompts.
- **Automatic Preloading**: Preloads next track in queue via background prefetch audio element for seamless track transitions.
- **Sleep Timer with Smooth Fade-out**: Automatically ramps down master volume over 2-3 seconds before pausing.

---

## 📱 Mobile-First UI/UX & PWA

- **Bottom Navigation**: Ergonomic bottom tab bar (`Home`, `Search`, `Library`, `Lyrics`, `Offline`) with `env(safe-area-inset-bottom)` safe-area padding.
- **Floating Mini-Player**:
  - Anchored right above bottom nav with glowing progress bar, like button, and large play target (>= 44px).
  - Tap to expand into Full-Screen Player with fluid 60fps spring transitions (Framer Motion).
- **Immersive Full-Screen Player**:
  - Dynamic ambient color glow matching album art.
  - Large vinyl disc with rotation animation when playing.
  - Interactive scrub slider with buffered time indication.
  - Real-time synchronized **LRC Lyrics View** (`apps/web/src/components/player/LyricsView.tsx`):
    - Automatically highlights active lyric line.
    - Smooth auto-scrolls to keep current lyric centered.
    - **Tap any lyric line** to jump audio directly to that exact timestamp!
  - Up Next Queue drawer with drag reordering, track removal, and tap-to-play.
  - Playback speed control (0.75x, 1x, 1.25x, 1.5x, 2x).
  - Sleep timer modal (15m, 30m, 45m, 60m, end-of-track).
- **Desktop Responsiveness**:
  - Left navigation sidebar + top search header.
  - Persistent bottom audio player bar with volume slider and scrubber.
- **PWA Capabilities**:
  - Web App Manifest (`manifest.json`) with standalone display mode.
  - Service Worker (`public/sw.js`):
    - Caches app shell.
    - Caches track metadata (network-first / stale-while-revalidate).
    - Caches audio streams in `pulse-audio-offline-v1` with **client-side Range request slicing** so offline audio can still be scrubbed!
  - 1-Click "Download for Offline" feature and dedicated `/offline` page.
  - Custom install banner (`beforeinstallprompt`).

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ (Node.js 24 recommended)
- pnpm 10+ (`npm install -g pnpm`)

### 1. Installation
Clone and install all workspace dependencies:
```bash
pnpm install
```

### 2. Build Shared Package
Build the shared TypeScript contracts:
```bash
pnpm --filter @music/shared build
```

### 3. Run in Development Mode
Run both the Web app and API concurrently:
```bash
pnpm dev
```
- Web Application: [http://localhost:3000](http://localhost:3000)
- API Service: [http://localhost:4000](http://localhost:4000)
- API Health Check: [http://localhost:4000/health](http://localhost:4000/health)

Or run individually:
```bash
pnpm dev:web    # Starts Next.js 16 on port 3000
pnpm dev:api    # Starts Express API with tsx watch on port 4000
```

### 4. Build for Production
```bash
pnpm build
```

### 5. Running with Docker Compose
```bash
docker-compose -f docker/docker-compose.yml up --build
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | System health, uptime, memory, and provider status |
| `GET` | `/api/tracks` | Paginated track catalog with genre/artist/search filters |
| `GET` | `/api/tracks/:id` | Track details and resolved stream source |
| `GET` | `/api/tracks/:id/stream` | Audio stream supporting HTTP 206 Range requests |
| `GET` | `/api/tracks/:id/lyrics` | Synced LRC lyrics + millisecond parsed lines |
| `POST` | `/api/tracks/:id/like` | Toggle track favorite state |
| `GET` | `/api/playlists` | List curated and user playlists |
| `GET` | `/api/playlists/:id` | Get playlist with track details |
| `POST` | `/api/playlists` | Create new playlist (`CreatePlaylistSchema`) |
| `POST` | `/api/playlists/:id/tracks` | Add track to playlist |
| `DELETE` | `/api/playlists/:id/tracks/:trackId` | Remove track from playlist |
| `GET` | `/api/search?q=...` | Cross-entity search (tracks, playlists, genres) |
| `GET` | `/api/genres` | Available music genres with gradients & counts |
| `GET` | `/api/providers` | Active MediaProvider registry status & capabilities |
