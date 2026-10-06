'use client';

import { useEffect } from 'react';
import { usePlayerStore } from '@/stores/player-store';
import { AudioProvider } from './AudioProvider';
import { MiniPlayer } from './MiniPlayer';
import { FullPlayer } from './FullPlayer';
import { QueueDrawer } from './QueueDrawer';
import { SleepTimerModal } from './SleepTimerModal';
import { OfflineBanner } from '../layout/OfflineBanner';
import { PwaInstallBanner } from '../layout/PwaInstallBanner';

export function PlayerInitializer() {
  const { initEngine } = usePlayerStore();

  useEffect(() => {
    // Register Service Worker for PWA & Offline Audio caching
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Pulse PWA Service Worker active:', reg.scope);
        })
        .catch((err) => {
          console.warn('Service Worker registration skipped:', err);
        });
    }
  }, [initEngine]);

  return (
    <AudioProvider>
      <OfflineBanner />
      <MiniPlayer />
      <FullPlayer />
      <QueueDrawer />
      <SleepTimerModal />
      <PwaInstallBanner />
    </AudioProvider>
  );
}
