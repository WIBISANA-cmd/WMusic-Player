import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PlaybackStatus, RepeatMode, SleepTimerState, Track } from '@music/shared';
import { audioBridge } from '../lib/audio-bridge';
import { mediaSessionService } from '../services/media-session';

export interface PlayerError {
  code: string;
  message: string;
  recoverable: boolean;
}

export interface PlayerStoreState {
  // Required core state properties
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  queueIndex: number; // Backward-compatible alias for currentIndex
  isPlaying: boolean;
  status: PlaybackStatus;
  playbackStatus: PlaybackStatus; // Backward-compatible alias for status
  currentTime: number;
  duration: number;
  buffered: number;
  bufferedTime: number; // Backward-compatible alias for buffered
  volume: number;
  muted: boolean;
  isMuted: boolean; // Backward-compatible alias for muted
  shuffle: boolean;
  isShuffled: boolean; // Backward-compatible alias for shuffle
  repeatMode: RepeatMode;
  error: PlayerError | null;

  // Extended player state
  playbackRate: number;
  originalQueue: Track[];
  history: Track[];
  sleepTimer: SleepTimerState;

  // UI state
  isFullPlayerOpen: boolean;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;
  isSleepTimerModalOpen: boolean;
  isOfflineMode: boolean;
  offlineTrackIds: string[];
  offlineTracks: Track[];
  likedTrackIds: string[];

  // Core Actions
  loadTrack: (track: Track, autoPlay?: boolean, newQueue?: Track[]) => Promise<void>;
  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>; // Alias for loadTrack
  play: () => Promise<boolean>;
  pause: () => void;
  togglePlay: () => Promise<void>;
  togglePlayPause: () => Promise<void>; // Alias for togglePlay
  next: () => Promise<void>;
  nextTrack: () => Promise<void>; // Alias for next
  previous: () => Promise<void>;
  prevTrack: () => Promise<void>; // Alias for previous
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  addToQueue: (track: Track) => void;
  addToQueueNext: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (from: number, to: number) => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  cycleRepeatMode: () => void;
  setPlaybackRate: (rate: number) => void;
  clearError: () => void;
  retry: () => Promise<void>;
  skip: () => Promise<void>;

  // Sleep timer actions
  setSleepTimer: (minutes: number, mode?: 'duration' | 'end_of_track') => void;
  cancelSleepTimer: () => void;

  // UI toggles
  setFullPlayerOpen: (open: boolean) => void;
  setLyricsOpen: (open: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  setSleepTimerModalOpen: (open: boolean) => void;
  toggleLike: (track: Track) => void;
  downloadTrackForOffline: (track: Track) => Promise<boolean>;
  removeOfflineTrack: (trackId: string) => Promise<void>;
  setOfflineMode: (enabled: boolean) => void;

  // Internal Audio Event Handlers (Called by AudioProvider)
  _setStatus: (status: PlaybackStatus) => void;
  _setIsPlaying: (isPlaying: boolean) => void;
  _setTime: (time: number) => void;
  _setDuration: (duration: number) => void;
  _setBuffered: (buffered: number) => void;
  _setError: (error: PlayerError | null) => void;
  _handleTrackEnd: () => void;
}

let currentGenerationId = 0;
let sleepTimerInterval: NodeJS.Timeout | null = null;

export const usePlayerStore = create<PlayerStoreState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      currentIndex: -1,
      queueIndex: -1,
      isPlaying: false,
      status: 'idle',
      playbackStatus: 'idle',
      currentTime: 0,
      duration: 0,
      buffered: 0,
      bufferedTime: 0,
      volume: 0.9,
      muted: false,
      isMuted: false,
      shuffle: false,
      isShuffled: false,
      repeatMode: 'off',
      error: null,
      playbackRate: 1.0,
      originalQueue: [],
      history: [],
      sleepTimer: {
        isActive: false,
        remainingSeconds: 0,
        targetTimestamp: null,
        mode: 'duration'
      },

      isFullPlayerOpen: false,
      isLyricsOpen: false,
      isQueueOpen: false,
      isSleepTimerModalOpen: false,
      isOfflineMode: false,
      offlineTrackIds: [],
      offlineTracks: [],
      likedTrackIds: ['track-neon-horizon', 'track-celestial-echo', 'track-retro-arcade'],

