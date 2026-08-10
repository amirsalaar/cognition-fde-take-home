import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16181d",
        panel: "#1e2128",
        edge: "#2c313a",
        paper: "#c9ccd3",
        dim: "#7d8390",
        amber: "#d99a2b",
        green: "#4f9e6b",
        red: "#c65454",
        blue: "#5b8dc9",
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
        sans: ["'Inter'", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
export default config;
