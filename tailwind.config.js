/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#6366F1",        // Indigo-500
        accentLight: "#818CF8",   // Indigo-400
        accentDark: "#4F46E5",    // Indigo-600

        bg: "#0D0D0D",            // Fond principal Prestige Build
        surface: "#1A1A1A",       // Cartes, panneaux
        surfaceLight: "#222222",  // Surfaces plus claires
        border: "#333333",        // Bordures subtiles
        editor: "#111111",        // Fond Monaco Editor
      },

      borderRadius: {
        smooth: "8px",            // Radius premium
        xlSmooth: "14px",
      },

      boxShadow: {
        soft: "0 0 20px rgba(0,0,0,0.25)",      // Ombre douce premium
        medium: "0 0 30px rgba(0,0,0,0.35)",    // Ombre plus marquée
        strong: "0 0 50px rgba(0,0,0,0.45)",    // Ombre profonde
      },

      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)", // Animation premium
      },

      animation: {
        fadeIn: "fadeIn 0.3s ease-out forwards",
        slideIn: "slideIn 0.25s ease-out forwards",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(4px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: 0, transform: "translateX(-6px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
