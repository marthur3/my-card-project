/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'homemade-apple': ['var(--font-homemade-apple)'],
        'nothing-you-could-do': ['var(--font-nothing-you-could-do)'],
        'alex-brush': ['var(--font-alex-brush)'],
        'caveat': ['var(--font-caveat)'],
      },
      borderColor: {
        border: 'var(--border)',
      },
    },
  },
  plugins: [],
}
