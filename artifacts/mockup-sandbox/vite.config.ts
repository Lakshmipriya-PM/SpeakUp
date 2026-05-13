import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  base: "/",
  plugins: [],
  root: path.resolve(import.meta.dirname),

  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },

  server: {
    port: 3000,
    host: "0.0.0.0",
  },

  preview: {
    port: 3000,
    host: "0.0.0.0",
  },
});
