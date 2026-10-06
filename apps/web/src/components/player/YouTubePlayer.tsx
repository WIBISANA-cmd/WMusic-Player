'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize2, ExternalLink } from 'lucide-react';
import { usePlayerStore } from '@/stores/player-store';
import {
  loadYouTubeIframeAPI,
  extractYouTubeVideoId,
  registerYouTubeDriver,
  YouTubeDriver
} from '@/lib/youtube-iframe';
import { mediaSessionService } from '@/services/media-session';

export function YouTubePlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeVideoIdRef = useRef<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isFullPlayerOpen = usePlayerStore((s) => s.isFullPlayerOpen);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.muted);
  const playbackRate = usePlayerStore((s) => s.playbackRate);
  const setFullPlayerOpen = usePlayerStore((s) => s.setFullPlayerOpen);

  const isYouTubeTrack = currentTrack?.provider === 'youtube';

  // Stop position polling
  const stopProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  // Start position polling
  const startProgressTimer = useCallback(() => {
    stopProgressTimer();
    progressTimerRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p || typeof p.getCurrentTime !== 'function') return;

      try {
        const cur = p.getCurrentTime() || 0;
        const dur = p.getDuration() || 0;
        const loaded = p.getVideoLoadedFraction ? p.getVideoLoadedFraction() * dur : 0;

        const store = usePlayerStore.getState();
        store._setTime(cur);
        if (dur > 0 && Math.abs(dur - store.duration) > 1) {
          store._setDuration(dur);
        }
        if (loaded > 0) {
          store._setBuffered(loaded);
        }

        mediaSessionService.updatePositionState({
          duration: dur || store.duration,
          playbackRate: store.playbackRate,
          position: cur
        });
      } catch (err) {
        // Player might be in transition
      }
    }, 250);
  }, [stopProgressTimer]);

  // Construct and register the YouTube driver
  useEffect(() => {
    const driver: YouTubeDriver = {
      loadTrack: async (videoId: string, autoPlay: boolean = true): Promise<boolean> => {
        const cleanId = extractYouTubeVideoId(videoId);
        activeVideoIdRef.current = cleanId;

        if (!playerRef.current || !isPlayerReady) {
          return false;
        }

        try {
          if (autoPlay) {
            playerRef.current.loadVideoById({
              videoId: cleanId,
              startSeconds: 0
            });
          } else {
            playerRef.current.cueVideoById({
              videoId: cleanId,
              startSeconds: 0
            });
          }
          return true;
        } catch (err) {
          console.error('Error loading video into YouTube player:', err);
          return false;
        }
      },

      play: async (): Promise<boolean> => {
        if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
          return true;
        }
        return false;
      },

      pause: (): void => {
        if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo();
        }
      },

      seek: (seconds: number): void => {
        if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
          playerRef.current.seekTo(seconds, true);
        }
      },

      setVolume: (vol: number): void => {
        if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
          playerRef.current.setVolume(Math.round(vol * 100));
        }
      },

      setMuted: (muted: boolean): void => {
        if (playerRef.current) {
          if (muted && typeof playerRef.current.mute === 'function') {
            playerRef.current.mute();
          } else if (!muted && typeof playerRef.current.unMute === 'function') {
            playerRef.current.unMute();
          }
        }
      },

      setPlaybackRate: (rate: number): void => {
        if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
          playerRef.current.setPlaybackRate(rate);
        }
      },

      getCurrentTime: (): number => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          return playerRef.current.getCurrentTime() || 0;
        }
        return 0;
      },

      getDuration: (): number => {
        if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
          return playerRef.current.getDuration() || 0;
        }
        return 0;
      }
    };

    registerYouTubeDriver(driver);

    return () => {
      registerYouTubeDriver(null);
    };
  }, [isPlayerReady]);

  // Synchronize volume and mute states to YouTube player
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;
    try {
      if (isMuted) {
        playerRef.current.mute?.();
      } else {
        playerRef.current.unMute?.();
        playerRef.current.setVolume?.(Math.round(volume * 100));
      }
    } catch {
      // ignore
    }
  }, [volume, isMuted, isPlayerReady]);

  // Synchronize playback rate
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;
    try {
      playerRef.current.setPlaybackRate?.(playbackRate);
    } catch {
      // ignore
    }
  }, [playbackRate, isPlayerReady]);

  // Initialize official YouTube Iframe Player
  useEffect(() => {
    let isCancelled = false;

    loadYouTubeIframeAPI()
      .then((YT) => {
        if (isCancelled || !containerRef.current) return;

        // Create player container element
        const holderId = 'youtube-iframe-holder';
        let holder = document.getElementById(holderId);
        if (!holder) {
          holder = document.createElement('div');
          holder.id = holderId;
          holder.style.width = '100%';
          holder.style.height = '100%';
          containerRef.current.appendChild(holder);
        }

        playerRef.current = new YT.Player(holderId, {
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            controls: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            fs: 1,
            enablejsapi: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : ''
          },
          events: {
            onReady: (event: any) => {
              if (isCancelled) return;
              setIsPlayerReady(true);
              const store = usePlayerStore.getState();
              event.target.setVolume(Math.round(store.volume * 100));
              if (store.muted) event.target.mute();

              // If a track was already queued while waiting for API
              if (activeVideoIdRef.current) {
                event.target.loadVideoById({
                  videoId: activeVideoIdRef.current,
                  startSeconds: 0
                });
              }
            },
            onStateChange: (event: any) => {
              const state = event.data;
              const store = usePlayerStore.getState();

              // YT.PlayerState: -1 (UNSTARTED), 0 (ENDED), 1 (PLAYING), 2 (PAUSED), 3 (BUFFERING), 5 (CUED)
              if (state === 1) {
                // PLAYING
                store._setIsPlaying(true);
                store._setStatus('playing');
                store._setError(null);
                startProgressTimer();
                mediaSessionService.setPlaybackState('playing');
              } else if (state === 2) {
                // PAUSED
                store._setIsPlaying(false);
                store._setStatus('paused');
                stopProgressTimer();
                mediaSessionService.setPlaybackState('paused');
              } else if (state === 3) {
                // BUFFERING
                store._setStatus('buffering');
              } else if (state === 0) {
                // ENDED
                stopProgressTimer();
                store._handleTrackEnd();
              }
            },
            onError: (event: any) => {
              const code = event.data;
              const store = usePlayerStore.getState();
              stopProgressTimer();

              let message = 'YouTube video playback error.';
              if (code === 101 || code === 150) {
                message = 'This video does not allow embedded playback. Skipping to next...';
              } else if (code === 100) {
                message = 'YouTube video was removed or marked private.';
              } else if (code === 2) {
                message = 'Invalid video ID parameter.';
              }

              store._setError({
                code: `YT_ERR_${code}`,
                message,
                recoverable: true
              });
              store._setStatus('error');
              store._setIsPlaying(false);
            }
          }
        });
      })
      .catch((err) => {
        console.error('Failed to load YouTube Iframe API:', err);
      });

    return () => {
      isCancelled = true;
      stopProgressTimer();
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [startProgressTimer, stopProgressTimer]);

  // When currentTrack changes and is a YouTube track, load it
  useEffect(() => {
    if (!isYouTubeTrack || !currentTrack) {
      if (playerRef.current && typeof playerRef.current.stopVideo === 'function') {
        try {
          playerRef.current.stopVideo();
        } catch {
          // ignore
        }
      }
      stopProgressTimer();
      return;
    }

    const videoId = extractYouTubeVideoId(
      (currentTrack.metadata?.videoId as string) || currentTrack.id
    );

    if (!videoId) return;

    activeVideoIdRef.current = videoId;

    if (playerRef.current && isPlayerReady) {
      try {
        if (isPlaying) {
          playerRef.current.loadVideoById({
            videoId,
            startSeconds: 0
          });
        } else {
          playerRef.current.cueVideoById({
            videoId,
            startSeconds: 0
          });
        }
      } catch (err) {
        console.warn('Error commanding YouTube player:', err);
      }
    }
  }, [currentTrack, isYouTubeTrack, isPlayerReady, isPlaying, stopProgressTimer]);

  // If not a YouTube track, keep player hidden but alive in DOM
  if (!isYouTubeTrack) {
    return (
      <div
        ref={containerRef}
        aria-hidden="true"
        className="fixed -left-[9999px] -top-[9999px] w-1 h-1 pointer-events-none opacity-0 overflow-hidden"
      />
    );
  }

  // Active YouTube track: Render responsive container
  return (
    <div
      className={`transition-all duration-300 ease-out select-none ${
        isFullPlayerOpen
          ? 'fixed z-[55] left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-sm sm:max-w-md aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/60 bg-black'
          : 'fixed z-40 right-3 sm:right-6 bottom-[calc(4.75rem+env(safe-area-inset-bottom,12px))] w-48 sm:w-60 aspect-video rounded-xl overflow-hidden shadow-glass border border-white/70 bg-black backdrop-blur-md group'
      }`}
    >
      {/* Top Banner Indicator */}
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white pointer-events-none shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        <span>YouTube Video</span>
      </div>

      {/* Floating Mini Mode Controls */}
      {!isFullPlayerOpen && (
        <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-auto">
          <button
            onClick={() => setFullPlayerOpen(true)}
            aria-label="Expand to full video player"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-800 text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            <Maximize2 size={13} />
            <span>Expand</span>
          </button>
        </div>
      )}

      {/* External Link button (Full Player Mode) */}
      {isFullPlayerOpen && activeVideoIdRef.current && (
        <a
          href={`https://www.youtube.com/watch?v=${activeVideoIdRef.current}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Watch on YouTube"
          className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-white"
        >
          <ExternalLink size={12} />
        </a>
      )}

      {/* Persistent IFrame Mount Container */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

