'use client';

import { usePlayerStore } from '@/stores/player-store';
import { useReducedMotion } from 'framer-motion';

export function AudioVisualizer() {
  const shouldReduceMotion = useReducedMotion();
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const status = usePlayerStore((s) => s.status);

  const barHeights = [40, 70, 95, 60, 85, 100, 75, 45, 90, 65, 80, 50];

  // Three pseudo-reactive states:
  // 1. Buffering: pulsing alternate breathing pattern
  // 2. Playing: fluid oscillating wave
  // 3. Paused: frozen static resting heights
  const isBuffering = status === 'buffering';

  return (
    <div
      className="flex items-end gap-1 h-8 px-2 select-none"
      aria-hidden="true"
      role="presentation"
    >
      {barHeights.map((h, i) => {
        let heightStyle = '25%';
        let animationClass = 'opacity-30';

        if (shouldReduceMotion) {
          heightStyle = isPlaying ? `${h}%` : '25%';
          animationClass = isPlaying ? 'opacity-80' : 'opacity-30';
        } else if (isBuffering) {
          heightStyle = `${30 + ((i % 4) * 15)}%`;
          animationClass = 'animate-pulse opacity-60';
        } else if (isPlaying) {
          heightStyle = `${Math.max(15, (h * ((i % 3) + 1)) % 100)}%`;
          animationClass = 'animate-pulse opacity-90';
        } else {
          // Paused / idle: slow frozen resting state
          heightStyle = `${Math.max(15, h * 0.35)}%`;
          animationClass = 'opacity-40';
        }

        return (
          <span
            key={i}
            className={`w-1 rounded-full bg-gradient-to-t from-slate-400 to-slate-700 transition-all duration-200 ${animationClass}`}
            style={{
              height: heightStyle,
              animationDelay: `${i * 75}ms`
            }}
          />
        );
      })}
    </div>
  );
}
