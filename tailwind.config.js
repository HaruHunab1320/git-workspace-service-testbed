/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nerv-red': '#FF3300',
        'nerv-orange': '#FF9900',
        'nerv-black': '#050505',
      },
      fontFamily: {
        mono: ['Share Tech Mono', 'Courier New', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-red': 'pulse-red 1s ease-in-out infinite',
        'scan-line': 'scan-line 3s linear infinite',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5', boxShadow: '0 0 20px rgba(255, 0, 0, 0.8)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
}
