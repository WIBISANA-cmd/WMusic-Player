'use client';

import { useEffect } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { MiniPlayer } from './MiniPlayer';
import { FullPlayerModal } from './FullPlayerModal';
import { QueueDrawer } from './QueueDrawer';
import { SleepTimerModal } from './SleepTimerModal';
import { OfflineBanner } from '../layout/OfflineBanner';
import { PwaInstallBanner } from '../layout/PwaInstallBanner';

export function PlayerInitializer() {
  const { initEngine } = usePlayerStore();

  useEffect(() => {
    // 1. Initialize HTML5 Audio Engine & Media Session API
    initEngine();

    // 2. Register Service Worker for PWA & Offline Audio caching
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
    <>
      <OfflineBanner />
      <MiniPlayer />
      <FullPlayerModal />
      <QueueDrawer />
      <SleepTimerModal />
      <PwaInstallBanner />
    </>
  );
}
