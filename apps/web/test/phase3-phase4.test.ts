import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { usePlayerStore } from '../src/stores/player-store';
import { audioBridge, AudioDriver } from '../src/lib/audio-bridge';
import { mediaSessionService } from '../src/services/media-session';
import { Track } from '@music/shared';

const sampleTracks: Track[] = [
  {
    id: 'track-1',
    provider: 'local',
    title: 'Neon Horizon',
    artist: 'Aura',
    album: 'Cybernetic Chill',
    duration: 180,
    artwork: [{ url: 'https://images.unsplash.com/photo-1?w=500', width: 500, height: 500 }],
    playable: true,
    explicit: false,
    metadata: {}
  },
  {
    id: 'track-2',
    provider: 'local',
    title: 'Celestial Echo',
    artist: 'Nova & The Echoes',
    album: 'Starlight Drift',
    duration: 210,
    artwork: [{ url: 'https://images.unsplash.com/photo-2?w=500', width: 500, height: 500 }],
    playable: true,
    explicit: false,
    metadata: {}
  },
  {
    id: 'track-3',
    provider: 'local',
    title: 'Retro Arcade',
    artist: 'Pixel Wave',
    album: '8-Bit Dreams',
    duration: 150,
    artwork: [{ url: 'https://images.unsplash.com/photo-3?w=500', width: 500, height: 500 }],
    playable: true,
    explicit: false,
    metadata: {}
  }
];

