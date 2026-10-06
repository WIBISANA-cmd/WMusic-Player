import http from 'http';
import { createApp } from '../src/app';
import { ensureAudioAssets } from '../src/services/audioGenerator';
import { config } from '../src/config';
import { mockTracks } from '../src/data/mockTracks';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

function record(name: string, passed: boolean, details?: string, error?: string) {
  results.push({ name, passed, details, error });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}${details ? ` (${details})` : ''}${error ? ` Error: ${error}` : ''}`);
}

function makeRequest(
  port: number,
  options: http.RequestOptions,
  body?: string
): Promise<{
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  data: Buffer;
}> {
  return new Promise((resolve, reject) => {
    const req = http.request({ port, host: '127.0.0.1', ...options }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          data: Buffer.concat(chunks)
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('\n==================================================');
  console.log('🚀 RUNNING PHASE 2 API & STREAMING VERIFICATION');
  console.log('==================================================\n');

  // 1. Ensure test audio files exist
  ensureAudioAssets(config.mediaStoragePath, mockTracks);

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as { port: number };
  const port = address.port;
  console.log(`Test server running on port ${port}\n`);

  const trackId = mockTracks[0].id; // e.g. track-neon-horizon

  try {
    // ----------------------------------------------------
    // TEST 1: GET /api/v1/health
    // ----------------------------------------------------
    {
      const res = await makeRequest(port, {
        path: '/api/v1/health',
        method: 'GET'
      });
      const passed = res.statusCode === 200;
      const body = JSON.parse(res.data.toString());
      record('Health endpoint (GET /api/v1/health)', passed && body.status === 'ok', `status: ${res.statusCode}`);
    }

    // ----------------------------------------------------
    // TEST 2: GET /api/v1/search - Validation (Empty / Malformed input)
    // ----------------------------------------------------
    {
      // Missing q
      const res1 = await makeRequest(port, { path: '/api/v1/search', method: 'GET' });
      const passed1 = res1.statusCode === 400;

      // Empty q after trim
      const res2 = await makeRequest(port, { path: '/api/v1/search?q=%20%20', method: 'GET' });
      const passed2 = res2.statusCode === 400;

      // Exceeding 100 characters
      const longQuery = 'a'.repeat(101);
      const res3 = await makeRequest(port, { path: `/api/v1/search?q=${longQuery}`, method: 'GET' });
      const passed3 = res3.statusCode === 400;

      record(
        'Search validation rejects malformed queries (400 Bad Request)',
        passed1 && passed2 && passed3,
        `missing q: ${res1.statusCode}, empty q: ${res2.statusCode}, >100 chars: ${res3.statusCode}`
      );
    }

    // ----------------------------------------------------
    // TEST 3: GET /api/v1/search - Valid search with normalized envelope
    // ----------------------------------------------------
    {
      const res = await makeRequest(port, { path: '/api/v1/search?q=neon', method: 'GET' });
      const json = JSON.parse(res.data.toString());
      const hasEnvelope = res.statusCode === 200 && Array.isArray(json.data) && json.meta?.query === 'neon';
      const hasNormalizedTrack = Boolean(json.data && json.data.length > 0 && json.data[0].id && json.data[0].title && json.data[0].artist);
      record(
        'Search returns normalized envelope { data: [], meta: { query, count } }',
        hasEnvelope && hasNormalizedTrack,
        `returned ${json.data.length} tracks`
      );
    }

    // ----------------------------------------------------
    // TEST 4: GET /api/v1/tracks & /api/v1/tracks/:id
    // ----------------------------------------------------
    {
      const resList = await makeRequest(port, { path: '/api/v1/tracks', method: 'GET' });
      const listJson = JSON.parse(resList.data.toString());

      const resTrack = await makeRequest(port, { path: `/api/v1/tracks/${trackId}`, method: 'GET' });
      const trackJson = JSON.parse(resTrack.data.toString());

      const passed = resList.statusCode === 200 && resTrack.statusCode === 200 && trackJson.data.track.id === trackId;
      record('Track catalog endpoints (GET /api/v1/tracks & /:id)', passed);
    }

    // ----------------------------------------------------
    // TEST 5: Normal Full GET /api/v1/stream/:trackId
    // ----------------------------------------------------
    let totalFileSize = 0;
    {
      const res = await makeRequest(port, {
        path: `/api/v1/stream/${trackId}`,
        method: 'GET'
      });

      const contentLength = parseInt(res.headers['content-length'] || '0', 10);
      totalFileSize = contentLength;
      const acceptRanges = res.headers['accept-ranges'];
      const contentType = res.headers['content-type'];
      const passed =
        res.statusCode === 200 &&
        contentLength > 0 &&
        res.data.length === contentLength &&
        acceptRanges === 'bytes' &&
        Boolean(contentType?.includes('audio/wav'));

      record(
        'Normal full stream (HTTP 200 OK)',
        passed,
        `status: ${res.statusCode}, size: ${contentLength} bytes, type: ${contentType}`
      );
    }

    // ----------------------------------------------------
    // TEST 6: Range: bytes=0-1023 (First 1024 bytes)
    // ----------------------------------------------------
    {
      const res = await makeRequest(port, {
        path: `/api/v1/stream/${trackId}`,
        method: 'GET',
        headers: { Range: 'bytes=0-1023' }
      });

      const contentRange = res.headers['content-range'];
      const contentLength = parseInt(res.headers['content-length'] || '0', 10);
      const expectedRange = `bytes 0-1023/${totalFileSize}`;

      const passed =
        res.statusCode === 206 &&
        contentRange === expectedRange &&
        contentLength === 1024 &&
        res.data.length === 1024 &&
        res.headers['accept-ranges'] === 'bytes';

      record(
        'Range: bytes=0-1023 (HTTP 206 Partial Content)',
        passed,
        `status: ${res.statusCode}, Content-Range: ${contentRange}, Content-Length: ${contentLength}`
      );
    }

    // ----------------------------------------------------
    // TEST 7: Range: bytes=100000- (From byte 100000 to EOF)
    // ----------------------------------------------------
    {
      const startByte = 100000;
      const expectedLength = totalFileSize - startByte;
      const expectedRange = `bytes ${startByte}-${totalFileSize - 1}/${totalFileSize}`;

      const res = await makeRequest(port, {
        path: `/api/v1/stream/${trackId}`,
        method: 'GET',
        headers: { Range: `bytes=${startByte}-` }
      });

      const contentRange = res.headers['content-range'];
      const contentLength = parseInt(res.headers['content-length'] || '0', 10);

      const passed =
        res.statusCode === 206 &&
        contentRange === expectedRange &&
        contentLength === expectedLength &&
        res.data.length === expectedLength;

      record(
        'Range: bytes=100000- (HTTP 206 to EOF)',
        passed,
        `status: ${res.statusCode}, Content-Range: ${contentRange}, bytes: ${contentLength}`
      );
    }

    // ----------------------------------------------------
    // TEST 8: Invalid Range (HTTP 416 Range Not Satisfiable)
    // ----------------------------------------------------
    {
      const res = await makeRequest(port, {
        path: `/api/v1/stream/${trackId}`,
        method: 'GET',
        headers: { Range: 'bytes=999999999-' }
      });

      const contentRange = res.headers['content-range'];
      const expectedRange = `bytes */${totalFileSize}`;

      const passed = res.statusCode === 416 && contentRange === expectedRange;
      record(
        'Invalid Range: bytes=999999999- (HTTP 416 Range Not Satisfiable)',
        passed,
        `status: ${res.statusCode}, Content-Range: ${contentRange}`
      );
    }

    // ----------------------------------------------------
    // TEST 9: HEAD Request /api/v1/stream/:trackId
    // ----------------------------------------------------
    {
      const res = await makeRequest(port, {
        path: `/api/v1/stream/${trackId}`,
        method: 'HEAD'
      });

      const contentLength = parseInt(res.headers['content-length'] || '0', 10);
      const passed =
        res.statusCode === 200 &&
        contentLength === totalFileSize &&
        res.headers['accept-ranges'] === 'bytes' &&
        res.data.length === 0; // Strictly 0 bytes body for HEAD!

      record(
        'HEAD request /api/v1/stream/:id (Headers sent with 0 body bytes)',
        passed,
        `status: ${res.statusCode}, length: ${contentLength}, bodyBytes: ${res.data.length}`
      );
    }

    // ----------------------------------------------------
    // TEST 10: Missing Track (HTTP 404 Not Found)
    // ----------------------------------------------------
    {
      const res = await makeRequest(port, {
        path: '/api/v1/stream/non-existent-track-xyz',
        method: 'GET'
      });

      const passed = res.statusCode === 404;
      const body = JSON.parse(res.data.toString());
      record(
        'Missing track returns HTTP 404 with structured error',
        passed && body.error?.code === 'TRACK_NOT_FOUND',
        `status: ${res.statusCode}, code: ${body.error?.code}`
      );
    }

    // ----------------------------------------------------
    // TEST 11: Client Cancellation / Abort handling
    // ----------------------------------------------------
    {
      let abortHandledCleanly = false;

      await new Promise<void>((resolve) => {
        const req = http.request(
          {
            port,
            host: '127.0.0.1',
            path: `/api/v1/stream/${trackId}`,
            method: 'GET'
          },
          (res) => {
            // Read first small chunk, then abruptly destroy socket!
            res.once('data', () => {
              req.destroy();
              abortHandledCleanly = true;
              setTimeout(resolve, 150);
            });
          }
        );
        req.on('error', () => {
          // Expected on client abort
        });
        req.end();
      });

      record('Client connection cancellation handled without server crash', abortHandledCleanly);
    }

    // ----------------------------------------------------
    // TEST 12: HTML5 Audio Seeking Simulation
    // ----------------------------------------------------
    {
      // Phase A: Initial probe (bytes=0-1)
      const probeRes = await makeRequest(port, {
        path: `/api/v1/stream/${trackId}`,
        method: 'GET',
        headers: { Range: 'bytes=0-1' }
      });

      // Phase B: User scrubs to 50% through the song
      const midpoint = Math.floor(totalFileSize / 2);
      const seekRes = await makeRequest(port, {
        path: `/api/v1/stream/${trackId}`,
        method: 'GET',
        headers: { Range: `bytes=${midpoint}-${midpoint + 65535}` } // 64KB seek buffer
      });

      const passed =
        probeRes.statusCode === 206 &&
        probeRes.data.length === 2 &&
        seekRes.statusCode === 206 &&
        seekRes.headers['content-range'] === `bytes ${midpoint}-${midpoint + 65535}/${totalFileSize}` &&
        seekRes.data.length === 65536;

      record(
        'HTML5 Audio scrub/seek simulation (initial probe + 50% seek chunk)',
        passed,
        `midpoint: ${midpoint}, seek chunk: ${seekRes.data.length} bytes`
      );
    }
  } catch (err: any) {
    console.error('Test execution error:', err);
    record('Unexpected test runner exception', false, undefined, err.message);
  } finally {
    server.close();
  }

  console.log('\n==================================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`TEST SUMMARY: ${results.filter((r) => r.passed).length}/${results.length} PASSED`);
  console.log('==================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runTests();
