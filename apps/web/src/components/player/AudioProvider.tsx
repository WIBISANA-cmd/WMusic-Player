'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { usePlayerStore } from '@/stores/player-store';
import { audioEngine } from '@/lib/audio-engine';

interface AudioContextValue {
  isInitialized: boolean;
}

const AudioContext = createContext<AudioContextValue>({ isInitialized: false });

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const { initEngine } = usePlayerStore();

  useEffect(() => {
    initEngine();
  }, [initEngine]);

  const value = useMemo(() => ({ isInitialized: true }), []);

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  return useContext(AudioContext);
}

