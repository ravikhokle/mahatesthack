import type { Config } from 'tailwindcss';

const config: Omit<Config, 'content'> = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2faf5',
          100: '#dff3e8',
          200: '#b9e5cd',
          300: '#86d0ab',
          400: '#4fb584',
          500: '#2a9666',
          600: '#1c7a52',
          700: '#166143',
          800: '#144d37',
          900: '#113f2e',
          950: '#082319',
        },
        ink: {
          DEFAULT: '#0c1f18',
          muted: '#4a6358',
          soft: '#6f857a',
        },
        surface: {
          DEFAULT: '#f4faf6',
          raised: '#ffffff',
          tint: '#e7f4ec',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        display: [
          'var(--font-display)',
          'ui-serif',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'Times',
          'serif',
        ],
      },
      boxShadow: {
        soft: '0 10px 40px -20px rgba(8, 35, 25, 0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slow-pan': {
          '0%': { transform: 'scale(1.05) translate3d(0, 0, 0)' },
          '100%': { transform: 'scale(1.12) translate3d(-1.5%, -1%, 0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'fade-in': 'fade-in 0.35s ease-out both',
        'slow-pan': 'slow-pan 18s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
};

export default config;
