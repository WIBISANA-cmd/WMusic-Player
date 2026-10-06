const CACHE_VERSION = 'v2';
const SHELL_CACHE = `pulse-shell-${CACHE_VERSION}`;
const FONTS_CACHE = `pulse-fonts-${CACHE_VERSION}`;
const ARTWORK_CACHE = `pulse-artwork-${CACHE_VERSION}`;
const DATA_CACHE = `pulse-data-${CACHE_VERSION}`;
const OFFLINE_AUDIO_CACHE = 'pulse-audio-offline-v1'; // Preserved across shell version upgrades

const SHELL_ASSETS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

const MAX_ARTWORK_ENTRIES = 50;

// Helper: Trim cache to max entries
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await trimCache(cacheName, maxItems);
  }
}

// 1. Install Phase
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('Pre-caching shell assets non-fatal warning:', err);
      });
    })
  );
  // Note: We do NOT unconditionally call self.skipWaiting() here to avoid
  // abruptly disrupting active user audio playback. We wait for user confirmation.
});

// 2. Activate Phase
self.addEventListener('activate', (event) => {
  const expectedCaches = [SHELL_CACHE, FONTS_CACHE, ARTWORK_CACHE, DATA_CACHE, OFFLINE_AUDIO_CACHE];

  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!expectedCaches.includes(key)) {
            console.log('Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event Routing
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // STRATEGY 1: Audio Streams (/api/v1/stream/** or /api/stream/**)
  // STRICT RULE: Must be strictly NetworkOnly for on-the-fly streaming!
  // NEVER automatically cache raw stream chunks into CacheStorage to prevent runaway cache bloat.
  // Exception: If the user explicitly downloaded the track into OFFLINE_AUDIO_CACHE, serve it.
  if (url.pathname.startsWith('/api/v1/stream/') || url.pathname.startsWith('/api/stream/')) {
    event.respondWith(handleAudioRequest(request));
    return;
  }

  // STRATEGY 2: Navigation requests (HTML documents)
  // NetworkFirst with fallback to precached /offline or /
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline').then((cachedOffline) => {
          return cachedOffline || caches.match('/');
        });
      })
    );
    return;
  }

  // STRATEGY 3: Fonts (Google fonts, gstatic, local woff2/woff)
  // CacheFirst with Network fallback and expiration cache
  if (
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    request.destination === 'font' ||
    url.pathname.match(/\.(woff2?|ttf|otf|eot)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkRes) => {
          if (networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(FONTS_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // STRATEGY 4: Cover Art & Images (Unsplash, artwork URLs, icons, SVGs)
  // StaleWhileRevalidate with bounded cache size (LRU limit)
  if (
    request.destination === 'image' ||
    url.hostname.includes('images.unsplash.com') ||
    url.pathname.match(/\.(png|jpe?g|svg|webp|avif)$/)
  ) {
    event.respondWith(
      caches.open(ARTWORK_CACHE).then((cache) => {
        return cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((networkRes) => {
              if (networkRes.ok) {
                cache.put(request, networkRes.clone());
                trimCache(ARTWORK_CACHE, MAX_ARTWORK_ENTRIES);
              }
              return networkRes;
            })
            .catch(() => cached);

          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // STRATEGY 5: Data API requests (/api/v1/tracks, /api/tracks)
  // NetworkFirst with cache fallback
  if (url.pathname.startsWith('/api/v1/') || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // STRATEGY 6: App Shell & Static Assets (_next/static, scripts, styles)
  // CacheFirst with Network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Cache static Next.js assets
        if (response.ok && url.pathname.startsWith('/_next/static/')) {
          const clone = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

/**
 * Handle audio requests:
 * 1. Check if explicitly saved by user in OFFLINE_AUDIO_CACHE.
 * 2. If present in cache, support HTTP 206 byte-range slicing.
 * 3. Otherwise STRICTLY NetworkOnly fetch without caching.
 */
async function handleAudioRequest(request) {
  const audioCache = await caches.open(OFFLINE_AUDIO_CACHE);
  const cleanUrl = request.url.split('?')[0];

  // Try matching clean URL or variations
  let cachedResponse = await audioCache.match(cleanUrl);
  if (!cachedResponse) {
    const trackIdMatch = cleanUrl.match(/\/stream\/([^/?#]+)/);
    if (trackIdMatch) {
      cachedResponse = await audioCache.match(`${self.location.origin}/api/stream/${trackIdMatch[1]}`);
    }
  }

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

  // STRICTLY NetworkOnly: Audio streams MUST NOT be automatically saved to cache!
  return fetch(request).catch(() => {
    return new Response(
      JSON.stringify({
        error: {
          code: 'OFFLINE_UNAVAILABLE',
          message: 'This track is not available offline. Please download it first.'
        }
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  });
}

// 4. Message Event Handling (Explicit offline caching & Skip Waiting update)
self.addEventListener('message', async (event) => {
  if (!event.data) return;

  // Controlled update activation (does not interrupt active playback)
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // Explicit user download for offline listening
  if (event.data.type === 'CACHE_AUDIO_TRACK') {
    const { audioUrl, trackId } = event.data;
    try {
      const response = await fetch(audioUrl);
      if (response.ok) {
        const cache = await caches.open(OFFLINE_AUDIO_CACHE);
        const canonicalKey = `${self.location.origin}/api/stream/${trackId}`;
        await cache.put(canonicalKey, response);
        event.ports[0]?.postMessage({ success: true, trackId });
      } else {
        event.ports[0]?.postMessage({ success: false, error: `Fetch failed: ${response.status}` });
      }
    } catch (err) {
      event.ports[0]?.postMessage({ success: false, error: String(err) });
    }
    return;
  }

  // Remove downloaded track
  if (event.data.type === 'REMOVE_AUDIO_TRACK') {
    const { trackId } = event.data;
    try {
      const cache = await caches.open(OFFLINE_AUDIO_CACHE);
      const canonicalKey = `${self.location.origin}/api/stream/${trackId}`;
      await cache.delete(canonicalKey);
      event.ports[0]?.postMessage({ success: true, trackId });
    } catch (err) {
      event.ports[0]?.postMessage({ success: false, error: String(err) });
    }
  }
});
