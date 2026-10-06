'use client';

import { useEffect } from 'react';
import { mediaSessionService } from '@/services/media-session';
import { usePlayerStore } from '@/stores/player-store';

export function useMediaSession() {
  const { currentTrack, isPlaying, currentTime, duration, playbackRate } = usePlayerStore();

  useEffect(() => {
    if (currentTrack) {
      mediaSessionService.updateMetadata(currentTrack);
    }
  }, [currentTrack]);

  useEffect(() => {
    mediaSessionService.setPlaybackState(isPlaying ? 'playing' : 'paused');
  }, [isPlaying]);

  useEffect(() => {
    if (duration > 0) {
      mediaSessionService.updatePositionState({
        duration,
        playbackRate,
        position: currentTime
      });
    }
  }, [currentTime, duration, playbackRate]);
}

