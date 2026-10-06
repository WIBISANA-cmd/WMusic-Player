/**
 * YouTube IFrame Player API loader and singleton manager.
 * Complies strictly with official YouTube playback mechanism guidelines.
 */

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoadPromise: Promise<any> | null = null;

export function loadYouTubeIframeAPI(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window not available in SSR'));
  }

  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }

  if (apiLoadPromise) {
    return apiLoadPromise;
  }

  apiLoadPromise = new Promise((resolve, reject) => {
    // Check if script is already present in document
    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    
    const prevOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevOnReady) prevOnReady();
      resolve(window.YT);
    };

    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = (err) => {
        apiLoadPromise = null;
        reject(err);
      };
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    // Safety timeout in case API script fails silently
    setTimeout(() => {
      if (window.YT && window.YT.Player) {
        resolve(window.YT);
      }
    }, 3000);
  });

  return apiLoadPromise;
}

export function extractYouTubeVideoId(urlOrId: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  
  // If it starts with yt- prefix
  if (trimmed.startsWith('yt-')) {
    return trimmed.substring(3);
  }

  // If already an 11-char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Parse watch URL: https://www.youtube.com/watch?v=...
  const match = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (match && match[1]) {
    return match[1];
  }

  return trimmed;
}

export interface YouTubeDriver {
  loadTrack: (videoId: string, autoPlay?: boolean) => Promise<boolean>;
  play: () => Promise<boolean>;
  pause: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

let activeYouTubeDriver: YouTubeDriver | null = null;

export function registerYouTubeDriver(driver: YouTubeDriver | null): void {
  activeYouTubeDriver = driver;
}

export function getYouTubeDriver(): YouTubeDriver | null {
  return activeYouTubeDriver;
}
