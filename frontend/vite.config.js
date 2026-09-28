import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, requests to /api/* are forwarded to the FastAPI backend,
// so you don't need to configure CORS while developing.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
