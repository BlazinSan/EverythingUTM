import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }
          if (id.includes("@clerk")) {
            return "auth";
          }
          if (id.includes("convex")) {
            return "convex";
          }
          if (id.includes("leaflet") || id.includes("react-leaflet")) {
            return "maps";
          }
          if (id.includes("lucide-react")) {
            return "icons";
          }
          if (id.includes("motion") || id.includes("@use-gesture")) {
            return "motion";
          }
          if (id.includes("react")) {
            return "react";
          }
          return;
        },
      },
    },
  },
});
