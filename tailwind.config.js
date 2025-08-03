/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 自然で有機的な配色パレット
        primary: {
          50: '#f0f9f0',
          100: '#dcf2dc',
          200: '#bce5bc',
          300: '#8dd18d',
          400: '#5bb85b',
          500: '#3a9f3a',
          600: '#2d7f2d',
          700: '#256525',
          800: '#215121',
          900: '#1d431d',
        },
        secondary: {
          50: '#fdf8f0',
          100: '#faefd7',
          200: '#f4dcae',
          300: '#ecc47a',
          400: '#e2a444',
          500: '#d98b1f',
          600: '#ca7315',
          700: '#a85a14',
          800: '#884717',
          900: '#6f3b16',
        },
        accent: {
          50: '#f5f8fa',
          100: '#eaf1f4',
          200: '#d0e2ea',
          300: '#a7ccd9',
          400: '#77b0c4',
          500: '#5496b0',
          600: '#467a94',
          700: '#3c6378',
          800: '#365364',
          900: '#304655',
        },
        // フィロタキシス特有の色
        golden: '#ffd700',
        leaf: {
          light: '#90ee90',
          DEFAULT: '#228b22',
          dark: '#006400',
        },
        stem: {
          light: '#deb887',
          DEFAULT: '#8b7355',
          dark: '#654321',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'grow': 'grow 0.4s ease-out',
        'pulse-gentle': 'pulseGentle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        grow: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
};