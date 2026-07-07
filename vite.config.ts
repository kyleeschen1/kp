import { defineConfig } from "vite";

const apiTarget = process.env["API_TARGET"] ?? "http://127.0.0.1:8001";

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 8000,
    proxy: {
      "/api": {
        changeOrigin: true,
        target: apiTarget
      }
    },
    strictPort: true
  }
});
