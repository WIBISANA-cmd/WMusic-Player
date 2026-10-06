'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'muted' | 'glass';
}

export function Badge({ className, variant = 'primary', children, ...props }: BadgeProps) {
  const variants = {
    primary: 'bg-slate-200/80 text-text-primary border-white/60',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    muted: 'bg-slate-100 text-text-secondary border-slate-200',
    glass: 'glass-pill text-text-primary'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
