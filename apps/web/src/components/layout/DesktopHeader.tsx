'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Moon, Wifi, WifiOff, Smartphone } from 'lucide-react';
import { usePlayerStore } from '@/stores/player-store';

export function DesktopHeader() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
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
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <header className="hidden md:flex items-center justify-between h-16 px-8 bg-[#090d16]/80 backdrop-blur-md sticky top-0 z-30 border-b border-white/5">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative w-96">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search tracks, artists, or genres..."
          className="w-full pl-10 pr-4 py-2 bg-surface rounded-full text-sm text-white placeholder-slate-500 border border-white/5 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all"
        />
      </form>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        {/* Network Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}
        >
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
        </div>

        {/* Sleep Timer Indicator */}
        <button
          onClick={() => setSleepTimerModalOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            sleepTimer.isActive
              ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40'
              : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          <Moon size={13} />
          <span>
            {sleepTimer.isActive
              ? sleepTimer.mode === 'end_of_track'
                ? 'End of Track'
                : `${Math.ceil(sleepTimer.remainingSeconds / 60)}m left`
              : 'Sleep Timer'}
          </span>
        </button>
      </div>
    </header>
  );
}