      loadTrack: async (track: Track, autoPlay: boolean = true, newQueue?: Track[]) => {
        const generation = ++currentGenerationId;

        let currentQueue = get().queue;
        let originalQueue = get().originalQueue;
        let queueIndex = -1;

        if (newQueue && newQueue.length > 0) {
          originalQueue = [...newQueue];
          currentQueue = get().shuffle ? shuffleArray([...newQueue]) : [...newQueue];
          queueIndex = currentQueue.findIndex((t) => t.id === track.id);
          if (queueIndex === -1) {
            currentQueue.unshift(track);
            queueIndex = 0;
          }
        } else {
          queueIndex = currentQueue.findIndex((t) => t.id === track.id);
          if (queueIndex === -1) {
            currentQueue = [...currentQueue, track];
            queueIndex = currentQueue.length - 1;
            originalQueue = [...originalQueue, track];
          }
        }

        const history = get().currentTrack
          ? [get().currentTrack!, ...get().history.slice(0, 49)]
          : get().history;

        // Immediate responsive UI update
        set({
          currentTrack: track,
          queue: currentQueue,
          originalQueue,
          currentIndex: queueIndex,
          queueIndex,
          history,
          status: 'loading',
          playbackStatus: 'loading',
          isPlaying: autoPlay,
          error: null,
          currentTime: 0,
          duration: track.duration || 0,
          buffered: 0,
          bufferedTime: 0
        });

        // Update Media Session metadata immediately
        mediaSessionService.updateMetadata(track);

        // Instruct native audio element via AudioBridge
        try {
          const success = await audioBridge.loadTrack(track, autoPlay);

          // Discard results if a newer track request was issued in the meantime
          if (generation !== currentGenerationId) {
            return;
          }

          if (autoPlay && success) {
            set({
              isPlaying: true,
              status: 'playing',
              playbackStatus: 'playing'
            });
            mediaSessionService.setPlaybackState('playing');
          } else if (autoPlay && !success) {
            // Rejection was caught by bridge/audio element (e.g. autoplay blocked)
            // State is updated by bridge error callback
          }
        } catch (err: unknown) {
          if (generation !== currentGenerationId) return;

          console.error('Track playback initialization failed:', err);
          set({
            isPlaying: false,
            status: 'error',
            playbackStatus: 'error',
            error: {
              code: 'LOAD_ERROR',
              message: 'Failed to load audio track. Please check connection and retry.',
              recoverable: true
            }
          });
        }
      },

      playTrack: async (track: Track, newQueue?: Track[]) => {
        return get().loadTrack(track, true, newQueue);
      },

      play: async (): Promise<boolean> => {
        const { currentTrack, queue } = get();
        if (!currentTrack) {
          if (queue.length > 0) {
            await get().loadTrack(queue[0], true);
            return true;
          }
          return false;
        }

        const success = await audioBridge.play();
        if (success) {
          set({
            isPlaying: true,
            status: 'playing',
            playbackStatus: 'playing',
            error: null
          });
          mediaSessionService.setPlaybackState('playing');
          return true;
        } else {
          // Play promise rejected or autoplay blocked
          set({
            isPlaying: false,
            status: 'paused',
            playbackStatus: 'paused'
          });
          mediaSessionService.setPlaybackState('paused');
          return false;
        }
      },

      pause: () => {
        audioBridge.pause();
        set({
          isPlaying: false,
          status: 'paused',
          playbackStatus: 'paused'
        });
        mediaSessionService.setPlaybackState('paused');
      },

      togglePlay: async () => {
        const { isPlaying } = get();
        if (isPlaying) {
          get().pause();
        } else {
          await get().play();
        }
      },

      togglePlayPause: async () => {
        return get().togglePlay();
      },

      next: async () => {
        const { queue, currentIndex, repeatMode } = get();
        if (queue.length === 0) return;

        let nextIdx = currentIndex + 1;
        if (nextIdx >= queue.length) {
          if (repeatMode === 'all') {
            nextIdx = 0;
          } else {
            get().pause();
            set({
              currentTime: 0,
              status: 'ended',
              playbackStatus: 'ended'
            });
            return;
          }
        }

        const nextTrackItem = queue[nextIdx];
        if (nextTrackItem) {
          await get().loadTrack(nextTrackItem, true);
        }
      },

      nextTrack: async () => {
        return get().next();
      },

      previous: async () => {
        const { queue, currentIndex, currentTime } = get();
        // If track played for > 3 seconds, restart current track
        if (currentTime > 3) {
          get().seek(0);
          return;
        }

        if (queue.length === 0) return;
        const prevIdx = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
        const prevTrackItem = queue[prevIdx];
        if (prevTrackItem) {
          await get().loadTrack(prevTrackItem, true);
        }
      },

      prevTrack: async () => {
        return get().previous();
      },

