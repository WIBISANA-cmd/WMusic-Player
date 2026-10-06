import type { Metadata, Viewport } from 'next';
import './globals.css';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { PlayerInitializer } from '@/components/player/PlayerInitializer';
import { AudioProvider } from '@/components/player/AudioProvider';
import { PageTransition } from '@/components/layout/PageTransition';

export const metadata: Metadata = {
  title: 'Pulse Music | Mobile-First Hi-Fi Audio Player',
  description: 'Production-ready PWA music application with liquid glass design, synchronized lyrics, offline playback, and Media Session API support.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pulse Music',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  }
};

export const viewport: Viewport = {
  themeColor: '#F3F4F6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-text-primary min-h-screen antialiased flex flex-col md:flex-row overflow-x-hidden relative selection:bg-slate-300 selection:text-text-primary">
        {/* Subtle Decorative Liquid Background Blobs */}
        <div className="liquid-blob-1" aria-hidden="true" />
        <div className="liquid-blob-2" aria-hidden="true" />

        {/* Global Persistent Audio Engine Provider */}
        <AudioProvider>
          {/* Desktop Sidebar (Enhancement on >= md screens) */}
          <DesktopSidebar />

          {/* Main Application Container */}
          <div className="flex-1 flex flex-col min-w-0 pb-36 md:pb-28 relative z-10">
            <AppHeader />
            <main className="flex-1 px-3.5 sm:px-6 md:px-8 py-4 max-w-5xl w-full mx-auto">
              <PageTransition>{children}</PageTransition>
            </main>
          </div>

          {/* Global Player Overlays, Floating Controls & Toasts */}
          <PlayerInitializer />

          {/* Mobile Bottom Navigation */}
          <BottomNav />
        </AudioProvider>
      </body>
    </html>
  );
}
