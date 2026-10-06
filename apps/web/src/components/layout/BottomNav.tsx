'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Mic2, Download } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';

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
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass-nav border-t border-white/5 pb-[env(safe-area-inset-bottom,12px)]">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.label === 'Lyrics' && isLyricsOpen);

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center w-14 h-full relative transition-colors duration-200 active:scale-95 ${
                isActive ? 'text-primary-400 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon size={20} className={isActive ? 'stroke-[2.4px]' : 'stroke-[1.8px]'} />
                {item.label === 'Offline' && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-background" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary-400 shadow-[0_0_6px_#8b5cf6]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
