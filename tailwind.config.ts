import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Huisstijl gebaseerd op kleding (Rhodamine red + zwart)
        brand: {
          50: '#fdf2f4',
          100: '#fbe5e9',
          200: '#f5ccd4',
          300: '#eda3b0',
          400: '#e16e83',
          500: '#d04258',
          600: '#bd2f47',
          700: '#9d233a', // Rhodamine red 2X ~
          800: '#831f33',
          900: '#6f1d2f',
          950: '#3e0a14',
        },
        ink: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#1a1a1a',
          950: '#0a0a0a',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #9d233a 0%, #4a0810 50%, #0a0a0a 100%)',
        'brand-fade': 'linear-gradient(180deg, #9d233a 0%, #0a0a0a 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
