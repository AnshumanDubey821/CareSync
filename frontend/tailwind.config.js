/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1e60f2', // Doctorate Royal Blue
          700: '#1a56db',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#0d213f', // Doctorate Deep Navy
        },
        navy: {
          800: '#15294b',
          900: '#0d213f',
          950: '#081528',
        },
        ice: {
          50: '#f9fbfd',
          100: '#f4f8fc',
          200: '#e8f1fc',
          300: '#d5e5fa',
        },
        healthcare: {
          blue: '#1e60f2',
          navy: '#0d213f',
          ice: '#f4f8fc',
          emerald: '#10b981',
          teal: '#0d9488',
          softBg: '#f8fafc'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(13, 33, 63, 0.05), 0 2px 6px -1px rgba(13, 33, 63, 0.03)',
        'card-hover': '0 12px 30px -4px rgba(30, 96, 242, 0.12), 0 4px 10px -2px rgba(30, 96, 242, 0.06)',
        'blue-glow': '0 8px 25px -4px rgba(30, 96, 242, 0.35)',
      }
    },
  },
  plugins: [],
}
