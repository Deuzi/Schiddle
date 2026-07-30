import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
      },
      colors: {
        schiddle: {
          50: "#e9fbee",
          100: "#c8f4d3",
          200: "#95e7ac",
          300: "#5dd684",
          400: "#33c163",
          500: "#22a34e", // primary brand green
          600: "#18823d",
          700: "#146633",
          800: "#0f4d27",
          900: "#0a331a",
          950: "#051d0f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
