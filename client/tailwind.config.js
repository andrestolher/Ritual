/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: { colors: { ink: "#18201c", moss: "#28634a", paper: "#f7f8f4", sand: "#e9e5db" }, boxShadow: { soft: "0 14px 35px rgba(24, 32, 28, .08)" } } },
  plugins: []
};
