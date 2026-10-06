'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Mic2, Download } from 'lucide-react';
import { usePlayerStore } from '@/stores/player-store';

export function BottomNav() {
  const pathname = usePathname();
  const { currentTrack, isLyricsOpen, setLyricsOpen, setFullPlayerOpen } = usePlayerStore();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Library', href: '/library', icon: Library },
    {
      label: 'Lyrics',
      href: '/lyrics',
      icon: Mic2,
      onClick: (e: React.MouseEvent) => {
        if (currentTrack) {
          e.preventDefault();
          setFullPlayerOpen(true);
          setLyricsOpen(true);
        }
      }
    },
    { label: 'Offline', href: '/offline', icon: Download },
  ];

  return (
    <nav
      aria-label="Main Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass-nav bg-white/70 border-t border-white/60 shadow-glass pb-[env(safe-area-inset-bottom,12px)] select-none"
    >
      <div className="flex items-center justify-around h-14 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.label === 'Lyrics' && isLyricsOpen);

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={item.onClick}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center w-14 h-12 relative transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl ${
                isActive ? 'text-slate-800 font-semibold' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="relative">
                <Icon size={20} className={isActive ? 'stroke-[2.4px]' : 'stroke-[1.8px]'} />
                {item.label === 'Offline' && (
                  <span
                    className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"
                    aria-hidden="true"
                  />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>

              {/* Liquid active indicator dot */}
              {isActive && (
                <span
                  className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full liquid-indicator shadow-sm"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
