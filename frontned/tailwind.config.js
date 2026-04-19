/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: '#00d4ff',
          purple: '#7c3aed',
          green: '#00ff88',
          pink: '#ff00ff',
        },
        dark: {
          900: '#020408',
          800: '#060d14',
          700: '#0a1520',
          600: '#0f1f2e',
          500: '#162840',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        display: ['"Orbitron"', 'sans-serif'],
        body: ['"Syne"', 'sans-serif'],
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(0,212,255,0.4), 0 0 60px rgba(0,212,255,0.1)',
        'neon-green': '0 0 20px rgba(0,255,136,0.4), 0 0 60px rgba(0,255,136,0.1)',
        'neon-purple': '0 0 20px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.1)',
        'neon-red': '0 0 20px rgba(255,50,50,0.4)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
