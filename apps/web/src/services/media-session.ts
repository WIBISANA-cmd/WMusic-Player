import { Track } from '@music/shared';

export interface MediaSessionHandlers {
  onPlay: () => void;
  onPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeekTo?: (time: number) => void;
  onSeekBackward?: (offset: number) => void;
  onSeekForward?: (offset: number) => void;
  onStop?: () => void;
}

export class MediaSessionService {
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'mediaSession' in navigator;
  }

  public registerHandlers(handlers: MediaSessionHandlers): void {
    if (!this.isSupported) return;

    try {
      navigator.mediaSession.setActionHandler('play', handlers.onPlay);
      navigator.mediaSession.setActionHandler('pause', handlers.onPause);
      navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrev);
      navigator.mediaSession.setActionHandler('nexttrack', handlers.onNext);

      if (handlers.onSeekTo) {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined && details.seekTime !== null) {
            handlers.onSeekTo!(details.seekTime);
          }
        });
      }

      if (handlers.onSeekBackward) {
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          handlers.onSeekBackward!(details.seekOffset || 10);
        });
      }

      if (handlers.onSeekForward) {
        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          handlers.onSeekForward!(details.seekOffset || 10);
        });
      }

      if (handlers.onStop) {
        navigator.mediaSession.setActionHandler('stop', handlers.onStop);
      }
    } catch (err) {
      console.warn('MediaSession handler registration skipped:', err);
    }
  }

  public updateMetadata(track: Track): void {
    if (!this.isSupported) return;

    try {
      const artwork = track.artwork && track.artwork.length > 0
        ? track.artwork.map((art) => ({
            src: art.url,
            sizes: `${art.width || 512}x${art.height || 512}`,
            type: 'image/jpeg'
          }))
        : [];

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || 'Pulse Music',
        artwork
      });
    } catch (err) {
      console.warn('Failed setting MediaMetadata:', err);
    }
  }

  public setPlaybackState(state: 'playing' | 'paused' | 'none'): void {
    if (!this.isSupported) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch {}
  }

  public updatePositionState(params: { duration: number; playbackRate: number; position: number }): void {
    if (!this.isSupported) return;
    try {
      if (Number.isFinite(params.duration) && params.duration > 0 && Number.isFinite(params.position)) {
        navigator.mediaSession.setPositionState({
          duration: params.duration,
          playbackRate: params.playbackRate,
          position: Math.min(params.position, params.duration)
        });
      }
    } catch {}
  }
}

export const mediaSessionService = new MediaSessionService();

