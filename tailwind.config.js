/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bed-unoccupied': '#10B981', // Green
        'bed-occupied': '#EF4444',   // Red
        'bed-occupied-cleaning': '#F97316', // Orange
        'bed-unoccupied-cleaning': '#ffc400', // Yellow
      }
    },
  },
  plugins: [],
}
