import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9f9",
          100: "#d9f0f0",
          200: "#b5e1e2",
          300: "#83cbcd",
          400: "#50acb0",
          500: "#369094",
          600: "#2d7479",
          700: "#285e63",
          800: "#244d52",
          900: "#224145",
          950: "#112629",
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      backgroundImage: {},
    }
  },
  plugins: []
};

export default config;
