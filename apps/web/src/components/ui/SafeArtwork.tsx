'use client';

import { useState } from 'react';
import { Music2 } from 'lucide-react';

interface SafeArtworkProps {
  src?: string | null;
  alt: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  fallbackIconSize?: number;
}

export function SafeArtwork({
  src,
  alt,
  className = '',
  fill = false,
  priority = false,
  fallbackIconSize = 20
}: SafeArtworkProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // If no source or failed to load, show beautiful soft glass fallback
  if (!src || hasError) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-slate-200/80 text-text-secondary ${className}`}
        aria-label={alt}
      >
        <Music2 size={fallbackIconSize} className="opacity-60" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${fill ? 'w-full h-full' : ''}`}>
      {/* Skeleton / Placeholder while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-200/60 animate-pulse text-text-secondary">
          <Music2 size={fallbackIconSize} className="opacity-30" />
        </div>
      )}

      {/* Robust Native Image (Bypasses Next.js strict hostname whitelist and avoids server proxy crashes) */}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`${fill ? 'w-full h-full' : ''} object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
      />
    </div>
  );
}

