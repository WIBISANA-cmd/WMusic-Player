'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'Search songs, artists, or genres...',
  autoFocus = false,
  className
}: SearchBarProps) {
  return (
    <div className={cn('relative w-full select-none', className)}>
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
        size={18}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-11 pr-11 py-3 bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl rounded-full text-sm text-text-primary placeholder:text-text-secondary border border-white/60 dark:border-white/10 shadow-glass-sm focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white dark:focus:bg-slate-800 transition-all min-h-[44px]"
      />
      {value && (
        <button
          onClick={() => {
            onChange('');
            onClear?.();
          }}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-slate-200/50 dark:hover:bg-slate-700/60 transition-colors focus-visible:ring-2 focus-visible:ring-accent"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
