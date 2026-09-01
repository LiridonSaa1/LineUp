/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#3473ef",
        midnight: "#050608",
        glass: "rgba(255, 255, 255, 0.05)",
      },
      fontFamily: {
        sans: ["DMSans_400Regular", "DM Sans", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["SpaceGrotesk_700Bold", "Space Grotesk", "sans-serif"],
        body: ["DMSans_400Regular", "DM Sans", "sans-serif"],
        medium: ["DMSans_500Medium", "DM Sans", "sans-serif"],
        semibold: ["DMSans_600SemiBold", "DM Sans", "sans-serif"],
        bold: ["SpaceGrotesk_700Bold", "DMSans_700Bold", "Space Grotesk", "sans-serif"],
        black: ["SpaceGrotesk_700Bold", "DMSans_700Bold", "Space Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [],
};
