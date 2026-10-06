'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/30',
      secondary: 'bg-white/10 hover:bg-white/15 text-white',
      ghost: 'bg-transparent hover:bg-white/5 text-slate-300 hover:text-white',
      glass: 'bg-surface/80 hover:bg-surface border border-white/10 text-white backdrop-blur-md'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-xl',
      md: 'px-4 py-2 text-sm rounded-2xl',
      lg: 'px-6 py-3 text-base rounded-full font-bold',
      icon: 'w-10 h-10 p-0 rounded-full flex items-center justify-center'
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer',
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

