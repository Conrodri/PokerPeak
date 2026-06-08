/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        felt: {
          50:  '#e8f5ee',
          100: '#c5e8d3',
          200: '#9dd8b5',
          300: '#6dc594',
          400: '#43b576',
          500: '#1a9a57',
          600: '#147a44',
          700: '#0f5c33',
          800: '#0a4025',
          900: '#062819',
          dark: '#0d2318',
          DEFAULT: '#1a4a2e',
        },
        gold: {
          300: '#f5d87a',
          400: '#e8c547',
          500: '#d4af37',
          600: '#b8932a',
          700: '#9a7820',
        },
        card: {
          red: '#e53e3e',
          black: '#1a202c',
        },
      },
      fontFamily: {
        poker: ['Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'felt-gradient': 'radial-gradient(ellipse at center, #1e5c38 0%, #0d2318 70%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
      },
      boxShadow: {
        'card': '0 4px 15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
        'card-hover': '0 8px 25px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.3)',
        'table': 'inset 0 0 60px rgba(0,0,0,0.5), 0 0 0 20px #5c3a1e, 0 0 0 25px #3d2410',
        'chip': '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
        'glow-green': '0 0 20px rgba(26,154,87,0.5)',
        'glow-gold': '0 0 20px rgba(212,175,55,0.5)',
        'glow-red': '0 0 20px rgba(229,62,62,0.5)',
      },
      animation: {
        'deal': 'deal 0.3s ease-out',
        'flip': 'flip 0.4s ease-in-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shake': 'shake 0.4s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
      },
      keyframes: {
        deal: {
          '0%': { transform: 'translateY(-20px) scale(0.8)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        flip: {
          '0%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-8px)' },
          '40%, 80%': { transform: 'translateX(8px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