      seek: (time: number) => {
        const { duration } = get();
        const clamped = Math.max(0, Math.min(time, duration || 0));
        audioBridge.seek(clamped);
        set({ currentTime: clamped });
        mediaSessionService.updatePositionState({
          duration,
          playbackRate: get().playbackRate,
          position: clamped
        });
      },

      setVolume: (vol: number) => {
        const clamped = Math.max(0, Math.min(1, vol));
        audioBridge.setVolume(clamped);
        set({
          volume: clamped,
          muted: clamped === 0,
          isMuted: clamped === 0
        });
      },

      toggleMute: () => {
        const nextMuted = !get().muted;
        audioBridge.setMuted(nextMuted);
        set({
          muted: nextMuted,
          isMuted: nextMuted
        });
      },

      addToQueue: (track: Track) => {
        set((s) => ({
          queue: [...s.queue, track],
          originalQueue: [...s.originalQueue, track]
        }));
      },

      addToQueueNext: (track: Track) => {
        const { queue, currentIndex } = get();
        const nextQueue = [...queue];
        nextQueue.splice(currentIndex + 1, 0, track);
        set({ queue: nextQueue });
      },

      removeFromQueue: (index: number) => {
        const { queue, currentIndex } = get();
        const nextQueue = [...queue];
        nextQueue.splice(index, 1);

        let newIdx = currentIndex;
        if (index < currentIndex) {
          newIdx = Math.max(0, currentIndex - 1);
        } else if (index === currentIndex) {
          newIdx = Math.min(currentIndex, nextQueue.length - 1);
        }

        set({
          queue: nextQueue,
          currentIndex: newIdx,
          queueIndex: newIdx
        });
      },

      clearQueue: () => {
        set({
          queue: [],
          originalQueue: [],
          currentIndex: -1,
          queueIndex: -1
        });
      },

      reorderQueue: (from: number, to: number) => {
        const nextQueue = [...get().queue];
        const [moved] = nextQueue.splice(from, 1);
        nextQueue.splice(to, 0, moved);

        const current = get().currentTrack;
        const newIdx = current ? nextQueue.findIndex((t) => t.id === current.id) : 0;
        set({
          queue: nextQueue,
          currentIndex: newIdx,
          queueIndex: newIdx
        });
      },

      toggleShuffle: () => {
        const { shuffle, queue, originalQueue, currentTrack } = get();
        const nextShuffle = !shuffle;

        if (nextShuffle) {
          const shuffled = shuffleArray([...queue]);
          if (currentTrack) {
            const curIdx = shuffled.findIndex((t) => t.id === currentTrack.id);
            if (curIdx > -1) {
              shuffled.splice(curIdx, 1);
              shuffled.unshift(currentTrack);
            }
          }
          set({
            shuffle: true,
            isShuffled: true,
            queue: shuffled,
            currentIndex: 0,
            queueIndex: 0
          });
        } else {
          // Restore un-shuffled chronological order perfectly
          const curIdx = currentTrack
            ? originalQueue.findIndex((t) => t.id === currentTrack.id)
            : 0;
          set({
            shuffle: false,
            isShuffled: false,
            queue: [...originalQueue],
            currentIndex: Math.max(0, curIdx),
            queueIndex: Math.max(0, curIdx)
          });
        }
      },

      setRepeatMode: (mode: RepeatMode) => {
        set({ repeatMode: mode });
      },

      cycleRepeatMode: () => {
        const modes: RepeatMode[] = ['off', 'all', 'one'];
        const current = get().repeatMode;
        const next = modes[(modes.indexOf(current) + 1) % modes.length];
        set({ repeatMode: next });
      },

      setPlaybackRate: (rate: number) => {
        audioBridge.setPlaybackRate(rate);
        set({ playbackRate: rate });
      },

      clearError: () => set({ error: null }),

      retry: async () => {
        const { currentTrack } = get();
        if (currentTrack) {
          set({ error: null });
          await get().loadTrack(currentTrack, true);
        }
      },

      skip: async () => {
        set({ error: null });
        await get().next();
      },

