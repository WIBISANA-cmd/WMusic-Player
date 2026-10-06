'use client';

import { usePlayerStore } from '@/store/usePlayerStore';

export function AudioVisualizer() {
  const { isPlaying } = usePlayerStore();

  const barHeights = [40, 70, 95, 60, 85, 100, 75, 45, 90, 65, 80, 50];

  return (
    <div className="flex items-end gap-1 h-8 px-2">
      {barHeights.map((h, i) => (
        <span
          key={i}
          className={`w-1 rounded-full bg-gradient-to-t from-primary-600 to-cyan-400 transition-all duration-150 ${
            isPlaying ? 'animate-pulse' : 'opacity-40'
          }`}
          style={{
            height: isPlaying ? `${Math.max(15, (h * ((i % 3) + 1)) % 100)}%` : '20%',
            animationDelay: `${i * 80}ms`
          }}
        />
      ))}
    </div>
  );
}
