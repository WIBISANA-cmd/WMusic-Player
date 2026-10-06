'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'liquid';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const variants = {
      primary:
        'bg-slate-700 hover:bg-slate-800 text-white shadow-sm active:scale-95',
      secondary:
        'bg-white/70 hover:bg-white/90 text-text-primary border border-white/60 shadow-sm active:scale-95',
      ghost:
        'bg-transparent hover:bg-slate-200/50 text-text-primary active:scale-95',
      glass:
        'glass-pill hover:bg-white/80 text-text-primary active:scale-95',
      liquid:
        'liquid-button text-text-primary font-semibold active:scale-95'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-xl min-h-[36px]',
      md: 'px-4 py-2 text-sm rounded-2xl min-h-[44px]',
      lg: 'px-6 py-3 text-base rounded-full font-bold min-h-[48px]',
      icon: 'w-11 h-11 p-0 rounded-full flex items-center justify-center min-w-[44px] min-h-[44px]'
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
