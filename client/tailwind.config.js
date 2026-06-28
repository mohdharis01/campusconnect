/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
          400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
          800: '#3730a3', 900: '#312e81', 950: '#1e1b4b',
        },
        dark: {
          50: '#f8f9fa', 100: '#1a1a2e', 200: '#16213e', 300: '#0f3460',
          400: '#533483', 500: '#0d0d0d', 600: '#141414', 700: '#1c1c1c',
          800: '#242424', 900: '#2c2c2c',
        },
        surface: {
          DEFAULT: '#1a1a2e', light: '#f0f0f5',
          card: '#16213e', 'card-light': '#ffffff',
          border: '#2a2a4a', 'border-light': '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideDown: { from: { transform: 'translateY(-10px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        scaleIn: { from: { transform: 'scale(0.95)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
      backdropBlur: { xs: '2px' },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 100%)',
        shimmer: 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.05) 50%, transparent 75%)',
      },
      boxShadow: {
        glow: '0 0 20px rgba(99,102,241,0.3)',
        'glow-sm': '0 0 10px rgba(99,102,241,0.2)',
        'card-dark': '0 4px 24px rgba(0,0,0,0.4)',
        'card-light': '0 4px 24px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
