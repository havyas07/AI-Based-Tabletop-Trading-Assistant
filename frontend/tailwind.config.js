/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          bg: '#0B0E14',
          panel: '#151A23',
          card: '#1C2331',
          hover: '#252F42',
          border: '#2A3447',
          accent: '#3B82F6',
          green: '#10B981',
          red: '#EF4444',
          gold: '#F59E0B',
          purple: '#8B5CF6',
          text: '#F3F4F6',
          muted: '#9CA3AF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
