'use client';

import { usePlayerStore } from '@/stores/player-store';
import { Track } from '@music/shared';

export function useAudioPlayer() {
  const store = usePlayerStore();

  const playWithQueue = async (track: Track, queue?: Track[]) => {
    await store.playTrack(track, queue);
  };

  return {
    ...store,
    playWithQueue
  };
}

