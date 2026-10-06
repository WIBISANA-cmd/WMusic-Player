'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { usePlayerStore, PlayerError } from '@/stores/player-store';
import { audioBridge, AudioDriver } from '@/lib/audio-bridge';
import { mediaSessionService } from '@/services/media-session';
import { Track } from '@music/shared';

interface AudioContextValue {
  isReady: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const AudioContext = createContext<AudioContextValue>({
  isReady: false,
  audioRef: { current: null }
});

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Throttling refs to prevent React state churn
  const lastTimeUpdateRef = useRef<number>(0);
  const lastSessionSyncRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);

  // Read store actions directly so listeners always have fresh action references
  const store = usePlayerStore();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 1. Construct the AudioDriver operating on this single persistent audio element
    const driver: AudioDriver = {
      loadTrack: async (track: Track, autoPlay: boolean = true): Promise<boolean> => {
        if (!audioRef.current) return false;
        const el = audioRef.current;

        // Reset retry counter on new track
        retryCountRef.current = 0;

        const streamUrl = track.audioUrl || `/api/v1/stream/${track.id}`;
        el.src = streamUrl;

        const { volume, muted, playbackRate } = usePlayerStore.getState();
        el.volume = muted ? 0 : volume;
        el.muted = muted;
        el.playbackRate = playbackRate;

        el.load();

        if (autoPlay) {
          try {
            await el.play();
            return true;
          } catch (err: unknown) {
            const domErr = err as { name?: string; message?: string };
            if (domErr?.name === 'NotAllowedError') {
              usePlayerStore.getState()._setError({
                code: 'AUTOPLAY_BLOCKED',
                message: 'Autoplay blocked by your browser. Tap play to start listening.',
                recoverable: true
              });
              usePlayerStore.getState()._setIsPlaying(false);
              usePlayerStore.getState()._setStatus('paused');
            } else if (domErr?.name === 'AbortError') {
              // Rapid track switch aborted loading this track - safe to ignore
            } else {
              usePlayerStore.getState()._setError({
                code: 'PLAYBACK_ERROR',
                message: 'Unable to stream audio track. Check your network or retry.',
                recoverable: true
              });
              usePlayerStore.getState()._setIsPlaying(false);
              usePlayerStore.getState()._setStatus('error');
            }
            return false;
          }
        }
        return true;
      },

      play: async (): Promise<boolean> => {
        if (!audioRef.current) return false;
        const el = audioRef.current;

        try {
          await el.play();
          return true;
        } catch (err: unknown) {
          const domErr = err as { name?: string; message?: string };
          if (domErr?.name === 'NotAllowedError') {
            usePlayerStore.getState()._setError({
              code: 'AUTOPLAY_BLOCKED',
              message: 'Playback requires user gesture. Tap play to resume.',
              recoverable: true
            });
          } else if (domErr?.name !== 'AbortError') {
            usePlayerStore.getState()._setError({
              code: 'PLAY_FAILED',
              message: 'Failed to start playback. Please retry.',
              recoverable: true
            });
          }
          return false;
        }
      },

      pause: (): void => {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      },

      seek: (timeInSeconds: number): void => {
        if (audioRef.current) {
          const maxDur = audioRef.current.duration || 0;
          const clamped = Math.max(0, Math.min(timeInSeconds, maxDur || timeInSeconds));
          audioRef.current.currentTime = clamped;
        }
      },

      setVolume: (volume: number): void => {
        if (audioRef.current) {
          audioRef.current.volume = Math.max(0, Math.min(1, volume));
        }
      },

      setMuted: (muted: boolean): void => {
        if (audioRef.current) {
          audioRef.current.muted = muted;
        }
      },

      setPlaybackRate: (rate: number): void => {
        if (audioRef.current) {
          audioRef.current.playbackRate = rate;
        }
      },

      fadeOutAndPause: (durationMs: number = 2000): Promise<void> => {
        return new Promise((resolve) => {
          if (!audioRef.current) return resolve();
          const el = audioRef.current;
          const startVolume = el.volume;
          const steps = 20;
          const stepDuration = durationMs / steps;
          let currentStep = 0;

          const interval = setInterval(() => {
            currentStep++;
            if (audioRef.current) {
              audioRef.current.volume = Math.max(0, startVolume * (1 - currentStep / steps));
            }

            if (currentStep >= steps) {
              clearInterval(interval);
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.volume = startVolume;
              }
              resolve();
            }
          }, stepDuration);
        });
      },

      getCurrentTime: (): number => {
        return audioRef.current?.currentTime || 0;
      },

      getDuration: (): number => {
        return audioRef.current?.duration || 0;
      }
    };

    // Register driver with bridge
    audioBridge.registerDriver(driver);
    setIsReady(true);

    // 2. Attach Media Session action handlers
    mediaSessionService.registerHandlers({
      onPlay: () => store.play(),
      onPause: () => store.pause(),
      onPrev: () => store.previous(),
      onNext: () => store.next(),
      onSeekTo: (time) => store.seek(time),
      onSeekBackward: (offset) => {
        const cur = audio.currentTime || 0;
        store.seek(Math.max(0, cur - offset));
      },
      onSeekForward: (offset) => {
        const cur = audio.currentTime || 0;
        const dur = audio.duration || 0;
        store.seek(Math.min(dur, cur + offset));
      },
      onStop: () => {
        store.pause();
        store.seek(0);
      }
    });

    // 3. Attach native HTMLMediaElement event listeners
    const handleLoadStart = () => {
      usePlayerStore.getState()._setStatus('loading');
    };

    const handleLoadedMetadata = () => {
      const dur = audio.duration;
      if (Number.isFinite(dur) && dur > 0) {
        usePlayerStore.getState()._setDuration(dur);
      }
    };

    const handleDurationChange = () => {
      const dur = audio.duration;
      if (Number.isFinite(dur) && dur > 0) {
        usePlayerStore.getState()._setDuration(dur);
      }
    };

    const handleCanPlay = () => {
      const s = usePlayerStore.getState();
      if (s.status === 'loading' || s.status === 'buffering') {
        s._setStatus(s.isPlaying ? 'playing' : 'paused');
      }
    };

    const handlePlaying = () => {
      retryCountRef.current = 0;
      const s = usePlayerStore.getState();
      s._setIsPlaying(true);
      s._setStatus('playing');
      s._setError(null);

      mediaSessionService.setPlaybackState('playing');
      mediaSessionService.updatePositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate,
        position: audio.currentTime
      });
    };

    const handlePlay = () => {
      usePlayerStore.getState()._setIsPlaying(true);
    };

    const handlePause = () => {
      if (!audio.ended) {
        const s = usePlayerStore.getState();
        s._setIsPlaying(false);
        s._setStatus('paused');
        mediaSessionService.setPlaybackState('paused');
      }
    };

    const handleWaiting = () => {
      usePlayerStore.getState()._setStatus('buffering');
    };

    const handleStalled = () => {
      usePlayerStore.getState()._setStatus('buffering');
    };

    const updateBufferedRanges = () => {
      if (audio.buffered.length > 0) {
        const cur = audio.currentTime || 0;
        for (let i = 0; i < audio.buffered.length; i++) {
          if (audio.buffered.start(i) <= cur && cur <= audio.buffered.end(i)) {
            usePlayerStore.getState()._setBuffered(audio.buffered.end(i));
            break;
          }
        }
      }
    };

    const handleTimeUpdate = () => {
      const now = performance.now();
      const curTime = audio.currentTime || 0;

      // Throttle store update to ~200ms or on significant jump
      if (now - lastTimeUpdateRef.current > 200 || Math.abs(curTime - lastTimeUpdateRef.current) > 1) {
        lastTimeUpdateRef.current = now;
        usePlayerStore.getState()._setTime(curTime);
        updateBufferedRanges();

        // Throttle media session position sync to ~1 second
        if (now - lastSessionSyncRef.current > 1000) {
          lastSessionSyncRef.current = now;
          mediaSessionService.updatePositionState({
            duration: audio.duration || usePlayerStore.getState().duration,
            playbackRate: audio.playbackRate,
            position: curTime
          });
        }
      }
    };

    const handleProgress = () => {
      updateBufferedRanges();
    };

    const handleEnded = () => {
      usePlayerStore.getState()._handleTrackEnd();
    };

    const handleError = () => {
      const err = audio.error;
      const currentTrack = usePlayerStore.getState().currentTrack;
      let userMessage = 'Playback error encountered.';

      if (err) {
        switch (err.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            userMessage = 'Playback was aborted.';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            userMessage = 'Network error while streaming audio.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            userMessage = 'Audio decoding error.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            userMessage = 'Audio source format not supported or unavailable.';
            break;
          default:
            userMessage = err.message || 'Unknown media error.';
        }
      }

      const isRecoverable = retryCountRef.current < 2;
      const playerError: PlayerError = {
        code: `MEDIA_ERR_${err?.code || 'UNKNOWN'}`,
        message: userMessage,
        recoverable: isRecoverable
      };

      usePlayerStore.getState()._setError(playerError);
      usePlayerStore.getState()._setIsPlaying(false);
      usePlayerStore.getState()._setStatus('error');

      // Automatic backoff retry if recoverable
      if (isRecoverable && currentTrack) {
        retryCountRef.current++;
        const backoffMs = 1500 * retryCountRef.current;
        setTimeout(() => {
          if (audioRef.current && usePlayerStore.getState().currentTrack?.id === currentTrack.id) {
            const savedPos = audioRef.current.currentTime;
            audioRef.current.load();
            audioRef.current.currentTime = savedPos;
            audioRef.current.play().catch(() => {});
          }
        }, backoffMs);
      }
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audioBridge.unregisterDriver();
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      isReady,
      audioRef
    }),
    [isReady]
  );

  return (
    <AudioContext.Provider value={contextValue}>
      {/* 
        The single persistent native HTML5 Audio element.
        Never destroyed during page navigation.
        Never placed directly in Zustand store.
      */}
      <audio
        ref={audioRef}
        preload="metadata"
        playsInline
        crossOrigin="anonymous"
        aria-hidden="true"
        className="hidden pointer-events-none"
      />
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}
