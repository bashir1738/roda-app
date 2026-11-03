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
        primary:  "#421F6D",
        surface:  "#FFFFFF",
        "surface-card": "#EDE6DC",
        accent:   "#FFFFFF",
        alert:    "#C1440E",
        sage:     "#B8A0C8",
        charcoal: "#303030",
        border:   "#D4C4E8",
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
