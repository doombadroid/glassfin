/** @type {import('tailwindcss').Config} */

// Streamyfin Next "Frost": the app's accent classes are written as purple-*,
// so the purple scale is remapped to Frost mint. 600 and up are the fills that
// carry white text, dark enough for it to stay readable.
const frost = {
  50: "#EEFBF6",
  100: "#D4F6EA",
  200: "#B3EEDB",
  300: "#8FE6CB",
  400: "#6BD9B8",
  500: "#3FBF9C",
  600: "#0E7A63",
  700: "#0B6352",
  800: "#094B3F",
  900: "#08372F",
  950: "#04201B",
};

module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: { purple: frost },
    },
  },
  plugins: [],
};
