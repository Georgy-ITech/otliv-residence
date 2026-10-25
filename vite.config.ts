import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages: https://georgy-itech.github.io/otliv-residence/
export default defineConfig({
  base: "/otliv-residence/",
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1000 },
});
