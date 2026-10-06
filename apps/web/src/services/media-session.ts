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
  private isSupported(): boolean {
    return typeof window !== 'undefined' && 'mediaSession' in navigator;
  }

  public registerHandlers(handlers: MediaSessionHandlers): void {
    if (!this.isSupported() || !navigator.mediaSession) return;

    const safeSetAction = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        if ('setActionHandler' in navigator.mediaSession) {
          navigator.mediaSession.setActionHandler(action, handler);
        }
      } catch (err) {
        // Some browsers may reject specific action types (e.g. Firefox or Safari)
        console.warn(`MediaSession action "${action}" not supported or rejected:`, err);
      }
    };

    safeSetAction('play', handlers.onPlay);
    safeSetAction('pause', handlers.onPause);
    safeSetAction('previoustrack', handlers.onPrev);
    safeSetAction('nexttrack', handlers.onNext);

    if (handlers.onSeekTo) {
      safeSetAction('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null && !isNaN(details.seekTime)) {
          handlers.onSeekTo!(Math.max(0, details.seekTime));
        }
      });
    }

    if (handlers.onSeekBackward) {
      safeSetAction('seekbackward', (details) => {
        const offset = details.seekOffset && !isNaN(details.seekOffset) ? details.seekOffset : 10;
        handlers.onSeekBackward!(offset);
      });
    }

    if (handlers.onSeekForward) {
      safeSetAction('seekforward', (details) => {
        const offset = details.seekOffset && !isNaN(details.seekOffset) ? details.seekOffset : 10;
        handlers.onSeekForward!(offset);
      });
    }

    if (handlers.onStop) {
      safeSetAction('stop', handlers.onStop);
    }
  }

  public updateMetadata(track: Track): void {
    if (!this.isSupported() || !navigator.mediaSession || typeof MediaMetadata === 'undefined') return;

    try {
      // Build multiple resolutions for responsive OS lock screens / notifications
      const artworkList: MediaImage[] = [];

      if (track.artwork && track.artwork.length > 0) {
        track.artwork.forEach((art) => {
          artworkList.push({
            src: art.url,
            sizes: `${art.width || 512}x${art.height || 512}`,
            type: 'image/jpeg'
          });
        });
      } else {
        // Fallback default icon for notifications
        artworkList.push(
          { src: '/icon.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icon.svg', sizes: '512x512', type: 'image/svg+xml' }
        );
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || 'Pulse Music',
        artwork: artworkList
      });
    } catch (err) {
      console.warn('Failed setting MediaMetadata:', err);
    }
  }

  public setPlaybackState(state: 'playing' | 'paused' | 'none'): void {
    if (!this.isSupported() || !navigator.mediaSession) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch (err) {
      console.warn('Failed setting mediaSession playbackState:', err);
    }
  }

  public updatePositionState(params: { duration: number; playbackRate: number; position: number }): void {
    if (!this.isSupported() || !navigator.mediaSession) return;

    try {
      if (
        'setPositionState' in navigator.mediaSession &&
        Number.isFinite(params.duration) &&
        params.duration > 0 &&
        Number.isFinite(params.position) &&
        params.position >= 0
      ) {
        const safePosition = Math.max(0, Math.min(params.position, params.duration));
        const safePlaybackRate =
          Number.isFinite(params.playbackRate) && params.playbackRate > 0 ? params.playbackRate : 1.0;

        navigator.mediaSession.setPositionState({
          duration: params.duration,
          playbackRate: safePlaybackRate,
          position: safePosition
        });
      }
    } catch (err) {
      // Ignore transient position state sync errors
      console.debug('Failed to update positionState:', err);
    }
  }
}

export const mediaSessionService = new MediaSessionService();
