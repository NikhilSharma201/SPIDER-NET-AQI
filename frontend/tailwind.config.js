/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        spider: {
          dark: "#0b0c10",
          card: "#1f2833",
          red: "#ff003c",    // Neon red
          blue: "#00f0ff",   // Neon blue
          purple: "#bf00ff", // Glitch purple
        }
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'], // Gives a tech/comic feel
      }
    },
  },
  plugins: [],
}