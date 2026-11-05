/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./providers/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary:  "#00C08B",
        "primary-dark": "#008761",
        "primary-light": "#1AD9A4",
        near:     "#00C08B",
        surface:  "#FFFFFF",
        "surface-card": "#EDE6DC",
        accent:   "#E6F9F3",
        alert:    "#C1440E",
        sage:     "#7DD4BC",
        charcoal: "#000000",
        darkbg:   "#111111",
        border:   "#BEEEDB",
        card:     "#FFFFFF",
        muted:    "#6B6B6B",
      },
      fontFamily: {
        sans: ["Satoshi-Regular", "System"],
        display: ["Geist-Bold"],
      },
    },
  },
  plugins: [],
};
