'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Download, PlusSquare, Heart, Music, Radio } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';

export function DesktopSidebar() {
  const pathname = usePathname();
  const { likedTrackIds, offlineTracks } = usePlayerStore();

  const mainNav = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Library', href: '/library', icon: Library },
    { label: 'Offline Tracks', href: '/offline', icon: Download, badge: offlineTracks.length },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-[#0d1322] border-r border-white/5 p-5 shrink-0 select-none">
      {/* Brand Header */}
      <Link href="/" className="flex items-center gap-3 mb-8 px-2 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-primary-500 to-pink-500 p-0.5 shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
          <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
            <Radio className="w-5 h-5 text-primary-400" />
          </div>
        </div>
        <div>
          <span className="font-bold text-lg tracking-wider text-white">PULSE</span>
          <span className="text-[11px] block font-mono text-cyan-400 tracking-normal uppercase">Audio Studio</span>
        </div>
      </Link>

      {/* Main Navigation */}
      <nav className="space-y-1 mb-8">
        <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase px-3 mb-2">
          Menu
        </div>
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-600/15 text-primary-300 font-semibold border border-primary-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? 'text-primary-400' : 'text-slate-400'} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Playlists / Collections */}
      <div className="flex-1 overflow-y-auto space-y-1">
        <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase px-3 mb-2">
          Playlists
        </div>
        <Link
          href="/library"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white">
            <Heart size={13} fill="currentColor" />
          </div>
          <span className="truncate">Liked Tracks ({likedTrackIds.length})</span>
        </Link>
        <Link
          href="/library?action=new"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-slate-300">
            <PlusSquare size={14} />
          </div>
          <span className="truncate">Create Playlist</span>
        </Link>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-white/5 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>HTML5 Native Engine</span>
        </div>
        <span>v1.0.0</span>
      </div>
    </aside>
  );
}
