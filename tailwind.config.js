/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7f1',
          100: '#dcebe0',
          200: '#bcd7c4',
          300: '#8fb89e',
          400: '#5e9072',
          500: '#3e7253',
          600: '#2d5a41',
          700: '#234833',
          800: '#1d3a2a',
          900: '#1a5631',
          950: '#0d2217',
        },
        accent: {
          50: '#fefbe8',
          100: '#fdf6c6',
          200: '#fbea88',
          300: '#f8d94f',
          400: '#f5c528',
          500: '#e9a810',
          600: '#cd810c',
          700: '#a85f10',
          800: '#884b15',
          900: '#713e16',
          950: '#421f08',
        },
        neutral: {
          50: '#f8f8f7',
          100: '#f0f0ee',
          200: '#e0e0dc',
          300: '#c8c8c2',
          400: '#a8a8a0',
          500: '#888880',
          600: '#6e6e66',
          700: '#585852',
          800: '#44443f',
          900: '#2e2e2a',
          950: '#1a1a17',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
