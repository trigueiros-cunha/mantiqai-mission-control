import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#050608',
          surface: '#0c0e14',
          card: '#111520',
          elevated: '#161b28',
        },
        border: {
          DEFAULT: '#1a1f2e',
          subtle: '#151925',
          strong: '#242b3d',
        },
        text: {
          primary: '#e4e8f2',
          secondary: '#9aa3b8',
          muted: '#6d7a96',
          faint: '#3d4560',
        },
        accent: {
          violet: '#a78bfa',
          pink: '#ec4899',
          blue: '#3b82f6',
          cyan: '#06b6d4',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.3)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideIn: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(100%)' },
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #a78bfa, #ec4899)',
        'gradient-card': 'linear-gradient(135deg, #111520, #161b28)',
      },
    },
  },
  plugins: [],
}

export default config
