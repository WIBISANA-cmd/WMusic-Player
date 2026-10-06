'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Download, PlusSquare, Heart, Radio } from 'lucide-react';
import { usePlayerStore } from '@/stores/player-store';

export function DesktopSidebar() {
  const pathname = usePathname();

  // Narrow selectors: Only re-renders when collection counts actually change
  const likedCount = usePlayerStore((s) => s.likedTrackIds.length);
  const offlineCount = usePlayerStore((s) => s.offlineTracks.length);

  const mainNav = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Library', href: '/library', icon: Library },
    { label: 'Offline Tracks', href: '/offline', icon: Download, badge: offlineCount },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen glass-panel bg-white/60 border-r border-white/60 p-5 shrink-0 select-none">
      {/* Brand Header */}
      <Link href="/" className="flex items-center gap-3 mb-8 px-2 group">
        <div className="w-10 h-10 rounded-2xl liquid-button flex items-center justify-center text-slate-800 shadow-sm group-hover:scale-105 transition-transform">
          <Radio className="w-5 h-5 text-slate-700" />
        </div>
        <div>
          <span className="font-black text-lg tracking-wider text-text-primary">PULSE</span>
          <span className="text-[10px] block font-mono text-text-secondary tracking-normal uppercase">
            Audio Studio
          </span>
        </div>
      </Link>

      {/* Main Navigation */}
      <nav className="space-y-1 mb-8" aria-label="Desktop Sidebar Navigation">
        <div className="text-[10px] font-bold tracking-wider text-text-secondary uppercase px-3 mb-2">
          Menu
        </div>
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-700 text-white font-semibold shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Playlists / Collections */}
      <div className="flex-1 overflow-y-auto space-y-1">
        <div className="text-[10px] font-bold tracking-wider text-text-secondary uppercase px-3 mb-2">
          Collections
        </div>
        <Link
          href="/library"
          className="flex items-center gap-3 px-3 py-2 rounded-2xl text-sm text-text-secondary hover:text-text-primary hover:bg-white/60 transition-colors"
        >
          <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
            <Heart size={13} fill="currentColor" />
          </div>
          <span className="truncate">Liked Tracks ({likedCount})</span>
        </Link>
        <Link
          href="/library?action=new"
          className="flex items-center gap-3 px-3 py-2 rounded-2xl text-sm text-text-secondary hover:text-text-primary hover:bg-white/60 transition-colors"
        >
          <div className="w-6 h-6 rounded-lg bg-slate-200/80 text-slate-600 flex items-center justify-center">
            <PlusSquare size={14} />
          </div>
          <span className="truncate">Create Playlist</span>
        </Link>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-300/40 text-[11px] text-text-secondary flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>HTML5 Audio</span>
        </div>
        <span className="font-mono">v1.0.0</span>
      </div>
    </aside>
  );
}
