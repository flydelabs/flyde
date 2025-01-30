/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // important: ".react-tooltip",
  darkMode: "false",
  theme: {
    extend: {
      fontSize: {
        "2xs": "0.625rem", // You can set this to whatever size you want.
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        blue: {
          DEFAULT: "#007EC6",
          50: "#7FD0FF",
          100: "#6AC9FF",
          200: "#41BAFF",
          300: "#19ABFF",
          400: "#0098EF",
          500: "#007EC6",
          600: "#005A8E",
          700: "#003756",
          800: "#00131E",
          900: "#000000",
          950: "#000000",
        },
        btn: {
          background: "hsl(var(--btn-background))",
          "background-hover": "hsl(var(--btn-background-hover))",
        },
      },
    },
  },
  plugins: [],
};
