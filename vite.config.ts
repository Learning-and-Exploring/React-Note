import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // specific aliases first
      "@/components/ui": path.resolve(__dirname, "./src/shared/components/ui"),
      "@/components": path.resolve(__dirname, "./src/shared/components"),
      "@/lib/utils": path.resolve(__dirname, "./src/core/lib/utils"),
      "@/lib": path.resolve(__dirname, "./src/core/lib"),
      "@/hooks": path.resolve(__dirname, "./src/shared/hooks"),
      // broad aliases after
      "@features": path.resolve(__dirname, "./src/features"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@core": path.resolve(__dirname, "./src/core"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});