/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
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

        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        surfaceLight: "var(--color-surface-light)",
        border: "var(--color-border)",
        editor: "var(--color-editor)",
        foreground: "var(--color-foreground)",
        muted: "var(--color-muted)",
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
        scaleIn: "scaleIn 0.25s cubic-bezier(0.4,0,0.2,1) forwards",
        slideUp: "slideUp 0.35s cubic-bezier(0.4,0,0.2,1) forwards",
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
        scaleIn: {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
