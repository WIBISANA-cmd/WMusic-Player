import { PlaybackStatus, RepeatMode, Track } from '@music/shared';
import { mediaSessionService } from '../services/media-session';

export interface AudioEngineCallbacks {
  onStatusChange?: (status: PlaybackStatus) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onBufferedUpdate?: (bufferedTime: number) => void;
  onError?: (error: { code: string; message: string; recoverable: boolean }) => void;
  onTrackEnd?: () => void;
  onNextRequested?: () => void;
  onPrevRequested?: () => void;
}

export class AudioEngine {
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

  public init(callbacks: AudioEngineCallbacks): void {
    if (typeof window === 'undefined') return;
    this.callbacks = callbacks;

    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = 'auto';
      this.preloadAudio = new Audio();
      this.preloadAudio.preload = 'auto';

      this.setupEventListeners();
      this.setupMediaSession();
    }
  }

  private setupEventListeners(): void {
    if (!this.audio) return;

    this.audio.addEventListener('loadstart', () => {
      this.callbacks.onStatusChange?.('loading');
    });

    this.audio.addEventListener('canplay', () => {
      this.callbacks.onStatusChange?.('ready');
      this.syncPositionState();
    });

    this.audio.addEventListener('playing', () => {
      this.retryCount = 0;
      this.callbacks.onStatusChange?.('playing');
      mediaSessionService.setPlaybackState('playing');
      this.syncPositionState();
    });

    this.audio.addEventListener('pause', () => {
      if (!this.audio?.ended) {
        this.callbacks.onStatusChange?.('paused');
        mediaSessionService.setPlaybackState('paused');
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

      if (this.audio.buffered.length > 0) {
        for (let i = 0; i < this.audio.buffered.length; i++) {
          if (this.audio.buffered.start(i) <= cur && cur <= this.audio.buffered.end(i)) {
            this.callbacks.onBufferedUpdate?.(this.audio.buffered.end(i));
            break;
          }
        }
      }

      this.syncPositionState();
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

  private setupMediaSession(): void {
    mediaSessionService.registerHandlers({
      onPlay: () => this.play(),
      onPause: () => this.pause(),
      onPrev: () => this.callbacks.onPrevRequested?.(),
      onNext: () => this.callbacks.onNextRequested?.(),
      onSeekTo: (time) => this.seek(time),
      onSeekBackward: (offset) => this.seek(Math.max(0, (this.audio?.currentTime || 0) - offset)),
      onSeekForward: (offset) => this.seek(Math.min(this.audio?.duration || 0, (this.audio?.currentTime || 0) + offset)),
      onStop: () => {
        this.pause();
        this.seek(0);
      }
    });
  }

  private syncPositionState(): void {
    if (!this.audio) return;
    mediaSessionService.updatePositionState({
      duration: this.audio.duration,
      playbackRate: this.audio.playbackRate,
      position: this.audio.currentTime
    });
  }

  public async loadTrack(track: Track, autoPlay: boolean = true): Promise<void> {
    if (!this.audio) return;

    this.currentTrack = track;
    mediaSessionService.updateMetadata(track);

    const streamUrl = track.audioUrl || `/api/stream/${track.id}`;
    this.audio.src = streamUrl;
    this.audio.playbackRate = this.playbackRate;
    this.audio.volume = this.isMuted ? 0 : this.volume;
    this.audio.load();

    if (autoPlay) {
      await this.play();
    }
  }

  public preloadNextTrack(track: Track): void {
    if (!this.preloadAudio) return;
    const url = track.audioUrl || `/api/stream/${track.id}`;
    this.preloadAudio.src = url;
    this.preloadAudio.load();
  }

  public async play(): Promise<boolean> {
    if (!this.audio) return false;
    try {
      await this.audio.play();
      return true;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        console.warn('Autoplay blocked by browser policy. Interaction needed.');
        this.callbacks.onError?.({
          code: 'AUTOPLAY_BLOCKED',
          message: 'Playback requires tap/click to start due to browser policy.',
          recoverable: true
        });
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
    this.syncPositionState();
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

