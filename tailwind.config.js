/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#EBBEC1',
        secondary: '#CCA9AB',
        tint: '#F6ECED',
        offwhite: '#E7E6E5',
        ebd_primary: '#8ba2d7',
        dark: '#cf939a',
        white: '#ffffff',
        // the hf colors are defined in hochfrequenz.css
        // see: https://github.com/Hochfrequenz/companystylesheet/blob/933394932c5c97328a891c2bd3e72dbb6cecd357/css/hochfrequenz.css
        hf: {
          // Greens
          'pastell-gruen': '#d5f4b9',
          'grell-gruen': '#8de040',
          'dunkel-gruen': '#4fbd57',
          // Blues
          'pastell-blau': '#c2cee9',
          'grell-blau': '#8ba2d7',
          'dunkel-blau': '#537096',
          // Reds
          'pastell-rot': '#f4e0e1',
          'grell-rot': '#ff569c',
          'dunkel-rot': '#d13166',
          // Yellows
          'pastell-gelb': '#f4e2b9',
          'grell-gelb': '#e5bd5c',
          'dunkel-gelb': '#ae8a1d',
          // Roses
          'pastell-rose': '#f4e0e1',
          'grell-rose': '#ebbec1',
          'dunkel-rose': '#cf939a',
          // Turquoise
          'pastell-tuerkis': '#d4ede8',
          'grell-tuerkis': '#abdcd3',
          'dunkel-tuerkis': '#73b2a5',
          // Mint
          'pastell-mint': '#c6e7d2',
          'grell-mint': '#85cb9c',
          'dunkel-mint': '#549976',
          // Neutral
          'neutral-grau': '#e7e6e5',
          'off-white': '#e7e6e5',
          'neutral-grau-2': '#eaece9',
          'grell-grau': '#c4cac1',
          'weiches-schwarz': '#25141d',
        },
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