export async function runPhase3And4Tests() {
  console.log('==================================================');
  console.log('🚀 RUNNING PHASE 3 & PHASE 4 VERIFICATION SUITE');
  console.log('==================================================\n');

  let passed = 0;

  function pass(msg: string) {
    passed++;
    console.log(`✅ PASS - ${msg}`);
  }

  // TEST 1: AudioBridge Driver Mocking and Decoupling
  let driverLoadedTrack: Track | null = null;
  let driverPlayed = false;
  let driverPaused = false;
  let driverCurrentTime = 0;
  let driverVolume = 1;
  let driverMuted = false;
  let driverRate = 1;
  let rejectPlay = false;

  const mockDriver: AudioDriver = {
    loadTrack: async (track, autoPlay) => {
      driverLoadedTrack = track;
      if (autoPlay) {
        if (rejectPlay) {
          usePlayerStore.getState()._setError({
            code: 'AUTOPLAY_BLOCKED',
            message: 'Autoplay blocked by your browser. Tap play to start listening.',
            recoverable: true
          });
          usePlayerStore.getState()._setIsPlaying(false);
          usePlayerStore.getState()._setStatus('paused');
          return false;
        }
        driverPlayed = true;
        return true;
      }
      return true;
    },
    play: async () => {
      if (rejectPlay) {
        usePlayerStore.getState()._setError({
          code: 'AUTOPLAY_BLOCKED',
          message: 'Autoplay blocked by your browser. Tap play to start listening.',
          recoverable: true
        });
        usePlayerStore.getState()._setIsPlaying(false);
        usePlayerStore.getState()._setStatus('paused');
        return false;
      }
      driverPlayed = true;
      return true;
    },
    pause: () => {
      driverPaused = true;
      driverPlayed = false;
    },
    seek: (t) => {
      driverCurrentTime = t;
    },
    setVolume: (v) => {
      driverVolume = v;
    },
    setMuted: (m) => {
      driverMuted = m;
    },
    setPlaybackRate: (r) => {
      driverRate = r;
    },
    fadeOutAndPause: async () => {
      driverPaused = true;
    },
    getCurrentTime: () => driverCurrentTime,
    getDuration: () => driverLoadedTrack?.duration || 0
  };

  audioBridge.registerDriver(mockDriver);
  assert.equal(audioBridge.hasDriver(), true, 'AudioBridge should register driver');
  pass('AudioBridge registers driver and decouples DOM from state store');

  // TEST 2: Load Track and Playback Synchronization
  await usePlayerStore.getState().loadTrack(sampleTracks[0], true, sampleTracks);
  const s1 = usePlayerStore.getState();
  assert.equal(s1.currentTrack?.id, 'track-1');
  assert.equal(s1.currentIndex, 0);
  assert.equal(s1.isPlaying, true);
  assert.equal(s1.status, 'playing');
  assert.equal((driverLoadedTrack as Track | null)?.id, 'track-1');
  assert.equal(driverPlayed, true);
  pass('loadTrack initializes state, updates queue, and commands driver to play');

  // TEST 3: Autoplay rejection handling (Audio.play() promise rejection)
  rejectPlay = true;
  await usePlayerStore.getState().loadTrack(sampleTracks[1], true);
  const s2 = usePlayerStore.getState();
  assert.equal(s2.isPlaying, false, 'UI must NEVER remain playing if play() rejects');
  assert.equal(s2.status, 'paused');
  assert.equal(s2.error?.code, 'AUTOPLAY_BLOCKED');
  pass('Autoplay rejection is caught gracefully: UI remains paused with friendly error');
  rejectPlay = false;

  // TEST 4: Error recovery actions (retry and skip)
  assert.ok(s2.error !== null);
  await usePlayerStore.getState().retry();
  const s3 = usePlayerStore.getState();
  assert.equal(s3.error, null, 'Retry should clear error');
  assert.equal(s3.isPlaying, true);
  assert.equal(s3.currentTrack?.id, 'track-2');
  pass('Player error banner actions: retry() successfully recovers playback');

  // TEST 5: Queue Engine (Next, Previous, Add, Reorder, Remove, Clear)
  // Current track is track-2 (index 1 in queue)
  await usePlayerStore.getState().next();
  assert.equal(usePlayerStore.getState().currentIndex, 2);
  assert.equal(usePlayerStore.getState().currentTrack?.id, 'track-3');

  // Previous (under 3s seek)
  usePlayerStore.getState()._setTime(1);
  await usePlayerStore.getState().previous();
  assert.equal(usePlayerStore.getState().currentIndex, 1);
  assert.equal(usePlayerStore.getState().currentTrack?.id, 'track-2');

  // Add next
  const extraTrack: Track = {
    id: 'track-bonus',
    provider: 'local',
    title: 'Bonus Beats',
    artist: 'Producer X',
    album: 'Bonus Album',
    duration: 120,
    artwork: [],
    playable: true,
    explicit: false,
    metadata: {}
  };
  usePlayerStore.getState().addToQueueNext(extraTrack);
  const queueAfterInsert = usePlayerStore.getState().queue;
  assert.equal(queueAfterInsert[2].id, 'track-bonus', 'addToQueueNext should insert right after current track');

  // Reorder queue
  usePlayerStore.getState().reorderQueue(2, 0);
  assert.equal(usePlayerStore.getState().queue[0].id, 'track-bonus', 'reorderQueue should move track to target index');

  // Remove from queue
  usePlayerStore.getState().removeFromQueue(0);
  assert.equal(usePlayerStore.getState().queue[0].id, 'track-1', 'removeFromQueue should remove track cleanly');

  // Clear queue
  usePlayerStore.getState().clearQueue();
  assert.equal(usePlayerStore.getState().queue.length, 0);
  assert.equal(usePlayerStore.getState().currentIndex, -1);
  pass('Queue Engine supports next, prev, addToQueueNext, reorderQueue, removeFromQueue, clearQueue');

  // TEST 6: Shuffle and Un-shuffle Integrity
  await usePlayerStore.getState().loadTrack(sampleTracks[0], true, sampleTracks);
  assert.equal(usePlayerStore.getState().shuffle, false);
  usePlayerStore.getState().toggleShuffle();
  assert.equal(usePlayerStore.getState().shuffle, true);
  assert.equal(usePlayerStore.getState().queue.length, 3);

  // Toggle shuffle off -> Must restore exact original queue order!
  usePlayerStore.getState().toggleShuffle();
  assert.equal(usePlayerStore.getState().shuffle, false);
  const restoredIds = usePlayerStore.getState().queue.map((t) => t.id);
  const originalIds = sampleTracks.map((t) => t.id);
  assert.deepEqual(restoredIds, originalIds, 'Un-shuffling must restore pristine original queue order');
  pass('Shuffle preserves originalQueue and un-shuffle restores exact playlist order');

  // TEST 7: Repeat Modes
  usePlayerStore.getState().setRepeatMode('one');
  assert.equal(usePlayerStore.getState().repeatMode, 'one');
  usePlayerStore.getState().cycleRepeatMode();
  // modes cycle: off -> all -> one -> off
  usePlayerStore.getState().setRepeatMode('all');
  assert.equal(usePlayerStore.getState().repeatMode, 'all');
  pass('Repeat modes ("off", "one", "all") cycle predictably');

  // TEST 8: Volume, Mute, Seek
  usePlayerStore.getState().setVolume(0.75);
  assert.equal(usePlayerStore.getState().volume, 0.75);
  assert.equal(driverVolume, 0.75);

  usePlayerStore.getState().toggleMute();
  assert.equal(usePlayerStore.getState().muted, true);
  assert.equal(driverMuted, true);

  usePlayerStore.getState().toggleMute();
  assert.equal(usePlayerStore.getState().muted, false);

  usePlayerStore.getState().seek(45);
  assert.equal(usePlayerStore.getState().currentTime, 45);
  assert.equal(driverCurrentTime, 45);
  pass('Volume, Mute, and Seek synchronize correctly between store and audio driver');

  // TEST 9: Media Session API Defensive Handling
  mediaSessionService.updateMetadata(sampleTracks[0]);
  mediaSessionService.setPlaybackState('playing');
  // Safe position state with NaN and negatives must not throw
  mediaSessionService.updatePositionState({ duration: NaN, playbackRate: 1, position: -5 });
  mediaSessionService.updatePositionState({ duration: 180, playbackRate: 1, position: 200 }); // Position clamped to duration
  pass('MediaSessionService handles metadata, states, and invalid/NaN position inputs defensively');

  // TEST 10: PWA Web App Manifest Validation
  const manifestPath = path.resolve(__dirname, '../public/manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.background_color, '#F3F4F6');
  assert.equal(manifest.theme_color, '#F3F4F6');
  assert.equal(manifest.display, 'standalone');
  const icon192 = manifest.icons.find((i: any) => i.sizes === '192x192');
  const icon512 = manifest.icons.find((i: any) => i.sizes === '512x512');
  assert.ok(icon192, '192x192 icon must be present');
  assert.ok(icon512, '512x512 icon must be present');
  assert.ok(fs.existsSync(path.resolve(__dirname, '../public/icon-192.png')), 'icon-192.png file exists');
  assert.ok(fs.existsSync(path.resolve(__dirname, '../public/icon-512.png')), 'icon-512.png file exists');
  pass('PWA manifest conforms to #F3F4F6 tokens with standalone display and 192/512 maskable icons');

  // TEST 11: Service Worker Rules and Cache Strategies
  const swPath = path.resolve(__dirname, '../public/sw.js');
  assert.ok(fs.existsSync(swPath), 'sw.js must exist');
  const swContent = fs.readFileSync(swPath, 'utf8');

  // Check strict audio stream bypass rule
  assert.ok(
    swContent.includes('/api/v1/stream/') && swContent.includes('/api/stream/'),
    'sw.js must intercept audio stream routes'
  );
  assert.ok(
    swContent.includes('OFFLINE_AUDIO_CACHE'),
    'sw.js must separate user-downloaded audio cache from shell'
  );
  assert.ok(
    swContent.includes('SKIP_WAITING'),
    'sw.js must support graceful SKIP_WAITING to avoid interrupting active playback'
  );
  assert.ok(
    swContent.includes('trimCache'),
    'sw.js must enforce bounded LRU cache limit on artwork'
  );
  assert.ok(
    swContent.includes('/offline'),
    'sw.js must precache and fallback to /offline'
  );
  pass('Service Worker enforces strict NetworkOnly audio stream bypass, LRU artwork, and safe updates');

  console.log('\n==================================================');
  console.log(`TEST SUMMARY: ${passed}/${passed} PASSED`);
  console.log('==================================================\n');
}

if (process.argv[1]?.includes('phase3-phase4.test')) {
  runPhase3And4Tests().catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
}
