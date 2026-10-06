'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Radio, Moon, Wifi, WifiOff, Sparkles } from 'lucide-react';
import { usePlayerStore } from '@/stores/player-store';

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);
  const { sleepTimer, setSleepTimerModalOpen } = usePlayerStore();

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 glass-header px-4 sm:px-6 md:px-8 py-3 select-none">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        {/* WMusic Application Identity */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
        >
          <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <img
              src="/logo-wmusic.png"
              alt="WMusic Logo"
              className="w-full h-full object-contain filter drop-shadow-sm"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-slate-900 leading-none">WMusic</span>
            <span className="text-[9px] font-semibold text-slate-500 tracking-wider uppercase mt-0.5">
              Audio
            </span>
          </div>
        </Link>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Online / Offline Status Badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span className="text-[11px]">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Compact Action Button: Sleep Timer */}
          <button
            onClick={() => setSleepTimerModalOpen(true)}
            aria-label={
              sleepTimer.isActive
                ? `Sleep timer active, ${Math.ceil(sleepTimer.remainingSeconds / 60)} minutes left`
                : 'Set sleep timer'
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold glass-pill transition-all active:scale-95 shadow-sm min-h-[36px] focus-visible:ring-2 focus-visible:ring-accent ${
              sleepTimer.isActive
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-text-primary hover:bg-white'
            }`}
          >
            <Moon size={14} className={sleepTimer.isActive ? 'text-white' : 'text-slate-600'} />
            <span className="text-[11px]">
              {sleepTimer.isActive
                ? sleepTimer.mode === 'end_of_track'
                  ? 'Track End'
                  : `${Math.ceil(sleepTimer.remainingSeconds / 60)}m`
                : 'Sleep'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