      setSleepTimer: (minutes: number, mode = 'duration') => {
        if (sleepTimerInterval) {
          clearInterval(sleepTimerInterval);
          sleepTimerInterval = null;
        }

        if (mode === 'end_of_track') {
          set({
            sleepTimer: {
              isActive: true,
              remainingSeconds: 0,
              targetTimestamp: null,
              mode: 'end_of_track'
            },
            isSleepTimerModalOpen: false
          });
          return;
        }

        const totalSeconds = minutes * 60;
        const targetTimestamp = Date.now() + totalSeconds * 1000;

        set({
          sleepTimer: {
            isActive: true,
            remainingSeconds: totalSeconds,
            targetTimestamp,
            mode: 'duration'
          },
          isSleepTimerModalOpen: false
        });

        sleepTimerInterval = setInterval(() => {
          const now = Date.now();
          const remaining = Math.max(0, Math.round((targetTimestamp - now) / 1000));

          if (remaining <= 0) {
            if (sleepTimerInterval) clearInterval(sleepTimerInterval);
            sleepTimerInterval = null;
            audioBridge.fadeOutAndPause(3000);
            set({
              isPlaying: false,
              status: 'paused',
              playbackStatus: 'paused',
              sleepTimer: {
                isActive: false,
                remainingSeconds: 0,
                targetTimestamp: null,
                mode: 'duration'
              }
            });
          } else {
            set((s) => ({
              sleepTimer: { ...s.sleepTimer, remainingSeconds: remaining }
            }));
          }
        }, 1000);
      },

      cancelSleepTimer: () => {
        if (sleepTimerInterval) {
          clearInterval(sleepTimerInterval);
          sleepTimerInterval = null;
        }
        set({
          sleepTimer: {
            isActive: false,
            remainingSeconds: 0,
            targetTimestamp: null,
            mode: 'duration'
          }
        });
      },

      setFullPlayerOpen: (open: boolean) => set({ isFullPlayerOpen: open }),
      setLyricsOpen: (open: boolean) => set({ isLyricsOpen: open }),
      setQueueOpen: (open: boolean) => set({ isQueueOpen: open }),
      setSleepTimerModalOpen: (open: boolean) => set({ isSleepTimerModalOpen: open }),

      toggleLike: (track: Track) => {
        const { likedTrackIds } = get();
        const isLiked = likedTrackIds.includes(track.id);
        const updated = isLiked
          ? likedTrackIds.filter((id) => id !== track.id)
          : [...likedTrackIds, track.id];

        set({ likedTrackIds: updated });
      },

      downloadTrackForOffline: async (track: Track) => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;

        try {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.active) {
            reg.active.postMessage({
              type: 'CACHE_AUDIO_TRACK',
              audioUrl: track.audioUrl || `/api/v1/stream/${track.id}`,
              trackId: track.id
            });
          }

          const { offlineTrackIds, offlineTracks } = get();
          if (!offlineTrackIds.includes(track.id)) {
            set({
              offlineTrackIds: [...offlineTrackIds, track.id],
              offlineTracks: [...offlineTracks, track]
            });
          }
          return true;
        } catch (err) {
          console.error('Failed to download track for offline:', err);
          return false;
        }
      },

      removeOfflineTrack: async (trackId: string) => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.active) {
            reg.active.postMessage({
              type: 'REMOVE_AUDIO_TRACK',
              trackId
            });
          }
        }

        set((s) => ({
          offlineTrackIds: s.offlineTrackIds.filter((id) => id !== trackId),
          offlineTracks: s.offlineTracks.filter((t) => t.id !== trackId)
        }));
      },

      setOfflineMode: (enabled: boolean) => set({ isOfflineMode: enabled }),

      // Internal event handlers hooked up in AudioProvider
      _setStatus: (status: PlaybackStatus) =>
        set({ status, playbackStatus: status }),

      _setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

      _setTime: (currentTime: number) => set({ currentTime }),

      _setDuration: (duration: number) => set({ duration }),

      _setBuffered: (buffered: number) =>
        set({ buffered, bufferedTime: buffered }),

      _setError: (error: PlayerError | null) =>
        set({
          error,
          status: error ? 'error' : get().status,
          playbackStatus: error ? 'error' : get().playbackStatus
        }),

      _handleTrackEnd: () => {
        const { sleepTimer, repeatMode } = get();
        if (sleepTimer.isActive && sleepTimer.mode === 'end_of_track') {
          get().cancelSleepTimer();
          get().pause();
          return;
        }

        if (repeatMode === 'one') {
          get().seek(0);
          get().play();
        } else {
          get().next();
        }
      }
    }),
    {
      name: 'pulse-player-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {}
        };
      }),
      partialize: (state) => ({
        volume: state.volume,
        muted: state.muted,
        isMuted: state.isMuted,
        playbackRate: state.playbackRate,
        repeatMode: state.repeatMode,
        shuffle: state.shuffle,
        isShuffled: state.isShuffled,
        likedTrackIds: state.likedTrackIds,
        offlineTrackIds: state.offlineTrackIds,
        offlineTracks: state.offlineTracks
      })
    }
  )
);

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
