// Import the editor's Tailwind config to extend from it
const editorConfig = require('../editor/tailwind.config.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    // Include Flyde editor components so their Tailwind classes are built
    '../editor/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    // Inherit the editor's theme
    ...editorConfig.theme,
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
  },
  plugins: [
    // Include the editor's plugins
    ...(editorConfig.plugins || []),
  ],
}; 