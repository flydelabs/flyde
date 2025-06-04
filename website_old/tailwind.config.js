/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
  // This ensures Tailwind classes don't conflict with existing styles
  important: true,
  // Ensure all classes are generated in production
  safelist: [
    {
      pattern: /.*/,
    },
  ],
  // Output file for other projects to consume
  output: {
    file: "./src/styles/tailwind-output.css",
  },
};
