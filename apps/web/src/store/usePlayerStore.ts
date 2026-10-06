import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PlaybackStatus, RepeatMode, SleepTimerState, Track } from '@music/shared';
import { audioEngine } from '../lib/audioEngine';

interface PlayerStoreState {
  currentTrack: Track | null;
  playbackStatus: PlaybackStatus;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bufferedTime: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  queue: Track[];
  queueIndex: number;
  originalQueue: Track[];
  history: Track[];
  error: { code: string; message: string; recoverable: boolean } | null;
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

  // Actions
  initEngine: () => void;
  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  nextTrack: () => Promise<void>;
  prevTrack: () => Promise<void>;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  cycleRepeatMode: () => void;
  toggleShuffle: () => void;
  setPlaybackRate: (rate: number) => void;
  setSleepTimer: (minutes: number, mode?: 'duration' | 'end_of_track') => void;
  cancelSleepTimer: () => void;
  setFullPlayerOpen: (open: boolean) => void;
  setLyricsOpen: (open: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  setSleepTimerModalOpen: (open: boolean) => void;
  reorderQueue: (from: number, to: number) => void;
  removeFromQueue: (index: number) => void;
  addToQueue: (track: Track) => void;
  addToQueueNext: (track: Track) => void;
  toggleLike: (track: Track) => void;
  downloadTrackForOffline: (track: Track) => Promise<boolean>;
  removeOfflineTrack: (trackId: string) => Promise<void>;
  setOfflineMode: (enabled: boolean) => void;
  clearError: () => void;
}

let sleepTimerInterval: NodeJS.Timeout | null = null;

export const usePlayerStore = create<PlayerStoreState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      playbackStatus: 'idle',
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      bufferedTime: 0,
      volume: 0.9,
      isMuted: false,
      playbackRate: 1.0,
      repeatMode: 'off',
      isShuffled: false,
      queue: [],
      queueIndex: -1,
      originalQueue: [],
      history: [],
      error: null,
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

      initEngine: () => {
        audioEngine.init({
          onStatusChange: (status) => {
            set({
              playbackStatus: status,
              isPlaying: status === 'playing'
            });
          },
          onTimeUpdate: (currentTime, duration) => {
            set({
              currentTime,
              duration: duration || get().currentTrack?.duration || 0
            });
          },
          onBufferedUpdate: (bufferedTime) => {
            set({ bufferedTime });
          },
          onError: (error) => {
            set({ error, playbackStatus: 'error', isPlaying: false });
          },
          onTrackEnd: () => {
            const { sleepTimer } = get();
            if (sleepTimer.isActive && sleepTimer.mode === 'end_of_track') {
              get().cancelSleepTimer();
              audioEngine.pause();
              set({ isPlaying: false, playbackStatus: 'paused' });
              return;
            }
            get().nextTrack();
          },
          onNextRequested: () => {
            get().nextTrack();
          },
          onPrevRequested: () => {
            get().prevTrack();
          }
        });

        // Set initial engine volume & rate from persisted state
        audioEngine.setVolume(get().volume);
        audioEngine.setMuted(get().isMuted);
        audioEngine.setPlaybackRate(get().playbackRate);
        audioEngine.setRepeatMode(get().repeatMode);
      },

