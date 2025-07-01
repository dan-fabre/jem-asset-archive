/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pink': {
          400: '#ff697f',
          500: '#ff697f',
          600: '#e55a6f',
        },
        'cream': {
          50: '#fff7ec',
        }
      }
    },
  },
  plugins: [],
}
