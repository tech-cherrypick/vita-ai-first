/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
    "./screens/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      colors: {
        'brand-purple': '#C084FC',
        'brand-pink': '#F9A8D4',
        'brand-cyan': '#5EEAD4',
        'brand-bg': '#FDFBFF',
        'brand-text': '#111827',
        'brand-text-light': '#6B7280',
      },
      animation: {
        'gradient-x': 'gradient-x 5s ease infinite',
        'slide-in-up': 'slide-in-up 0.6s cubic-bezier(0.23, 1, 0.32, 1) both',
        'slide-in-right': 'slide-in-right 0.5s cubic-bezier(0.23, 1, 0.32, 1) both',
        'slide-out-left': 'slide-out-left 0.5s cubic-bezier(0.23, 1, 0.32, 1) both',
        'fade-in': 'fade-in 0.6s ease-out both',
        'draw': 'draw 2s ease-out forwards 0.5s',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' }
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        'slide-out-left': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-120%)', opacity: '0' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'draw': {
          'to': { 'stroke-dashoffset': '0' }
        }
      }
    }
  },
  plugins: [],
}
