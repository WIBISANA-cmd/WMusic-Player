import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        surface: '#111726',
        'surface-hover': '#1a2236',
        card: '#151d30',
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          DEFAULT: '#8b5cf6'
        },
        accent: {
          cyan: '#06b6d4',
          pink: '#ec4899',
          amber: '#f59e0b',
          emerald: '#10b981'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom, 16px)',
        'safe-top': 'env(safe-area-inset-top, 0px)'
      }
    },
  },
  plugins: [],
};

export default config;
