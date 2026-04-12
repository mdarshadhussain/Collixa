module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          light: "#E5EEE4",
          DEFAULT: "#D4E6D3",
          dark: "#1F2937",
        },
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(0, 0, 0, 0.05)",
        soft: "0 4px 6px rgba(0, 0, 0, 0.07)",
      },
      borderRadius: {
        soft: "12px",
      },
    },
  },
  plugins: [],
}
