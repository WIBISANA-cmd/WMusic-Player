import type { Metadata, Viewport } from 'next';
import './globals.css';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { DesktopHeader } from '@/components/layout/DesktopHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { PlayerInitializer } from '@/components/player/PlayerInitializer';

export const metadata: Metadata = {
  title: 'Pulse Music | Mobile-First Hi-Fi Audio Player',
  description: 'Production-ready PWA music application with synchronized lyrics, offline playback, and Media Session API support.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pulse Music',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  }
};

export const viewport: Viewport = {
  themeColor: '#090d16',
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
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen antialiased flex flex-col md:flex-row overflow-x-hidden">
        {/* Desktop Left Sidebar */}
        <DesktopSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-36 md:pb-28">
          <DesktopHeader />
          <main className="flex-1 px-4 sm:px-6 md:px-8 py-4 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Global Player Engine & Modals */}
        <PlayerInitializer />

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav />
      </body>
    </html>
  );
}
