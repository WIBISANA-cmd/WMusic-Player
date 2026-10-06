'use client';

import { useThemeStore } from '@/stores/theme-store';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'row';
}

export function ThemeToggle({ className = '', variant = 'icon' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  if (variant === 'row') {
    return (
      <button
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm font-medium transition-all ${
          isDark
            ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        } ${className}`}
      >
        <div className="flex items-center gap-3">
          {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </div>
        <div
          className={`w-10 h-6 rounded-full p-1 transition-colors ${
            isDark ? 'bg-sky-500' : 'bg-slate-300'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
              isDark ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center transition-all shadow-sm active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        isDark
          ? 'bg-slate-800/80 text-amber-400 hover:bg-slate-700/80 border border-white/10'
          : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200/80'
      } ${className}`}
    >
      {isDark ? (
        <Sun size={18} className="transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon size={18} className="transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
}
