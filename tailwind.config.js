/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette
        dark: {
          50: '#F8F6F1',
          75: '#F1EFE8',
          100: '#1B1B1B',
          200: '#14130F',
        },
        gold: {
          DEFAULT: '#C9A227',
          dark: '#b8911f',
          light: '#e0b850',
        },
      },
      fontFamily: {
        serif: ['\'Merriweather\', Georgia, serif'],
        sans: ['\'Inter\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif'],
        display: ['\'Cormorant Garamond\', \'Georgia\', serif'],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '1.4', letterSpacing: '0.38em' }],
        sm: ['12px', { lineHeight: '1.4', letterSpacing: '0.14em' }],
        base: ['15px', { lineHeight: '1.6' }],
        lg: ['16px', { lineHeight: '1.6' }],
        xl: ['18px', { lineHeight: '1.5' }],
        '2xl': ['22px', { lineHeight: '1.4' }],
        '3xl': ['32px', { lineHeight: '1.15' }],
        '4xl': ['48px', { lineHeight: '1.1' }],
        '5xl': ['64px', { lineHeight: '1.08' }],
        '6xl': ['84px', { lineHeight: '1.05' }],
        '7xl': ['104px', { lineHeight: '1.02' }],
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      letterSpacing: {
        tight: '-0.02em',
        normal: '0em',
        wide: '0.05em',
        widest: '0.1em',
        luxury: '0.14em',
        luxuryWide: '0.38em',
      },
      lineHeight: {
        tight: 1.1,
        snug: 1.15,
        normal: 1.5,
        relaxed: 1.6,
        loose: 1.75,
      },
    },
  },
  plugins: [],
}