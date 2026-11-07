import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Сайт публикуется на GitHub Pages по адресу https://fotiii.github.io/neurolab/v3/
export default defineConfig({
  base: "/neurolab/v3/",
  plugins: [react()],
  build: { outDir: "../v3", emptyOutDir: true },
});
