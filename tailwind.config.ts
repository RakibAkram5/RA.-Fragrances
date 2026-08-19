import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0B0B",
        surface: "#141414",
        "surface-2": "#1C1C1C",
        "surface-3": "#242424",
        border: "#262626",
        "border-strong": "#333333",
        ink: "#F5F1E8",
        "ink-secondary": "#A8A39A",
        "ink-muted": "#6E6A62",
        accent: "#C8A96B",
        "accent-strong": "#B8944F",
        "accent-soft": "rgba(200, 169, 107, 0.14)",
        white: "#FFFFFF",
        danger: "#E5534B",
        success: "#3FA46A",
        warning: "#D9A13B",
        info: "#5B8DD9",
      },
      fontFamily: {
        serif: [
          '"Cormorant Garamond"',
          "Georgia",
          '"Times New Roman"',
          "serif",
        ],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      letterSpacing: {
        widest2: "0.35em",
      },
      maxWidth: {
        "8xl": "88rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-down": {
          from: { opacity: "0", transform: "translateY(-12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out both",
        "fade-up": "fade-up 0.6s ease-out both",
        "fade-down": "fade-down 0.4s ease-out both",
        "slide-in-right": "slide-in-right 0.3s ease-out both",
        "scale-in": "scale-in 0.2s ease-out both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;
