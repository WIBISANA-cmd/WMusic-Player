const CACHE_NAME = 'pulse-shell-v1';
const AUDIO_CACHE = 'pulse-audio-offline-v1';
const DATA_CACHE = 'pulse-data-v1';

const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== AUDIO_CACHE && key !== DATA_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Audio stream requests (/api/stream/*)
  if (url.pathname.startsWith('/api/stream/')) {
    event.respondWith(handleAudioFetch(event.request));
    return;
  }

  // 2. Track/Playlist metadata API requests: Stale-while-revalidate or Network-first
  if (url.pathname.startsWith('/api/tracks') || url.pathname.startsWith('/api/playlists') || url.pathname.startsWith('/api/genres')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. Static assets & pages: Cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        // Return offline root shell if navigation fails
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

/**
 * Handles audio fetch with Range slicing support from CacheStorage
 */
async function handleAudioFetch(request) {
  const audioCache = await caches.open(AUDIO_CACHE);
  // Match without Range header
  const cleanUrl = request.url.split('?')[0];
  const cachedResponse = await audioCache.match(cleanUrl);

  const rangeHeader = request.headers.get('range');

  if (cachedResponse) {
    if (!rangeHeader) {
      return cachedResponse;
    }

    // Serve partial slice from cached arrayBuffer
    const arrayBuffer = await cachedResponse.arrayBuffer();
    const totalSize = arrayBuffer.byteLength;
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

    if (start >= totalSize || end >= totalSize) {
      return new Response('Range not satisfiable', {
        status: 416,
        headers: { 'Content-Range': `bytes */${totalSize}` }
      });
    }

    const sliced = arrayBuffer.slice(start, end + 1);
    return new Response(sliced, {
      status: 206,
      headers: {
        'Content-Type': cachedResponse.headers.get('Content-Type') || 'audio/wav',
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Content-Length': String(end - start + 1),
        'Accept-Ranges': 'bytes'
      }
    });
  }

  // Fallback to network fetch
  return fetch(request);
}

// Listen for message events (e.g. manually pre-caching a track for offline listening)
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'CACHE_AUDIO_TRACK') {
    const { audioUrl, trackId } = event.data;
    try {
      const response = await fetch(audioUrl);
      if (response.ok) {
        const cache = await caches.open(AUDIO_CACHE);
        const cleanUrl = new URL(audioUrl, self.location.origin).origin + `/api/stream/${trackId}`;
        await cache.put(cleanUrl, response);
        event.ports[0]?.postMessage({ success: true, trackId });
      }
    } catch (err) {
      event.ports[0]?.postMessage({ success: false, error: String(err) });
    }
  }

  if (event.data && event.data.type === 'REMOVE_AUDIO_TRACK') {
    const { trackId } = event.data;
    try {
      const cache = await caches.open(AUDIO_CACHE);
      const cleanUrl = self.location.origin + `/api/stream/${trackId}`;
      await cache.delete(cleanUrl);
      event.ports[0]?.postMessage({ success: true, trackId });
    } catch (err) {
      event.ports[0]?.postMessage({ success: false, error: String(err) });
    }
  }
});
