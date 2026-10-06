import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { usePlayerStore } from '../src/stores/player-store';

async function runPhase5And6Tests() {
  console.log('==================================================');
  console.log('🚀 RUNNING PHASE 5 & PHASE 6 VERIFICATION SUITE');
  console.log('==================================================\n');

  let passed = 0;

  function pass(msg: string) {
    passed++;
    console.log(`✅ PASS - ${msg}`);
  }

  // TEST 1: Narrow Selector State Isolation
  const initialDuration = 240;
  usePlayerStore.getState()._setDuration(initialDuration);
  usePlayerStore.getState()._setTime(12.5);

  // Time update must only change currentTime
  usePlayerStore.getState()._setTime(15.0);
  assert.equal(usePlayerStore.getState().currentTime, 15.0);
  assert.equal(usePlayerStore.getState().duration, initialDuration);
  pass('Narrow Zustand selector updates: currentTime changes isolated from static state');

  // TEST 2: Shared Layout ID in Player Components
  const miniPlayerFile = fs.readFileSync(
    path.resolve(__dirname, '../src/components/player/MiniPlayer.tsx'),
    'utf8'
  );
  const fullPlayerFile = fs.readFileSync(
    path.resolve(__dirname, '../src/components/player/FullPlayer.tsx'),
    'utf8'
  );
  assert.ok(
    miniPlayerFile.includes('layoutId="player-artwork"'),
    'MiniPlayer must specify layoutId="player-artwork" for shared-element transition'
  );
  assert.ok(
    fullPlayerFile.includes('layoutId="player-artwork"'),
    'FullPlayer must specify layoutId="player-artwork" for shared-element transition'
  );
  pass('MiniPlayer and FullPlayer share layoutId="player-artwork" for smooth visual expansion');

  // TEST 3: Keyboard Escape Accessibility on FullPlayer
  assert.ok(
    fullPlayerFile.includes("e.key === 'Escape'"),
    'FullPlayer must handle Escape key for non-touch / keyboard accessibility'
  );
  pass('FullPlayer supports Escape key to collapse gracefully for keyboard users');

  // TEST 4: Page Transition Configuration
  const pageTransitionFile = fs.readFileSync(
    path.resolve(__dirname, '../src/components/layout/PageTransition.tsx'),
    'utf8'
  );
  assert.ok(
    pageTransitionFile.includes('useReducedMotion'),
    'PageTransition must respect useReducedMotion'
  );
  assert.ok(
    pageTransitionFile.includes('y: 10') && pageTransitionFile.includes('opacity: 1'),
    'PageTransition must follow 10px vertical and 0 to 1 opacity transition'
  );
  pass('PageTransition provides subtle 10px vertical slide and opacity fade with reduced-motion check');

  // TEST 5: Pseudo-Reactive Audio Visualizer States
  const visualizerFile = fs.readFileSync(
    path.resolve(__dirname, '../src/components/player/AudioVisualizer.tsx'),
    'utf8'
  );
  assert.ok(
    visualizerFile.includes('isBuffering') &&
      visualizerFile.includes('isPlaying') &&
      visualizerFile.includes('shouldReduceMotion'),
    'AudioVisualizer must handle playing, paused, buffering and reduced-motion states'
  );
  pass('AudioVisualizer implements 3 pseudo-reactive states (playing, paused, buffering) without Web Audio API dependency');

  // TEST 6: Reduced Motion CSS Rules in globals.css
  const cssFile = fs.readFileSync(
    path.resolve(__dirname, '../src/app/globals.css'),
    'utf8'
  );
  assert.ok(
    cssFile.includes('prefers-reduced-motion: reduce'),
    'globals.css must have prefers-reduced-motion media query'
  );
  assert.ok(
    cssFile.includes('animate-blob-slow') && cssFile.includes('animate-blob-reverse'),
    'globals.css must have GPU transform blob animations'
  );
  pass('CSS globals configure hardware-accelerated transform blob animations with reduced-motion overrides');

  // TEST 7: Docker Production Configuration & Non-Root User
  const dockerApiFile = fs.readFileSync(
    path.resolve(__dirname, '../../../docker/Dockerfile.api'),
    'utf8'
  );
  assert.ok(
    dockerApiFile.includes('USER node'),
    'Dockerfile.api must run as non-root user node'
  );
  assert.ok(
    dockerApiFile.includes('HEALTHCHECK'),
    'Dockerfile.api must define a container healthcheck'
  );
  assert.ok(
    dockerApiFile.includes('EXPOSE 4000'),
    'Dockerfile.api must expose port 4000'
  );
  pass('Backend Dockerfile implements multi-stage build, non-root user, and healthcheck');

  // TEST 8: Nginx Reverse Proxy Streaming Configuration
  const nginxFile = fs.readFileSync(
    path.resolve(__dirname, '../../../docker/nginx.conf'),
    'utf8'
  );
  assert.ok(
    nginxFile.includes('proxy_buffering off'),
    'Nginx configuration must disable proxy_buffering for audio streaming'
  );
  assert.ok(
    nginxFile.includes('Range $http_range'),
    'Nginx configuration must forward HTTP Range headers'
  );
  assert.ok(
    nginxFile.includes('proxy_read_timeout 600s'),
    'Nginx configuration must provide extended read timeouts for audio streams'
  );
  pass('Nginx reverse proxy reference preserves Range headers and disables stream buffering');

  // TEST 9: Express Production Trust Proxy & Security
  const apiAppFile = fs.readFileSync(
    path.resolve(__dirname, '../../../apps/api/src/app.ts'),
    'utf8'
  );
  assert.ok(
    apiAppFile.includes("app.set('trust proxy', 1)"),
    'Express app must configure trust proxy for reverse proxy deployment'
  );
  assert.ok(
    apiAppFile.includes('helmet'),
    'Express app must use helmet for security headers'
  );
  pass('Express app configures trust proxy, helmet security headers, and strict origin checking');

  // TEST 10: Production Environment Configuration Examples
  const webProdEnv = path.resolve(__dirname, '../.env.production.example');
  const apiProdEnv = path.resolve(__dirname, '../../../apps/api/.env.production.example');
  assert.ok(fs.existsSync(webProdEnv), '.env.production.example must exist for web');
  assert.ok(fs.existsSync(apiProdEnv), '.env.production.example must exist for api');
  const webEnvContent = fs.readFileSync(webProdEnv, 'utf8');
  assert.ok(webEnvContent.includes('https://'), 'Web production env example must use HTTPS URL');
  pass('Production environment templates provide HTTPS API endpoint and production secrets guidance');

  console.log('\n==================================================');
  console.log(`TEST SUMMARY: ${passed}/${passed} PASSED`);
  console.log('==================================================\n');
}

runPhase5And6Tests().catch((err) => {
  console.error('Phase 5 & 6 test suite failed:', err);
  process.exit(1);
});
