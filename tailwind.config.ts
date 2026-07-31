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
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(16, 24, 40, 0.05)",
        card: "0 1px 3px 0 rgba(16, 24, 40, 0.1), 0 1px 2px -1px rgba(16, 24, 40, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
