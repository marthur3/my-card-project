/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'homemade-apple': ['Homemade Apple', 'cursive'],
        'nothing-you-could-do': ['Nothing You Could Do', 'cursive'],
        'alex-brush': ['Alex Brush', 'cursive'],
        'caveat': ['Caveat', 'cursive'],
      },
      borderColor: {
        border: 'var(--border)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      scale: {
        '102': '1.02',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
