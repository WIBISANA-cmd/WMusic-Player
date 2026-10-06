'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number;
  max?: number;
  min?: number;
  step?: number;
  onValueChange?: (val: number) => void;
}

export function Slider({
  value,
  max = 100,
  min = 0,
  step = 0.1,
  onValueChange,
  className,
  ...props
}: SliderProps) {
  const percentage = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onValueChange?.(parseFloat(e.target.value))}
        className="w-full relative z-10"
        {...props}
      />
      <div
        className="absolute top-0 left-0 h-1 bg-primary-500 rounded-full pointer-events-none"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

