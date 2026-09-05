import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe7fe",
          200: "#bfd7fe",
          300: "#93bcfd",
          400: "#609afa",
          500: "#3b76f6",
          600: "#2557eb",
          700: "#1d43d8",
          800: "#1e38ae",
          900: "#1e3389",
          950: "#172354",
        },
        ink: {
          50: "#f4f6fb",
          100: "#e7eaf3",
          200: "#cad0e3",
          300: "#9ba5c4",
          400: "#6b76a0",
          500: "#4a5480",
          600: "#363f65",
          700: "#282f4d",
          800: "#181d33",
          900: "#0d1021",
          950: "#070914",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(16, 24, 40, 0.05)",
        card: "0 1px 3px 0 rgba(16, 24, 40, 0.1), 0 1px 2px -1px rgba(16, 24, 40, 0.06)",
        elevated:
          "0 4px 12px -2px rgba(16, 24, 40, 0.08), 0 12px 32px -8px rgba(16, 24, 40, 0.12)",
        glow: "0 0 0 1px rgba(59, 118, 246, 0.08), 0 8px 24px -4px rgba(37, 87, 235, 0.25)",
        "inner-glow": "inset 0 1px 0 0 rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        "grid-slate":
          "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
        "radial-fade":
          "radial-gradient(circle at 50% 0%, rgba(59,118,246,0.35), transparent 60%)",
      },
      backgroundSize: {
        grid: "36px 36px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "fade-in": "fade-in 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
