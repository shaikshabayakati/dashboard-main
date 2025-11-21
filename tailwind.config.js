/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        severity: {
          low: '#10b981',
          medium: '#f59e0b',
          high: '#ef4444',
        },
      },
    },
  },
  plugins: [],
}
