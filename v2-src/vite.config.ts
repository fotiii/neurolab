import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Сайт публикуется на GitHub Pages по адресу https://fotiii.github.io/neurolab/v2/
export default defineConfig({
  base: "/neurolab/v2/",
  plugins: [react()],
  build: { outDir: "../v2", emptyOutDir: true },
});