      playTrack: async (track, newQueue) => {
        let currentQueue = get().queue;
        let originalQueue = get().originalQueue;
        let queueIndex = -1;

        if (newQueue && newQueue.length > 0) {
          originalQueue = [...newQueue];
          currentQueue = get().isShuffled ? shuffleArray([...newQueue]) : [...newQueue];
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

        const history = get().currentTrack ? [get().currentTrack!, ...get().history.slice(0, 49)] : get().history;

        set({
          currentTrack: track,
          queue: currentQueue,
          originalQueue,
          queueIndex,
          history,
          playbackStatus: 'loading',
          isPlaying: true,
          error: null,
          currentTime: 0,
          duration: track.duration
        });

        await audioEngine.loadTrack(track, true);

        // Preload next track if present
        const nextIndex = queueIndex + 1;
        if (nextIndex < currentQueue.length) {
          audioEngine.preloadNextTrack(currentQueue[nextIndex]);
        }
      },

      togglePlayPause: () => {
        const { isPlaying, currentTrack, queue } = get();
        if (!currentTrack) {
          if (queue.length > 0) {
            get().playTrack(queue[0]);
          }
          return;
        }

        if (isPlaying) {
          audioEngine.pause();
          set({ isPlaying: false, playbackStatus: 'paused' });
        } else {
          audioEngine.play().then((started) => {
            if (started) {
              set({ isPlaying: true, playbackStatus: 'playing', error: null });
            }
          });
        }
      },

      seek: (time) => {
        audioEngine.seek(time);
        set({ currentTime: time });
      },

      nextTrack: async () => {
        const { queue, queueIndex, repeatMode } = get();
        if (queue.length === 0) return;

        let nextIdx = queueIndex + 1;
        if (nextIdx >= queue.length) {
          if (repeatMode === 'all') {
            nextIdx = 0;
          } else {
            // End of queue
            audioEngine.pause();
            set({ isPlaying: false, playbackStatus: 'ended', currentTime: 0 });
            return;
          }
        }

        const nextTrackItem = queue[nextIdx];
        if (nextTrackItem) {
          await get().playTrack(nextTrackItem);
        }
      },

      prevTrack: async () => {
        const { queue, queueIndex, currentTime } = get();
        // If track played for > 3 seconds, restart current track
        if (currentTime > 3) {
          audioEngine.seek(0);
          set({ currentTime: 0 });
          return;
        }

        if (queue.length === 0) return;
        const prevIdx = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
        const prevTrackItem = queue[prevIdx];
        if (prevTrackItem) {
          await get().playTrack(prevTrackItem);
        }
      },

      setVolume: (vol) => {
        const clamped = Math.max(0, Math.min(1, vol));
        audioEngine.setVolume(clamped);
        set({ volume: clamped, isMuted: clamped === 0 });
      },

      toggleMute: () => {
        const nextMuted = !get().isMuted;
        audioEngine.setMuted(nextMuted);
        set({ isMuted: nextMuted });
      },

      setRepeatMode: (mode) => {
        audioEngine.setRepeatMode(mode);
        set({ repeatMode: mode });
      },

      cycleRepeatMode: () => {
        const modes: RepeatMode[] = ['off', 'all', 'one'];
        const current = get().repeatMode;
        const next = modes[(modes.indexOf(current) + 1) % modes.length];
        audioEngine.setRepeatMode(next);
        set({ repeatMode: next });
      },

      toggleShuffle: () => {
        const { isShuffled, queue, originalQueue, currentTrack } = get();
        const nextShuffled = !isShuffled;

        if (nextShuffled) {
          const shuffled = shuffleArray([...queue]);
          if (currentTrack) {
            const curIdx = shuffled.findIndex((t) => t.id === currentTrack.id);
            if (curIdx > -1) {
              shuffled.splice(curIdx, 1);
              shuffled.unshift(currentTrack);
            }
          }
          set({
            isShuffled: true,
            queue: shuffled,
            queueIndex: 0
          });
        } else {
          const curIdx = currentTrack ? originalQueue.findIndex((t) => t.id === currentTrack.id) : 0;
          set({
            isShuffled: false,
            queue: [...originalQueue],
            queueIndex: Math.max(0, curIdx)
          });
        }
      },

      setPlaybackRate: (rate) => {
        audioEngine.setPlaybackRate(rate);
        set({ playbackRate: rate });
      },

      setSleepTimer: (minutes, mode = 'duration') => {
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
            audioEngine.fadeOutAndPause(3000);
            set({
              isPlaying: false,
              playbackStatus: 'paused',
              sleepTimer: { isActive: false, remainingSeconds: 0, targetTimestamp: null, mode: 'duration' }
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

      setFullPlayerOpen: (open) => set({ isFullPlayerOpen: open }),
      setLyricsOpen: (open) => set({ isLyricsOpen: open }),
      setQueueOpen: (open) => set({ isQueueOpen: open }),
      setSleepTimerModalOpen: (open) => set({ isSleepTimerModalOpen: open }),

      reorderQueue: (from, to) => {
        const nextQueue = [...get().queue];
        const [moved] = nextQueue.splice(from, 1);
        nextQueue.splice(to, 0, moved);

        const current = get().currentTrack;
        const newQueueIndex = current ? nextQueue.findIndex((t) => t.id === current.id) : 0;
        set({ queue: nextQueue, queueIndex: newQueueIndex });
      },

      removeFromQueue: (index) => {
        const { queue, queueIndex } = get();
        const nextQueue = [...queue];
        nextQueue.splice(index, 1);

        let newIdx = queueIndex;
        if (index < queueIndex) {
          newIdx = Math.max(0, queueIndex - 1);
        } else if (index === queueIndex) {
          newIdx = Math.min(queueIndex, nextQueue.length - 1);
        }

        set({ queue: nextQueue, queueIndex: newIdx });
      },

      addToQueue: (track) => {
        set((s) => ({
          queue: [...s.queue, track],
          originalQueue: [...s.originalQueue, track]
        }));
      },

      addToQueueNext: (track) => {
        const { queue, queueIndex } = get();
        const nextQueue = [...queue];
        nextQueue.splice(queueIndex + 1, 0, track);
        set({ queue: nextQueue });
      },

      toggleLike: (track) => {
        const { likedTrackIds } = get();
        const isLiked = likedTrackIds.includes(track.id);
        const updated = isLiked
          ? likedTrackIds.filter((id) => id !== track.id)
          : [...likedTrackIds, track.id];

        set({ likedTrackIds: updated });

        // Update currentTrack liked state if matched
        if (get().currentTrack?.id === track.id) {
          set((s) => ({
            currentTrack: s.currentTrack ? { ...s.currentTrack, isLiked: !isLiked } : null
          }));
        }
      },

      downloadTrackForOffline: async (track) => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;

        try {
          // Tell Service Worker to cache this audio file
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.active) {
            reg.active.postMessage({
              type: 'CACHE_AUDIO_TRACK',
              audioUrl: track.audioUrl,
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

      removeOfflineTrack: async (trackId) => {
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

      setOfflineMode: (enabled) => set({ isOfflineMode: enabled }),
      clearError: () => set({ error: null })
    }),
    {
      name: 'pulse-player-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        playbackRate: state.playbackRate,
        repeatMode: state.repeatMode,
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
