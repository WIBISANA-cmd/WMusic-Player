'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Mic2, Download } from 'lucide-react';
import { usePlayerStore } from '@/stores/player-store';

export function BottomNav() {
  const pathname = usePathname();

  // Narrow selectors: Avoid subscribing to high-frequency player state
  const hasCurrentTrack = usePlayerStore((s) => s.currentTrack !== null);
  const isLyricsOpen = usePlayerStore((s) => s.isLyricsOpen);
  const setLyricsOpen = usePlayerStore((s) => s.setLyricsOpen);
  const setFullPlayerOpen = usePlayerStore((s) => s.setFullPlayerOpen);

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Library', href: '/library', icon: Library },
    {
      label: 'Lyrics',
      href: '/lyrics',
      icon: Mic2,
      onClick: (e: React.MouseEvent) => {
        if (hasCurrentTrack) {
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
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-2xl border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] pb-[env(safe-area-inset-bottom,12px)] select-none"
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
                isActive
                  ? 'text-slate-950 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon size={21} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.9px]'} />
                {item.label === 'Offline' && (
                  <span
                    className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"
                    aria-hidden="true"
                  />
                )}
              </div>
              <span className={`text-[10.5px] mt-0.5 tracking-tight ${isActive ? 'font-bold text-slate-950' : 'font-medium text-slate-500'}`}>
                {item.label}
              </span>

              {/* High contrast active indicator dot */}
              {isActive && (
                <span
                  className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-slate-900 shadow-sm"
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
