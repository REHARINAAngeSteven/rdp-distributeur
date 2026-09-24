import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Config unique pour Vite (dev + build) et Vitest (tests). Évite d'avoir
// deux fichiers à garder synchronisés.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
