'use client';

import { useEffect } from 'react';
import { MiniPlayer } from './MiniPlayer';
import { FullPlayer } from './FullPlayer';
import { QueueDrawer } from './QueueDrawer';
import { SleepTimerModal } from './SleepTimerModal';
import { PlayerErrorBanner } from './PlayerErrorBanner';
import { OfflineBanner } from '../layout/OfflineBanner';
import { PwaInstallBanner } from '../layout/PwaInstallBanner';
import { PwaUpdateToast } from '../layout/PwaUpdateToast';

export function PlayerInitializer() {
  useEffect(() => {
    // Register Service Worker for PWA capabilities & offline caching
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('Pulse PWA Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.warn('Service Worker registration skipped:', err);
          });
      });
    }
  }, []);

  return (
    <>
      <OfflineBanner />
      <PlayerErrorBanner />
      <MiniPlayer />
      <FullPlayer />
      <QueueDrawer />
      <SleepTimerModal />
      <PwaInstallBanner />
      <PwaUpdateToast />
    </>
  );
}
