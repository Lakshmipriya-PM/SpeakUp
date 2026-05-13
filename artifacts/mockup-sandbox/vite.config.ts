import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  base: "/",

  plugins: [],

  root: path.resolve(import.meta.dirname),

  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },

  server: {
    port: 3000,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
  },

  preview: {
    port: 3000,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
