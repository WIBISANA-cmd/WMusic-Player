import { extractYouTubeVideoId, registerYouTubeDriver, getYouTubeDriver, YouTubeDriver } from '../src/lib/youtube-iframe';
import { usePlayerStore } from '../src/stores/player-store';
import { Track } from '@music/shared';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL - ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASS - ${message}`);
}

export async function runYouTubeTests() {
  console.log('\n==================================================');
  console.log('🚀 RUNNING YOUTUBE PROVIDER & VIDEO PLAYER TESTS');
  console.log('==================================================\n');

  // Test 1: extractYouTubeVideoId parses multiple formats
  const id1 = extractYouTubeVideoId('yt-k4V3Mo61fJM');
  const id2 = extractYouTubeVideoId('https://www.youtube.com/watch?v=k4V3Mo61fJM');
  const id3 = extractYouTubeVideoId('https://youtu.be/k4V3Mo61fJM');
  const id4 = extractYouTubeVideoId('k4V3Mo61fJM');

  assert(id1 === 'k4V3Mo61fJM', 'extractYouTubeVideoId extracts from yt- prefix');
  assert(id2 === 'k4V3Mo61fJM', 'extractYouTubeVideoId extracts from youtube.com watch URL');
  assert(id3 === 'k4V3Mo61fJM', 'extractYouTubeVideoId extracts from youtu.be short URL');
  assert(id4 === 'k4V3Mo61fJM', 'extractYouTubeVideoId handles raw 11-char video ID');

  // Test 2: registerYouTubeDriver & getYouTubeDriver
  let driverCalledWith: string | null = null;
  let driverPlayCalled = false;
  let driverPauseCalled = false;

  const mockYtDriver: YouTubeDriver = {
    loadTrack: async (vId: string) => {
      driverCalledWith = vId;
      return true;
    },
    play: async () => {
      driverPlayCalled = true;
      return true;
    },
    pause: () => {
      driverPauseCalled = true;
    },
    seek: () => {},
    setVolume: () => {},
    setMuted: () => {},
    setPlaybackRate: () => {},
    getCurrentTime: () => 45,
    getDuration: () => 240
  };

  registerYouTubeDriver(mockYtDriver);
  assert(getYouTubeDriver() === mockYtDriver, 'YouTube driver registers and is retrievable via getYouTubeDriver');

  // Test 3: Zustand store loads YouTube track seamlessly
  const sampleYtTrack: Track = {
    id: 'yt-k4V3Mo61fJM',
    provider: 'youtube',
    title: 'Fix You (Official Video)',
    artist: 'Coldplay',
    album: 'YouTube Music',
    duration: 294,
    artwork: [{ url: 'https://i.ytimg.com/vi/k4V3Mo61fJM/hqdefault.jpg', width: 480, height: 360 }],
    playable: true,
    explicit: false,
    metadata: { videoId: 'k4V3Mo61fJM' }
  };

  await usePlayerStore.getState().loadTrack(sampleYtTrack, false);
  const state = usePlayerStore.getState();

  assert(state.currentTrack?.id === 'yt-k4V3Mo61fJM', 'YouTube track is set as currentTrack in player store');
  assert(state.currentTrack?.provider === 'youtube', 'Track provider is recognized as youtube');
  assert(state.duration === 294, 'YouTube track duration is synchronized');

  // Cleanup
  registerYouTubeDriver(null);
  assert(getYouTubeDriver() === null, 'YouTube driver unregisters cleanly');

  console.log('\n==================================================');
  console.log('TEST SUMMARY: ALL YOUTUBE PROVIDER TESTS PASSED');
  console.log('==================================================\n');
}

if (process.argv[1]?.includes('youtube-provider.test')) {
  runYouTubeTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
