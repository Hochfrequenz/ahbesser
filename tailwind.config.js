/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#EBBEC1',
        secondary: '#CCA9AB',
        tint: '#F6ECED',
      },
      fontFamily: {
        sans: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        bold: 700,
      },
    },
  },
  plugins: [],
};
