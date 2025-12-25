/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        accent: "#06B6D4"   
      },
      borderRadius: {
        xl: "1rem"
      }
    }
  },
  plugins: []
}
