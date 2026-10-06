import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F3F4F6',
        surface: 'rgba(255, 255, 255, 0.70)',
        'surface-hover': 'rgba(255, 255, 255, 0.90)',
        'text-primary': '#374151',
        'text-secondary': '#9CA3AF',
        accent: {
          light: '#CBD5E1',
          DEFAULT: '#94A3B8',
          dark: '#64748B',
          charcoal: '#475569',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.40)',
          card: 'rgba(255, 255, 255, 0.65)',
          pill: 'rgba(255, 255, 255, 0.75)',
          border: 'rgba(255, 255, 255, 0.40)',
          active: 'rgba(255, 255, 255, 0.92)',
        },
      },
      boxShadow: {
        glass: '0 8px 32px rgba(148, 163, 184, 0.20)',
        'glass-sm': '0 4px 16px rgba(148, 163, 184, 0.12)',
        'glass-lg': '0 16px 40px rgba(148, 163, 184, 0.25)',
        liquid: '0 8px 24px -4px rgba(148, 163, 184, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
        'liquid-active': '0 4px 12px rgba(148, 163, 184, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.9)',
        'liquid-thumb': '0 2px 8px rgba(148, 163, 184, 0.4), inset 0 1px 1px #ffffff',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom, 16px)',
        'safe-top': 'env(safe-area-inset-top, 0px)',
      },
    },
  },
  plugins: [],
};

export default config;
