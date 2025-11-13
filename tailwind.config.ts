import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          bg: "#FFFFFF",
          fg: "#0C0C0C",
          accent: "#00719C",
          "accent-light": "#E8F6FA",
          border: "#E0E0E0",
          muted: "#777777",
        },
      },
      borderRadius: { 
        xl: "1rem" 
      },
      boxShadow: { 
        soft: "0 2px 4px rgba(0,0,0,0.08)" 
      },
    },
  },
  plugins: [],
};

export default config;

