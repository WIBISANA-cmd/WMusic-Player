import { Track } from './track';

export type PlaybackStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'error'
  | 'ended';

export type RepeatMode = 'off' | 'all' | 'one';

export interface SleepTimerState {
  isActive: boolean;
  remainingSeconds: number;
  targetTimestamp: number | null;
  mode: 'duration' | 'end_of_track';
}

export interface AudioPlayerState {
  currentTrack: Track | null;
  playbackStatus: PlaybackStatus;
  isPlaying: boolean;
  currentTime: number; // in seconds
  duration: number; // in seconds
  bufferedTime: number; // in seconds
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  playbackRate: number; // 0.5 to 2.0
  repeatMode: RepeatMode;
  isShuffled: boolean;
  queue: Track[];
  queueIndex: number;
  originalQueue: Track[];
  history: Track[];
  error: {
    code: string;
    message: string;
    recoverable: boolean;
  } | null;
  sleepTimer: SleepTimerState;
  isOfflineMode: boolean;
}

export interface PlayerActionPayloads {
  setTrack: { track: Track; autoPlay?: boolean };
  playQueue: { tracks: Track[]; startIndex?: number; autoPlay?: boolean };
  addToQueue: { track: Track };
  addToQueueNext: { track: Track };
  removeFromQueue: { index: number };
  reorderQueue: { fromIndex: number; toIndex: number };
  clearQueue: void;
  seek: { timeInSeconds: number };
  setVolume: { volume: number };
  toggleMute: void;
  setRepeatMode: { mode: RepeatMode };
  toggleShuffle: void;
  setPlaybackRate: { rate: number };
  setSleepTimer: { minutes: number; mode?: 'duration' | 'end_of_track' };
  cancelSleepTimer: void;
}
