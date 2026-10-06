import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

/**
 * Creates a valid RIFF WAV audio buffer with stereo PCM 16-bit audio.
 * Generates beautiful musical patterns based on genre and mood:
 * - Synthwave: Synth bassline + 80s arpeggio chords
 * - Lo-Fi Chill: Warm lowpass electric piano chords + gentle pulse
 * - Ambient: Soft ethereal harmonic drone + floating chime
 * - Cyberpunk: Driving bass pulse + synth lead
 */
export function generateMelodicWav(
  durationSeconds: number,
  options: {
    tempo?: number;
    genre?: string;
    rootFreq?: number;
  } = {}
): Buffer {
  const sampleRate = 44100;
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = totalSamples * blockAlign;

  const buffer = Buffer.alloc(44 + dataSize);

  // --- RIFF Header ---
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4); // Chunk size
  buffer.write('WAVE', 8);

  // --- fmt Subchunk ---
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size for PCM
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34); // BitsPerSample

  // --- data Subchunk ---
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Music synthesis parameters
  const bpm = options.tempo || 120;
  const beatSec = 60 / bpm;
  const root = options.rootFreq || 220; // A3
  const genre = (options.genre || 'synthwave').toLowerCase();

  // Scale degrees in semitones (Minor pentatonic / Dorian)
  const minorScale = [0, 3, 5, 7, 10, 12, 15, 17];

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const currentBeat = (t / beatSec) % 8;
    const beatIndex = Math.floor(currentBeat);
    const beatProgress = (t % beatSec) / beatSec;

    let sampleL = 0;
    let sampleR = 0;

    // 1. Kick/Bass Pulse on quarter notes
    const kickEnv = Math.max(0, 1 - (beatProgress * 4));
    if (beatIndex % 2 === 0 || genre.includes('cyber') || genre.includes('synth')) {
      const kickFreq = 120 * Math.exp(-beatProgress * 15) + 40;
      const kick = Math.sin(2 * Math.PI * kickFreq * beatProgress) * kickEnv * 0.4;
      sampleL += kick;
      sampleR += kick;
    }

    // 2. Chord / Arpeggio layer
    const noteInterval = minorScale[beatIndex % minorScale.length];
    const freq = root * Math.pow(2, noteInterval / 12);
    const subFreq = (root / 2) * Math.pow(2, minorScale[Math.floor(beatIndex / 2) % 4] / 12);

    // Synthwave / Cyberpunk leads
    if (genre.includes('synth') || genre.includes('cyber')) {
      // Arpeggio 16th note pattern
      const arpStep = Math.floor((t / (beatSec / 4)) % 4);
      const arpNote = minorScale[(beatIndex + arpStep) % minorScale.length];
      const arpeggioFreq = root * 2 * Math.pow(2, arpNote / 12);

      const arpEnv = Math.exp(-((t % (beatSec / 4)) / (beatSec / 4)) * 3);
      const synthLead = (Math.sin(2 * Math.PI * arpeggioFreq * t) + 0.3 * Math.sin(4 * Math.PI * arpeggioFreq * t)) * arpEnv * 0.25;

      const bass = Math.sin(2 * Math.PI * subFreq * t) * 0.3;

      sampleL += bass + synthLead * 0.8;
      sampleR += bass + synthLead * 1.1;
    }
    // Lo-Fi / Chillhop
    else if (genre.includes('chill') || genre.includes('lofi') || genre.includes('lo-fi')) {
      const padEnv = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / (beatSec * 4));
      const pad = (Math.sin(2 * Math.PI * freq * t) + 0.5 * Math.sin(2 * Math.PI * freq * 1.5 * t)) * padEnv * 0.22;
      const warmBass = Math.sin(2 * Math.PI * (root / 2) * t) * 0.25;
      
      // Gentle stereo panning
      sampleL += pad * 0.9 + warmBass;
      sampleR += pad * 1.1 + warmBass;
    }
    // Ambient / Cinematic
    else {
      const drone1 = Math.sin(2 * Math.PI * root * t) * 0.2;
      const drone2 = Math.sin(2 * Math.PI * (root * 1.498) * t) * 0.15; // Fifth
      const drone3 = Math.sin(2 * Math.PI * (root * 2.0) * t + Math.sin(t * 0.5)) * 0.1;
      const gentleShimmer = Math.sin(2 * Math.PI * (root * 4.0) * t) * 0.05 * (0.5 + 0.5 * Math.sin(t * 2));

      sampleL += drone1 + drone2 * 0.8 + gentleShimmer;
      sampleR += drone1 * 0.8 + drone3 + gentleShimmer * 1.2;
    }

    // Soft master fade in / out
    const fadeIn = Math.min(1, t / 1.5);
    const fadeOut = Math.min(1, (durationSeconds - t) / 2.0);
    const masterGain = 0.65 * fadeIn * fadeOut;

    // Clamp 16-bit signed PCM (-32768 to 32767)
    const valL = Math.max(-1, Math.min(1, sampleL * masterGain));
    const valR = Math.max(-1, Math.min(1, sampleR * masterGain));

    buffer.writeInt16LE(Math.floor(valL * 32767), offset);
    buffer.writeInt16LE(Math.floor(valR * 32767), offset + 2);
    offset += 4;
  }

  return buffer;
}

export function ensureAudioAssets(storageDir: string, tracks: Array<{ id: string; duration: number; genre?: string; bpm?: number }>): void {
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  for (const track of tracks) {
    const audioPath = path.join(storageDir, `${track.id}.wav`);
    if (!fs.existsSync(audioPath)) {
      try {
        const audioBuffer = generateMelodicWav(track.duration, {
          tempo: track.bpm || 110,
          genre: track.genre,
          rootFreq: 220 + ((track.id.charCodeAt(0) % 7) * 20)
        });
        fs.writeFileSync(audioPath, audioBuffer);
        logger.info('Synthesized audio track asset', { trackId: track.id, duration: track.duration, path: audioPath });
      } catch (err) {
        logger.error('Failed generating audio asset', err, { trackId: track.id });
      }
    }
  }
}
