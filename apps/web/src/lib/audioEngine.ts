import { PlaybackStatus, RepeatMode, Track } from '@music/shared';

export interface AudioEngineCallbacks {
  onStatusChange?: (status: PlaybackStatus) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onBufferedUpdate?: (bufferedTime: number) => void;
  onError?: (error: { code: string; message: string; recoverable: boolean }) => void;
  onTrackEnd?: () => void;
  onNextRequested?: () => void;
  onPrevRequested?: () => void;
}

class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private preloadAudio: HTMLAudioElement | null = null;
  private callbacks: AudioEngineCallbacks = {};
  private currentTrack: Track | null = null;
  private repeatMode: RepeatMode = 'off';
  private playbackRate: number = 1.0;
  private isMuted: boolean = false;
  private volume: number = 1.0;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private isInitialized: boolean = false;

  constructor() {
    // Audio element is initialized on client-side
  }

  public init(callbacks: AudioEngineCallbacks) {
    if (typeof window === 'undefined') return;
    this.callbacks = callbacks;

    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = 'auto';
      this.preloadAudio = new Audio();
      this.preloadAudio.preload = 'auto';

      this.setupEventListeners();
      this.setupMediaSession();
      this.isInitialized = true;
    }
  }

  private setupEventListeners() {
    if (!this.audio) return;

    this.audio.addEventListener('loadstart', () => {
      this.callbacks.onStatusChange?.('loading');
    });

    this.audio.addEventListener('canplay', () => {
      this.callbacks.onStatusChange?.('ready');
      this.updateMediaSessionPosition();
    });

    this.audio.addEventListener('playing', () => {
      this.retryCount = 0;
      this.callbacks.onStatusChange?.('playing');
      this.updateMediaSessionPlaybackState('playing');
      this.updateMediaSessionPosition();
    });

    this.audio.addEventListener('pause', () => {
      if (!this.audio?.ended) {
        this.callbacks.onStatusChange?.('paused');
        this.updateMediaSessionPlaybackState('paused');
      }
    });

    this.audio.addEventListener('waiting', () => {
      this.callbacks.onStatusChange?.('buffering');
    });

    this.audio.addEventListener('timeupdate', () => {
      if (!this.audio) return;
      const cur = this.audio.currentTime || 0;
      const dur = this.audio.duration || 0;
      this.callbacks.onTimeUpdate?.(cur, dur);

      // Calculate buffer progress
      if (this.audio.buffered.length > 0) {
        for (let i = 0; i < this.audio.buffered.length; i++) {
          if (this.audio.buffered.start(i) <= cur && cur <= this.audio.buffered.end(i)) {
            this.callbacks.onBufferedUpdate?.(this.audio.buffered.end(i));
            break;
          }
        }
      }

      this.updateMediaSessionPosition();
    });

    this.audio.addEventListener('ended', () => {
      if (this.repeatMode === 'one') {
        this.seek(0);
        this.play();
      } else {
        this.callbacks.onStatusChange?.('ended');
        this.callbacks.onTrackEnd?.();
      }
    });

    this.audio.addEventListener('error', () => {
      const err = this.audio?.error;
      const isRecoverable = this.retryCount < this.maxRetries;

      this.callbacks.onError?.({
        code: `MEDIA_ERR_${err?.code || 'UNKNOWN'}`,
        message: err?.message || 'Audio playback error occurred',
        recoverable: isRecoverable
      });

      if (isRecoverable) {
        this.retryCount++;
        const backoffMs = Math.min(1000 * Math.pow(2, this.retryCount), 6000);
        setTimeout(() => {
          if (this.audio && this.currentTrack) {
            const savedTime = this.audio.currentTime;
            this.audio.load();
            this.audio.currentTime = savedTime;
            this.audio.play().catch(() => {});
          }
        }, backoffMs);
      }
    });
  }

  /**
   * Media Session API: controls on lockscreen, smartwatch, earphones, notifications
   */
  private setupMediaSession() {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        this.play();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        this.pause();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        this.callbacks.onPrevRequested?.();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        this.callbacks.onNextRequested?.();
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          this.seek(details.seekTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const offset = details.seekOffset || 10;
        this.seek(Math.max(0, (this.audio?.currentTime || 0) - offset));
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const offset = details.seekOffset || 10;
        this.seek(Math.min(this.audio?.duration || 0, (this.audio?.currentTime || 0) + offset));
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        this.pause();
        this.seek(0);
      });
    } catch (err) {
      console.warn('Media Session action registration issue:', err);
    }
  }

  private updateMediaSessionMetadata(track: Track) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album,
        artwork: [
          { src: track.coverUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: track.coverUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: track.coverUrl, sizes: '192x192', type: 'image/jpeg' },
          { src: track.coverUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: track.coverUrl, sizes: '512x512', type: 'image/jpeg' }
        ]
      });
    } catch (e) {
      console.warn('Failed setting MediaMetadata:', e);
    }
  }

  private updateMediaSessionPlaybackState(state: 'playing' | 'paused' | 'none') {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch {}
  }

  private updateMediaSessionPosition() {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !this.audio) return;
    try {
      const dur = this.audio.duration;
      const cur = this.audio.currentTime;
      if (Number.isFinite(dur) && dur > 0 && Number.isFinite(cur)) {
        navigator.mediaSession.setPositionState({
          duration: dur,
          playbackRate: this.audio.playbackRate,
          position: Math.min(cur, dur)
        });
      }
    } catch {}
  }

  public async loadTrack(track: Track, autoPlay: boolean = true): Promise<void> {
    if (!this.audio) return;

    this.currentTrack = track;
    this.updateMediaSessionMetadata(track);
    this.audio.src = track.audioUrl;
    this.audio.playbackRate = this.playbackRate;
    this.audio.volume = this.isMuted ? 0 : this.volume;
    this.audio.load();

    if (autoPlay) {
      await this.play();
    }
  }

  public preloadNextTrack(track: Track): void {
    if (!this.preloadAudio || !track?.audioUrl) return;
    this.preloadAudio.src = track.audioUrl;
    this.preloadAudio.load();
  }

  public async play(): Promise<boolean> {
    if (!this.audio) return false;
    try {
      await this.audio.play();
      return true;
    } catch (err: unknown) {
      // Browser Autoplay restriction
      if (err instanceof Error && err.name === 'NotAllowedError') {
        console.warn('Autoplay was blocked by browser. User interaction is required to initiate audio.');
        this.callbacks.onError?.({
          code: 'AUTOPLAY_BLOCKED',
          message: 'Playback requires tap/click to start due to browser policy.',
          recoverable: true
        });
      } else {
        console.error('Playback error:', err);
      }
      return false;
    }
  }

  public pause(): void {
    if (!this.audio) return;
    this.audio.pause();
  }

  public seek(timeInSeconds: number): void {
    if (!this.audio) return;
    const clampedTime = Math.max(0, Math.min(timeInSeconds, this.audio.duration || 0));
    this.audio.currentTime = clampedTime;
    this.updateMediaSessionPosition();
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio && !this.isMuted) {
      this.audio.volume = this.volume;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.audio) {
      this.audio.volume = muted ? 0 : this.volume;
    }
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
    if (this.audio) {
      this.audio.playbackRate = rate;
    }
  }

  public setRepeatMode(mode: RepeatMode): void {
    this.repeatMode = mode;
  }

  public fadeOutAndPause(durationMs: number = 2000): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audio) return resolve();
      const startVolume = this.audio.volume;
      const steps = 20;
      const stepDuration = durationMs / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        if (this.audio) {
          this.audio.volume = Math.max(0, startVolume * (1 - currentStep / steps));
        }

        if (currentStep >= steps) {
          clearInterval(interval);
          this.pause();
          if (this.audio) this.audio.volume = startVolume;
          resolve();
        }
      }, stepDuration);
    });
  }

  public getCurrentTime(): number {
    return this.audio?.currentTime || 0;
  }

  public getDuration(): number {
    return this.audio?.duration || 0;
  }
}

export const audioEngine = new AudioEngine();
