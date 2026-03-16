/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      colors: {
        primary: "#1d4ed8",
        secondary: "#0f172a"
      }
    }
  },
  plugins: []
};
