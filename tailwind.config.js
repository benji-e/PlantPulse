/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#1F4D2B', light: '#3E7B4F' },
        coffee: { DEFAULT: '#5C3A21', light: '#8B5E3C' },
        warm: '#F7F3EE',
        ink: '#2B2118',
        warning: '#B5651D',
        danger: '#A63D2F'
      },
      fontFamily: { sans: ['Nunito', 'Arial', 'sans-serif'] },
      boxShadow: { soft: '0 12px 32px rgba(43, 33, 24, .08)' }
    }
  },
  plugins: []
};
